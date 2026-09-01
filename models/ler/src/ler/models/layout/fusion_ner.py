import logging

from ler.models.baseline.indobert_ner import IndoBertNerModel
from ler.models.layout.layout_encoder import LayoutEncoder
from ler.shared.types import EntitySpan, NormalizedDocument, TextBlock

logger = logging.getLogger(__name__)


class LayoutFusionNerModel:
    """Phase 2 — IndoBERT + layout features (layout boosts confidence)."""

    def __init__(self, baseline: IndoBertNerModel) -> None:
        self._baseline = baseline
        self._layout_encoder = LayoutEncoder()

    @property
    def model_version(self) -> str:
        return self._baseline.model_version.replace("baseline", "layout")

    def predict(self, document: NormalizedDocument) -> list[EntitySpan]:
        entities = self._baseline.predict(document)
        if not document.blocks:
            return entities

        layout_blocks = [b for b in document.blocks if b.bbox is not None]
        if not layout_blocks:
            return entities

        layout_vectors = self._layout_encoder.encode_document(layout_blocks)
        layout_score = min(1.0, 0.05 * len(layout_vectors))

        boosted: list[EntitySpan] = []
        for entity in entities:
            overlap = self._layout_overlap(entity, layout_blocks)
            confidence = min(1.0, entity.confidence + layout_score * overlap)
            boosted.append(
                EntitySpan(
                    type=entity.type,
                    value=entity.value,
                    start=entity.start,
                    end=entity.end,
                    confidence=round(confidence, 4),
                    source_text=entity.source_text,
                )
            )

        logger.info("layout fusion applied on %d blocks", len(layout_blocks))
        return boosted

    def _layout_overlap(self, entity: EntitySpan, blocks: list[TextBlock]) -> float:
        hits = 0
        for block in blocks:
            if block.char_end <= entity.start or block.char_start >= entity.end:
                continue
            hits += 1
        if hits == 0:
            return 0.2
        return min(1.0, 0.4 + hits * 0.15)
