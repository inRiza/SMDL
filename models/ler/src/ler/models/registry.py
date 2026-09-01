from functools import lru_cache

from transformers import AutoModelForTokenClassification, AutoTokenizer, pipeline

from ler.models.baseline.indobert_ner import IndoBertNerModel
from ler.models.layout.fusion_ner import LayoutFusionNerModel
from ler.models.structure.structure_fusion import StructureFusionNerModel
from ler.shared.config import get_settings, load_inference_config, load_label_config
from ler.shared.types import EntitySpan, NormalizedDocument


class BasePredictor:
    model_version: str = "unknown"

    def predict(self, document: NormalizedDocument) -> list[EntitySpan]:
        raise NotImplementedError


@lru_cache
def _build_baseline() -> IndoBertNerModel:
    settings = get_settings()
    inference = load_inference_config()
    labels = load_label_config()

    model_name = settings.ler_ner_model
    tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=True)
    model = AutoModelForTokenClassification.from_pretrained(model_name)

    ner_pipeline = pipeline(
        "ner",
        model=model,
        tokenizer=tokenizer,
        aggregation_strategy="simple",
        device=-1,
    )

    return IndoBertNerModel(
        ner_pipeline=ner_pipeline,
        model_id=settings.ler_ner_model.split("/")[-1],
        label_mapping=labels.get("ner_to_smdl", {}),
        confidence_threshold=settings.ler_confidence_threshold,
        window_max_chars=int(inference.get("window_max_chars", 4000)),
        window_overlap_chars=int(inference.get("window_overlap_chars", 200)),
    )


@lru_cache
def get_predictor(variant: str | None = None) -> BasePredictor:
    settings = get_settings()
    selected = (variant or settings.ler_model_variant or "baseline").lower()

    baseline = _build_baseline()

    if selected == "baseline":
        return baseline

    layout_model = LayoutFusionNerModel(baseline)

    if selected == "layout":
        return layout_model

    if selected in {"layout_structure", "layout-structure", "full"}:
        return StructureFusionNerModel(layout_model)

    raise ValueError(f"unknown model variant: {selected}")
