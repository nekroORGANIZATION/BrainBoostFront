// src/app/teacher/courses/new/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import http, { API_BASE } from '@/lib/http';
import { motion } from 'framer-motion';
import { Check, Image as ImageIcon, Loader2, PlusCircle } from 'lucide-react';

/* ===================== TYPES ===================== */
type Category = { id: number; name: string; slug?: string };
type Language = { id: number; name: string; code?: string };

type CourseMetaDraft = {
  title: string;
  description: string;
  price: string;       // з інпуту — як string
  language: string;    // ID мови (stringified)
  topic: string;
  category: string;    // ID категорії (stringified)
  image_file?: File | null;
  image_url?: string | null;
  status?: 'draft' | 'pending' | 'published';
};

/* ===================== CONSTS ===================== */
const COURSES_ENDPOINT = '/courses/';

const CATEGORIES_URLS = ['/courses/categories/', '/api/courses/categories/'];
const LANGUAGES_URLS  = [
  '/courses/admin/languages/',      // пріоритетний (якщо доступний викладачу)
  '/api/courses/admin/languages/',
  '/courses/languages/',            // публічний фолбек
  '/api/courses/languages/',
];

/* ===================== PAGE ===================== */
export default function TeacherCourseCreatePage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);

  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages]   = useState<Language[]>([]);
  const [busy, setBusy]             = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [notice, setNotice]         = useState<string | null>(null);

  const [draft, setDraft] = useState<CourseMetaDraft>({
    title: '',
    description: '',
    price: '',
    language: '',
    topic: '',
    category: '',
    image_file: null,
    image_url: null,
    status: 'draft',
  });

  /* ---------- load categories & languages (із фолбеками) ---------- */
  useEffect(() => {
    let cancelled = false;

    async function loadWithFallback<T>(urls: string[], map?: (data: any) => T[]): Promise<T[]> {
      for (const u of urls) {
        try {
          const r = await http.get(u);
          const raw = r.data;
          const arr = Array.isArray(raw) ? raw : (raw?.results || raw?.data || raw?.items || []);
          const out = (map ? map(arr) : arr) ?? [];
          if (Array.isArray(out) && out.length >= 0) return out;
        } catch {
          // пробуємо наступний url
        }
      }
      return [];
    }

    (async () => {
      const [cats, langs] = await Promise.all([
        loadWithFallback<Category>(CATEGORIES_URLS),
        loadWithFallback<Language>(LANGUAGES_URLS),
      ]);
      if (!cancelled) {
        setCategories(cats);
        setLanguages(langs);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  /* ---------- helpers ---------- */
  function setField<K extends keyof CourseMetaDraft>(k: K, v: CourseMetaDraft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  const checks = useMemo(() => {
    const title = draft.title.trim().length >= 4;
    const desc = draft.description.trim().length >= 40;
    const priceOk = !Number.isNaN(Number(draft.price)) && Number(draft.price) >= 0;
    const languageOk = !!draft.language;
    const topicOk = !!draft.topic.trim();
    const categoryOk = !!draft.category;
    return { title, desc, priceOk, languageOk, topicOk, categoryOk };
  }, [draft]);

  const readyToCreate =
    checks.title && checks.desc && checks.priceOk &&
    checks.languageOk && checks.topicOk && checks.categoryOk;

  const imagePreview = useMemo(() => {
    if (draft.image_file) return URL.createObjectURL(draft.image_file);
    if (draft.image_url)  return draft.image_url.startsWith('http') ? draft.image_url : `${API_BASE}${draft.image_url}`;
    return null;
  }, [draft.image_file, draft.image_url]);

  /* ---------- actions ---------- */
  async function createDraftCourse() {
    if (!readyToCreate || busy) return;

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const fd = new FormData();
      fd.append('title', draft.title.trim());
      fd.append('description', draft.description.trim());
      fd.append('price', String(Number(draft.price || 0)));
      fd.append('language', String(draft.language));   // ← ID мови
      fd.append('topic', draft.topic.trim());
      fd.append('category', String(draft.category));   // ← ID категорії
      fd.append('status', 'draft');

      if (draft.image_file) fd.append('image', draft.image_file);
      else if (draft.image_url) fd.append('image_url', draft.image_url);

      const res = await http.post(COURSES_ENDPOINT, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const created = res?.data || {};
      if (!created?.id) throw new Error('Курс створено без ідентифікатора.');

      // далі — одразу в Builder → Overview
      router.push(`/teacher/courses/${created.id}/builder/overview`);
      router.refresh();
    } catch (e: any) {
      const d = e?.response?.data;
      const msg = typeof d === 'string'
        ? d
        : d?.detail
        ? String(d.detail)
        : d
        ? JSON.stringify(d)
        : (e?.message || 'Не вдалося створити курс.');
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  /* ===================== UI ===================== */
  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="rounded-[24px] bg-white/95 ring-1 ring-[#E5ECFF] shadow-[0_16px_48px_rgba(2,28,78,0.10)] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#EEF3FF] to-white px-6 md:px-8 py-6 border-b">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#021C4E] m-0">
                  Створення курсу
                </h1>
                <p className="text-slate-600 mt-1">Крок {step} з 2</p>
              </div>
              <div className="flex items-center gap-2">
                <StepPill active={step === 1} label="Метадані" onClick={() => setStep(1)} />
                <StepPill active={step === 2} label="Підсумок" onClick={() => setStep(2)} />
              </div>
            </div>
            {/* progress */}
            <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-[#1345DE] transition-[width]"
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mx-6 md:mx-8 mt-4 rounded-lg bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2">
              {error}
            </div>
          )}
          {notice && (
            <div className="mx-6 md:mx-8 mt-4 rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-3 py-2">
              {notice}
            </div>
          )}

          {/* Body */}
          <div className="p-6 md:p-8">
            {step === 1 ? (
              <section className="grid md:grid-cols-[1fr_340px] gap-6">
                {/* left */}
                <div>
                  <Field label="Назва курсу" hint="Мінімум 4 символи">
                    <input
                      className="w-full rounded-xl ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
                      value={draft.title}
                      onChange={(e) => setField('title', e.target.value)}
                      placeholder="Напр.: Frontend з нуля"
                    />
                  </Field>

                  <Field label="Опис" hint="Мінімум 40 символів">
                    <textarea
                      rows={8}
                      className="w-full rounded-xl ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE] resize-vertical"
                      value={draft.description}
                      onChange={(e) => setField('description', e.target.value)}
                      placeholder="Програма, формат навчання, очікуваний результат…"
                    />
                  </Field>

                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Field label="Ціна, $" >
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-full rounded-xl ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
                        value={draft.price}
                        onChange={(e) => setField('price', e.target.value)}
                        placeholder="0.00"
                      />
                    </Field>

                    <Field label="Мова курсу">
                      <select
                        className="w-full rounded-xl ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE] bg-white"
                        value={draft.language}
                        onChange={(e) => setField('language', e.target.value)}
                      >
                        <option value="" disabled>Оберіть мову…</option>
                        {languages.map((l) => (
                          <option key={l.id} value={String(l.id)}>
                            {l.name}{l.code ? ` (${l.code})` : ''}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Тема">
                      <input
                        className="w-full rounded-xl ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
                        value={draft.topic}
                        onChange={(e) => setField('topic', e.target.value)}
                        placeholder="Програмування / Дизайн…"
                      />
                    </Field>
                  </div>

                  <Field label="Категорія">
                    <select
                      className="w-full rounded-xl ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE] bg-white"
                      value={draft.category}
                      onChange={(e) => setField('category', e.target.value)}
                    >
                      <option value="" disabled>Оберіть категорію…</option>
                      {categories.map((c) => (
                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* right */}
                <div className="space-y-4">
                  <div className="rounded-2xl ring-1 ring-[#E5ECFF] p-4 bg-slate-50">
                    <div className="text-sm font-semibold text-[#0F2E64] mb-2">Обкладинка</div>
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setField('image_file', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <div className="aspect-[4/3] grid place-items-center rounded-xl bg-white ring-1 ring-[#E5ECFF] overflow-hidden cursor-pointer hover:ring-[#1345DE] transition">
                        {imagePreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imagePreview} alt="cover" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-500">
                            <ImageIcon className="w-8 h-8 mb-2" />
                            <span className="text-sm">Натисни, щоб завантажити</span>
                          </div>
                        )}
                      </div>
                    </label>
                    <div className="text-xs text-slate-500 mt-2">JPG/PNG, до 10 МБ</div>
                  </div>

                  <div className="rounded-2xl ring-1 ring-[#E5ECFF] p-4">
                    <h3 className="text-sm font-semibold text-[#0F2E64] mb-2">Готовність</h3>
                    <ul className="space-y-1 text-sm">
                      <ReadyRow ok={checks.title}>Назва</ReadyRow>
                      <ReadyRow ok={checks.desc}>Опис</ReadyRow>
                      <ReadyRow ok={checks.priceOk}>Ціна</ReadyRow>
                      <ReadyRow ok={checks.languageOk}>Мова</ReadyRow>
                      <ReadyRow ok={checks.topicOk}>Тема</ReadyRow>
                      <ReadyRow ok={checks.categoryOk}>Категорія</ReadyRow>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white hover:ring-[#1345DE] transition"
                    >
                      Перейти до підсумку
                    </button>
                    <button
                      onClick={createDraftCourse}
                      disabled={!readyToCreate || busy}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#1345DE] text-white font-semibold disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                      Створити чернетку
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <section>
                <h2 className="text-xl font-extrabold text-[#0F2E64]">Підсумок</h2>
                <div className="mt-4 grid md:grid-cols-2 gap-6">
                  <SummaryCard title="Назва">{draft.title || '—'}</SummaryCard>
                  <SummaryCard title="Тема">{draft.topic || '—'}</SummaryCard>
                  <SummaryCard title="Опис">
                    <p className="whitespace-pre-wrap">{draft.description || '—'}</p>
                  </SummaryCard>
                  <SummaryCard title="Ціна">
                    {Number.isFinite(Number(draft.price)) ? `$${Number(draft.price).toFixed(2)}` : '—'}
                  </SummaryCard>
                  <SummaryCard title="Мова">
                    {labelById(languages, draft.language) || '—'}
                  </SummaryCard>
                  <SummaryCard title="Категорія">
                    {labelById(categories, draft.category) || '—'}
                  </SummaryCard>
                  <div className="md:col-span-2">
                    <SummaryCard title="Обкладинка">
                      <div className="aspect-[4/3] rounded-xl ring-1 ring-[#E5ECFF] overflow-hidden bg-slate-50 grid place-items-center">
                        {imagePreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imagePreview} alt="cover" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-500 text-sm">Не завантажено</span>
                        )}
                      </div>
                    </SummaryCard>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white hover:ring-[#1345DE] transition"
                  >
                    ← Повернутися до редагування
                  </button>
                  <button
                    onClick={createDraftCourse}
                    disabled={!readyToCreate || busy}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#1345DE] text-white font-semibold disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                    Створити чернетку
                  </button>
                </div>
              </section>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}

/* ===================== SMALL UI ===================== */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-semibold text-[#0F2E64] mb-1">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-slate-500 mt-1">{hint}</span> : null}
    </label>
  );
}

function StepPill({ active, label, onClick }: { active?: boolean; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${
        active ? 'bg-[#1345DE] text-white' : 'bg-white ring-1 ring-[#E5ECFF] text-[#0F2E64] hover:ring-[#1345DE]'
      }`}
    >
      {label}
    </button>
  );
}

function ReadyRow({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`px-2.5 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
      ok ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'
    }`}>
      <Check className={`w-4 h-4 ${ok ? '' : 'opacity-40'}`} /> {children}
    </li>
  );
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl ring-1 ring-[#E5ECFF] p-4 bg-white">
      <div className="text-sm font-semibold text-[#0F2E64] mb-1">{title}</div>
      <div className="text-slate-800">{children}</div>
    </div>
  );
}

function labelById(items: Array<{ id: number; name: string; code?: string }>, idStr: string) {
  const id = Number(idStr);
  const item = items.find((i) => i.id === id);
  if (!item) return '';
  return item.code ? `${item.name} (${item.code})` : item.name;
}
