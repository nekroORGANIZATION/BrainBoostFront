import { Suspense } from "react";
import React from "react";

export default function LessonsLayout({ children }: { children: React.ReactNode }) {
  // Wrap the page to satisfy Next.js requirement when useSearchParams/usePathname are used in children
  return <Suspense fallback={null}>{children}</Suspense>;
}
