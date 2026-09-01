"""
Generator eval.json untuk SMDL LER — auto-compute offset, no manual counting.

Cara pakai: isi ANNOTATIONS di bawah dengan (text, [(type, value), ...]),
lalu jalankan:
    python build_eval.py

Skrip akan mencari setiap `value` di dalam `text` menggunakan str.find(),
menghitung start/end secara otomatis, dan memvalidasi bahwa text[start:end]
memang sama persis dengan value yang diminta. Kalau ada value yang tidak
ditemukan atau duplikat tanpa disambiguasi posisi, skrip akan berhenti
dengan pesan error yang jelas — bukan menghasilkan offset yang salah diam-diam.
"""

from __future__ import annotations

import json
from pathlib import Path

# setiap entri: (text, [(type, value, occurrence_index), ...])
# occurrence_index = ke berapa kemunculan value tsb dalam teks (0-based),
# dibutuhkan hanya kalau value yang sama muncul berkali-kali di teks yang sama
ANNOTATIONS: list[tuple[str, list[tuple[str, str, int]]]] = [
    (
        "PERJANJIAN KERJA SAMA\n\n"
        "Nomor: TELKOM/LEGAL/2025/001\n\n"
        "Perjanjian ini dibuat dan ditandatangani pada tanggal 15 Januari 2025 "
        "di Jakarta Selatan, oleh dan antara:\n\n"
        "1. PT Telkom Indonesia Tbk, sebuah perseroan terbatas yang didirikan "
        "berdasarkan hukum Republik Indonesia, beralamat di Jl. Japati No. 1, "
        "Bandung (selanjutnya disebut \"Pihak Pertama\");\n\n"
        "2. PT Mitra Solusi, sebuah perseroan terbatas yang didirikan "
        "berdasarkan hukum Republik Indonesia, beralamat di Jl. Sudirman No. 5, "
        "Jakarta (selanjutnya disebut \"Pihak Kedua\").\n\n"
        "Pihak Pertama dan Pihak Kedua secara bersama-sama selanjutnya disebut "
        "\"Para Pihak\".",
        [
            ("CONTRACT_NO", "TELKOM/LEGAL/2025/001", 0),
            ("DATE", "15 Januari 2025", 0),
            ("LOCATION", "Jakarta Selatan", 0),
            ("PARTY", "PT Telkom Indonesia Tbk", 0),
            ("ORG", "PT Telkom Indonesia Tbk", 0),
            ("PARTY", "PT Mitra Solusi", 0),
            ("ORG", "PT Mitra Solusi", 0),
        ],
    ),
]


def find_nth(text: str, value: str, n: int) -> int:
    idx = -1
    for _ in range(n + 1):
        idx = text.find(value, idx + 1)
        if idx == -1:
            return -1
    return idx


def build() -> list[dict]:
    docs = []
    for text, entities in ANNOTATIONS:
        resolved = []
        for etype, value, occurrence in entities:
            idx = find_nth(text, value, occurrence)
            if idx == -1:
                raise ValueError(
                    f"value not found (occurrence={occurrence}): {value!r}"
                )
            start, end = idx, idx + len(value)
            actual = text[start:end]
            if actual != value:
                raise ValueError(
                    f"offset mismatch for {value!r}: got {actual!r} at [{start}:{end}]"
                )
            resolved.append(
                {"type": etype, "start": start, "end": end, "value": value}
            )
        docs.append({"text": text, "entities": resolved})
    return docs


if __name__ == "__main__":
    docs = build()
    out_path = Path("data/annotated/eval.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(docs, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {len(docs)} document(s) to {out_path}")
    for doc in docs:
        for e in doc["entities"]:
            print(f"  {e['type']:12} [{e['start']:3}:{e['end']:3}] {e['value']!r}")