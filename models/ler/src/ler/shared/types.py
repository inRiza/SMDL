from dataclasses import dataclass, field
from enum import Enum


class BlockType(str, Enum):
    TITLE = "title"
    SECTION = "section"
    PARAGRAPH = "paragraph"
    TABLE = "table"
    LIST = "list"
    HEADER = "header"
    FOOTER = "footer"
    OTHER = "other"


@dataclass
class BBox:
    x0: float
    y0: float
    x1: float
    y1: float
    page: int = 0


@dataclass
class TextBlock:
    text: str
    block_type: BlockType = BlockType.PARAGRAPH
    bbox: BBox | None = None
    char_start: int = 0
    char_end: int = 0
    # docling hierarchy depth; 1 = top level heading
    level: int = 0


@dataclass
class NormalizedDocument:
    full_text: str
    blocks: list[TextBlock] = field(default_factory=list)
    source_format: str = "unknown"
    page_count: int = 0


@dataclass
class EntitySpan:
    type: str
    value: str
    start: int
    end: int
    confidence: float
    source_text: str


@dataclass
class ExtractionResult:
    entities: list[EntitySpan]
    document: NormalizedDocument
    model_variant: str
    model_version: str
