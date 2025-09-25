// app/flagmanCourses/marketing/page.tsx
export const dynamic = 'force-dynamic'; // или уберите эту строку, если хотите SSG

import ClientMarketingPage from './ClientMarketingPage';

export default function Page() {
  return <ClientMarketingPage />;
}
