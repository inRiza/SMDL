import { TellsWorkspace } from "./components/tells-workspace";

export default function TellsPage() {
  return (
    <div className="flex h-[calc(100svh-3.5rem)] min-h-0 flex-col overflow-hidden">
      <TellsWorkspace />
    </div>
  );
}
