"""
Evaluation script for SMDL LER — seqeval + sklearn metrics.

Usage:
    uv run python scripts/evaluate.py --data data/annotated/eval.json
    uv run python scripts/evaluate.py --data data/annotated/eval.json --variant layout
    uv run python scripts/evaluate.py --data data/annotated/eval.json --variant layout_structure --out artifacts/eval_report.json

Annotated JSON format (list of documents):
[
  {
    "text": "...",
    "entities": [
      {"type": "PARTY",       "start": 0,  "end": 20, "value": "PT Telkom Indonesia"},
      {"type": "CONTRACT_NO", "start": 50, "end": 70, "value": "TELKOM/LEGAL/2025/001"},
      {"type": "DATE",        "start": 80, "end": 95, "value": "15 Januari 2025"}
    ]
  }
]

Outputs:
  - Per-entity-type precision / recall / F1 table (stdout)
  - Overall (micro + macro) aggregates
  - Latency p50 / p95 per document
  - Confidence calibration: mean confidence vs. correctness bucket
  - Optional JSON report (--out)
"""

from __future__ import annotations

import argparse
import json
import statistics
import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Dependency guard — seqeval / sklearn are in the `train` dep group
# ---------------------------------------------------------------------------
try:
    from seqeval.metrics import (
        classification_report as seqeval_report,
        f1_score,
        precision_score,
        recall_score,
    )
    from sklearn.metrics import classification_report as sklearn_report
except ImportError:
    print(
        "ERROR: evaluation dependencies not installed.\n"
        "Run: uv sync --group train",
        file=sys.stderr,
    )
    sys.exit(1)

# ---------------------------------------------------------------------------
# Add src/ to path so we can import `ler` without installing in editable mode
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from ler.inference.pipeline import LerPipeline  # noqa: E402
from ler.shared.types import EntitySpan  # noqa: E402

SMDL_ENTITY_TYPES = {"PARTY", "ORG", "DATE", "CONTRACT_NO", "LOCATION"}


# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------

@dataclass
class AnnotatedDoc:
    text: str
    gold_entities: list[EntitySpan]


def load_annotated(path: Path) -> list[AnnotatedDoc]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    docs: list[AnnotatedDoc] = []
    for item in raw:
        gold = [
            EntitySpan(
                type=e["type"],
                value=e.get("value", ""),
                start=int(e["start"]),
                end=int(e["end"]),
                confidence=1.0,
                source_text=e.get("value", ""),
            )
            for e in item.get("entities", [])
        ]
        docs.append(AnnotatedDoc(text=item["text"], gold_entities=gold))
    return docs


# ---------------------------------------------------------------------------
# IOB conversion helpers (for seqeval)
# ---------------------------------------------------------------------------

def _spans_to_iob(text: str, spans: list[EntitySpan]) -> list[str]:
    """Convert character-level entity spans to per-character IOB tags."""
    tags = ["O"] * len(text)
    for span in sorted(spans, key=lambda s: s.start):
        if span.start >= len(text) or span.end > len(text):
            continue
        entity_type = span.type if span.type in SMDL_ENTITY_TYPES else "O"
        if entity_type == "O":
            continue
        tags[span.start] = f"B-{entity_type}"
        for i in range(span.start + 1, span.end):
            tags[i] = f"I-{entity_type}"
    return tags


def _word_iob(text: str, spans: list[EntitySpan]) -> list[str]:
    """Approximate word-level IOB for seqeval (split on whitespace)."""
    char_tags = _spans_to_iob(text, spans)
    words = text.split()
    word_tags: list[str] = []
    cursor = 0
    for word in words:
        idx = text.find(word, cursor)
        if idx == -1:
            word_tags.append("O")
            cursor += len(word)
            continue
        tag = char_tags[idx] if idx < len(char_tags) else "O"
        # seqeval wants the first sub-token tag to represent the word
        word_tags.append(tag)
        cursor = idx + len(word)
    return word_tags


