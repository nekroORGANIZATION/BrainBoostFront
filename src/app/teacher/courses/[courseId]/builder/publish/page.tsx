'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import http, { setAuthHeader } from '@/lib/http';
import {
  ChevronLeft, CheckCircle2, AlertTriangle, Eye, Save, Loader2,
  ShieldCheck, ListChecks, BookOpen, Info, Check, XCircle, Image as ImageIcon,
  FileText, DollarSign, Tag, Clock, RefreshCw
} from 'lucide-react';

/* ========================= Types ========================= */
type CourseStatus = 'draft'|'published'|'archived'|'scheduled'|string;
type CourseDto = {
  id: number;
  slug: string;
  title: string;
  description: string;
  image?: string|null;
  price?: number|null;
  category?: number|null;
  status: CourseStatus;
  created_at?: string;
  updated_at?: string;
  language?: number|null;
  topic?: string|null;
};
type LessonMini = { id:number; title:string; status?:string };

/* ========================= Helpers ========================= */
const prettyError = (e:any) => {
  const d = e?.response?.data, s = e?.response?.status;
  if (typeof d === 'string') return d;
  if (!d) return e?.message || 'Сталася помилка.';
  if (d.detail) return String(d.detail);
  try { return Object.entries(d).map(([k,v]) => Array.isArray(v) ? `${k}: ${v.join(', ')}` : `${k}: ${JSON.stringify(v)}`).join('\n'); }
  catch { return s ? `HTTP ${s}` : 'Сталася помилка.'; }
};
const asArray = <T,>(raw:any): T[] =>
  Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : [];

