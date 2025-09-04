// src/app/me/purchases/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, RefreshCw, CreditCard, Calendar, ExternalLink, Copy } from 'lucide-react';
import http from '@/lib/http';

const PURCHASED_URL = '/courses/me/purchased/';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

type Course = { id: number; title: string; slug?: string; image?: string; price?: number | string };
type PurchaseRaw =
  | { id: number | string; course: Course | number; amount?: number | string; currency?: string; status?: string; created_at?: string; payment_method?: string; order_id?: string | number }
  | Course;
type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] };
type PurchaseUI = { id: string; course: Course; status?: string; createdAt?: string; amount?: number; currency?: string; paymentMethod?: string; orderId?: string };

const isAbs = (u?: string) => !!u && (/^https?:\/\//i.test(u) || u.startsWith('data:') || u.startsWith('blob:'));
const murl = (u?: string) => (!u ? '' : isAbs(u) ? u : `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`);
const getData = <T,>(resp): T => (resp && ('data' in resp ? resp.data : resp)) as T;
const safeGetArray = <T,>(raw): T[] => (Array.isArray(raw) ? raw : raw?.results ?? []) as T[];
const toNumber = (n): number | undefined => (Number.isFinite(+n) ? +n : undefined);

function normalizeOne(p: PurchaseRaw): PurchaseUI | null {
  if ('title' in p && 'id' in p) {
    const c = p as Course;
    return { id: String(c.id), course: c, status: 'completed', amount: toNumber((c as unknown).price) };
  }
  const r = p;
  const c: Course | null =
    typeof r.course === 'object'
      ? r.course
      : typeof r.course === 'number'
      ? { id: r.course, title: `Курс #${r.course}` }
      : null;
  if (!c) return null;
  return {
    id: String(r.id ?? c.id),
    course: { id: c.id, title: c.title, slug: c.slug, image: c.image, price: toNumber(c.price) ?? undefined },
    status: r.status || undefined,
    createdAt: r.created_at || undefined,
    amount: toNumber(r.amount) ?? toNumber(c.price) ?? undefined,
    currency: r.currency || undefined,
    paymentMethod: r.payment_method || undefined,
    orderId: r.order_id != null ? String(r.order_id) : undefined,
  };
}

function formatMoney(amount?: number, currency?: string) {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount}${currency ? ' ' + currency : ''}`;
  }
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white/70 backdrop-blur-md ring-1 ring-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.05)] ${className}`}>{children}</div>;
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
  React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'ghost' | 'danger' | 'soft'; size?: 'md' | 'sm'; className?: string }
) {
  const tones: Record<string, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-200',
    soft: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:ring-indigo-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-200',
    ghost: 'bg-transparent text-indigo-700 hover:bg-indigo-50 focus:ring-indigo-100',
  };
  const sizes: Record<string, string> = { md: 'px-4 py-2 text-[15px]', sm: 'px-3 py-1.5 text-sm' };
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

