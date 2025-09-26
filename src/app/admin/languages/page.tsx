'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Plus, RefreshCw, Search, Save, X, Pencil, Trash2,
  ChevronLeft, ChevronRight, Languages as LanguagesIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://brainboost.pp.ua/api';
const ADMIN_LANG_LIST = `${API_BASE}/courses/admin/languages/`;
const ADMIN_LANG_DETAIL = (id: number) => `${API_BASE}/courses/admin/languages/${id}/`;

type Language = { id: number; name: string; courses_count?: number };
type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] };

// ---------- UI ----------
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/70 backdrop-blur-md ring-1 ring-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.05)] ${className}`}>
      {children}
    </div>
  );
}

function TextInput(
  { className = '', leftIcon, ...props }:
  React.InputHTMLAttributes<HTMLInputElement> & { leftIcon?: React.ReactNode }
) {
  return (
    <div className={`relative ${className}`}>
      {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{leftIcon}</div>}
      <input
        {...props}
        className={`w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 outline-none
                    focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-400 text-[15px]
                    ${leftIcon ? 'pl-10' : ''}`}
      />
    </div>
  );
}

function Button(
  { children, tone = 'primary', size = 'md', className = '', ...rest }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: 'primary' | 'ghost' | 'danger' | 'soft';
    size?: 'md' | 'sm';
    className?: string;
  }
) {
  const tones: Record<string, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-200',
    soft:    'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:ring-indigo-100',
    danger:  'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-200',
    ghost:   'bg-transparent text-indigo-700 hover:bg-indigo-50 focus:ring-indigo-100',
  };
  const sizes: Record<string, string> = {
    md: 'px-4 py-2 text-[15px]',
    sm: 'px-3 py-1.5 text-sm',
  };
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-2 rounded-xl transition
                  focus:outline-none focus:ring-4 disabled:opacity-50 disabled:pointer-events-none
                  ${tones[tone]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

// ---------- Page ----------
export default function AdminLanguagesPage() {
  const router = useRouter();

  const [items, setItems] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [q, setQ] = useState('');
  const [createName, setCreateName] = useState('');
  const [edit, setEdit] = useState<{ id: number; name: string } | null>(null);

  const [count, setCount] = useState(0);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(ADMIN_LANG_LIST);

  const [confirm, setConfirm] = useState<{ id: number; name: string } | null>(null);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    return items.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  }, [items, q]);

  function buildUrl(base: string, search: string) {
    try {
      const url = new URL(base);
      if (search.trim()) url.searchParams.set('search', search.trim());
      else url.searchParams.delete('search');
      return url.toString();
    } catch {
      const delim = base.includes('?') ? '&' : '?';
      return search.trim() ? `${base}${delim}search=${encodeURIComponent(search.trim())}` : base;
    }
  }

  async function load(url = currentUrl) {
    setLoading(true);
    try {
      const res = await fetch(url);
      const data: Paginated<Language> = await res.json();
      setItems(data.results || []);
      setCount(data.count || 0);
      setNextUrl(data.next);
      setPrevUrl(data.previous);
      setCurrentUrl(url);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(buildUrl(ADMIN_LANG_LIST, q)); /* eslint-disable-line */ }, []);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    await load(buildUrl(ADMIN_LANG_LIST, q));
  }

  async function createLanguage() {
    if (!createName.trim()) return;
    setBusyId(-1);
    try {
      await fetch(ADMIN_LANG_LIST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim() }),
      });
      setCreateName('');
      await load(buildUrl(ADMIN_LANG_LIST, q));
    } finally {
      setBusyId(null);
    }
  }

  async function saveEdit() {
    if (!edit || !edit.name.trim()) return;
    setBusyId(edit.id);
    try {
      await fetch(ADMIN_LANG_DETAIL(edit.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: edit.name.trim() }),
      });
      setEdit(null);
      await load(currentUrl);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: number) {
    setBusyId(id);
    try {
      await fetch(ADMIN_LANG_DETAIL(id), { method: 'DELETE' });
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (items.length <= 1) await load(currentUrl);
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  }

  const Header = (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-gradient-to-br from-indigo-50 to-sky-50 ring-1 ring-slate-200/60 p-6 md:p-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        
        {/* Ліва частина: кнопка назад + заголовок */}
        <div className="flex items-center gap-3">
          <Button tone="soft" onClick={() => router.back()} className="!px-3">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Назад</span>
          </Button>
          <div>
            <h1 className="text-[22px] md:text-[26px] font-semibold text-slate-800">Мови</h1>
            <p className="text-slate-500 mt-1 text-[15px]">Список мов для курсів. Лаконічно й зручно.</p>
          </div>
        </div>

        {/* Права частина: форма пошуку */}
        <form
          onSubmit={onSearch}
          className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto mt-2 sm:mt-0"
        >
          <TextInput
            leftIcon={<Search className="h-5 w-5" />}
            placeholder="Пошук мов…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full sm:flex-1 min-w-0"
          />
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <Button type="submit" tone="soft" className="w-full sm:w-auto justify-center">
              <Search className="h-4 w-4" /> Шукати
            </Button>
            <Button
              type="button"
              tone="ghost"
              onClick={() => load(currentUrl)}
              className="w-full sm:w-auto justify-center"
            >
              <RefreshCw className="h-4 w-4" /> Оновити
            </Button>
          </div>
        </form>

      </div>
    </motion.div>
  );

  return (
    <div className="bg-[url('/images/back.png')] bg-cover bg-center min-h-screen">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8 py-8 space-y-6 text-[15px]">

        {Header}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row gap-3 md:items-end">
              <div className="flex-1">
                <label className="block text-sm text-slate-600 mb-1">Нова мова</label>
                <TextInput placeholder="Напр.: Українська" value={createName} onChange={(e) => setCreateName(e.target.value)} />
              </div>
              <Button onClick={createLanguage} disabled={!createName.trim() || busyId === -1}>
                <Plus className="h-5 w-5" /> Додати
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 md:px-6 py-4">
                        <div className="text-slate-600">Усього: <span className="font-medium text-slate-800">{count}</span></div>
                        <div className="flex gap-2">
                          <Button tone="ghost" size="sm" onClick={() => prevUrl && load(prevUrl)} disabled={!prevUrl || loading}>
                            <ChevronLeft className="h-4 w-4" /> Назад
                          </Button>
                          <Button tone="ghost" size="sm" onClick={() => nextUrl && load(nextUrl)} disabled={!nextUrl || loading}>
                            Вперед <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-[15px]">
                <thead className="bg-slate-50/80 text-slate-600">
                  <tr>
                    <th className="py-3 px-5 text-left min-w-[80px]">ID</th>
                    <th className="py-3 px-5 text-left min-w-[150px]">Назва</th>
                    <th className="py-3 px-5 text-left min-w-[100px]">Курсів</th>
                    <th className="py-3 px-5 text-left min-w-[120px]">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="py-10 text-center text-slate-500">Завантаження…</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={4} className="py-10 text-center text-slate-500">Нічого не знайдено</td></tr>
                  ) : (
                    filtered.map((c, i) => {
                      const isEditing = edit?.id === c.id;
                      return (
                        <tr key={c.id} className={`border-t border-slate-100 ${i % 2 ? 'bg-white' : 'bg-slate-50/30'}`}>
                          <td className="py-3 px-5 align-top">{c.id}</td>
                          <td className="py-3 px-5 align-top break-words">
                            {isEditing ? (
                              <TextInput value={edit!.name} onChange={(e) => setEdit({ id: c.id, name: e.target.value })} />
                            ) : (
                              <span className="font-medium text-slate-800">{c.name}</span>
                            )}
                          </td>
                          <td className="py-3 px-5 align-top">{c.courses_count ?? '—'}</td>
                          <td className="py-3 px-5 align-top">
                            {isEditing ? (
                              <div className="flex flex-nowrap gap-2 justify-end items-center whitespace-nowrap">
                                <Button size="sm" onClick={saveEdit} disabled={busyId === c.id}><Save className="h-4 w-4" /> Зберегти</Button>
                                <Button tone="ghost" size="sm" onClick={() => setEdit(null)} disabled={busyId === c.id}><X className="h-4 w-4" /> Скасувати</Button>
                              </div>
                            ) : (
                              <div className="flex flex-nowrap gap-2 justify-end items-center whitespace-nowrap">
                                <Button tone="soft" size="sm" onClick={() => setEdit({ id: c.id, name: c.name })}><Pencil className="h-4 w-4" /> Редагувати</Button>
                                <Button tone="danger" size="sm" onClick={() => setConfirm({ id: c.id, name: c.name })} disabled={busyId === c.id}>
                                  <Trash2 className="h-4 w-4" /> Видалити
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 md:px-6 py-4 border-t border-slate-100">
              <Button tone="ghost" size="sm" onClick={() => prevUrl && load(prevUrl)} disabled={!prevUrl || loading}>
                <ChevronLeft className="h-4 w-4" /> Назад
              </Button>
              <Button tone="ghost" size="sm" onClick={() => nextUrl && load(nextUrl)} disabled={!nextUrl || loading}>
                Вперед <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Confirm Modal */}
        {confirm && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 backdrop-blur-sm">
            <Card className="p-6 w-[95vw] max-w-md">
              <h3 className="text-[17px] font-semibold mb-2">Підтвердіть видалення</h3>
              <p className="text-slate-600 mb-5">Видалити мову <span className="font-medium text-slate-800">«{confirm.name}»</span>?</p>
              <div className="flex justify-end gap-2">
                <Button tone="ghost" size="sm" onClick={() => setConfirm(null)}><X className="h-4 w-4" /> Скасувати</Button>
                <Button tone="danger" size="sm" onClick={() => remove(confirm.id)}><Trash2 className="h-4 w-4" /> Видалити</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
