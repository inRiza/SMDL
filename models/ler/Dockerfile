FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock ./

ENV UV_LINK_MODE=copy
RUN uv sync --frozen --no-dev

COPY config ./config
COPY src ./src

ENV PYTHONPATH=/app/src
ENV LER_HOST=0.0.0.0
ENV LER_PORT=8000

EXPOSE 8000

CMD ["uv", "run", "python", "-m", "ler.main"]
