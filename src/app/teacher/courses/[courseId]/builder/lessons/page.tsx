'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import http, { setAuthHeader } from '@/lib/http';
import {
  Plus, Pencil, Trash2, AlertTriangle, BookOpen, Clock, CheckCircle2, FileText, ChevronRight, X
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
type Module = {
  id: number;
  course: number;
  title: string;
  order: number;
  is_visible: boolean;
};
type FetchState = 'idle' | 'loading' | 'done' | 'error';

/* ========= HELPERS ========= */
function asArray<T = any>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw?.results && Array.isArray(raw.results)) return raw.results as T[];
  if (raw?.data && Array.isArray(raw.data)) return raw.data as T[];
  return [];
}
function fmt(n: number) { return new Intl.NumberFormat('uk-UA').format(n); }
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
/* статус → кольори картки */
function statusTint(status?: Lesson['status']) {
  const s = status || 'draft';
  return s === 'published'
    ? { ring: 'ring-emerald-200', glow: 'shadow-[0_12px_30px_rgba(16,185,129,0.18)]', stripe: 'bg-emerald-500' }
    : s === 'scheduled'
    ? { ring: 'ring-violet-200', glow: 'shadow-[0_12px_30px_rgba(139,92,246,0.18)]', stripe: 'bg-violet-500' }
    : s === 'archived'
    ? { ring: 'ring-slate-200', glow: 'shadow-[0_12px_26px_rgba(100,116,139,0.18)]', stripe: 'bg-slate-500' }
    : { ring: 'ring-indigo-200', glow: 'shadow-[0_12px_30px_rgba(19,69,222,0.14)]', stripe: 'bg-indigo-500' };
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
  const [busyDelId, setBusyDelId] = useState<number | null>(null);

  // module picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<number | ''>('');

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

  // load modules for picker (on open)
  async function openModulePicker() {
    setPickerOpen(true);
    setModulesLoading(true);
    setErr(null);
    const endpoints = ['/lesson/admin/modules/', '/api/lesson/admin/modules/'];
    for (const u of endpoints) {
      try {
        const r = await http.get(u, { params: { course: courseId, ordering: 'order' } });
        const arr = asArray<Module>(r.data).map((m:any)=>({
          id: m.id, course: m.course ?? courseId, title: m.title, order: m.order ?? 0, is_visible: !!m.is_visible
        })).sort((a,b)=> a.order - b.order || a.id - b.id);
        setModules(arr);
        break;
      } catch {}
    }
    setModulesLoading(false);
  }

  // delete
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

        {/* NEW: open module picker instead of API-creating */}
        <button
          onClick={openModulePicker}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-[#1345DE] text-white font-semibold w-full sm:w-auto"
        >
          <Plus className="inline w-4 h-4 -mt-1 mr-1" /> Створити урок
        </button>
      </div>

      {/* errors */}
      {err && (
        <div className="rounded-lg bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 mt-0.5" /> <span>{err}</span>
        </div>
      )}

      {/* list */}
      <div className="grid gap-4">
        {state === 'loading' && (
          <>
            {[...Array(4)].map((_,i)=>(<div key={i} className="h-20 rounded-2xl bg-slate-200 animate-pulse" />))}
          </>
        )}

        {state === 'done' && lessons.length === 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-[#F6F9FF] to-white ring-1 ring-[#E5ECFF] p-6 text-slate-600">
            Уроків ще немає. Додай перший урок.
          </div>
        )}

        {state !== 'loading' && lessons.map((l, idx) => {
          const moduleTitle =
            typeof l.module === 'object' && l.module
              ? (l.module as any).title || `Модуль #${(l.module as any).id}`
              : l.module
              ? `Модуль #${l.module}`
              : null;

          const tint = statusTint(l.status);
          const displayIndex = idx + 1;

          return (
            <div
              key={l.id}
              className={`group relative overflow-hidden rounded-2xl ring-1 ${tint.ring} bg-white p-3 sm:p-4 transition-transform hover:-translate-y-[2px] hover:${tint.glow}`}
            >
              <span className={`absolute left-0 top-0 h-full w-1.5 ${tint.stripe} rounded-l-2xl`} />
              <div className="grid grid-cols-[48px_1fr] sm:grid-cols-[56px_1fr_auto] gap-3 sm:gap-4 items-center">
                <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#F7F9FF] ring-1 ring-[#E5ECFF] grid place-items-center text-[#1345DE] font-extrabold text-lg sm:text-xl">
                  {displayIndex}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                    <div className="min-w-0">
                      <div className="font-semibold text-[#0F2E64] text-[15px] sm:text-[16px] truncate">{l.title}</div>
                      <div className="mt-1 sm:mt-0 flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={l.status} />
                        {moduleTitle && (
                          <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {moduleTitle}
                          </span>
                        )}
                        {typeof l.contents_count === 'number' && (
                          <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                            Контент: {l.contents_count}
                          </span>
                        )}
                        {typeof l.duration_min === 'number' && (
                          <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-[#F7F9FF] text-slate-700 ring-1 ring-[#E5ECFF]">
                            {l.duration_min} хв
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-600">
                      Створено: {shortDate(l.created_at)}{(l.order ?? 0) ? ` · Порядок: ${l.order}` : ''}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1 flex flex-col sm:flex-row gap-2 sm:justify-end">
                  <Link
                    href={`/teacher/courses/${courseId}/builder/lessons/${l.id}/edit`}
                    className="w-full sm:w-auto px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white hover:bg-[#F7F9FF] inline-flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-4 h-4" /> Редагувати
                  </Link>
                  <button
                    onClick={() => deleteLesson(l)}
                    disabled={busyDelId === l.id}
                    className="w-full sm:w-auto px-3 py-2 rounded-xl ring-1 ring-red-200 text-red-700 bg-white hover:bg-rose-50 inline-flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Trash2 className="w-4 h-4" /> {busyDelId === l.id ? 'Видаляємо…' : 'Видалити'}
                  </button>
                </div>
              </div>
              <div className="pointer-events-none absolute -right-24 -top-24 w-64 h-64 rounded-full bg-[#EEF3FF] blur-3xl opacity-40 group-hover:opacity-60 transition" />
            </div>
          );
        })}
      </div>

      {/* ===== Module Picker Modal ===== */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={()=>setPickerOpen(false)} />
          <div className="absolute inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 top-20 sm:top-24 max-w-lg mx-auto rounded-2xl bg-white ring-1 ring-[#E5ECFF] shadow-[0_20px_60px_rgba(2,28,78,0.20)]">
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[18px] font-extrabold text-[#0F2E64]">Створити урок</div>
                  <div className="text-sm text-slate-600">Оберіть розділ, у якому створити урок.</div>
                </div>
                <button onClick={()=>setPickerOpen(false)} className="p-1.5 rounded-lg ring-1 ring-[#E5ECFF] hover:bg-slate-50">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4">
                {modulesLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_,i)=>(<div key={i} className="h-10 rounded-lg bg-slate-200 animate-pulse" />))}
                  </div>
                ) : modules.length === 0 ? (
                  <div className="rounded-xl bg-[#F7F9FF] ring-1 ring-[#E5ECFF] p-4">
                    <div className="text-sm text-slate-700">У цього курсу ще немає розділів.</div>
                    <Link
                      href={`/teacher/courses/${courseId}/builder/program`}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1345DE] text-white"
                      onClick={()=>setPickerOpen(false)}
                    >
                      Перейти до «Програма» <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <>
                    <label className="text-sm text-slate-600">Розділ</label>
                    <select
                      value={selectedModule}
                      onChange={(e)=>setSelectedModule(e.target.value ? Number(e.target.value) : '')}
                      className="w-full mt-1 px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white"
                    >
                      <option value="">— Оберіть розділ —</option>
                      {modules.map(m => (
                        <option key={m.id} value={m.id}>#{m.order} — {m.title}</option>
                      ))}
                    </select>
                    <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                      <button
                        onClick={()=>setPickerOpen(false)}
                        className="px-4 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white"
                      >
                        Скасувати
                      </button>
                      <button
                        onClick={()=>{
                          if (!selectedModule) return;
                          setPickerOpen(false);
                          router.push(`/teacher/courses/${courseId}/builder/lessons/new?module=${selectedModule}`);
                        }}
                        disabled={!selectedModule}
                        className="px-4 py-2 rounded-xl bg-[#1345DE] text-white disabled:opacity-60"
                      >
                        Продовжити
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
