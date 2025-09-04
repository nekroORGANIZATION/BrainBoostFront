'use client';

import React, { useEffect, useMemo, useState } from 'react';
import http, { API_BASE } from '@/lib/http';

/* ===================== TYPES ===================== */
type Category = { id: number; name: string; slug?: string };

type LessonDraft = {
  id: string; // client-only
  title: string;
  type: 'video' | 'text' | 'link' | 'file';
  content_text?: string;
  content_url?: string;
  duration_min?: number | null;
  order: number;
};

type CourseDraft = {
  id?: number;      // появится ТОЛЬКО после POST /courses/
  slug?: string | null;
  title: string;
  description: string;
  price: string;
  language: string;
  topic: string;
  category: string; // stringified id
  image_file?: File | null;
  image_url?: string | null;
  lessons: LessonDraft[];
  status?: 'draft' | 'pending' | 'published';
};

/* ===================== CONSTS ===================== */
const DRAFT_KEY = 'course_builder_draft';
const LESSON_INBOX_KEY = 'course_builder_inbox_lessons';
const COURSES_ENDPOINT = '/courses/';              // POST курс, PATCH /courses/:id/
const LESSONS_ENDPOINT = '/api/lesson/lessons/';   // POST урок

/* ===================== HELPERS ===================== */
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function toBackendType(t: LessonDraft['type']) {
  switch (t) {
    case 'video': return 'VIDEO';
    case 'link':  return 'LINK';
    default:      return 'TEXT';
  }
}

function buildLessonPayload(courseId: number, l: LessonDraft) {
  const p = {
    course: courseId,
    title: (l.title || '').trim(),
    type: toBackendType(l.type),
    order: l.order,
  };
  if (l.duration_min != null) p.duration_min = l.duration_min;

  if (l.type === 'text') {
    p.content_text = (l.content_text || '').trim();
  } else {
    p.content_url = (l.content_url || '').trim();
  }
  return p;
}

