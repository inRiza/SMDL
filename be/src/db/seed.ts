import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DOC_IDS = {
  vendorA: "11111111-1111-1111-1111-111111111101",
  addendum: "11111111-1111-1111-1111-111111111102",
  nda: "11111111-1111-1111-1111-111111111103",
} as const;

async function main() {
  await prisma.documentChunk.deleteMany();
  await prisma.document.deleteMany();

  await prisma.document.createMany({
    data: [
      {
        id: DOC_IDS.vendorA,
        title: "Perjanjian Kerja Sama Telkom & Vendor A",
        description: "Kontrak kerja sama layanan infrastruktur jaringan.",
        category: "Kontrak",
        fileFormat: "pdf",
        fileSizeBytes: 2048000,
        status: "ready",
        storageKey: "docs/sample-1.pdf",
        ownerId: "00000000-0000-0000-0000-000000000001",
      },
      {
        id: DOC_IDS.addendum,
        title: "Addendum Perjanjian 2025",
        description: "Addendum perpanjangan dan revisi klausul pembayaran.",
        category: "Addendum",
        fileFormat: "docx",
        fileSizeBytes: 512000,
        status: "ready",
        storageKey: "docs/sample-2.docx",
        ownerId: "00000000-0000-0000-0000-000000000001",
      },
      {
        id: DOC_IDS.nda,
        title: "NDA Proyek Internal",
        description: "Non-disclosure agreement untuk proyek transformasi digital.",
        category: "NDA",
        fileFormat: "pdf",
        fileSizeBytes: 1024000,
        status: "processing",
        storageKey: "docs/sample-3.pdf",
        ownerId: "00000000-0000-0000-0000-000000000001",
      },
    ],
  });

  await prisma.documentChunk.createMany({
    data: [
      {
        documentId: DOC_IDS.vendorA,
        chunkIndex: 0,
        content:
          "Perjanjian Kerja Sama antara PT Telekomunikasi Indonesia Tbk (Telkom) dan Vendor A. Telkom bertindak sebagai pihak pertama. Vendor A bertindak sebagai pihak kedua. Ruang lingkup meliputi layanan infrastruktur jaringan dan pemeliharaan perangkat.",
      },
      {
        documentId: DOC_IDS.vendorA,
        chunkIndex: 1,
        content:
          "Jangka waktu perjanjian 24 bulan sejak tanggal penandatanganan. Pembayaran dilakukan setiap bulan berdasarkan invoice yang disetujui Telkom.",
      },
      {
        documentId: DOC_IDS.addendum,
        chunkIndex: 0,
        content:
          "Addendum Perjanjian 2025 memperpanjang kontrak Vendor A selama 12 bulan. Klausul pembayaran diubah menjadi termin 30 hari setelah invoice diterima.",
      },
      {
        documentId: DOC_IDS.nda,
        chunkIndex: 0,
        content:
          "Non-disclosure agreement untuk proyek transformasi digital internal Telkom. Pihak penerima wajib menjaga kerahasiaan informasi selama 3 tahun.",
      },
    ],
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
