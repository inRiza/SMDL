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

const GENERIC_DOC_TERMS = new Set([
  "dokumen",
  "document",
  "documents",
  "doc",
  "file",
  "arsip",
  "smdl",
]);

const CAPABILITY_PATTERNS = [
  /^(?:apa|siapa|bagaimana)\s+(?:fungsi|peran|tugas|kemampuan)\s*(?:anda|kamu|mu|tells)?/i,
  /^fungsi\s+(?:anda|kamu|mu|tells)/i,
  /^(?:anda|kamu)\s+bisa\s+(?:apa|ngapain|melakukan\s+apa)/i,
  /^apa\s+yang\s+(?:anda|kamu)\s+bisa/i,
  /^(?:kamu|anda)\s+siapa/i,
  /^(?:apa|siapa)\s+(?:itu\s+)?tells/i,
  /^tells\s+itu\s+apa/i,
  /^smdl\s+itu\s+apa/i,
  /^apa\s+(?:itu\s+)?smdl\b/i,
  /^(?:apakah|bisakah)\s+(?:anda|kamu)\s+bisa/i,
  /^bisa\s+(?:tidak\s+)?(?:anda|kamu)\s+(?:mem)?(?:bantu|carikan|cari|mencari)/i,
  /^bisa\s+(?:tidak\s+)?(?:mem)?(?:bantu|carikan|cari|mencari)\s+(?:saya\s+)?(?:dokumen)?/i,
  /^(?:tolong\s+)?(?:jelaskan|informasikan)\s+(?:fungsi|kemampuan)/i,
  /^(?:kamu|anda)\s+dapat\s+(?:mem)?(?:bantu|carikan|cari)/i,
  /^apa\s+saja\s+yang\s+(?:anda|kamu)\s+(?:ketahui|tahu)/i,
  /^(?:anda|kamu)\s+(?:ketahui|tahu)\s+apa/i,
  /(?:tentang|terkait|mengenai)\s+(?:aplikasi\s+)?smdl/i,
  /(?:tentang|terkait|mengenai)\s+tells/i,
  /what\s+(?:can you|do you)\s+do/i,
  /what\s+is\s+tells/i,
  /what\s+is\s+smdl/i,
];

const DOCUMENT_TOPIC_PATTERN =
  /\b(?:dokumen|kontrak|nda|addendum|perjanjian)\b/i;

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
  const query = stripGreeting(message).trim();
  return CAPABILITY_PATTERNS.some((pattern) => pattern.test(query));
}

function hasSpecificDocumentTerms(message: string) {
  return extractSearchTerms(message).some((term) => !GENERIC_DOC_TERMS.has(term));
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

  const startsWithSearchVerb = /^(?:cari|temukan|search|find|carikan)\b/.test(query);
  const mentionsDocumentTopic =
    DOCUMENT_TOPIC_PATTERN.test(query) &&
    !/(?:siapa|kapan|berapa|isi|klausul|pihak|jangka|pembayaran|nilai|masa|fungsi|bisa|ketahui|tahu|aplikasi)/.test(
      query
    );

  if (startsWithSearchVerb || (mentionsDocumentTopic && hasSpecificDocumentTerms(message))) {
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
