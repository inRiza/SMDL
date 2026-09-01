# SMDL Models

Machine learning services for SMDL.

## LER Service (`models/ler`)

Indonesian Legal Entity Recognition using **Docling + IndoBERT**.

```text
PDF / DOCX → Docling → IndoBERT NER → structured entities
```

### Quick start

```bash
cd models/ler
uv sync
cp .env.example .env
uv run python -m ler.main
```

Service runs at `http://localhost:8000`.

### Model variants

| Variant | Phase | Description |
|---|---|---|
| `baseline` | 1 | Text-only IndoBERT NER |
| `layout` | 2 | IndoBERT + Docling bbox fusion |
| `layout_structure` | 3 | + Docling element-type fusion |

### Backend integration

Configure in `be/.env`:

```env
LER_SERVICE_URL=http://localhost:8000
LER_MODEL_VARIANT=baseline
```

Or via Docker:

```bash
cd be
docker compose up -d
```

## Project layout

```text
models/
├── ler/                   # LER service (Docling + IndoBERT)
│   ├── config/
│   ├── src/ler/
│   ├── scripts/
│   └── tests/
└── README.md
```
