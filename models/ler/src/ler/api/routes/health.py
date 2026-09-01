from fastapi import APIRouter

from ler import __version__
from ler.api.warmup import is_ready, warmup_error
from ler.shared.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    settings = get_settings()
    return {
        "status": "ok",
        "service": "smdl-ler",
        "version": __version__,
        "model_variant": settings.ler_model_variant,
        "base_model": settings.ler_base_model,
        "ner_model": settings.ler_ner_model,
        "ocr_enabled": settings.ler_enable_ocr,
        "models_ready": is_ready(),
        "warmup_error": warmup_error(),
    }
