import logging

from ler.models.baseline.indobert_ner import IndoBertNerModel
from ler.models.layout.fusion_ner import LayoutFusionNerModel
from ler.shared.types import EntitySpan, NormalizedDocument, TextBlock

logger = logging.getLogger(__name__)

_STRUCTURE_WEIGHTS = {
    "title": 0.08,
    "section": 0.06,
    "paragraph": 0.02,
    "table": 0.05,
    "list": 0.03,
    "header": 0.01,
    "footer": 0.01,
    "other": 0.0,
}


class StructureFusionNerModel:
    """Phase 3 — adds Docling element-type signal on top of layout fusion."""

    def __init__(self, layout_model: LayoutFusionNerModel) -> None:
        self._layout_model = layout_model

    @property
    def model_version(self) -> str:
        return self._layout_model.model_version.replace("layout", "layout-structure")

    def predict(self, document: NormalizedDocument) -> list[EntitySpan]:
        entities = self._layout_model.predict(document)
        if not document.blocks:
            return entities

        boosted: list[EntitySpan] = []
        for entity in entities:
            structure_boost = self._structure_boost(entity, document.blocks)
            boosted.append(
                EntitySpan(
                    type=entity.type,
                    value=entity.value,
                    start=entity.start,
                    end=entity.end,
                    confidence=round(min(1.0, entity.confidence + structure_boost), 4),
                    source_text=entity.source_text,
                )
            )

        logger.info("structure fusion applied on %d blocks", len(document.blocks))
        return boosted

    def _structure_boost(self, entity: EntitySpan, blocks: list[TextBlock]) -> float:
        boost = 0.0
        for block in blocks:
            if block.char_end <= entity.start or block.char_start >= entity.end:
                continue
            boost = max(boost, _STRUCTURE_WEIGHTS.get(block.block_type.value, 0.0))
        return boost
