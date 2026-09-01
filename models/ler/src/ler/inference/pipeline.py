from ler.models.registry import get_predictor
from ler.parsing.docling_parser import DoclingParser
from ler.preprocessing.sliding_window import truncate_text
from ler.shared.config import get_settings
from ler.shared.types import ExtractionResult, NormalizedDocument


class LerPipeline:
    def __init__(self) -> None:
        self._parser = DoclingParser()
        self._settings = get_settings()

    def extract_from_bytes(
        self,
        content: bytes,
        filename: str,
        variant: str | None = None,
    ) -> ExtractionResult:
        document = self._parser.parse_bytes(content, filename)
        return self._run(document, variant)

    def extract_from_text(
        self,
        text: str,
        variant: str | None = None,
    ) -> ExtractionResult:
        document = self._parser.parse_text(text)
        return self._run(document, variant)

    def _run(
        self,
        document: NormalizedDocument,
        variant: str | None,
    ) -> ExtractionResult:
        max_chars = self._settings.ler_max_text_chars
        if len(document.full_text) > max_chars:
            document.full_text = truncate_text(document.full_text, max_chars)

        predictor = get_predictor(variant)
        entities = predictor.predict(document)

        return ExtractionResult(
            entities=entities,
            document=document,
            model_variant=(variant or self._settings.ler_model_variant).lower(),
            model_version=predictor.model_version,
        )
