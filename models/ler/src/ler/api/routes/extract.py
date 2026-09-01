import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ler.api.deps import get_pipeline
from ler.api.schemas.extract import (
    BlockItem,
    EntityItem,
    ExtractResponse,
    ExtractTextRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["extract"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}


def _to_response(result) -> ExtractResponse:
    return ExtractResponse(
        entities=[
            EntityItem(
                type=e.type,
                value=e.value,
                start=e.start,
                end=e.end,
                confidence=round(e.confidence, 4),
                source_text=e.source_text,
            )
            for e in result.entities
        ],
        blocks=[
            BlockItem(
                text=b.text,
                block_type=b.block_type.value,
                level=b.level,
                page=b.bbox.page if b.bbox else 0,
                char_start=b.char_start,
                char_end=b.char_end,
            )
            for b in result.document.blocks
        ],
        model_version=result.model_version,
        model_variant=result.model_variant,
        entity_count=len(result.entities),
        full_text=result.document.full_text,
        block_count=len(result.document.blocks),
    )


@router.post("/extract/text", response_model=ExtractResponse)
def extract_text(request: ExtractTextRequest) -> ExtractResponse:
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is empty")

    try:
        result = get_pipeline().extract_from_text(text, request.model_variant)
    except Exception as exc:
        logger.exception("text extraction failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return _to_response(result)


@router.post("/extract/document", response_model=ExtractResponse)
def extract_document(
    file: UploadFile = File(...),
    document_id: str | None = Form(default=None),
    model_variant: str | None = Form(default=None),
) -> ExtractResponse:
    filename = file.filename or "document.pdf"
    suffix = filename.lower()[filename.rfind(".") :] if "." in filename else ""
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"unsupported file type: {suffix or 'unknown'}",
        )

    content = file.file.read()
    if not content:
        raise HTTPException(status_code=400, detail="file is empty")

    try:
        result = get_pipeline().extract_from_bytes(content, filename, model_variant)
    except Exception as exc:
        logger.exception("document extraction failed doc_id=%s", document_id)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return _to_response(result)
