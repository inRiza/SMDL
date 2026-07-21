const STOPWORDS = new Set([
  "yang",
  "dengan",
  "dari",
  "untuk",
  "pada",
  "dalam",
  "adalah",
  "atau",
  "dan",
  "di",
  "ke",
  "the",
  "a",
  "an",
  "is",
  "are",
  "this",
  "that",
  "please",
  "tolong",
  "tampilkan",
  "show",
  "list",
  "cari",
  "apa",
  "siapa",
  "bagaimana",
  "kapan",
  "dimana",
  "dokumen",
  "document",
  "documents",
  "terbaru",
  "latest",
  "newest",
  "semua",
  "ada",
  "berapa",
]);

const GREETING_PREFIX =
  /^(?:halo|hai|hi|hello|hey|selamat\s+(?:pagi|siang|sore|malam)|good\s+(?:morning|afternoon|evening))[,!.?\s]+/i;

const PURE_GREETING =
  /^(?:halo|hai|hi|hello|hey|terima kasih|thanks|makasih|apa kabar|good\s+(?:morning|afternoon|evening))[!.?\s]*$/i;

const META_PATTERN =
  /^(?:kamu siapa|siapa tells|apa itu tells|what is tells|fungsi tells|kamu bisa apa)[!.?\s]*$/i;

export type QueryIntent =
  | "greeting"
  | "meta"
  | "document_latest"
  | "document_list"
  | "document_search"
  | "content_question";

export function stripGreeting(message: string) {
  const text = message.trim();
  const stripped = text.replace(GREETING_PREFIX, "").trim();
  return stripped.length > 0 ? stripped : text;
}

export function isPureGreeting(message: string) {
  return PURE_GREETING.test(message.trim());
}

export function isMetaQuery(message: string) {
  return META_PATTERN.test(stripGreeting(message).trim());
}

export function classifyQuery(message: string): QueryIntent {
  const text = message.trim();

  if (isPureGreeting(text)) return "greeting";
  if (isMetaQuery(text)) return "meta";

  const query = stripGreeting(text).toLowerCase();

  if (
    /terbaru|latest|newest|paling baru|baru saja|yang baru/.test(query) &&
    /dokumen|doc|kontrak|perjanjian|file|arsip/.test(query)
  ) {
    return "document_latest";
  }

  if (
    /(?:daftar|list|semua|berapa|jumlah|total|overview|ringkasan|summary|ada\s+berapa)/.test(
      query
    ) &&
    /dokumen|doc|kontrak|perjanjian|file|arsip|smdl/.test(query)
  ) {
    return "document_list";
  }

  if (
    /^(?:cari|temukan|search|find)\b/.test(query) ||
    (/dokumen|kontrak|nda|addendum|perjanjian/.test(query) &&
      !/(?:siapa|kapan|berapa|isi|klausul|pihak|jangka|pembayaran|nilai|masa)/.test(
        query
      ))
  ) {
    return "document_search";
  }

  return "content_question";
}

export function extractSearchTerms(message: string) {
  const query = stripGreeting(message);

  return query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3 && !STOPWORDS.has(term));
}

export function isDocumentRelated(message: string) {
  const query = stripGreeting(message).toLowerCase();
  return /dokumen|doc|kontrak|nda|addendum|perjanjian|legal|smdl|vendor|telkom|file|arsip/.test(
    query
  );
}

export function wasGreetingIncluded(message: string) {
  const text = message.trim();
  return GREETING_PREFIX.test(text) && !isPureGreeting(text);
}
