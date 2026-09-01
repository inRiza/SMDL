import logging

from ler.shared.types import BBox, TextBlock


def _normalize_bbox(bbox: BBox) -> tuple[float, float, float, float]:
    width = max(bbox.x1 - bbox.x0, 1.0)
    height = max(bbox.y1 - bbox.y0, 1.0)
    return (
        bbox.x0 / width,
        bbox.y0 / height,
        bbox.x1 / width,
        bbox.y1 / height,
    )


class LayoutEncoder:
    """Phase 2 — spatial embedding from Docling bbox."""

    def encode_block(self, block: TextBlock) -> list[float]:
        if block.bbox is None:
            return [0.0, 0.0, 0.0, 0.0, float(block.block_type.value == "paragraph")]

        x0, y0, x1, y1 = _normalize_bbox(block.bbox)
        type_hint = hash(block.block_type.value) % 7 / 7.0
        page_hint = min(block.bbox.page / 50.0, 1.0)
        return [x0, y0, x1, y1, type_hint, page_hint, (x1 - x0) * (y1 - y0)]

    def encode_document(self, blocks: list[TextBlock]) -> list[list[float]]:
        return [self.encode_block(block) for block in blocks if block.text.strip()]
