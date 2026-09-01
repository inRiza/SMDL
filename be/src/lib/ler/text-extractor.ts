export function chunkText(text: string, chunkSize = 1200, overlap = 150) {
  if (!text.trim()) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks.filter(Boolean);
}
