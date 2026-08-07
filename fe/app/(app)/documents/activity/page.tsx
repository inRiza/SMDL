import { DocumentActivityView } from "../components/document-activity-view";
import { fetchDocumentWorkspace } from "@/lib/api/document/route";

export default async function DocumentActivityPage() {
  const workspace = await fetchDocumentWorkspace();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <DocumentActivityView workspace={workspace} />
    </div>
  );
}
