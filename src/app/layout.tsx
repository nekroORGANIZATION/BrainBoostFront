'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';

const tabs = [
  { slug: '', label: 'Мета-дані' },
  { slug: 'lessons', label: 'Програма' },
  { slug: 'publish', label: 'Публікація' },
  { slug: 'danger', label: 'Небезпечно' },
];

export default function CourseEditLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams() as { id?: string | string[] };

  // ✅ НЕ з props, а з useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id || '';
  const base = id ? `/teacher/courses/${id}` : '/teacher/courses';

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        <div className="rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] shadow-[0_12px_40px_rgba(2,28,78,0.08)]">
          <div className="px-6 pt-5 pb-3 border-b flex flex-wrap gap-2">
            {tabs.map((t) => {
              const href = t.slug ? `${base}/${t.slug}` : base;
              const active = isActive(href);
              return (
                <Link
                  key={t.slug || 'root'}
                  href={href}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                    active ? 'bg-[#1345DE] text-white' : 'bg-white ring-1 ring-[#E5ECFF]'
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
