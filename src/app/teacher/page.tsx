// app/teacher/page.tsx
export const dynamic = 'force-dynamic'; // пусть страница всегда рендерится на рантайме

import TeacherClient from './TeacherClient'; // обычный импорт

export default function Page() {
  return <TeacherClient />;
}