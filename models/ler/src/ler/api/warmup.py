import logging
import threading

from ler.api.deps import get_pipeline
from ler.models.registry import get_predictor
from ler.shared.config import get_settings

logger = logging.getLogger(__name__)

_state = {"ready": False, "error": None}


def is_ready() -> bool:
    return _state["ready"]


def warmup_error() -> str | None:
    return _state["error"]


def _load_models() -> None:
    settings = get_settings()
    try:
        get_pipeline()
        get_predictor(settings.ler_model_variant)
        _state["ready"] = True
        logger.info("ler models warmed up (variant=%s)", settings.ler_model_variant)
    except Exception as exc:
        _state["error"] = str(exc)
        logger.exception("ler warmup failed")


def start_warmup() -> None:
    """Preload docling + NER models so the first extraction is not slowed by cold start."""
    if not get_settings().ler_warmup:
        _state["ready"] = True
        return

    threading.Thread(target=_load_models, name="ler-warmup", daemon=True).start()
