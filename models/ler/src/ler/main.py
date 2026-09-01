import uvicorn

from ler.shared.config import get_settings


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "ler.api.app:app",
        host=settings.ler_host,
        port=settings.ler_port,
        reload=False,
    )


if __name__ == "__main__":
    main()
