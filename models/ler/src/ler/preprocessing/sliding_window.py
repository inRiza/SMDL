from dataclasses import dataclass


@dataclass
class TextWindow:
    text: str
    start: int


def truncate_text(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars]


def sliding_windows(text: str, max_chars: int, overlap_chars: int) -> list[TextWindow]:
    if not text:
        return []

    if len(text) <= max_chars:
        return [TextWindow(text=text, start=0)]

    windows: list[TextWindow] = []
    start = 0
    step = max(max_chars - overlap_chars, 1)

    while start < len(text):
        end = min(start + max_chars, len(text))
        windows.append(TextWindow(text=text[start:end], start=start))
        if end >= len(text):
            break
        start += step

    return windows
