'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import http, { setAuthHeader } from '@/lib/http';
import {
  ArrowLeft, ImagePlus, X, Loader2, ChevronRight,
  Tag, Languages, BookOpen, AlignLeft, DollarSign, Trash2, Sparkles
} from 'lucide-react';

/** ===================== TYPES ===================== */
type Option = { id: number; name: string };
type CourseDetail = {
  id: number;
  title: string;
  slug?: string | null;
  description: string;
  price: string | number;
  language: number | null;
  topic: string;
  image?: string | null;
  category: number | null;
  status: 'draft' | 'published' | 'archived' | string;
  author?: { username?: string | null } | null;
};

/** ===================== SMALL UI ===================== */
function Surface({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={[
        // градієнтна рамка
        'p-[1px] rounded-[28px] bg-gradient-to-br from-blue-500/20 via-fuchsia-500/10 to-emerald-500/20',
        className,
      ].join(' ')}
    >
      <div
        className={[
          'rounded-[26px] bg-white/85 backdrop-blur-md',
          'ring-1 ring-white/70',
          'shadow-[0_16px_64px_rgba(2,28,78,0.14)] hover:shadow-[0_28px_100px_rgba(2,28,78,0.18)]',
          'transition-all duration-300',
        ].join(' ')}
      >
        {children}
      </div>
    </motion.div>
  );
}

function Button({
  children, className = '', onClick, disabled, variant = 'plain', href, size = 'md', type,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant?: 'plain' | 'primary' | 'danger' | 'soft' | 'ghost';
  href?: string;
  size?: 'sm' | 'md';
  type?: 'button' | 'submit' | 'reset';
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 active:scale-[0.98]';
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };
  const variants: Record<string, string> = {
    plain: 'bg-white ring-1 ring-slate-200 hover:bg-slate-50 active:bg-slate-100 shadow-sm',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-lg shadow-blue-600/25',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-lg shadow-rose-600/25',
    soft: 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 shadow-sm',
    ghost: 'bg-transparent hover:bg-white/70 ring-1 ring-transparent hover:ring-slate-200',
  };
  const cls = [base, sizes[size], variants[variant], className].join(' ');
  if (href) return <Link href={href} className={cls} aria-disabled={disabled} onClick={(e) => disabled && e.preventDefault()}>{children}</Link>;
  return <button className={cls} onClick={onClick} disabled={disabled} type={type || 'button'}>{children}</button>;
}

function Field({
  label, children, icon, hint, required,
}: { label: string; children: React.ReactNode; icon?: React.ReactNode; hint?: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-slate-900">
        {icon ? <span className="text-slate-500">{icon}</span> : null}
        <label className="text-sm font-semibold">{label}{required ? ' *' : ''}</label>
      </div>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function InputBase({
  value, onChange, placeholder, type = 'text', leftIcon, onBlur,
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  leftIcon?: React.ReactNode;
  onBlur?: () => void;
}) {
  return (
    <label className="group relative block">
      {leftIcon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{leftIcon}</span>}
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        onBlur={onBlur}
        className={[
          'w-full rounded-2xl bg-white/90 ring-1 ring-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-400/70',
          'shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_6px_18px_rgba(2,28,78,0.08)]',
          leftIcon ? 'pl-9' : '',
          'transition-all',
        ].join(' ')}
      />
    </label>
  );
}

function Textarea({
  value, onChange, placeholder, rows = 10,
}: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={[
        'w-full rounded-2xl bg-white/90 ring-1 ring-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400',
        'focus:outline-none focus:ring-2 focus:ring-blue-400/70',
        'shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_6px_18px_rgba(2,28,78,0.08)]',
        'transition-all',
      ].join(' ')}
    />
  );
}

function Select({
  value, onChange, options, placeholder,
}: { value: number | null; onChange: (v: number | null) => void; options: Option[]; placeholder?: string; }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className={[
        'w-full rounded-2xl bg-white/90 ring-1 ring-slate-200 px-3 py-2 text-sm text-slate-900',
        'focus:outline-none focus:ring-2 focus:ring-blue-400/70',
        'shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_6px_18px_rgba(2,28,78,0.08)]',
        'transition-all',
      ].join(' ')}
    >
      <option value="">{placeholder || '— Не вибрано —'}</option>
      {options.map((o) => <option value={o.id} key={o.id}>{o.name}</option>)}
    </select>
  );
}