/* ===================== PAGE ===================== */
export default function CourseBuilderPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [draft, setDraft] = useState<CourseDraft>({
    title: '',
    description: '',
    price: '',
    language: '',
    topic: '',
    category: '',
    image_file: null,
    image_url: null,
    lessons: [],
    status: 'draft',
  });

  /* ---------- load categories + import inbox lessons ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await http.get('/courses/categories/');
        const arr = Array.isArray(r.data?.results) ? r.data.results : r.data;
        if (!cancelled) setCategories(arr || []);
        console.log('[CourseBuilder] categories:', arr);
      } catch (e) {
        console.error('[CourseBuilder] categories error:', e?.response?.status, e?.response?.data || e);
        // 401 не чиним специально
      }
    })();

    // імпорт черновых уроков из «inbox» (другая страница)
    try {
      const inboxRaw = typeof window !== 'undefined' ? localStorage.getItem(LESSON_INBOX_KEY) : null;
      if (inboxRaw) {
        const inbox: LessonDraft[] = JSON.parse(inboxRaw);
        if (Array.isArray(inbox) && inbox.length) {
          setDraft((d) => {
            const merged = [
              ...d.lessons,
              ...inbox.map((l, i) => ({ ...l, order: d.lessons.length + i + 1 })),
            ];
            localStorage.removeItem(LESSON_INBOX_KEY);
            return { ...d, lessons: merged };
          });
          console.log('[CourseBuilder] imported lessons from inbox:', inbox.length);
        }
      }
    } catch (e) {
      console.error('[CourseBuilder] parse inbox error:', e);
    }

    return () => { cancelled = true; };
  }, []);

  /* ---------- load draft from LS (без id/slug!) ---------- */
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(DRAFT_KEY) : null;
      if (!raw) return;
      const saved: CourseDraft = JSON.parse(raw);
      // ВАЖНО: не тащим старые id/slug, чтобы не попасть на /courses/15/
      const { id: _dropId, slug: _dropSlug, ...rest } = saved as unknown;
      setDraft((d) => ({ ...d, ...rest, id: undefined, slug: null, image_file: null }));
      console.log('[CourseBuilder] draft restored (id/slug ignored)');
    } catch (e) {
      console.error('[CourseBuilder] restore draft error:', e);
    }
  }, []);

  /* ---------- persist draft to LS ---------- */
  useEffect(() => {
    const { image_file, ...persist } = draft;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(persist));
    } catch (e) {
      console.error('[CourseBuilder] save draft error:', e);
    }
  }, [draft]);

  /* ---------- field helpers ---------- */
  function setField<K extends keyof CourseDraft>(k: K, v: CourseDraft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function addLesson() {
    const id = uid();
    setDraft((d) => ({
      ...d,
      lessons: [
        ...d.lessons,
        { id, title: `Новий урок #${d.lessons.length + 1}`, type: 'text', order: d.lessons.length + 1 },
      ],
    }));
  }
  function updateLesson(id: string, patch: Partial<LessonDraft>) {
    setDraft((d) => ({
      ...d,
      lessons: d.lessons.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  }
  function removeLesson(id: string) {
    setDraft((d) => {
      const rest = d.lessons.filter((l) => l.id !== id);
      return { ...d, lessons: rest.map((l, i) => ({ ...l, order: i + 1 })) };
    });
  }
  function move(id: string, dir: -1 | 1) {
    setDraft((d) => {
      const idx = d.lessons.findIndex((l) => l.id === id);
      if (idx < 0) return d;
      const target = idx + dir;
      if (target < 0 || target >= d.lessons.length) return d;
      const arr = [...d.lessons];
      const tmp = arr[idx]; arr[idx] = arr[target]; arr[target] = tmp;
      return { ...d, lessons: arr.map((l, i) => ({ ...l, order: i + 1 })) };
    });
  }

  /* ---------- validation ---------- */
  const checks = useMemo(() => {
    const title = draft.title.trim().length >= 4;
    const desc = draft.description.trim().length >= 40;
    const price = !Number.isNaN(Number(draft.price)) && Number(draft.price) >= 0;
    const language = !!draft.language.trim();
    const topic = !!draft.topic.trim();
    const category = !!draft.category;
    const atLeastOneLesson = draft.lessons.length >= 1;
    const everyLessonHasTitle = draft.lessons.every((l) => l.title.trim().length >= 3);
    const everyLessonHasContent = draft.lessons.every((l) => {
      if (l.type === 'text') return (l.content_text || '').trim().length >= 20;
      if (l.type === 'video' || l.type === 'link') return !!(l.content_url && l.content_url.trim());
      return true;
    });
    return { title, desc, price, language, topic, category, atLeastOneLesson, everyLessonHasTitle, everyLessonHasContent };
  }, [draft]);

  const readyToPublish =
    checks.title && checks.desc && checks.price &&
    checks.language && checks.topic && checks.category &&
    checks.atLeastOneLesson && checks.everyLessonHasTitle && checks.everyLessonHasContent;

  /* ---------- server actions ---------- */

  // 1) Создаём курс (чернетка) — ВСЕГДА, при переходе на шаг уроков
  async function createCourseDraft(): Promise<{ id: number; slug?: string | null; image?: string | null }> {
    const fd = new FormData();
    fd.append('title', draft.title);
    fd.append('description', draft.description);
    fd.append('price', draft.price);
    fd.append('language', draft.language);
    fd.append('topic', draft.topic);
    fd.append('category', String(Number(draft.category || '')));
    fd.append('status', 'draft');
    if (draft.image_file) fd.append('image', draft.image_file);

    console.log('[CourseBuilder] POST', COURSES_ENDPOINT, {
      ...Object.fromEntries(fd.entries()),
      image: draft.image_file ? '[File]' : undefined
    });

    const res = await http.post(COURSES_ENDPOINT, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    const data = res?.data || {};
    console.log('[CourseBuilder] course create response:', data);

    if (!data?.id) throw new Error('Курс не створився (відсутній id)');
    return { id: Number(data.id), slug: data.slug ?? null, image: data.image ?? null };
  }

  // 2) «Далі → Уроки»: всегда создаём НОВЫЙ курс, сохраняем id
  async function goToLessons() {
    setError(null); setMsg(null); setBusy(true);
    try {
      const created = await createCourseDraft();
      // Сбрасываем прошлые id/slug и ставим свежие
      setDraft(d => ({ ...d, id: created.id, slug: created.slug ?? null, image_url: created.image ?? d.image_url, status: 'draft' }));
      console.log('[CourseBuilder] Draft created id=', created.id);
      setStep(2);
    } catch (e) {
      console.error('[CourseBuilder] goToLessons error:', {
        status: e?.response?.status, data: e?.response?.data, url: e?.config?.url, method: e?.config?.method,
      });
      setError(e?.response?.data ? JSON.stringify(e.response.data) : (e?.message || 'Не вдалося створити чернетку курсу.'));
    } finally { setBusy(false); }
  }

  // 3) Локальное сохранение меты (без запросов — курс создаём только на «Далі»)
  async function saveCourseMeta() {
    setError(null);
    setMsg('Чернетку збережено локально ✔');
  }

  // 4) Публикация: используем СВЕЖИЙ draft.id → создаём уроки → публикуем курс
  async function publishCourse() {
    if (!readyToPublish) return;
    setError(null); setMsg(null); setBusy(true);

    try {
      const courseId = Number(draft.id);
      if (!Number.isFinite(courseId)) throw new Error('Не вдалось отримати id курсу. Спочатку натисніть «Далі → Уроки».');

      // Создаём уроки
      for (const l of draft.lessons) {
        const payload = buildLessonPayload(courseId, l);
        console.log('[CourseBuilder] POST', LESSONS_ENDPOINT, payload);
        const resp = await http.post(LESSONS_ENDPOINT, payload);
        console.log('[CourseBuilder] Lesson created:', resp?.data);
      }

      // Переводим курс в published
      console.log('[CourseBuilder] PATCH publish', `${COURSES_ENDPOINT}${courseId}/`, { status: 'published' });
      await http.patch(`${COURSES_ENDPOINT}${courseId}/`, { status: 'published' });

      setMsg('Курс опубліковано! 🎉');
      // опционально: localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      console.error('[CourseBuilder] publishCourse error:', {
        status: e?.response?.status, data: e?.response?.data, url: e?.config?.url, method: e?.config?.method,
      });
      const d = e?.response?.data;
      setError(d?.detail ? String(d.detail) : (d ? JSON.stringify(d) : 'Публікація не вдалася.'));
    } finally { setBusy(false); }
  }

  /* ---------- UI ---------- */
  const imagePreview = useMemo(() => {
    if (draft.image_file) return URL.createObjectURL(draft.image_file);
    if (draft.image_url) return draft.image_url.startsWith('http') ? draft.image_url : `${API_BASE}${draft.image_url}`;
    return null;
  }, [draft.image_file, draft.image_url]);

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="max-w-[1100px] mx-auto px-6 pt-28 pb-20">
        <div className="rounded-[24px] bg-white/95 ring-1 ring-[#E5ECFF] shadow-[0_12px_40px_rgba(2,28,78,0.08)] p-6 md:p-8">
          <header className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F2E64] m-0">Конструктор курсу</h1>
              <p className="text-slate-600 mt-1">Метадані → Уроки → Публікація</p>
            </div>
            <div className="flex items-center gap-2">
              <StepDot active={step === 1} text="Метадані" onClick={() => setStep(1)} />
              <StepDot active={step === 2} text="Уроки" onClick={() => setStep(2)} />
              <StepDot active={step === 3} text="Публікація" onClick={() => setStep(3)} />
            </div>
          </header>

          {error && <div className="mt-4 rounded-lg bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 break-words">{error}</div>}
          {msg && <div className="mt-4 rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-3 py-2">{msg}</div>}

          {/* STEP 1 */}
          {step === 1 && (
            <section className="mt-6 grid md:grid-cols-[1fr_320px] gap-6">
              <div>
                <Field label="Назва">
                  <input
                    className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
                    value={draft.title}
                    onChange={(e) => setField('title', e.target.value)}
                    placeholder="Напр.: Frontend з нуля"
                  />
                </Field>
                <Field label="Опис">
                  <textarea
                    rows={8}
                    className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE] resize-vertical"
                    value={draft.description}
                    onChange={(e) => setField('description', e.target.value)}
                    placeholder="Що входить у програму, формат, результат… (мін. 40 символів)"
                  />
                </Field>

                <div className="grid md:grid-cols-3 gap-4">
                  <Field label="Ціна, $">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
                      value={draft.price}
                      onChange={(e) => setField('price', e.target.value)}
                    />
                  </Field>
                  <Field label="Мова">
                    <input
                      className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
                      value={draft.language}
                      onChange={(e) => setField('language', e.target.value)}
                      placeholder="Українська"
                    />
                  </Field>
                  <Field label="Тема">
                    <input
                      className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
                      value={draft.topic}
                      onChange={(e) => setField('topic', e.target.value)}
                      placeholder="Програмування / Дизайн…"
                    />
                  </Field>
                </div>

                <Field label="Категорія">
                  <select
                    className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE] bg-white"
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

              <div>
                <div className="rounded-xl ring-1 ring-[#E5ECFF] p-3 bg-slate-50">
                  <div className="text-sm font-semibold text-[#0F2E64] mb-1">Обкладинка</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setField('image_file', e.target.files?.[0] || null)}
                    className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-[#1345DE] file:text-white"
                  />
                  <div className="mt-2 rounded-lg overflow-hidden bg-white ring-1 ring-[#E5ECFF] grid place-items-center aspect-[4/3]">
                    {imagePreview ? (
                      <img src={imagePreview} alt="cover" className="max-h-full object-contain" />
                    ) : (
                      <div className="text-slate-500 text-sm">Превʼю</div>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">JPG/PNG, до 10 МБ</div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={saveCourseMeta}
                    disabled={busy}
                    className="px-4 py-2 rounded-[10px] bg-[#1345DE] text-white font-semibold disabled:opacity-60"
                  >
                    Зберегти чернетку (локально)
                  </button>
                  <button
                    onClick={goToLessons}
                    disabled={busy}
                    className="px-4 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white disabled:opacity-60"
                  >
                    Далі → Уроки
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-[#0F2E64]">Уроки курсу</h2>
                <button onClick={addLesson} className="px-4 py-2 rounded-[10px] bg-[#1345DE] text-white font-semibold">
                  + Додати урок
                </button>
              </div>

              {draft.lessons.length === 0 ? (
                <div className="mt-4 rounded-lg bg-slate-50 ring-1 ring-[#E5ECFF] p-4 text-slate-600">
                  Поки немає уроків. Додайте перший.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {draft.lessons.map((l) => (
                    <div key={l.id} className="rounded-xl ring-1 ring-[#E5ECFF] p-4 bg-white">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <input
                          className="flex-1 rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
                          value={l.title}
                          onChange={(e) => updateLesson(l.id, { title: e.target.value })}
                          placeholder="Назва уроку"
                        />
                        <div className="flex items-center gap-2">
                          <button onClick={() => move(l.id, -1)} className="px-2 py-1 rounded ring-1 ring-[#E5ECFF]">↑</button>
                          <button onClick={() => move(l.id, +1)} className="px-2 py-1 rounded ring-1 ring-[#E5ECFF]">↓</button>
                          <button onClick={() => removeLesson(l.id)} className="px-3 py-1 rounded bg-red-50 text-red-700 ring-1 ring-red-200">
                            Видалити
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid md:grid-cols-3 gap-3">
                        <label className="block">
                          <span className="block text-sm text-[#0F2E64] mb-1">Тип</span>
                          <select
                            className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2"
                            value={l.type}
                            onChange={(e) => updateLesson(l.id, { type: e.target.value as LessonDraft['type'] })}
                          >
                            <option value="text">Текст</option>
                            <option value="video">Відео</option>
                            <option value="link">Посилання</option>
                            <option value="file" disabled>Файл (пізніше)</option>
                          </select>
                        </label>

                        <label className="block">
                          <span className="block text-sm text-[#0F2E64] mb-1">Тривалість, хв (опц.)</span>
                          <input
                            type="number" min={0} step={1}
                            className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2"
                            value={l.duration_min ?? ''}
                            onChange={(e) => updateLesson(l.id, { duration_min: e.target.value ? Number(e.target.value) : null })}
                          />
                        </label>
                      </div>

                      {l.type === 'text' && (
                        <label className="block mt-3">
                          <span className="block text-sm text-[#0F2E64] mb-1">Контент (мін. 20 символів)</span>
                          <textarea
                            rows={5}
                            className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2"
                            value={l.content_text || ''}
                            onChange={(e) => updateLesson(l.id, { content_text: e.target.value })}
                            placeholder="Теорія, приклади, завдання…"
                          />
                        </label>
                      )}
                      {(l.type === 'video' || l.type === 'link') && (
                        <label className="block mt-3">
                          <span className="block text-sm text-[#0F2E64] mb-1">{l.type === 'video' ? 'URL на відео (YouTube/Vimeo…)' : 'Посилання'}</span>
                          <input
                            className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2"
                            value={l.content_url || ''}
                            onChange={(e) => updateLesson(l.id, { content_url: e.target.value })}
                            placeholder="https://…"
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep(1)} className="px-4 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white">
                  ← Назад
                </button>
                <button onClick={() => setStep(3)} className="px-4 py-2 rounded-[10px] bg-[#1345DE] text-white font-semibold">
                  Далі → Публікація
                </button>
              </div>
            </section>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <section className="mt-6">
              <h2 className="text-xl font-extrabold text-[#0F2E64]">Перевірка готовності</h2>
              <ul className="mt-3 grid md:grid-cols-2 gap-2 text-sm">
                <Check ok={checks.title}>Назва (мін. 4 символи)</Check>
                <Check ok={checks.desc}>Опис (мін. 40 символів)</Check>
                <Check ok={checks.price}>Ціна ≥ 0</Check>
                <Check ok={checks.language}>Мова</Check>
                <Check ok={checks.topic}>Тема</Check>
                <Check ok={checks.category}>Категорія</Check>
                <Check ok={checks.atLeastOneLesson}>Є щонайменше 1 урок</Check>
                <Check ok={checks.everyLessonHasTitle}>Кожен урок має назву</Check>
                <Check ok={checks.everyLessonHasContent}>Кожен урок має контент</Check>
              </ul>

              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={() => setStep(2)} className="px-4 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white">
                  ← До уроків
                </button>
                <button
                  onClick={publishCourse}
                  disabled={!readyToPublish || busy}
                  className="px-5 py-2 rounded-[10px] bg-emerald-600 text-white font-semibold disabled:opacity-60"
                >
                  {busy ? 'Публікуємо…' : 'Опублікувати курс'}
                </button>
              </div>

              <p className="mt-3 text-slate-600 text-sm">
                Публікація стане доступною лише коли продукт повний. Окремі уроки — це чернетки, їх не можна опублікувати без курсу.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

/* ===================== SMALL UI ===================== */
function StepDot({ active, text, onClick }: { active?: boolean; text: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${
        active ? 'bg-[#1345DE] text-white' : 'bg-white ring-1 ring-[#E5ECFF] text-[#0F2E64]'
      }`}
      type="button"
    >
      {text}
    </button>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-semibold text-[#0F2E64] mb-1">{label}</span>
      {children}
    </label>
  );
}
function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`px-3 py-2 rounded-lg ring-1 ${ok ? 'ring-emerald-200 bg-emerald-50 text-emerald-700' : 'ring-red-200 bg-red-50 text-red-700'}`}>
      {ok ? '✅' : '⛔'} {children}
    </li>
  );
}
