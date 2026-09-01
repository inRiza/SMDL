# SMDL LER — Docling + IndoBERT

Information extraction service for Indonesian PDF/DOCX documents.

## Architecture

```text
PDF / DOCX
    │
    ▼
 Docling
    │
    ▼
NormalizedDocument (text + bbox + block type)
    │
    ├─ baseline ──► IndoBERT NER
    ├─ layout ────► IndoBERT + layout fusion
    └─ layout_structure ► IndoBERT + layout + structure fusion
    │
    ▼
Structured entities (JSON)
```

## Phases

| Variant | Description |
|---|---|
| `baseline` | Docling → text → IndoBERT NER |
| `layout` | Adds bbox fusion from Docling |
| `layout_structure` | Adds element-type fusion |

## Run locally

Requires [uv](https://docs.astral.sh/uv/).

```bash
cd models/ler
uv sync
cp .env.example .env
uv run python -m ler.main
# atau: uv run ler
```

Dev dependencies:

```bash
uv sync --group dev
uv run pytest
```

Training dependencies:

```bash
uv sync --group train
uv run python scripts/train.py
```

## Performance

| Setting | Default | Effect |
|---|---|---|
| `LER_ENABLE_OCR` | `false` | OCR only needed for scanned PDFs; adds minutes per document on CPU |
| `LER_WARMUP` | `true` | Preloads Docling + NER models at startup so the first request is not slowed by cold start |

`GET /health` reports `models_ready` — extraction is fast once it turns `true`.

## API

- `GET /health`
- `POST /extract/text` — JSON `{ "text": "...", "model_variant": "baseline" }`
- `POST /extract/document` — multipart file upload

## Backend integration

Set in `be/.env`:

```env
LER_SERVICE_URL=http://localhost:8000
LER_TIMEOUT_MS=180000
LER_MODEL_VARIANT=baseline
```