/* ========================= Page ========================= */
export default function CoursePublishPage(){
  const params = useParams() as { courseId?: string|string[] };
  const router = useRouter();
  const courseId = Number(Array.isArray(params.courseId)? params.courseId[0]: params.courseId);
  const { accessToken } = useAuth();

  const [course, setCourse] = useState<CourseDto | null>(null);
  const [lessons, setLessons] = useState<LessonMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string|null>(null);
  const [ok, setOk] = useState<string|null>(null);

  useEffect(()=>{ if(accessToken) setAuthHeader(accessToken); }, [accessToken]);

  const loadAll = async () => {
    if (!courseId) return;
    setLoading(true); setErr(null);
    try{
      const [cRes, lRes] = await Promise.all([
        http.get(`/api/courses/${courseId}/`),
        http.get(`/lesson/admin/lessons/`, { params:{ course: courseId, page_size: 200, ordering:'order' } }),
      ]);
      setCourse(cRes.data as CourseDto);
      setLessons(asArray<LessonMini>(lRes.data));
    } catch(e:any){
      setErr(prettyError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ if (accessToken && courseId) loadAll(); }, [accessToken, courseId]);

  // ------- Readiness checklist -------
  const readiness = useMemo(()=>{
    const items: Array<{ ok:boolean; label:string; hint?:string; icon?:React.ReactNode }> = [];

    const titleOk = !!course?.title && course.title.trim().length >= 4;
    const descOk  = !!course?.description && course.description.trim().length >= 30;
    const imageOk = !!course?.image;
    const priceOk = course?.price === 0 || !!course?.price; // 0 теж валідно
    const catOk   = !!course?.category;
    const hasLessons = lessons.length > 0;

    items.push({ ok: titleOk, label: 'Назва курсу заповнена (≥ 4 символи)', icon:<Tag className="w-4 h-4"/>, hint: titleOk ? undefined : 'Додай коротку, чітку назву' });
    items.push({ ok: descOk,  label: 'Опис не менше 30 символів', icon:<FileText className="w-4 h-4"/>, hint: descOk ? undefined : 'Дай студенту контекст і користь' });
    items.push({ ok: imageOk, label: 'Обкладинка завантажена', icon:<ImageIcon className="w-4 h-4"/>, hint: imageOk ? undefined : 'Додай привабливе зображення' });
    items.push({ ok: priceOk, label: 'Ціна встановлена (або 0)', icon:<DollarSign className="w-4 h-4"/>, hint: priceOk ? undefined : 'Вкажи ціну або зроби безкоштовним' });
    items.push({ ok: catOk,   label: 'Категорія вибрана', icon:<BookOpen className="w-4 h-4"/>, hint: catOk ? undefined : 'Оберіть релевантну категорію' });
    items.push({ ok: hasLessons, label: `Уроки додані (${lessons.length})`, icon:<ListChecks className="w-4 h-4"/>, hint: hasLessons ? undefined : 'Додай принаймні один урок' });

    const score = items.filter(i=>i.ok).length;
    const allOk = score === items.length;

    return { items, score, allOk, total: items.length };
  }, [course, lessons]);

  // ------- Actions -------
  const patchCourse = async (data: Partial<CourseDto>) => {
    setBusy(true); setErr(null); setOk(null);
    try{
      const r = await http.patch(`/api/courses/${courseId}/`, data);
      setCourse(r.data as CourseDto);
      setOk('Зміни збережені.');
    } catch(e:any){
      setErr(prettyError(e));
    } finally { setBusy(false); }
  };

  const publishNow = async () => {
    if (!readiness.allOk && !confirm('Деякі пункти чек-ліста не виконані. Все одно опублікувати?')) return;
    await patchCourse({ status: 'published' });
  };
  const unpublish = async () => await patchCourse({ status: 'draft' });

  // ------- UI -------
  if (!accessToken){
    return (
      <main className="min-h-screen grid place-items-center p-6 bg-[url('/images/back.png')] bg-cover">
        <div className="max-w-md bg-white/95 ring-1 ring-slate-200 rounded-2xl p-6 text-center shadow-xl">
          <h1 className="text-2xl font-extrabold text-slate-900">Потрібен вхід</h1>
          <p className="text-slate-600 mt-1">Щоб публікувати курси — увійди.</p>
          <div className="mt-4">
            <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold">
              Увійти
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 pt-[90px] pb-24">
        {/* Header */}
        <div className="rounded-[24px] bg-white/90 ring-1 ring-[#E5ECFF] p-4 md:p-6 shadow-[0_10px_30px_rgba(2,28,78,0.10)] sticky top-16 z-10 backdrop-blur">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm text-slate-600">
                <Link href={`/teacher/courses/${courseId}/builder/overview`} className="text-indigo-600 hover:underline">Builder</Link>
                <span> / Публікація</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-[26px] md:text-[32px] font-extrabold text-[#021C4E] leading-tight truncate">
                  {course?.title || (loading ? 'Завантаження…' : 'Курс')}
                </h1>
                <StatusBadge status={course?.status || 'draft'} />
              </div>
              <div className="mt-1 text-xs text-slate-600 flex items-center gap-2">
                {loading && <span className="inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Завантаження…</span>}
                {ok && <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">{ok}</span>}
                {err && <span className="px-2 py-1 rounded-full bg-red-50 text-red-700 ring-1 ring-red-200">{err}</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!!course?.slug && (
                <Link href={`/courses/${course.slug}`} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-sm inline-flex items-center gap-2 hover:shadow-md transition">
                  <Eye className="w-4 h-4"/> Переглянути
                </Link>
              )}
              <Link href={`/teacher/courses/${courseId}/builder/overview`} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-sm inline-flex items-center gap-2 hover:shadow-md transition">
                <ChevronLeft className="w-4 h-4"/> До Hub
              </Link>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {err && (
          <div className="mt-4 rounded-xl bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 whitespace-pre-wrap shadow-md">
            <div className="flex items-start gap-2"><AlertTriangle className="w-5 h-5 mt-0.5"/> <span>{err}</span></div>
          </div>
        )}

        {/* Content grid */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Left: Checklist & lessons */}
          <div className="rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-4 shadow-lg">
            <Section title="Готовність до публікації" icon={<ShieldCheck className="w-4 h-4"/>}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-slate-600">
                  Виконано <b>{readiness.score}</b> з <b>{readiness.total}</b>
                </div>
                <div className="w-40 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all"
                    style={{ width: `${(readiness.score/readiness.total)*100}%` }}
                  />
                </div>
              </div>

              <ul className="grid gap-2">
                {readiness.items.map((it, idx)=>(
                  <li key={idx} className={`flex items-start gap-3 p-3 rounded-xl ring-1 transition ${
                    it.ok ? 'ring-emerald-200 bg-emerald-50/60' : 'ring-amber-200 bg-amber-50/60'
                  }`}>
                    <span className={`mt-0.5 rounded-full p-1 ${it.ok ? 'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>
                      {it.ok ? <CheckCircle2 className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                    </span>
                    <div className="text-sm">
                      <div className="font-medium text-[#0F2E64] flex items-center gap-2">
                        {it.icon}{it.label}
                      </div>
                      {!it.ok && it.hint && <div className="text-slate-600">{it.hint}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title={`Уроки курсу (${lessons.length})`} icon={<ListChecks className="w-4 h-4"/>}>
              {loading ? (
                <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Завантаження уроків…</div>
              ) : lessons.length ? (
                <div className="grid gap-2">
                  {lessons.map(ls=>(
                    <div key={ls.id} className="flex items-center justify-between p-3 rounded-xl ring-1 ring-[#E5ECFF] hover:shadow-sm transition">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#0F2E64] truncate">{ls.title}</div>
                        {ls.status && <div className="text-xs text-slate-500">Статус: {ls.status}</div>}
                      </div>
                      <Link href={`/teacher/courses/${courseId}/builder/lessons/${ls.id}`} className="text-indigo-600 text-sm hover:underline">Редагувати</Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-600">Поки що уроків немає. Додайте хоча б один урок у розділі “Розділи/Уроки”.</div>
              )}
            </Section>
          </div>

          {/* Right: Actions */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-4 shadow-lg">
              <div className="text-sm font-semibold text-[#0F2E64] mb-2">Дії з курсом</div>

              <div className="grid gap-2">
                <button
                  onClick={publishNow}
                  disabled={busy || course?.status === 'published'}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white inline-flex items-center justify-center gap-2 hover:shadow-md disabled:opacity-60 transition"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Опублікувати курс
                </button>

                <button
                  onClick={unpublish}
                  disabled={busy || course?.status === 'draft'}
                  className="px-4 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center justify-center gap-2 hover:shadow-md disabled:opacity-60 transition"
                >
                  <XCircle className="w-4 h-4" />
                  Зняти з публікації
                </button>

                <button
                  onClick={loadAll}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center justify-center gap-2 hover:shadow-md transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Оновити дані
                </button>
              </div>

              <div className="mt-4 text-xs text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5"/>
                <span>Публікація змінює лише статус курсу на бекенді (<code>/api/courses/{'{id}'}/</code>). Якщо хочеш планування — додамо поле <code>scheduled_at</code> в модель курсу окремо.</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-4 shadow-lg">
              <div className="text-sm font-semibold text-[#0F2E64] mb-2">Навігація</div>
              <div className="grid gap-2">
                <Link href={`/teacher/courses/${courseId}/builder/overview`} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] text-center hover:shadow-md transition">← До Hub</Link>
                <Link href={`/teacher/courses/${courseId}/builder/lessons`} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] text-center hover:shadow-md transition">До розділів/уроків →</Link>
                <Link href={`/teacher/courses/${courseId}/builder/assessments`} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] text-center hover:shadow-md transition">Оцінювання</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

/* ========================= UI Bits ========================= */
function Section({ title, icon, children }:{ title:string; icon?:React.ReactNode; children:React.ReactNode }){
  return (
    <section className="not-prose">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700">{icon}</span>
        <h2 className="text-base font-semibold text-[#0F2E64]">{title}</h2>
      </div>
      <div className="rounded-xl ring-1 ring-[#E5ECFF] p-3 bg-white/95">{children}</div>
    </section>
  );
}

function StatusBadge({ status }:{ status:CourseStatus }){
  const map: Record<string, {label:string; cls:string}> = {
    draft:     { label:'Чернетка',     cls:'bg-slate-100 text-slate-700' },
    published: { label:'Опубліковано', cls:'bg-emerald-100 text-emerald-800' },
    archived:  { label:'Архів',        cls:'bg-slate-200 text-slate-700' },
    scheduled: { label:'Заплановано',  cls:'bg-amber-100 text-amber-800' },
  };
  const m = map[status] || map['draft'];
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${m.cls}`}>{m.label}</span>;
}
