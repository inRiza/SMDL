import { Suspense } from "react";
import { OrganizationSearchProvider } from "./components/organization-search-provider";

export default function OrganizationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <OrganizationSearchProvider>{children}</OrganizationSearchProvider>
    </Suspense>
  );
}
