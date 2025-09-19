'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import http, { API_BASE, setAuthHeader } from '@/lib/http';
import {
  Plus, Pencil, Trash2, Save, X, ArrowUp, ArrowDown, GripVertical,
  ChevronLeft, BookOpen, Layers, AlertTriangle, CheckCircle2, ListChecks, Eye
} from 'lucide-react';

/* ============ TYPES ============ */
type Course = {
  id: number;
  title: string;
  status?: 'draft' | 'pending' | 'published';
  created_at?: string | null;
};

type Module = {
  id: number;
  course: number;
  title: string;
  description?: string;
  order: number;
  is_visible: boolean;
};

type Lesson = {
  id: number;
  course: number;
  module: number | null;
  title: string;
  summary?: string;
  order: number;
  status?: 'draft' | 'scheduled' | 'published' | 'archived';
  duration_min?: number | null;
  updated_at?: string | null;
};

type FetchState = 'idle' | 'loading' | 'done' | 'error';

/* ============ HELPERS ============ */
function asArray<T = any>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw?.results && Array.isArray(raw.results)) return raw.results as T[];
  if (raw?.data && Array.isArray(raw.data)) return raw.data as T[];
  return [];
}

function formatDate(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('uk-UA', { year: 'numeric', month: 'short', day: '2-digit' });
}

function Pill({ tone = 'slate', children }: { tone?: 'slate'|'blue'|'green'|'amber'|'red'|'violet'; children: React.ReactNode }) {
  const map = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-[#EEF3FF] text-[#1345DE]',
    green: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-rose-100 text-rose-700',
    violet: 'bg-violet-100 text-violet-700',
  } as const;
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${map[tone]}`}>{children}</span>;
}

function StatusPill({ status }: { status?: Course['status'] }) {
  const s = status || 'draft';
  return s === 'published' ? <Pill tone="green">Опубліковано</Pill>
    : s === 'pending' ? <Pill tone="amber">На модерації</Pill>
    : <Pill>Чернетка</Pill>;
}

function LessonStatusPill({ status }: { status?: Lesson['status'] }) {
  const s = status || 'draft';
  if (s === 'published') return <Pill tone="green">Опубліковано</Pill>;
  if (s === 'scheduled') return <Pill tone="violet">Заплановано</Pill>;
  if (s === 'archived') return <Pill tone="slate">Архів</Pill>;
  return <Pill>Чернетка</Pill>;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-5 shadow-[0_10px_30px_rgba(2,28,78,0.08)] ${className}`}>
      {children}
    </div>
  );
}

// ---- API helpers bound to your backend structure ----
const API_PREFIXES = ['/lesson', '/api/lesson']; // match lesson/urls.py
const urlVariants = (suffix: string) => API_PREFIXES.map(p => `${p}${suffix}`);

function httpErrStr(e: any) {
  const s = e?.response?.status;
  const msg = e?.response?.data?.detail || e?.response?.data?.message || e?.message || 'Помилка мережі';
  return s ? `${s}: ${msg}` : msg;
}

