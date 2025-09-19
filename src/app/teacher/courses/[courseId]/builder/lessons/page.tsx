'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import http, { setAuthHeader } from '@/lib/http';
import {
  Plus, Pencil, Trash2, AlertTriangle, BookOpen, Clock, CheckCircle2, FileText
} from 'lucide-react';

/* ========= TYPES ========= */
type Lesson = {
  id: number;
  title: string;
  order?: number;
  status?: 'draft' | 'scheduled' | 'published' | 'archived';
  is_published?: boolean;
  contents_count?: number;
  duration_min?: number | null;
  module?: number | { id: number; title?: string } | null;
  created_at?: string | null;
};
type FetchState = 'idle' | 'loading' | 'done' | 'error';

/* ========= HELPERS ========= */
function asArray<T = any>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw?.results && Array.isArray(raw.results)) return raw.results as T[];
  if (raw?.data && Array.isArray(raw.data)) return raw.data as T[];
  return [];
}
function fmt(n: number) {
  return new Intl.NumberFormat('uk-UA').format(n);
}
function shortDate(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('uk-UA', { year: 'numeric', month: 'short', day: '2-digit' });
}

/* ========= BADGES ========= */
function StatusBadge({ status }: { status?: Lesson['status'] }) {
  const s = status || 'draft';
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    scheduled: 'bg-amber-100 text-amber-800',
    published: 'bg-emerald-100 text-emerald-800',
    archived: 'bg-slate-200 text-slate-600',
  };
  const label =
    s === 'published' ? 'Опубліковано' :
    s === 'scheduled' ? 'Заплановано' :
    s === 'archived' ? 'Архів' : 'Чернетка';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[s]}`}>{label}</span>;
}

/* ========= PAGE ========= */
export default function LessonsPage() {
  const { courseId: raw } = useParams() as { courseId?: string | string[] };
  const courseId = Number(Array.isArray(raw) ? raw[0] : raw);
  const router = useRouter();
  const { accessToken } = useAuth();

  const [state, setState] = useState<FetchState>('idle');
  const [err, setErr] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [busyNew, setBusyNew] = useState(false);
  const [busyDelId, setBusyDelId] = useState<number | null>(null);

  // auth → axios
  useEffect(() => { if (accessToken) setAuthHeader(accessToken); }, [accessToken]);

  // load lessons of course
  useEffect(() => {
    if (!courseId || !accessToken) return;
    let cancel = false;
    (async () => {
      setState('loading'); setErr(null);
      try {
        const variants = [
          ['/lesson/admin/lessons/', { course: courseId, ordering: 'order' }],
          ['/api/lesson/admin/lessons/', { course: courseId, ordering: 'order' }],
        ] as const;

        let list: Lesson[] = [];
        for (const [url, params] of variants) {
          try {
            const r = await http.get(url, { params });
            list = asArray<Lesson>(r.data);
            if (list.length || r.status === 200) break;
          } catch {}
        }

        // normalize
        const normalized = list.map((l: any) => ({
          id: l.id,
          title: l.title || 'Без назви',
          order: typeof l.order === 'number' ? l.order : 0,
          status: (l.status || (l.is_published ? 'published' : 'draft')) as Lesson['status'],
          is_published: typeof l.is_published === 'boolean'
            ? l.is_published
            : (String(l.status || '').toLowerCase() === 'published'),
          contents_count: typeof l.contents_count === 'number'
            ? l.contents_count
            : Array.isArray(l.contents) ? l.contents.length : undefined,
          duration_min: typeof l.duration_min === 'number' ? l.duration_min : null,
          module: l.module ?? null,
          created_at: l.created_at ?? null,
        })).sort((a,b)=> (a.order||0)-(b.order||0) || a.id-b.id);

        if (!cancel) {
          setLessons(normalized);
          setState('done');
        }
      } catch (e:any) {
        if (!cancel) {
          setErr(e?.response?.data?.detail || e?.message || 'Не вдалося завантажити уроки.');
          setState('error');
        }
      }
    })();
    return () => { cancel = true; };
  }, [courseId, accessToken]);

  /* ---- Create new lesson (optional, швидкий старт) ---- */
  async function createLesson() {
    if (!courseId || busyNew) return;
    setBusyNew(true); setErr(null);
    const payload = { course: courseId, title: 'Новий урок', status: 'draft' as const };

    const variants = [
      '/lesson/admin/lessons/',
      '/api/lesson/admin/lessons/',
      // фронтовий простий ендпоінт (якщо увімкнений)
      '/lesson/lessons/',
    ];

    let createdId: number | null = null;
    for (const u of variants) {
      try {
        const r = await http.post(u, payload);
        createdId = r?.data?.id ?? r?.data?.pk ?? null;
        if (createdId) break;
      } catch {}
    }
    setBusyNew(false);

    if (!createdId) { setErr('Не вдалося створити урок. Перевір API-шляхи або права.'); return; }
    router.push(`/teacher/courses/${courseId}/builder/lessons/${createdId}/new`);
  }

  /* ---- Delete lesson ---- */
  async function deleteLesson(l: Lesson) {
    if (!confirm(`Видалити урок «${l.title}»? Дію не можна буде скасувати.`)) return;
    setBusyDelId(l.id); setErr(null);
    const endpoints = [
      `/lesson/admin/lessons/${l.id}/`,
      `/api/lesson/admin/lessons/${l.id}/`,
    ];
    let ok = false;
    for (const u of endpoints) {
      try { await http.delete(u); ok = true; break; } catch {}
    }
    setBusyDelId(null);
    if (!ok) { setErr('Не вдалося видалити урок.'); return; }
    setLessons(prev => prev.filter(x => x.id !== l.id));
  }

  const totals = useMemo(() => {
    const total = lessons.length;
    const published = lessons.filter(l => l.is_published || l.status === 'published').length;
    const withContent = lessons.filter(l => (l.contents_count ?? 0) > 0).length;
    const duration = lessons.reduce((s, l) => s + (l.duration_min || 0), 0);
    return { total, published, withContent, duration };
  }, [lessons]);

  /* ---- Guards ---- */
  if (!accessToken) {
    return (
      <div className="grid place-items-center py-16">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Потрібен вхід</div>
          <Link href="/login" className="px-4 py-2 rounded-xl bg-[#1345DE] text-white">Увійти</Link>
        </div>
      </div>
    );
  }

  /* ---- UI ---- */
  return (
    <div className="space-y-6">
      {/* top actions + stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI icon={<FileText className="w-4 h-4" />} label="Уроків" value={fmt(totals.total)} />
          <KPI icon={<CheckCircle2 className="w-4 h-4" />} label="Опубліковані" value={fmt(totals.published)} />
          <KPI icon={<BookOpen className="w-4 h-4" />} label="З контентом" value={fmt(totals.withContent)} />
          <KPI icon={<Clock className="w-4 h-4" />} label="Тривалість" value={`${fmt(totals.duration)} хв`} />
        </div>
      </div>

      {/* errors */}
      {err && (
        <div className="rounded-lg bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 mt-0.5" /> <span>{err}</span>
        </div>
      )}

      {/* list */}
      <div className="grid gap-2">
        {state === 'loading' && (
          <>
            {[...Array(4)].map((_,i)=>(
              <div key={i} className="h-16 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </>
        )}

        {state === 'done' && lessons.length === 0 && (
          <div className="text-slate-600 text-sm">
            Уроків ще немає. Додай перший урок.
          </div>
        )}

        {state !== 'loading' && lessons.map((l) => {
          const moduleTitle =
            typeof l.module === 'object' && l.module
              ? (l.module as any).title || `Модуль #${(l.module as any).id}`
              : l.module
              ? `Модуль #${l.module}`
              : null;

          return (
            <div
              key={l.id}
              className="rounded-xl ring-1 ring-[#E5ECFF] bg-white p-3 hover:shadow transition flex items-center gap-3"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-[#F7F9FF] ring-1 ring-[#E5ECFF] grid place-items-center text-slate-500">
                {(l.order ?? 0) || '—'}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-semibold text-[#0F2E64] truncate">{l.title}</div>
                  <StatusBadge status={l.status} />
                  {moduleTitle ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {moduleTitle}
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Створено: {shortDate(l.created_at)} · Контент: {l.contents_count ?? '—'}
                  {typeof l.duration_min === 'number' ? ` · ${l.duration_min} хв` : ''}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/teacher/courses/${courseId}/builder/lessons/${l.id}/edit`}
                  className="px-3 py-1.5 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" /> Редагувати
                </Link>

                <button
                  onClick={() => deleteLesson(l)}
                  disabled={busyDelId === l.id}
                  className="px-3 py-1.5 rounded-xl ring-1 ring-red-200 text-red-700 bg-white inline-flex items-center gap-2 disabled:opacity-60"
                >
                  <Trash2 className="w-4 h-4" /> {busyDelId === l.id ? 'Видаляємо…' : 'Видалити'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ========= SMALL KPI ========= */
function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F7F9FF] ring-1 ring-[#E5ECFF] p-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white ring-1 ring-[#E5ECFF] grid place-items-center">{icon}</div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-lg font-extrabold text-[#0F2E64] leading-tight">{value}</div>
      </div>
    </div>
  );
}
