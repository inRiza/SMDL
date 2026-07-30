export const SMDL_KNOWLEDGE_REPLY = `SMDL (Sistem Manajemen Dokumen Legal) adalah aplikasi internal PT Telkom Indonesia untuk mengelola, menyimpan, dan menelusuri dokumen legal perusahaan — seperti kontrak, perjanjian, kebijakan, dan dokumen legal lainnya.

TELLS adalah asisten AI di dalam SMDL yang membantu Anda bekerja dengan dokumen-dokumen tersebut.`;

export const CAPABILITY_REPLY = `${SMDL_KNOWLEDGE_REPLY}

Berikut yang bisa saya bantu:
1. Mencari dokumen berdasarkan judul, kategori, atau kata kunci
2. Menampilkan dokumen terbaru
3. Menampilkan daftar atau jumlah dokumen
4. Menjawab pertanyaan isi dokumen klausul, pihak, jangka waktu, dan sebagainya

Contoh pertanyaan:
- "cari dokumen NDA vendor"
- "dokumen terbaru apa?"
- "ada berapa dokumen di SMDL?"
- "apa isi klausul pembayaran di kontrak X?"`;

export const GREETING_REPLY = `Halo! Saya TELLS, asisten dokumen legal Telkom di SMDL.

Saya bisa membantu mencari dokumen, melihat dokumen terbaru, dan menjawab pertanyaan seputar isi dokumen legal. Silakan tanyakan langsung, misalnya "cari dokumen kontrak" atau "dokumen terbaru apa?".`;

export function buildMetaReply(_message: string) {
  return CAPABILITY_REPLY;
}