# ---------------------------------------------------------------------------
# Span-level exact-match (token-free, for per-entity-type metrics)
# ---------------------------------------------------------------------------

@dataclass
class SpanMatchResult:
    entity_type: str
    predicted: int
    gold: int
    true_positive: int

    @property
    def precision(self) -> float:
        return self.true_positive / self.predicted if self.predicted else 0.0

    @property
    def recall(self) -> float:
        return self.true_positive / self.gold if self.gold else 0.0

    @property
    def f1(self) -> float:
        p, r = self.precision, self.recall
        return 2 * p * r / (p + r) if (p + r) else 0.0


def _normalize_span(text: str, start: int, end: int) -> str:
    return text[start:end].strip().lower() if start < len(text) else ""


def _spans_overlap(a_start: int, a_end: int, b_start: int, b_end: int) -> bool:
    """True if two character spans overlap by at least one character."""
    return a_start < b_end and b_start < a_end


def compute_span_metrics(
    docs: list[AnnotatedDoc],
    predictions: list[list[EntitySpan]],
    match_mode: str = "overlap",
) -> dict[str, SpanMatchResult]:
    """
    Span-match per entity type.

    match_mode:
      "overlap"  — same type + any character overlap (lenient, good for partial spans)
      "exact"    — same type + exact normalized value string match (strict)

    For each gold span we attempt to match at most one predicted span (greedy,
    highest-confidence first). This prevents one predicted span from matching
    multiple gold spans.
    """
    buckets: dict[str, dict[str, int]] = {
        t: {"predicted": 0, "gold": 0, "tp": 0} for t in SMDL_ENTITY_TYPES
    }

    for doc, pred_spans in zip(docs, predictions):
        # Count per-type gold and predicted
        for s in doc.gold_entities:
            if s.type in SMDL_ENTITY_TYPES:
                buckets[s.type]["gold"] += 1

        for s in pred_spans:
            if s.type in SMDL_ENTITY_TYPES:
                buckets[s.type]["predicted"] += 1

        # Match: for each gold span find a predicted span that satisfies the
        # match criterion; each predicted span can only be used once.
        used_pred: set[int] = set()
        for gold in doc.gold_entities:
            if gold.type not in SMDL_ENTITY_TYPES:
                continue
            candidates = [
                (i, p)
                for i, p in enumerate(pred_spans)
                if i not in used_pred and p.type == gold.type
            ]
            # sort by confidence descending
            candidates.sort(key=lambda x: -x[1].confidence)

            for idx, pred in candidates:
                if match_mode == "exact":
                    gold_val = _normalize_span(doc.text, gold.start, gold.end)
                    matched = pred.value.strip().lower() == gold_val
                else:  # overlap
                    matched = _spans_overlap(gold.start, gold.end, pred.start, pred.end)

                if matched:
                    buckets[gold.type]["tp"] += 1
                    used_pred.add(idx)
                    break

    return {
        etype: SpanMatchResult(
            entity_type=etype,
            predicted=b["predicted"],
            gold=b["gold"],
            true_positive=b["tp"],
        )
        for etype, b in buckets.items()
    }


# ---------------------------------------------------------------------------
# Confidence calibration
# ---------------------------------------------------------------------------

def confidence_calibration(
    docs: list[AnnotatedDoc],
    predictions: list[list[EntitySpan]],
) -> dict[str, Any]:
    """
    Bin predicted spans by confidence, report correctness rate per bin.
    A span is 'correct' if a gold span with the same type and value exists.
    """
    bins: dict[str, list[float]] = {
        "0.0-0.5": [],
        "0.5-0.7": [],
        "0.7-0.9": [],
        "0.9-1.0": [],
    }

    def _bin(conf: float) -> str:
        if conf < 0.5:
            return "0.0-0.5"
        if conf < 0.7:
            return "0.5-0.7"
        if conf < 0.9:
            return "0.7-0.9"
        return "0.9-1.0"

    for doc, pred_spans in zip(docs, predictions):
        for span in pred_spans:
            correct = any(
                g.type == span.type and _spans_overlap(g.start, g.end, span.start, span.end)
                for g in doc.gold_entities
            )
            bins[_bin(span.confidence)].append(1.0 if correct else 0.0)

    return {
        bucket: {
            "n": len(vals),
            "accuracy": round(statistics.mean(vals), 4) if vals else None,
        }
        for bucket, vals in bins.items()
    }


