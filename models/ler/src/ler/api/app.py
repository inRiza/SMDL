from contextlib import asynccontextmanager

from fastapi import FastAPI

from ler import __version__
from ler.api.routes.extract import router as extract_router
from ler.api.routes.health import router as health_router
from ler.api.warmup import start_warmup


@asynccontextmanager
async def lifespan(_: FastAPI):
    start_warmup()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="SMDL LER Service",
        description="Docling + IndoBERT information extraction for Indonesian documents",
        version=__version__,
        lifespan=lifespan,
    )
    app.include_router(health_router)
    app.include_router(extract_router)
    return app


app = create_app()
