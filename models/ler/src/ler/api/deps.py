from functools import lru_cache

from ler.inference.pipeline import LerPipeline


@lru_cache
def get_pipeline() -> LerPipeline:
    return LerPipeline()
