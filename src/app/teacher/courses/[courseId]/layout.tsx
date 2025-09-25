'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { GraduationCap } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

type CourseMeta = {
  id: number;
  title: string;
  description?: string | null;
  image?: string | null;
  status?: 'draft' | 'pending' | 'published';
  created_at?: string | null;
};

function mediaUrl(u?: string | null) {
  if (!u) return '';
  return /^https?:\/\//i.test(u) || u.startsWith('data:') || u.startsWith('blob:')
    ? u
    : `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`;
}

const mainTabs = [
  { slug: 'overview', label: 'Огляд' },
  { slug: 'program', label: 'Розділи' },
  { slug: 'lessons', label: 'Уроки' },
  { slug: 'assessments', label: 'Тести' },
  { slug: 'publish', label: 'Публікація' },
] as const;

function StatusPill({ status }: { status?: CourseMeta['status'] }) {
  const m: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    pending: 'bg-amber-100 text-amber-800',
    published: 'bg-emerald-100 text-emerald-800',
  };
  const label =
    status === 'published' ? 'Опубліковано' : status === 'pending' ? 'На модерації' : 'Чернетка';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m[status || 'draft']}`}>
      {label}
    </span>
  );
}

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { courseId: raw } = useParams() as { courseId?: string | string[] };
  const courseId = Array.isArray(raw) ? raw[0] : raw!;
  const base = `/teacher/courses/${courseId}/builder`;

  const { accessToken } = useAuth() as { accessToken: string | null };

  const [course, setCourse] = useState<CourseMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // ---- fetch minimal course meta with endpoint fallbacks + 404 handling
  useEffect(() => {
    const ac = new AbortController();
    let ignore = false;

    async function fetchCourseMeta(): Promise<CourseMeta | null> {
      const urls = [
        `${API_BASE}/courses/${courseId}/`,
        `${API_BASE}/api/courses/${courseId}/`,
      ];

      for (const url of urls) {
        try {
          const r = await fetch(url, {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
            cache: 'no-store',
            signal: ac.signal,
          });

          if (r.status === 404) {
            // eslint-disable-next-line no-console
            console.debug('[course meta] 404:', url);
            continue;
          }
          if (!r.ok) {
            // eslint-disable-next-line no-console
            console.debug('[course meta] !ok:', url, r.status);
            continue;
          }

          const data = (await r.json()) as CourseMeta;
          // eslint-disable-next-line no-console
          console.debug('[course meta] OK via:', url);
          return {
            id: data.id,
            title: data.title,
            description: data.description ?? null,
            image: data.image ? mediaUrl(data.image) : null,
            status: (data.status as CourseMeta['status']) || 'draft',
            created_at: data.created_at ?? null,
          };
        } catch (e: any) {
          if (e?.name !== 'AbortError') {
            // eslint-disable-next-line no-console
            console.debug('[course meta] error on', url, e);
          }
        }
      }
      return null;
    }

    (async () => {
      setLoading(true);
      setNotFound(false);
      const meta = await fetchCourseMeta();
      if (ignore) return;

      if (!meta) {
        setNotFound(true);
        setCourse({
          id: Number(courseId),
          title: 'Курс',
          status: 'draft',
          description: null,
          created_at: null,
        });
      } else {
        setCourse(meta);
      }
      setLoading(false);
    })();

    return () => {
      ignore = true;
      ac.abort();
    };
  }, [courseId, accessToken]);

  // ---- active tab
  const activeKey = useMemo(() => {
    for (const t of mainTabs) {
      const href = `${base}/${t.slug}`;
      if (pathname === href || pathname.startsWith(href + '/')) return t.slug;
    }
    return 'overview';
  }, [pathname, base]);

  // ---- underline animation (safe null handling)
  const containerRef = useRef<HTMLDivElement>(null);
  const [underline, setUnderline] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const update = () => {
      const parent = containerRef.current;
      if (!parent) return;

      const el = parent.querySelector<HTMLAnchorElement>(`a[data-tab="${activeKey}"]`);
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const host = parent.getBoundingClientRect();
      setUnderline({ left: rect.left - host.left, width: rect.width });
    };

    update();

    const parent = containerRef.current;
    if (!parent) return;

    const ro = new ResizeObserver(() => update());
    ro.observe(parent);

    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [activeKey, loading, course?.title]);

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* 404 banner */}
        {notFound && (
          <div className="mb-4 rounded-xl bg-red-50 text-red-700 ring-1 ring-red-200 p-3">
            Курс не знайдено або недоступний. Перевір посилання або повернись до списку курсів.
            <div className="mt-2 flex gap-2">
              <Link
                href="/teacher/courses"
                className="px-3 py-1.5 rounded-lg bg-white ring-1 ring-blue-100 hover:ring-blue-300 transition"
              >
                ← До курсів
              </Link>
              <Link
                href="/teacher/courses/new"
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                + Новий курс
              </Link>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="rounded-2xl bg-white/95 ring-1 ring-blue-100 shadow-lg overflow-hidden">
          {/* Top bar: breadcrumbs + actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 py-4 border-b border-slate-100">
            {/* Breadcrumbs */}
            <div className="text-sm text-slate-600 flex items-center gap-1">
              <Link href="/teacher/courses" className="hover:underline">
                Курси
              </Link>
              <span>›</span>
              <span className="text-slate-900 font-medium truncate max-w-[60vw] md:max-w-none">
                {loading ? 'Завантаження…' : course?.title || 'Курс'}
              </span>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <Link
              href="/teacher"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] ring-1 ring-[#E5ECFF] bg-white hover:ring-[#1345DE] transition text-[#0F2E64]"
              title="Teacher Hub"
            >
              <GraduationCap className="w-4 h-4" />
              Teacher Hub
            </Link>
              <Link
                href={`/teacher/courses/${courseId}/builder/program`}
                className="px-3 py-2 rounded-xl ring-1 ring-blue-100 bg-white hover:ring-blue-400 text-sm transition"
              >
                Розділи
              </Link>
              <Link
                href={`/courses/${courseId}`}
                className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm shadow hover:shadow-md hover:bg-blue-700 transition"
              >
                Переглянути курс
              </Link>
              <Link
                href={`/teacher/courses/${courseId}/danger`}
                className="px-3 py-2 rounded-xl ring-1 ring-red-200 text-red-700 bg-white hover:bg-red-50 text-sm transition"
              >
                Видалити курс
              </Link>
            </div>
          </div>

          {/* Course hero */}
          <div className="px-5 pt-5 pb-4 flex items-start gap-4">
            <div className="w-20 h-14 rounded-lg overflow-hidden ring-1 ring-blue-100 bg-slate-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {course?.image ? (
                <img src={course.image} alt={course.title ?? 'Курс'} className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-semibold text-blue-900 truncate">
                  {loading ? '...' : course?.title || 'Курс'}
                </h1>
                <StatusPill status={course?.status} />
              </div>
              {course?.description ? (
                <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{course.description}</p>
              ) : null}
            </div>
          </div>

          {/* Tabs bar (sticky) */}
          <div className="sticky top-20 z-30 px-3 sm:px-5 pt-1 pb-0 border-t border-slate-100 bg-white/90 backdrop-blur">
            <div
              ref={containerRef}
              className="relative flex gap-2 overflow-x-auto no-scrollbar pb-2"
            >
              {/* underline — піднято у стеку і винесено нижче лінків */}
              <motion.div
                className="pointer-events-none absolute -bottom-0.5 h-0.5 rounded bg-blue-600 z-20"
                animate={{ left: underline.left, width: underline.width }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              />
              {mainTabs.map((t) => {
                const href = `${base}/${t.slug}`;
                const active = activeKey === t.slug;
                return (
                  <Link
                    key={t.slug}
                    href={href}
                    data-tab={t.slug}
                    className={[
                      'relative px-3 py-2 rounded-[10px] text-sm whitespace-nowrap transition',
                      active
                        ? 'text-blue-700 bg-blue-50 ring-1 ring-blue-100'
                        : 'text-slate-700 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          <div className="rounded-2xl bg-white/95 ring-1 ring-blue-100 shadow-lg p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile bottom quick bar */}
      <div className="fixed bottom-4 left-0 right-0 px-4 md:hidden pointer-events-none">
        <div className="pointer-events-auto mx-auto max-w-md rounded-2xl bg-white/95 ring-1 ring-blue-100 shadow-xl p-2 flex justify-between">
          <Link href={`${base}/overview`} className="px-3 py-2 rounded-lg text-sm bg-slate-50">
            Огляд
          </Link>
          <Link href={`${base}/program`} className="px-3 py-2 rounded-lg text-sm bg-slate-50">
            Розділи
          </Link>
          <Link href={`${base}/lessons`} className="px-3 py-2 rounded-lg text-sm bg-slate-50">
            Уроки
          </Link>
          <Link href={`${base}/assessments`} className="px-3 py-2 rounded-lg text-sm bg-slate-50">
            Тести
          </Link>
          <Link href={`${base}/publish`} className="px-3 py-2 rounded-lg text-sm bg-slate-50">
            Публікація
          </Link>
        </div>
      </div>
    </main>
  );
}
