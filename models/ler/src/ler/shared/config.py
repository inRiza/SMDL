from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[3]
CONFIG_DIR = ROOT / "config"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ler_host: str = Field(default="0.0.0.0", alias="LER_HOST")
    ler_port: int = Field(default=8000, alias="LER_PORT")
    ler_model_variant: str = Field(default="baseline", alias="LER_MODEL_VARIANT")
    ler_base_model: str = Field(
        default="indobenchmark/indobert-base-p1", alias="LER_BASE_MODEL"
    )
    ler_ner_model: str = Field(
        default="treamyracle/indobert-ner-gold", alias="LER_NER_MODEL"
    )
    ler_confidence_threshold: float = Field(default=0.5, alias="LER_CONFIDENCE_THRESHOLD")
    ler_max_text_chars: int = Field(default=50000, alias="LER_MAX_TEXT_CHARS")
    # OCR only matters for scanned PDFs; it costs minutes per document on CPU
    ler_enable_ocr: bool = Field(default=False, alias="LER_ENABLE_OCR")
    ler_warmup: bool = Field(default=True, alias="LER_WARMUP")


@lru_cache
def get_settings() -> Settings:
    return Settings()


def load_yaml(name: str) -> dict[str, Any]:
    path = CONFIG_DIR / name
    with path.open(encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


@lru_cache
def load_inference_config() -> dict[str, Any]:
    return load_yaml("inference.yaml")


@lru_cache
def load_label_config() -> dict[str, Any]:
    return load_yaml("labels.yaml")
