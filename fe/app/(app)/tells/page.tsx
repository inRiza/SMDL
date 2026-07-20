import { AppHeader } from "@/components/app/app-header";
import { PagePlaceholder } from "@/components/app/page-placeholder";

export default function TellsPage() {
  return (
    <>
      <AppHeader
        title="TELLS"
        description="Asisten inteligensi berbasis SLM"
      />
      <PagePlaceholder
        title="TELLS Asisten Inteligensi"
        description="Pencarian semantik, ringkasan dokumen, dan tanya jawab natural language."
      />
    </>
  );
}
