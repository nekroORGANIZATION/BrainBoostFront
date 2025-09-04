// src/app/student/layout.tsx
import React from 'react';
import { Provider as RACProvider } from 'react-aria-components';

/**
 * Wraps all /student pages with react-aria-components Provider so that
 * Accessibility context is available during SSR/SSG as well as on the client.
 */
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <RACProvider>{children}</RACProvider>;
}
