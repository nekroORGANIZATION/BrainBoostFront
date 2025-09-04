'use client';
import { Suspense } from 'react';

// Force client-side rendering to avoid SSR-time provider requirements
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Minimal client component; replace with your actual page content if needed.
function SettingsClient() {
  return null;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SettingsClient />
    </Suspense>
  );
}