# ---------------------------------------------------------------------------
# False-positive rate per entity type
# ---------------------------------------------------------------------------

def false_positive_rates(metrics: dict[str, SpanMatchResult]) -> dict[str, float]:
    """FP rate = false positives / total predicted."""
    result: dict[str, float] = {}
    for etype, m in metrics.items():
        fp = m.predicted - m.true_positive
        rate = fp / m.predicted if m.predicted else 0.0
        result[etype] = round(rate, 4)
    return result


# ---------------------------------------------------------------------------
# Latency measurement
# ---------------------------------------------------------------------------

@dataclass
class LatencyStats:
    p50_ms: float
    p95_ms: float
    mean_ms: float
    min_ms: float
    max_ms: float


def measure_latency(
    pipeline: LerPipeline,
    docs: list[AnnotatedDoc],
    variant: str | None,
) -> LatencyStats:
    times: list[float] = []
    for doc in docs:
        t0 = time.perf_counter()
        pipeline.extract_from_text(doc.text, variant=variant)
        times.append((time.perf_counter() - t0) * 1000)

    times_sorted = sorted(times)
    n = len(times_sorted)
    p50 = times_sorted[int(n * 0.50)]
    p95 = times_sorted[min(int(n * 0.95), n - 1)]
    return LatencyStats(
        p50_ms=round(p50, 1),
        p95_ms=round(p95, 1),
        mean_ms=round(statistics.mean(times), 1),
        min_ms=round(min(times), 1),
        max_ms=round(max(times), 1),
    )


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------

def print_table(rows: list[tuple], headers: list[str]) -> None:
    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, cell in enumerate(row):
            col_widths[i] = max(col_widths[i], len(str(cell)))
    sep = "  "
    header_line = sep.join(h.ljust(col_widths[i]) for i, h in enumerate(headers))
    divider = sep.join("-" * w for w in col_widths)
    print(header_line)
    print(divider)
    for row in rows:
        print(sep.join(str(cell).ljust(col_widths[i]) for i, cell in enumerate(row)))