/* ============ PAGE ============ */
export default function ProgramPage() {
  const params = useParams() as { courseId?: string | string[] };
  const courseId = Number(Array.isArray(params?.courseId) ? params.courseId[0] : params?.courseId);
  const { accessToken } = useAuth();
  const router = useRouter();

  const [state, setState] = useState<FetchState>('idle');
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // lessons
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({}); // per-module expand

  // form
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visible, setVisible] = useState(true);
  const [saving, setSaving] = useState(false);

  const [orderDirty, setOrderDirty] = useState(false);
  const [reorderSaving, setReorderSaving] = useState(false);

  // створення уроку: id модуля в процесі
  const [busyCreateId, setBusyCreateId] = useState<number | null>(null);

  useEffect(() => {
    if (accessToken) setAuthHeader(accessToken);
  }, [accessToken]);

  /* ---------- data loaders ---------- */
  async function loadCourse(cid: number) {
    const candidates = [
      `/courses/${cid}/`,
      `/api/courses/${cid}/`,
      `/course/${cid}/`,
    ];
    for (const url of candidates) {
      try {
        const r = await http.get(url);
        return r.data as Course;
      } catch (e: any) {
        const s = e?.response?.status;
        if (s === 404 || s === 401 || s === 403) continue;
      }
    }
    const pub = [
      `/courses/public/${cid}/`,
      `/api/courses/public/${cid}/`,
    ];
    for (const url of pub) {
      try {
        const r = await http.get(url);
        return r.data as Course;
      } catch (e: any) {
        if (e?.response?.status === 404) continue;
      }
    }
    const err: any = new Error('NOT_FOUND');
    err.code = 404;
    throw err;
  }

  async function loadModules(cid: number) {
    const variants = urlVariants('/admin/modules/');
    for (const url of variants) {
      try {
        const r = await http.get(url, { params: { course: cid, ordering: 'order' } });
        return asArray<Module>(r.data);
      } catch {}
    }
    return [] as Module[];
  }

  // NOTE: robust loader tries several param shapes so UI doesn't say "нема уроків" якщо бек очікує інші ключі
  async function loadLessons(cid: number) {
    setLessonsLoading(true);
    setErr(null);

    const variants = urlVariants('/admin/lessons/');
    const paramShapes = [
      { course: cid, ordering: 'module,order,id' },
      { course_id: cid, ordering: 'module,order,id' },
      { course__id: cid, ordering: 'module,order,id' },
      // fallback: без фільтра по курсу (потім відфільтруємо на фронті за module/course)
      { ordering: 'module,order,id' } as any,
    ];

    let list: Lesson[] = [];
    let lastError: string | null = null;

    outer: for (const url of variants) {
      for (const params of paramShapes) {
        try {
          const r = await http.get(url, { params });
          const raw = asArray<Lesson>(r.data).map((l: any) => ({
            id: l.id,
            course: l.course ?? cid,
            module: typeof l.module === 'number' ? l.module : (l.module?.id ?? null),
            title: l.title,
            summary: l.summary ?? '',
            order: typeof l.order === 'number' ? l.order : 0,
            status: l.status as Lesson['status'],
            duration_min: l.duration_min ?? null,
            updated_at: l.updated_at ?? null,
          }));
          // якщо відповідь без фільтру курсу — відфільтруємо свої
          list = (params as any).course || (params as any).course_id || (params as any).course__id
            ? raw
            : raw.filter(x => x.course === cid || modules.some(m => m.id === x.module));
          if (list.length || params !== paramShapes[paramShapes.length - 1]) {
            break outer; // маємо дані або успішний запит
          }
        } catch (e: any) {
          lastError = httpErrStr(e);
        }
      }
    }

    if (!list.length && lastError) {
      setErr(prev => prev ? prev : `Не вдалося завантажити уроки: ${lastError}`);
    }

    // групування по module (null → 'null')
    const grouped: Record<string, Lesson[]> = {};
    list.forEach(l => {
      const key = String(l.module ?? 'null');
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(l);
    });

    // впорядкування в середині групи
    Object.values(grouped).forEach(arr => arr.sort((a, b) => (a.order - b.order) || (a.id - b.id)));

    setLessonsByModule(grouped);
    setLessonsLoading(false);
  }

  useEffect(() => {
    if (!courseId) return;
    let cancel = false;
    (async () => {
      setState('loading');
      setErr(null);
      setNotFound(false);
      try {
        const cr = await loadCourse(courseId);
        if (cancel) return;
        setCourse(cr);

        const ms = (await loadModules(courseId))
          .map(m => ({
            id: m.id,
            course: (m as any).course ?? courseId,
            title: m.title,
            description: m.description ?? '',
            order: typeof m.order === 'number' ? m.order : 0,
            is_visible: typeof m.is_visible === 'boolean' ? m.is_visible : true,
          }))
          .sort((a, b) => a.order - b.order || a.id - b.id);

        if (!cancel) {
          setModules(ms);
          setState('done');
        }
      } catch (e: any) {
        if (cancel) return;
        if (e?.code === 404 || e?.response?.status === 404) {
          setNotFound(true);
          setState('error');
        } else {
          setErr(e?.response?.data?.detail || e?.message || 'Не вдалося завантажити дані.');
          setState('error');
        }
      }
    })();
    return () => { cancel = true; };
  }, [courseId]);

  // Коли модулі завантажені — тягнемо уроки
  useEffect(() => {
    if (state === 'done' && courseId) loadLessons(courseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, courseId, modules.length]);

  /* ---------- CRUD: modules ---------- */
  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setVisible(true);
  };

  async function createModule() {
    if (!title.trim()) return;
    if (!accessToken) {
      setErr('Потрібен вхід (JWT). Зайдіть у акаунт і спробуйте ще раз.');
      return;
    }
    setSaving(true);
    setErr(null);

    const lastOrder = modules.length ? modules[modules.length - 1].order : 0;
    const payload = { course: courseId, title: title.trim(), description, is_visible: visible, order: lastOrder + 1 };
    const endpoints = urlVariants('/admin/modules/');

    let created: Module | null = null;
    let lastError: string | null = null;
    for (const url of endpoints) {
      try {
        const r = await http.post(url, payload);
        const d = r.data;
        created = {
          id: d.id ?? d.pk,
          course: courseId,
          title: d.title ?? payload.title,
          description: d.description ?? payload.description,
          order: d.order ?? payload.order,
          is_visible: typeof d.is_visible === 'boolean' ? d.is_visible : payload.is_visible,
        };
        break;
      } catch (e: any) {
        lastError = `POST ${url} → ${httpErrStr(e)}`;
      }
    }

    setSaving(false);
    if (!created) {
      setErr(`Не вдалося створити розділ.\n${lastError || 'Невідома помилка.'}`);
      return;
    }

    setModules(prev => [...prev, created!].sort((a, b) => a.order - b.order || a.id - b.id));
    resetForm();
  }

  async function updateModule() {
    if (!editingId || !title.trim()) return;
    setSaving(true);
    setErr(null);

    const payload = { title: title.trim(), description, is_visible: visible };
    const endpoints = urlVariants(`/admin/modules/${editingId}/`);

    let ok = false;
    let lastError: string | null = null;
    for (const url of endpoints) {
      try {
        await http.patch(url, payload);
        ok = true;
        break;
      } catch (e1: any) {
        try {
          await http.put(url, payload as any);
          ok = true;
          break;
        } catch (e2: any) {
          lastError = `${url} → ${httpErrStr(e2)}`;
        }
      }
    }

    setSaving(false);
    if (!ok) {
      setErr(`Не вдалося оновити розділ. ${lastError || ''}`);
      return;
    }

    setModules(prev => prev.map(m => (m.id === editingId ? { ...m, ...payload } as Module : m)));
    resetForm();
  }

  async function deleteModule(m: Module) {
    if (!confirm(`Видалити розділ «${m.title}»? Уроки залишаться у курсі без розділу.`)) return;

    setErr(null);
    const endpoints = urlVariants(`/admin/modules/${m.id}/`);

    let ok = false;
    let lastError: string | null = null;
    for (const url of endpoints) {
      try {
        await http.delete(url);
        ok = true;
        break;
      } catch (e: any) {
        lastError = `${url} → ${httpErrStr(e)}`;
      }
    }

    if (!ok) {
      setErr(`Не вдалося видалити розділ. ${lastError || ''}`);
      return;
    }

    setModules(prev => prev.filter(x => x.id !== m.id));
    if (editingId === m.id) resetForm();
    // після видалення — перезавантажити уроки (деякі могли мати цей модуль)
    loadLessons(courseId);
  }

  /* ---------- reorder ---------- */
  function move(idx: number, dir: -1 | 1) {
    setModules(prev => {
      const list = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= list.length) return prev;
      [list[idx], list[j]] = [list[j], list[idx]];
      list.forEach((m, i) => { m.order = i + 1; });
      return list;
    });
    setOrderDirty(true);
  }

  const dragFrom = useRef<number | null>(null);
  function onDragStart(i: number) { dragFrom.current = i; }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  function onDrop(i: number) {
    const from = dragFrom.current;
    dragFrom.current = null;
    if (from === null || from === i) return;
    setModules(prev => {
      const list = [...prev];
      const [item] = list.splice(from, 1);
      list.splice(i, 0, item);
      list.forEach((m, idx) => { m.order = idx + 1; });
      return list;
    });
    setOrderDirty(true);
  }

  async function saveOrder() {
    setReorderSaving(true);
    setErr(null);

    const payload = modules.map(m => ({ id: m.id, order: m.order }));
    const batch = urlVariants('/admin/modules/reorder/');

    let done = false;
    let lastError: string | null = null;
    for (const url of batch) {
      try {
        await http.post(url, { items: payload });
        done = true;
        break;
      } catch (e: any) {
        lastError = `${url} → ${httpErrStr(e)}`;
      }
    }

    if (!done) {
      for (const it of payload) {
        const single = urlVariants(`/admin/modules/${it.id}/`);
        let ok = false;
        for (const u of single) {
          try {
            await http.patch(u, { order: it.order });
            ok = true;
            break;
          } catch {}
        }
        if (!ok) setErr(`Частково збережено порядок. Перевір API. Остання помилка: ${lastError || ''}`);
      }
    }

    setReorderSaving(false);
    setOrderDirty(false);
  }

  /* ---------- create lesson inside module + redirect ---------- */
  function createLessonInModule(m: Module) {
    setBusyCreateId(m.id);
    const qs = new URLSearchParams({ module: String(m.id) }).toString();
    router.push(`/teacher/courses/${courseId}/builder/lessons/new?${qs}`);
  }

  /* ---------- guards ---------- */
  if (!courseId) {
    return (
      <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top grid place-items-center px-6">
        <Card className="max-w-xl text-center">
          <h1 className="text-2xl font-extrabold text-[#0F2E64]">Невірний шлях до курсу</h1>
          <div className="mt-4 flex gap-3 justify-center">
            <Link href="/teacher/courses" className="px-4 py-2 rounded-[10px] bg-[#1345DE] text-white font-semibold">← До курсів</Link>
          </div>
        </Card>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top grid place-items-center px-6">
        <Card className="max-w-xl text-center">
          <h1 className="text-2xl font-extrabold text-[#0F2E64]">Курс не знайдено або недоступний</h1>
          <p className="text-slate-600 mt-1">Перевір посилання або повернись до списку курсів.</p>
          <div className="mt-4 flex gap-3 justify-center">
            <Link href="/teacher/courses" className="px-4 py-2 rounded-[10px] bg-[#1345DE] text-white font-semibold">← До курсів</Link>
            <Link href="/teacher/courses/new" className="px-4 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white">+ Новий курс</Link>
          </div>
        </Card>
      </main>
    );
  }

  /* ---------- UI ---------- */
  const unassignedLessons = lessonsByModule['null'] || [];

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm text-slate-600">
              <Link href={`/teacher/courses/${courseId}/builder/overview`} className="text-[#1345DE] hover:underline inline-flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Hub Builder
              </Link>
            </div>
            <h1 className="text-[28px] sm:text-[36px] font-extrabold text-[#0F2E64] truncate">Програма курсу</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill status={course?.status} />
              <Pill tone="blue">Курс ID: {courseId}</Pill>
              <Pill tone="slate">Створено: {formatDate(course?.created_at)}</Pill>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={`/courses/${courseId}`} className="px-4 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Попередній перегляд
            </Link>
            <Link href={`/teacher/courses/${courseId}/builder/publish`} className="px-4 py-2 rounded-xl bg-[#1345DE] text-white inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> До публікації
            </Link>
          </div>
        </div>

        {err && (
          <div className="mt-4 rounded-lg bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 break-words whitespace-pre-wrap flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 mt-0.5" />
            <span>{err}</span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          {/* LEFT: modules list + lessons */}
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[#0F2E64] font-extrabold text-[18px] inline-flex items-center gap-2">
                  <Layers className="w-5 h-5" /> Розділи курсу
                </h3>
                <div className="text-sm text-slate-600">{lessonsLoading ? 'Завантажуємо уроки…' : null}</div>
              </div>

              {state === 'loading' && (
                <div className="mt-3 space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-14 rounded-xl bg-slate-200 animate-pulse" />
                  ))}
                </div>
              )}

              {state === 'done' && modules.length === 0 && (
                <div className="mt-4 text-sm text-slate-600">Розділів ще немає. Створи перший розділ праворуч.</div>
              )}

              {state !== 'loading' && modules.length > 0 && (
                <div className="mt-3 space-y-2">
                  {modules.map((m, idx) => {
                    const lessons = lessonsByModule[String(m.id)] || [];
                    const isOpen = !!expanded[m.id];
                    const visibleLessons = isOpen ? lessons : lessons.slice(0, 6);

                    return (
                      <div
                        key={m.id}
                        className="group rounded-xl ring-1 ring-[#E5ECFF] bg-white p-3 hover:shadow transition"
                        draggable
                        onDragStart={() => { onDragStart(idx); }}
                        onDragOver={onDragOver}
                        onDrop={() => onDrop(idx)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="pt-1 cursor-grab active:cursor-grabbing text-slate-400 group-hover:text-slate-600">
                            <GripVertical className="w-4 h-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="font-semibold text-[#0F2E64] truncate">{m.title}</div>
                              {m.is_visible ? <Pill tone="green">Видимий</Pill> : <Pill tone="slate">Прихований</Pill>}
                              <Pill tone="blue">#{m.order}</Pill>
                              <Pill tone="violet"><ListChecks className="w-3.5 h-3.5 inline -mt-1 mr-1" />{lessons.length} уроків</Pill>
                            </div>
                            {m.description ? (
                              <div className="text-sm text-slate-600 line-clamp-2">{m.description}</div>
                            ) : null}

                            {/* Actions */}
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(m.id);
                                  setTitle(m.title);
                                  setDescription(m.description || '');
                                  setVisible(!!m.is_visible);
                                }}
                                className="px-3 py-1.5 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center gap-2"
                              >
                                <Pencil className="w-4 h-4" /> Редагувати розділ
                              </button>

                              <button
                                type="button"
                                onClick={() => createLessonInModule(m)}
                                disabled={busyCreateId === m.id}
                                className="px-3 py-1.5 rounded-xl bg-[#1345DE] text-white inline-flex items-center gap-2 disabled:opacity-60"
                              >
                                <Plus className="w-4 h-4" /> {busyCreateId === m.id ? 'Створюємо…' : 'Створити урок'}
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteModule(m)}
                                className="px-3 py-1.5 rounded-xl ring-1 ring-red-200 text-red-700 bg-white inline-flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Видалити
                              </button>

                              {lessons.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setExpanded(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
                                  className="px-3 py-1.5 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />{isOpen ? 'Згорнути' : `Показати всі (${lessons.length})`}
                                </button>
                              )}
                            </div>

                            {/* Lessons list */}
                            <div className="mt-3">
                              {lessonsLoading && lessons.length === 0 ? (
                                <div className="space-y-2">
                                  {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
                                  ))}
                                </div>
                              ) : lessons.length === 0 ? (
                                <div className="text-sm text-slate-500">У цьому розділі поки немає уроків.</div>
                              ) : (
                                <ul className="divide-y divide-[#EEF3FF] rounded-xl ring-1 ring-[#EEF3FF]">
                                  {visibleLessons.map(l => (
                                    <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-white">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-slate-900 font-medium truncate">{l.title}</span>
                                          <span className="text-xs text-slate-500">#{l.order}</span>
                                          <LessonStatusPill status={l.status} />
                                          {typeof l.duration_min === 'number' ? <Pill tone="slate">{l.duration_min} хв</Pill> : null}
                                        </div>
                                        {l.summary ? (
                                          <div className="text-xs text-slate-500 line-clamp-1">{l.summary}</div>
                                        ) : null}
                                      </div>
                                      <div className="shrink-0 flex gap-2">
                                        <Link
                                          href={`/teacher/courses/${courseId}/builder/lessons/${l.id}/edit`}
                                          className="px-3 py-1.5 rounded-lg ring-1 ring-[#E5ECFF] bg-white inline-flex items-center gap-2"
                                        >
                                          <Pencil className="w-4 h-4" /> Редагувати
                                        </Link>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 shrink-0">
                            <button type="button" onClick={() => move(idx, -1)} className="px-2 py-1 rounded-lg ring-1 ring-[#E5ECFF] bg-white" title="Вище">
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => move(idx, 1)} className="px-2 py-1 rounded-lg ring-1 ring-[#E5ECFF] bg-white" title="Нижче">
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {orderDirty && (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={saveOrder}
                        disabled={reorderSaving}
                        className="px-3 py-2 rounded-xl bg-emerald-600 text-white inline-flex items-center gap-2 disabled:opacity-60"
                      >
                        <Save className="w-4 h-4" /> {reorderSaving ? 'Зберігаємо…' : 'Зберегти порядок'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setOrderDirty(false); router.refresh(); }}
                        className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center gap-2"
                      >
                        <X className="w-4 h-4" /> Скасувати
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Unassigned lessons */}
            {unassignedLessons.length > 0 && (
              <Card>
                <h3 className="text-[#0F2E64] font-extrabold text-[18px]">
                  Уроки без розділу <Pill tone="violet">{unassignedLessons.length}</Pill>
                </h3>
                <ul className="mt-3 divide-y divide-[#EEF3FF] rounded-xl ring-1 ring-[#EEF3FF]">
                  {unassignedLessons.map(l => (
                    <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-white">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-900 font-medium truncate">{l.title}</span>
                          <span className="text-xs text-slate-500">#{l.order}</span>
                          <LessonStatusPill status={l.status} />
                          {typeof l.duration_min === 'number' ? <Pill tone="slate">{l.duration_min} хв</Pill> : null}
                        </div>
                        {l.summary ? <div className="text-xs text-slate-500 line-clamp-1">{l.summary}</div> : null}
                      </div>
                      <Link
                        href={`/teacher/courses/${courseId}/builder/lessons/${l.id}/edit`}
                        className="px-3 py-1.5 rounded-lg ring-1 ring-[#E5ECFF] bg-white inline-flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4" /> Редагувати
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* RIGHT: form */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <h3 className="text-[#0F2E64] font-extrabold text-[18px]">{editingId ? 'Редагувати розділ' : 'Створити розділ'}</h3>
              <div className="mt-3 grid gap-3">
                <div>
                  <label className="text-sm text-slate-600">Назва</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Напр., «Вступ», «Основи Python»"
                    className="w-full mt-1 px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] outline-none focus:ring-[#1345DE]"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600">Опис</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Короткий опис змісту розділу…"
                    className="w-full mt-1 px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] outline-none focus:ring-[#1345DE]"
                  />
                </div>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
                  <span className="text-sm text-slate-700">Показувати студентам</span>
                </label>

                <div className="flex flex-wrap gap-2">
                  {editingId ? (
                    <>
                      <button
                        type="button"
                        onClick={updateModule}
                        disabled={saving || !title.trim()}
                        className="px-4 py-2 rounded-xl bg-[#1345DE] text-white inline-flex items-center gap-2 disabled:opacity-60"
                      >
                        <Save className="w-4 h-4" /> {saving ? 'Зберігаємо…' : 'Зберегти'}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center gap-2"
                      >
                        <X className="w-4 h-4" /> Скасувати
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={createModule}
                      disabled={saving || !title.trim()}
                      className="px-4 py-2 rounded-xl bg-[#1345DE] text-white inline-flex items-center gap-2 disabled:opacity-60"
                    >
                      <Plus className="w-4 h-4" /> {saving ? 'Створюємо…' : 'Створити розділ'}
                    </button>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-[#0F2E64] font-extrabold text-[18px]">Навігація</h3>
              <div className="mt-3 grid gap-2">
                <Link href={`/teacher/courses/${courseId}/builder/overview`} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] text-center">← До Hub</Link>
                <Link href={`/teacher/courses/${courseId}/builder/publish`} className="px-3 py-2 rounded-xl bg-[#1345DE] text-white text-center">До публікації →</Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}