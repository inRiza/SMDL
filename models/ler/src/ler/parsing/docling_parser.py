import logging
import tempfile
from pathlib import Path

from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption

from ler.shared.config import get_settings
from ler.shared.types import BBox, BlockType, NormalizedDocument, TextBlock

logger = logging.getLogger(__name__)

_BLOCK_TYPE_MAP = {
    "title": BlockType.TITLE,
    "section_header": BlockType.SECTION,
    "text": BlockType.PARAGRAPH,
    "paragraph": BlockType.PARAGRAPH,
    "table": BlockType.TABLE,
    "list_item": BlockType.LIST,
    "page_header": BlockType.HEADER,
    "page_footer": BlockType.FOOTER,
}


def _guess_format(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix == ".pdf":
        return "pdf"
    if suffix in {".docx", ".doc"}:
        return "docx"
    return "unknown"


def _bbox_from_prov(prov_list) -> BBox | None:
    if not prov_list:
        return None
    prov = prov_list[0]
    bbox = getattr(prov, "bbox", None)
    if bbox is None:
        return None
    page = getattr(prov, "page_no", 0) or 0
    return BBox(
        x0=float(getattr(bbox, "l", 0)),
        y0=float(getattr(bbox, "t", 0)),
        x1=float(getattr(bbox, "r", 0)),
        y1=float(getattr(bbox, "b", 0)),
        page=int(page),
    )


def _label_value(item) -> str:
    """docling labels are enum members; fall back to plain strings for docx."""
    label = getattr(item, "label", "text")
    return str(getattr(label, "value", label)).lower().replace("-", "_")


def _block_type_from_label(label: str) -> BlockType:
    return _BLOCK_TYPE_MAP.get(label, BlockType.OTHER)


def _heading_level(block_type: BlockType, docling_level: int) -> int:
    """Normalize docling tree depth into a 1-based heading level; 0 = body text."""
    if block_type is BlockType.TITLE:
        return 1
    if block_type is BlockType.SECTION:
        return max(1, int(docling_level or 1))
    return 0


def _build_converter() -> DocumentConverter:
    settings = get_settings()
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = settings.ler_enable_ocr
    pipeline_options.do_table_structure = True

    logger.info("docling converter ready (ocr=%s)", settings.ler_enable_ocr)

    return DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )


class DoclingParser:
    def __init__(self) -> None:
        self._converter = _build_converter()

    def parse_bytes(self, content: bytes, filename: str) -> NormalizedDocument:
        source_format = _guess_format(filename)
        suffix = Path(filename).suffix or ".bin"

        with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as tmp:
            tmp.write(content)
            tmp.flush()
            result = self._converter.convert(tmp.name)

        document = result.document
        full_text = document.export_to_markdown() or ""
        blocks: list[TextBlock] = []
        cursor = 0

        for item, level in document.iterate_items():
            text = getattr(item, "text", None)
            if not text or not str(text).strip():
                continue

            chunk = str(text).strip()
            label = _label_value(item)
            prov = getattr(item, "prov", None)
            bbox = _bbox_from_prov(prov) if prov else None
            block_type = _block_type_from_label(label)

            char_start = full_text.find(chunk, cursor)
            if char_start == -1:
                char_start = cursor
            char_end = char_start + len(chunk)

            blocks.append(
                TextBlock(
                    text=chunk,
                    block_type=block_type,
                    bbox=bbox,
                    char_start=char_start,
                    char_end=char_end,
                    level=_heading_level(block_type, level),
                )
            )
            cursor = char_end

        page_count = 0
        if hasattr(document, "pages"):
            page_count = len(document.pages)

        if not full_text.strip() and blocks:
            full_text = "\n\n".join(block.text for block in blocks)

        logger.info(
            "docling parsed %s: %d blocks, %d chars, %d pages",
            filename,
            len(blocks),
            len(full_text),
            page_count,
        )

        return NormalizedDocument(
            full_text=full_text.strip(),
            blocks=blocks,
            source_format=source_format,
            page_count=page_count,
        )

    def parse_text(self, text: str) -> NormalizedDocument:
        cleaned = text.strip()
        return NormalizedDocument(
            full_text=cleaned,
            blocks=[
                TextBlock(
                    text=cleaned,
                    block_type=BlockType.PARAGRAPH,
                    char_start=0,
                    char_end=len(cleaned),
                )
            ],
            source_format="text",
            page_count=0,
        )
