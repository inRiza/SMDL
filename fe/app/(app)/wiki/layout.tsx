import { Suspense } from "react";
import { WikiSearchProvider } from "./components/wiki-search-provider";

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <WikiSearchProvider>{children}</WikiSearchProvider>
    </Suspense>
  );
}