def print_report(
    span_metrics: dict[str, SpanMatchResult],
    fp_rates: dict[str, float],
    calibration: dict[str, Any],
    latency: LatencyStats | None,
    model_version: str,
    variant: str,
    match_mode: str = "overlap",
) -> None:
    print(f"\n{'='*60}")
    print(f"SMDL LER Evaluation Report")
    print(f"  Model variant : {variant}")
    print(f"  Model version : {model_version}")
    print(f"  Match mode    : {match_mode}")
    print(f"{'='*60}\n")

    print("── Per-Entity Span Metrics (exact match) ──\n")
    rows = []
    for etype, m in sorted(span_metrics.items()):
        rows.append((
            etype,
            m.gold,
            m.predicted,
            m.true_positive,
            f"{m.precision:.4f}",
            f"{m.recall:.4f}",
            f"{m.f1:.4f}",
            f"{fp_rates.get(etype, 0):.4f}",
        ))
    print_table(
        rows,
        ["Entity Type", "Gold", "Predicted", "TP", "Precision", "Recall", "F1", "FP Rate"],
    )

    # Aggregate
    all_gold = sum(m.gold for m in span_metrics.values())
    all_pred = sum(m.predicted for m in span_metrics.values())
    all_tp = sum(m.true_positive for m in span_metrics.values())
    micro_p = all_tp / all_pred if all_pred else 0.0
    micro_r = all_tp / all_gold if all_gold else 0.0
    micro_f1 = 2 * micro_p * micro_r / (micro_p + micro_r) if (micro_p + micro_r) else 0.0
    macro_f1 = statistics.mean(m.f1 for m in span_metrics.values())

    print(f"\n── Aggregate ──\n")
    print_table(
        [
            ("Micro", f"{micro_p:.4f}", f"{micro_r:.4f}", f"{micro_f1:.4f}"),
            ("Macro", "—", "—", f"{macro_f1:.4f}"),
        ],
        ["Scope", "Precision", "Recall", "F1"],
    )

    print(f"\n── Confidence Calibration ──\n")
    cal_rows = [
        (bucket, data["n"], data["accuracy"] if data["accuracy"] is not None else "—")
        for bucket, data in calibration.items()
    ]
    print_table(cal_rows, ["Confidence Bin", "Predictions", "Accuracy"])

    if latency:
        print(f"\n── Latency (text extraction, CPU) ──\n")
        print_table(
            [(latency.p50_ms, latency.p95_ms, latency.mean_ms, latency.min_ms, latency.max_ms)],
            ["p50 (ms)", "p95 (ms)", "Mean (ms)", "Min (ms)", "Max (ms)"],
        )

    print()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate SMDL LER model")
    parser.add_argument(
        "--data",
        type=Path,
        required=True,
        help="Path to annotated JSON evaluation file",
    )
    parser.add_argument(
        "--variant",
        type=str,
        default=None,
        help="Model variant: baseline | layout | layout_structure (default: from .env)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Optional path to write JSON report",
    )
    parser.add_argument(
        "--match",
        type=str,
        default="overlap",
        choices=["overlap", "exact"],
        help="Span matching mode: 'overlap' (default, lenient) or 'exact' (strict value match)",
    )
    parser.add_argument(
        "--no-latency",
        action="store_true",
        help="Skip latency measurement (useful when running without a warm model)",
    )
    args = parser.parse_args()

    if not args.data.exists():
        print(f"ERROR: data file not found: {args.data}", file=sys.stderr)
        sys.exit(1)

    print(f"Loading evaluation data from {args.data} …")
    docs = load_annotated(args.data)
    print(f"  {len(docs)} documents loaded")

    print("Initializing LER pipeline …")
    pipeline = LerPipeline()

    print("Running inference …")
    predictions: list[list[EntitySpan]] = []
    model_version = "unknown"
    for doc in docs:
        result = pipeline.extract_from_text(doc.text, variant=args.variant)
        predictions.append(result.entities)
        model_version = result.model_version

    span_metrics = compute_span_metrics(docs, predictions, match_mode=args.match)
    fp_rates = false_positive_rates(span_metrics)
    calibration = confidence_calibration(docs, predictions)

    latency: LatencyStats | None = None
    if not args.no_latency:
        print("Measuring latency …")
        latency = measure_latency(pipeline, docs, variant=args.variant)

    variant_label = args.variant or "default"
    print_report(span_metrics, fp_rates, calibration, latency, model_version, variant_label, args.match)

    if args.out:
        report = {
            "model_version": model_version,
            "variant": variant_label,
            "match_mode": args.match,
            "n_documents": len(docs),
            "per_entity": {
                etype: {
                    "precision": round(m.precision, 4),
                    "recall": round(m.recall, 4),
                    "f1": round(m.f1, 4),
                    "fp_rate": fp_rates.get(etype, 0),
                    "gold": m.gold,
                    "predicted": m.predicted,
                    "true_positive": m.true_positive,
                }
                for etype, m in span_metrics.items()
            },
            "calibration": calibration,
            "latency_ms": asdict(latency) if latency else None,
        }
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"JSON report written to {args.out}")


if __name__ == "__main__":
    main()
