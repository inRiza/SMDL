from pydantic import BaseModel, Field


class ExtractTextRequest(BaseModel):
    text: str = Field(min_length=1)
    document_id: str | None = None
    model_variant: str | None = None


class EntityItem(BaseModel):
    type: str
    value: str
    start: int
    end: int
    confidence: float
    source_text: str


class BlockItem(BaseModel):
    text: str
    block_type: str
    level: int
    page: int
    char_start: int
    char_end: int


class ExtractResponse(BaseModel):
    entities: list[EntityItem]
    blocks: list[BlockItem] = Field(default_factory=list)
    model_version: str
    model_variant: str
    entity_count: int
    full_text: str
    block_count: int
    parser: str = "docling"