function StatusSegment({ value, onChange }: { value: CourseDetail['status']; onChange: (s: CourseDetail['status']) => void; }) {
  const opts: { v: CourseDetail['status']; label: string }[] = [
    { v: 'draft', label: 'Чернетка' },
    { v: 'published', label: 'Опубліковано' },
    { v: 'archived', label: 'Архів' },
  ];
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-100 p-1 ring-1 ring-slate-200 shadow-inner">
      {opts.map(o => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={[
            'px-3 py-1.5 text-sm rounded-xl transition-all',
            value === o.v ? 'bg-white shadow ring-1 ring-slate-200 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60',
          ].join(' ')}
          aria-pressed={value === o.v}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toast({ show, tone = 'ok', children }: { show: boolean; tone?: 'ok' | 'warn' | 'err'; children: React.ReactNode }) {
  const toneCls = tone === 'ok' ? 'bg-emerald-600' : tone === 'warn' ? 'bg-amber-600' : 'bg-rose-600';
  return (
    <div className={['fixed right-4 top-4 z-50 transform transition-all duration-300',
      show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'].join(' ')}>
      <div className={`text-white text-sm px-4 py-2 rounded-xl shadow-lg ${toneCls}`}>{children}</div>
    </div>
  );
}

/** ===================== PAGE ===================== */
export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const courseId = Number(params?.id);

  const { isAuthenticated, user, accessToken } = useAuth() as {
    isAuthenticated: boolean;
    accessToken: string | null;
    user?: { username?: string; is_superuser?: boolean } | null;
  };

  // прокинути токен у axios-інстанс
  useEffect(() => {
    const token = accessToken || (typeof window !== 'undefined' ? (localStorage.getItem('access') || sessionStorage.getItem('access')) : null);
    setAuthHeader(token);
  }, [accessToken]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [categories, setCategories] = useState<Option[]>([]);
  const [languages, setLanguages] = useState<Option[]>([]);

  // form
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('0.00');
  const [status, setStatus] = useState<CourseDetail['status']>('draft');
  const [category, setCategory] = useState<number | null>(null);
  const [language, setLanguage] = useState<number | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [savedToast, setSavedToast] = useState(false);
  const [deletedToast, setDeletedToast] = useState(false);
  const [toastErr, setToastErr] = useState(false);

  const notLoggedIn = !isAuthenticated || !accessToken;
  const notAdmin = !!user && !user.is_superuser;

  // dictionaries + course
  useEffect(() => {
    let abort = false;
    async function loadAll() {
      if (!courseId) { setError('Некоректний ID курсу'); setLoading(false); return; }
      setLoading(true); setError(null);
      try {
        const [cats, langs] = await Promise.all([
          http.get('/courses/categories/').then(r => r.data).catch(() => []),
          http.get('/courses/languages/').then(r => r.data).catch(() => []),
        ]);
        if (!abort) {
          const cList = Array.isArray(cats) ? cats : (cats?.results || []);
          const lList = Array.isArray(langs) ? langs : (langs?.results || []);
          setCategories(cList.map((c: any) => ({ id: c.id, name: c.name })));
          setLanguages(lList.map((l: any) => ({ id: l.id, name: l.name })));
        }
        const data: CourseDetail = (await http.get(`/courses/${courseId}/`, { headers: { Accept: 'application/json' } })).data;
        if (abort) return;
        setCourse(data);
        setTitle(data.title || '');
        setTopic(data.topic || '');
        setDescription(data.description || '');
        setPrice(String(data.price ?? '0.00'));
        setStatus((data.status as any) || 'draft');
        setCategory((data.category as any) ?? null);
        setLanguage((data.language as any) ?? null);
        setImageUrl(data.image || null);
      } catch (e: any) {
        if (!abort) setError(e?.response?.data?.detail || e?.message || 'Помилка завантаження');
      } finally {
        if (!abort) setLoading(false);
      }
    }
    loadAll();
    return () => { abort = true; };
  }, [courseId]);

  /** ------- drag & drop image ------- */
  function onPickImage() { fileInputRef.current?.click(); }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImageUrl(URL.createObjectURL(f));
  }
  function removeImage() { setImageFile(null); setImageUrl(null); }
  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) {
      setImageFile(f);
      setImageUrl(URL.createObjectURL(f));
    }
  }

  /** ------- save (PATCH) + redirect ------- */
  async function onSave(e?: React.MouseEvent<HTMLButtonElement>) {
    e?.preventDefault();
    if (!courseId) return;
    setSaving(true); setError(null);
    try {
      if (imageFile) {
        const fd = new FormData();
        fd.append('title', title || '');
        fd.append('topic', topic || '');
        fd.append('description', description || '');
        fd.append('price', String(price || '0'));
        if (status) fd.append('status', status);
        if (category !== null) fd.append('category', String(category));
        if (language !== null) fd.append('language', String(language));
        fd.append('image', imageFile);
        await http.patch(`/courses/${courseId}/`, fd, { headers: { 'Content-Type': 'multipart/form-data', Accept: 'application/json' } });
      } else {
        const payload: any = { title, topic, description, price: String(price || '0'), status, category, language };
        if (!imageUrl) payload.image = null; // прибрали обкладинку
        await http.patch(`/courses/${courseId}/`, payload, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
      }
      // миттєвий перехід після збереження
      router.push('/admin/courses');
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Помилка збереження');
      setToastErr(true);
      setTimeout(() => setToastErr(false), 2200);
    } finally {
      setSaving(false);
    }
  }

  /** ------- delete ------- */
  async function onDelete() {
    if (!courseId) return;
    if (!confirm('Видалити курс? Цю дію не можна скасувати.')) return;
    setDeleting(true); setError(null);
    try {
      const res = await http.delete(`/courses/${courseId}/`);
      if (!(res.status === 200 || res.status === 204)) throw new Error('Delete failed');
      router.push('/admin/courses');
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Помилка видалення');
      setToastErr(true);
      setTimeout(() => setToastErr(false), 2200);
    } finally {
      setDeleting(false);
    }
  }

  /** ------- hotkeys: Ctrl/Cmd+S ------- */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [title, topic, description, price, status, category, language, imageFile, imageUrl]);

  /** ------- helpers ------- */
  const categoryName = useMemo(() => categories.find(c => c.id === category)?.name || 'Без категорії', [categories, category]);
  const languageName = useMemo(() => languages.find(l => l.id === language)?.name || '—', [languages, language]);

  /** ------- guards ------- */
  if (!courseId) {
    return (
      <main className="min-h-screen grid place-items-center">
        <Surface className="w-[600px] max-w-[95vw]">
          <div className="p-8 text-rose-600">Невірний маршрут: відсутній ID курсу.</div>
        </Surface>
      </main>
    );
  }
  if (!isAuthenticated || !accessToken) {
    return (
      <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-center bg-no-repeat">
        <div className="mx-auto grid min-h-screen max-w-2xl place-items-center p-6">
          <Surface><div className="p-8 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100">
              <AlignLeft className="h-6 w-6 text-slate-600" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Потрібен вхід</h1>
            <p className="mt-1 text-sm text-slate-600">Увійдіть, щоб редагувати курс.</p>
            <div className="mt-6"><Button href="/login" variant="primary">Увійти</Button></div>
          </div></Surface>
        </div>
      </main>
    );
  }
  if (notAdmin) {
    return (
      <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-center bg-no-repeat">
        <div className="mx-auto grid min-h-screen max-w-2xl place-items-center p-6">
          <Surface><div className="p-8 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-amber-100">
              <AlignLeft className="h-6 w-6 text-amber-900" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Доступ обмежено</h1>
            <p className="mt-1 text-sm text-slate-600">Редагування доступне лише адміністраторам.</p>
            <div className="mt-6"><Button href="/" variant="plain">На головну</Button></div>
          </div></Surface>
        </div>
      </main>
    );
  }

  /** ===================== UI ===================== */
  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-center bg-no-repeat">
      {/* Header — чиста картинка без кнопок справа */}
      <header className="sticky top-0 z-20 bg-transparent">
        <div className="mx-auto flex w-[1280px] max-w-[95vw] items-center justify-between gap-4 px-3 py-5">
          <div className="flex items-center gap-2 text-sm text-slate-800">
            <Link href="/admin" className="inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 hover:bg-white/70 ring-1 ring-transparent hover:ring-slate-200 transition">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <Link href="/admin/courses" className="hover:underline">Курси</Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">Редагування</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Sparkles className="h-4 w-4" /> Ctrl/Cmd + S — зберегти
          </div>
        </div>
      </header>

      <section className="mx-auto w-[1280px] max-w-[95vw] px-3 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ===== Left: форма ===== */}
          <Surface className="lg:col-span-2">
            <div className="p-6 sm:p-10">
              {loading ? (
                <div className="grid place-items-center py-16 text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="mt-2 text-sm">Завантажуємо курс…</p>
                </div>
              ) : course ? (
                <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
                  <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#0F2E64]">Редагування курсу</h1>
                    <p className="text-sm text-slate-600 mt-1">ID: {course.id}{course.slug ? ` • slug: ${course.slug}` : ''}</p>
                  </div>

                  <Field label="Назва курсу" icon={<BookOpen className="h-4 w-4" />} required>
                    <InputBase value={title} onChange={setTitle} placeholder="Напр. 'React з нуля до Pro'" />
                  </Field>

                  <Field label="Короткий опис" icon={<AlignLeft className="h-4 w-4" />} hint="Опишіть, що отримає студент після проходження курсу.">
                    <Textarea value={description} onChange={setDescription} placeholder="Про що курс, для кого, які результати…" />
                  </Field>

                  <Field label="Тема / теги" icon={<Tag className="h-4 w-4" />} hint="2–4 ключові теги.">
                    <InputBase value={topic} onChange={setTopic} placeholder="Напр. 'frontend, react, hooks'" />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Field label="Категорія">
                      <Select value={category} onChange={setCategory} options={categories} placeholder="Оберіть категорію" />
                    </Field>
                    <Field label="Мова" icon={<Languages className="h-4 w-4" />}>
                      <Select value={language} onChange={setLanguage} options={languages} placeholder="Оберіть мову" />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Field label="Статус">
                      <StatusSegment value={status} onChange={setStatus} />
                    </Field>
                    <Field label="Ціна (UAH)">
                      <InputBase
                        value={price}
                        onChange={(v) => setPrice(v.replace(/[^0-9.]/g, ''))}
                        onBlur={() => {
                          const n = parseFloat(price || '0');
                          if (!isNaN(n)) setPrice(n.toFixed(2));
                        }}
                        placeholder="0.00"
                        leftIcon={<DollarSign className="h-4 w-4" />}
                      />
                    </Field>
                  </div>

                  <Field label="Обкладинка курсу">
                    <div
                      className="rounded-2xl ring-1 ring-slate-200 bg-white/90 p-3 shadow-[0_6px_18px_rgba(2,28,78,0.08)]"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={onDrop}
                    >
                      {imageUrl ? (
                        <div className="relative overflow-hidden rounded-xl group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imageUrl} alt="Course" className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <Button size="sm" variant="soft" onClick={onPickImage}><ImagePlus className="h-4 w-4" /> Змінити</Button>
                            <Button size="sm" variant="danger" onClick={removeImage}><X className="h-4 w-4" /> Прибрати</Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="grid place-items-center h-52 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 hover:bg-slate-50 transition text-slate-500 cursor-pointer"
                          onClick={onPickImage}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <ImagePlus className="h-6 w-6" />
                            <span className="text-sm">Drag & drop або натисніть, щоб обрати зображення</span>
                          </div>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                    </div>
                  </Field>

                  {/* Bottom actions */}
                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> Збереження: Ctrl/Cmd + S
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="danger" onClick={onDelete} disabled={deleting}>
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Видалити курс
                      </Button>
                      <Button variant="primary" onClick={onSave} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Зберегти зміни
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="text-rose-600 text-sm">Курс не знайдено.</div>
              )}
              {error ? <div className="mt-6 text-rose-600 text-sm">{error}</div> : null}
            </div>
          </Surface>

          {/* ===== Right: живий прев'ю-кард + Danger zone ===== */}
          <div className="space-y-8">
            {/* Live Preview */}
            <Surface>
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#0F2E64]">Прев’ю курсу</h2>
                  <span className="text-xs rounded-full px-2 py-0.5 bg-slate-100 text-slate-700">Live</span>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/90 shadow-[0_6px_18px_rgba(2,28,78,0.08)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl || '/images/placeholder-course.jpg'}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/placeholder-course.jpg'; }}
                    alt=""
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold px-2 py-0.5 rounded-full
                        bg-slate-100 text-slate-800">
                        {status === 'published' ? 'Опубліковано' : status === 'archived' ? 'Архів' : 'Чернетка'}
                      </div>
                      <div className="text-sm font-semibold text-emerald-700">{Number(price || 0).toFixed(2)} ₴</div>
                    </div>
                    <div className="mt-2 font-semibold text-slate-900 truncate">{title || 'Без назви'}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      {categoryName} • {languageName}
                    </div>
                    <p className="mt-2 text-sm text-slate-700 line-clamp-3">{description || 'Опис курсу з’явиться тут.'}</p>
                  </div>
                </div>
              </div>
            </Surface>

            {/* Danger Zone */}
            <Surface>
              <div className="p-6 sm:p-8">
                <h3 className="text-lg font-bold text-rose-700">Небезпечна зона</h3>
                <p className="text-sm text-slate-600 mt-1">Видалення безповоротне. Переконайтесь, що ви цього хочете.</p>
                <div className="mt-4">
                  <Button variant="danger" onClick={onDelete} disabled={deleting}>
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Видалити курс
                  </Button>
                </div>
              </div>
            </Surface>
          </div>
        </div>
      </section>

      {/* Footer — чистий фон */}
      <footer className="py-10">
        <div className="mx-auto w-[1280px] max-w-[95vw] px-3 text-xs text-slate-600">© BrainBoost Admin</div>
      </footer>

      {/* Toasters */}
      <Toast show={savedToast} tone="ok">Збережено ✅</Toast>
      <Toast show={deletedToast} tone="warn">Курс видалено</Toast>
      <Toast show={toastErr} tone="err">Сталася помилка</Toast>
    </main>
  );
}
