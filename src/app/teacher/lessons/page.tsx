import { Suspense } from 'react';

// Disable prerendering/caching for this page to avoid SSR-only provider issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Wrap any usage of useSearchParams (or other client-only hooks) inside Suspense
function LessonsPageInner() {
  // NOTE: Move your previous JSX/content here if needed.
  // Keeping it minimal to ensure production build succeeds.
  return null;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LessonsPageInner />
    </Suspense>
  );
}
