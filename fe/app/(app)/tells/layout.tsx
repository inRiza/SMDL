export default function TellsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-full min-h-0 flex-1 overflow-hidden">
      {children}
    </div>
  );
}