export default function PurchasesPage() {
  const router = useRouter();

  const [items, setItems] = useState<PurchaseUI[]>([]);
  const [count, setCount] = useState(0);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(PURCHASED_URL);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'completed' | 'pending' | 'failed' | 'refunded'>('all');

  const filtered = useMemo(() => {
    let list = [...items];
    if (status !== 'all') list = list.filter((x) => (x.status || 'completed').toLowerCase().includes(status));
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (x) =>
          x.course.title.toLowerCase().includes(s) ||
          (x.course.slug || '').toLowerCase().includes(s) ||
          (x.orderId || '').toLowerCase().includes(s)
      );
    }
    return list;
  }, [items, q, status]);

  async function load(url: string = PURCHASED_URL) {
    setLoading(true);
    setErr(null);
    try {
      const resp = await http.get(url);
      const data = getData<Paginated<PurchaseRaw> | PurchaseRaw[]>(resp);
      if (Array.isArray(data)) {
        const arr = data.map(normalizeOne).filter(Boolean) as PurchaseUI[];
        setItems(arr); setCount(arr.length); setNextUrl(null); setPrevUrl(null);
      } else {
        const arr = safeGetArray<PurchaseRaw>(data).map(normalizeOne).filter(Boolean) as PurchaseUI[];
        setItems(arr); setCount((data as unknown).count ?? arr.length);
        setNextUrl((data as unknown).next ?? null); setPrevUrl((data as unknown).previous ?? null);
      }
      setCurrentUrl(url);
    } catch (e) {
      const msg = e?.response?.status === 401 ? 'Щоб переглянути історію, увійдіть до акаунту.' : e?.message || 'Не вдалося завантажити покупки';
      setErr(msg); setItems([]); setCount(0); setNextUrl(null); setPrevUrl(null);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(PURCHASED_URL); /* eslint-disable-line */ }, []);

  return (
    // ← фикс. ширина 1000px (и max-w-full для маленьких экранов)
    <div className="mx-auto w-[1000px] max-w-full px-5 py-8 space-y-6 text-[15px]">
      {/* хедер как был */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-sky-50 ring-1 ring-slate-200/60 p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button tone="soft" onClick={() => router.back()} className="!px-3">
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Назад</span>
              </Button>
              <div>
                <h1 className="text-[22px] md:text-[26px] font-semibold text-slate-800">Історія покупок</h1>
                <p className="text-slate-500 mt-1 text-[15px]">Тут зібрані всі придбані курси вашого акаунта.</p>
              </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2">
              <TextInput
                leftIcon={<Search className="h-5 w-5" />}
                placeholder="Пошук за курсом або ID замовлення…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ width: 320 }}
              />
              <Button type="button" tone="ghost" onClick={() => load(currentUrl)}>
                <RefreshCw className="h-4 w-4" /> Оновити
              </Button>
            </form>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as unknown)}
              className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 outline-none focus:ring-4 focus:ring-indigo-100"
            >
              <option value="all">Усі статуси</option>
              <option value="completed">Оплачено</option>
              <option value="pending">Очікує</option>
              <option value="failed">Помилка</option>
              <option value="refunded">Повернено</option>
            </select>
            <div className="text-slate-500 text-sm ml-auto">
              Усього: <span className="text-slate-800 font-medium">{count}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* таблица */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-0 overflow-hidden">
          {err && <div className="px-5 md:px-6 py-4 bg-red-50 text-red-700 ring-1 ring-red-200 text-center">{err}</div>}

          <div className="overflow-x-auto">
            {/* text-center для всей таблицы */}
            <table className="w-full table-auto text-[15px] text-center">
              <thead className="bg-slate-50/80 text-slate-600">
                <tr>
                  <th className="py-3 px-5 w-[72px]">№</th>
                  <th className="py-3 px-5">Курс</th>
                  <th className="py-3 px-5 w-[140px]">Сума</th>
                  <th className="py-3 px-5 w-[140px]">Статус</th>
                  <th className="py-3 px-5 w-[180px]">Дата</th>
                  <th className="py-3 px-5 w-[180px]">Дії</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-3 px-5 align-middle"><div className="h-4 w-10 bg-slate-200 rounded mx-auto animate-pulse" /></td>
                      <td className="py-3 px-5 align-middle">
                        <div className="flex items-center justify-center gap-3">
                          <div className="h-12 w-20 bg-slate-200 rounded-md animate-pulse" />
                          <div className="h-4 w-44 bg-slate-200 rounded" />
                        </div>
                      </td>
                      <td className="py-3 px-5 align-middle"><div className="h-4 w-16 bg-slate-200 rounded mx-auto animate-pulse" /></td>
                      <td className="py-3 px-5 align-middle"><div className="h-4 w-24 bg-slate-200 rounded mx-auto animate-pulse" /></td>
                      <td className="py-3 px-5 align-middle"><div className="h-4 w-28 bg-slate-200 rounded mx-auto animate-pulse" /></td>
                      <td className="py-3 px-5 align-middle"><div className="h-8 w-40 bg-slate-200 rounded-xl mx-auto animate-pulse" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-slate-500">Поки що немає покупок.</td></tr>
                ) : (
                  filtered.map((p, idx) => {
                    const img = p.course.image ? murl(p.course.image) : '';
                    const courseHref = `/courses/${p.course.slug || p.course.id}`;
                    return (
                      <tr key={`${p.id}-${idx}`} className={`border-t border-slate-100 ${idx % 2 ? 'bg-white' : 'bg-slate-50/30'}`}>
                        <td className="py-3 px-5 align-middle">{idx + 1}</td>
                        <td className="py-3 px-5 align-middle">
                          <div className="flex items-center justify-center gap-3">
                            <div className="h-12 w-20 rounded-md ring-1 ring-slate-200 overflow-hidden bg-white">
                              {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-slate-400 text-xs">no image</div>}
                            </div>
                            <div className="min-w-0">
                              <Link href={courseHref} className="text-slate-800 font-medium hover:underline">
                                {p.course.title}
                              </Link>
                              <div className="text-xs text-slate-500 mt-1 space-x-2">
                                {p.orderId && (
                                  <span className="inline-flex items-center gap-1">
                                    ID: <code className="bg-slate-100 px-1 rounded">{p.orderId}</code>
                                    <button onClick={() => navigator.clipboard?.writeText(p.orderId!)} className="text-indigo-700 hover:underline">
                                      <Copy className="h-3.5 w-3.5 inline" /> копіювати
                                    </button>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-5 align-middle">
                          <div className="inline-flex items-center justify-center gap-1">
                            <CreditCard className="h-4 w-4 text-indigo-600" />
                            {formatMoney(p.amount, p.currency)}
                          </div>
                        </td>
                        <td className="py-3 px-5 align-middle">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1
                            ${
                              (p.status || 'completed').toLowerCase().includes('pend')
                                ? 'bg-amber-50 text-amber-700 ring-amber-200'
                                : (p.status || 'completed').toLowerCase().includes('fail') ||
                                  (p.status || 'completed').toLowerCase().includes('refund')
                                ? 'bg-rose-50 text-rose-700 ring-rose-200'
                                : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                            }`}
                          >
                            {(p.status || 'completed').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-5 align-middle">
                          <div className="inline-flex items-center justify-center gap-1 text-slate-700">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            {p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}
                          </div>
                        </td>
                        <td className="py-3 px-5 align-middle">
                          <div className="flex flex-nowrap gap-2 justify-center items-center whitespace-nowrap">
                            <Link href={courseHref} className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                              Перейти <ExternalLink className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* пагинация */}
          <div className="flex items-center justify-center gap-2 px-5 md:px-6 py-4 border-t border-slate-100">
            <Button tone="ghost" size="sm" onClick={() => prevUrl && load(prevUrl)} disabled={!prevUrl || loading}>← Назад</Button>
            <Button tone="ghost" size="sm" onClick={() => nextUrl && load(nextUrl)} disabled={!nextUrl || loading}>Далі →</Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
