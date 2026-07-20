import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.document.createMany({
    data: [
      {
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
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });