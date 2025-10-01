// src/app/me/purchases/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, RefreshCw, CreditCard, Calendar, ExternalLink, Copy } from 'lucide-react';
import http from '@/lib/http';
import { mediaUrl } from '@/lib/media';

const PURCHASED_URL = '/courses/me/purchased/';

type Course = { id: number; title: string; slug?: string; image?: string | null; price?: number | string };
type PurchaseRaw =
  | { id: number | string; course: Course | number; amount?: number | string; currency?: string; status?: string; created_at?: string; payment_method?: string; order_id?: string | number }
  | Course;
type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] };
type PurchaseUI = { id: string; course: Course; status?: string; createdAt?: string; amount?: number; currency?: string; paymentMethod?: string; orderId?: string };

const getData = <T,>(resp: any): T => (resp && ('data' in resp ? resp.data : resp)) as T;
const safeGetArray = <T,>(raw: any): T[] => (Array.isArray(raw) ? raw : raw?.results ?? []) as T[];
const toNumber = (n: any): number | undefined => (Number.isFinite(+n) ? +n : undefined);

function normalizeOne(p: PurchaseRaw): PurchaseUI | null {
  if ('title' in p && 'id' in p) {
    const c = p as Course;
    return { id: String(c.id), course: c, status: 'completed', amount: toNumber((c as any).price) };
  }
  const r: any = p;
  const c: Course | null =
    typeof r.course === 'object'
      ? r.course
      : typeof r.course === 'number'
      ? { id: r.course, title: `Курс #${r.course}` }
      : null;
  if (!c) return null;
  return {
    id: String(r.id ?? c.id),
    course: { id: c.id, title: c.title, slug: c.slug, image: c.image ?? null, price: toNumber(c.price) ?? undefined },
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

/* ----------------------- Мобільна картка для покупки ---------------------- */
function PurchaseCard({ p, index }: { p: PurchaseUI; index: number }) {
  const imgSrc = p.course.image ? mediaUrl(p.course.image) : '';
  const courseHref = `/courses/${p.course.slug || p.course.id}`;
  const badge =
    (p.status || 'completed').toLowerCase().includes('pend')
      ? 'bg-amber-50 text-amber-700 ring-amber-200'
      : (p.status || 'completed').toLowerCase().includes('fail') ||
        (p.status || 'completed').toLowerCase().includes('refund')
      ? 'bg-rose-50 text-rose-700 ring-rose-200'
      : 'bg-emerald-50 text-emerald-700 ring-emerald-200';

  return (
    <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-16 w-24 overflow-hidden rounded-md ring-1 ring-slate-200 bg-white shrink-0 relative">
          {imgSrc ? (
            <Image src={imgSrc} alt="" fill className="object-cover" sizes="96px" />
          ) : (
            <div className="grid h-full w-full place-items-center text-xs text-slate-400">no image</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-slate-500 text-xs">#{index + 1}</div>
          <Link href={courseHref} className="line-clamp-2 font-medium text-slate-800 hover:underline">
            {p.course.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badge}`}>
              {(p.status || 'completed').toUpperCase()}
            </span>
            {p.orderId && (
              <button
                onClick={() => navigator.clipboard?.writeText(p.orderId!)}
                className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:underline"
                aria-label="Скопіювати ID замовлення"
                title="Скопіювати ID"
              >
                ID: <code className="rounded bg-slate-100 px-1">{p.orderId}</code> <Copy className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
        <div className="inline-flex items-center gap-1.5">
          <CreditCard className="h-4 w-4 text-indigo-600" />
          {formatMoney(p.amount, p.currency)}
        </div>
        <div className="inline-flex items-center justify-end gap-1.5">
          <Calendar className="h-4 w-4 text-slate-500" />
          {p.createdAt ? new Date(p.createdAt).toLocaleString('uk-UA') : '—'}
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href={courseHref}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-100"
        >
          Перейти <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
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
          (x.orderId || '').toLowerCase().includes(s),
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
        setItems(arr);
        setCount(arr.length);
        setNextUrl(null);
        setPrevUrl(null);
      } else {
        const arr = safeGetArray<PurchaseRaw>(data).map(normalizeOne).filter(Boolean) as PurchaseUI[];
        setItems(arr);
        setCount((data as any).count ?? arr.length);
        setNextUrl((data as any).next ?? null);
        setPrevUrl((data as any).previous ?? null);
      }
      setCurrentUrl(url);
    } catch (e: any) {
      const msg =
        e?.response?.status === 401
          ? 'Щоб переглянути історію, увійдіть до акаунту.'
          : e?.message || 'Не вдалося завантажити покупки';
      setErr(msg);
      setItems([]);
      setCount(0);
      setNextUrl(null);
      setPrevUrl(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(PURCHASED_URL); // eslint-disable-line
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 py-8 space-y-6 text-[15px]">
      {/* Хедер */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-sky-50 ring-1 ring-slate-200/60 p-5 sm:p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Button tone="soft" onClick={() => router.back()} className="!px-3">
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Назад</span>
              </Button>
              <div>
                <h1 className="text-[20px] sm:text-[22px] md:text-[26px] font-semibold text-slate-800">
                  Історія покупок
                </h1>
                <p className="text-slate-500 mt-1 text-[14px] sm:text-[15px]">
                  Тут зібрані всі придбані курси вашого акаунта.
                </p>
              </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="flex w-full md:w-auto items-center gap-2">
              <TextInput
                leftIcon={<Search className="h-5 w-5" />}
                placeholder="Пошук за курсом або ID замовлення…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full md:w-[320px]"
                aria-label="Пошук покупок"
              />
              <Button type="button" tone="ghost" onClick={() => load(currentUrl)} aria-label="Оновити список">
                <RefreshCw className="h-4 w-4" /> <span className="hidden sm:inline">Оновити</span>
              </Button>
            </form>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 outline-none focus:ring-4 focus:ring-indigo-100"
              aria-label="Фільтр за статусом"
            >
              <option value="all">Усі статуси</option>
              <option value="completed">Оплачено</option>
              <option value="pending">Очікує</option>
              <option value="failed">Помилка</option>
              <option value="refunded">Повернено</option>
            </select>
            <div className="ml-auto text-sm text-slate-500">
              Усього: <span className="font-medium text-slate-800">{count}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Контент */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-0 overflow-hidden">
          {err && (
            <div className="px-4 sm:px-5 md:px-6 py-4 bg-red-50 text-red-700 ring-1 ring-red-200 text-center">
              {err}
            </div>
          )}

          {/* Мобільна версія — картки */}
          <div className="p-4 sm:p-5 md:hidden">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 animate-pulse space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-16 w-24 rounded-md bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 bg-slate-200 rounded" />
                        <div className="h-3 w-24 bg-slate-200 rounded" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-3 bg-slate-200 rounded" />
                      <div className="h-3 bg-slate-200 rounded" />
                    </div>
                    <div className="h-8 w-28 bg-slate-200 rounded-xl ml-auto" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-slate-500">Поки що немає покупок.</div>
            ) : (
              <div className="space-y-4">
                {filtered.map((p, idx) => (
                  <PurchaseCard key={`${p.id}-${idx}`} p={p} index={idx} />
                ))}
              </div>
            )}
          </div>

          {/* Десктопна таблиця */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full table-auto text-[15px]">
              <thead className="bg-slate-50/80 text-slate-600">
                <tr className="text-left">
                  <th className="py-3 px-5 w-[72px] text-center">№</th>
                  <th className="py-3 px-5">Курс</th>
                  <th className="py-3 px-5 w-[140px] text-center">Сума</th>
                  <th className="py-3 px-5 w-[140px] text-center">Статус</th>
                  <th className="py-3 px-5 w-[180px] text-center">Дата</th>
                  <th className="py-3 px-5 w-[180px] text-center">Дії</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-3 px-5 align-middle text-center">
                        <div className="h-4 w-10 bg-slate-200 rounded mx-auto animate-pulse" />
                      </td>
                      <td className="py-3 px-5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-20 bg-slate-200 rounded-md animate-pulse" />
                          <div className="h-4 w-44 bg-slate-200 rounded" />
                        </div>
                      </td>
                      <td className="py-3 px-5 align-middle text-center">
                        <div className="h-4 w-16 bg-slate-200 rounded mx-auto animate-pulse" />
                      </td>
                      <td className="py-3 px-5 align-middle text-center">
                        <div className="h-4 w-24 bg-slate-200 rounded mx-auto animate-pulse" />
                      </td>
                      <td className="py-3 px-5 align-middle text-center">
                        <div className="h-4 w-28 bg-slate-200 rounded mx-auto animate-pulse" />
                      </td>
                      <td className="py-3 px-5 align-middle text-center">
                        <div className="h-8 w-40 bg-slate-200 rounded-xl mx-auto animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      Поки що немає покупок.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, idx) => {
                    const imgSrc = p.course.image ? mediaUrl(p.course.image) : '';
                    const courseHref = `/courses/${p.course.slug || p.course.id}`;
                    const badgeClass =
                      (p.status || 'completed').toLowerCase().includes('pend')
                        ? 'bg-amber-50 text-amber-700 ring-amber-200'
                        : (p.status || 'completed').toLowerCase().includes('fail') ||
                          (p.status || 'completed').toLowerCase().includes('refund')
                        ? 'bg-rose-50 text-rose-700 ring-rose-200'
                        : 'bg-emerald-50 text-emerald-700 ring-emerald-200';
                    return (
                      <tr key={`${p.id}-${idx}`} className={`border-t border-slate-100 ${idx % 2 ? 'bg-white' : 'bg-slate-50/30'}`}>
                        <td className="py-3 px-5 align-middle text-center">{idx + 1}</td>
                        <td className="py-3 px-5 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-20 overflow-hidden rounded-md ring-1 ring-slate-200 bg-white relative">
                              {imgSrc ? (
                                <Image src={imgSrc} alt="" fill className="object-cover" sizes="80px" />
                              ) : (
                                <div className="grid h-full w-full place-items-center text-xs text-slate-400">no image</div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link href={courseHref} className="font-medium text-slate-800 hover:underline">
                                {p.course.title}
                              </Link>
                              <div className="mt-1 space-x-2 text-xs text-slate-500">
                                {p.orderId && (
                                  <span className="inline-flex items-center gap-1">
                                    ID: <code className="rounded bg-slate-100 px-1">{p.orderId}</code>
                                    <button
                                      onClick={() => navigator.clipboard?.writeText(p.orderId!)}
                                      className="text-indigo-700 hover:underline"
                                    >
                                      <Copy className="inline h-3.5 w-3.5" /> копіювати
                                    </button>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-5 align-middle text-center">
                          <div className="inline-flex items-center justify-center gap-1">
                            <CreditCard className="h-4 w-4 text-indigo-600" />
                            {formatMoney(p.amount, p.currency)}
                          </div>
                        </td>
                        <td className="py-3 px-5 align-middle text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badgeClass}`}>
                            {(p.status || 'completed').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-5 align-middle text-center">
                          <div className="inline-flex items-center justify-center gap-1 text-slate-700">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            {p.createdAt ? new Date(p.createdAt).toLocaleString('uk-UA') : '—'}
                          </div>
                        </td>
                        <td className="py-3 px-5 align-middle text-center">
                          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                            <Link
                              href={courseHref}
                              className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-100"
                            >
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

          {/* Пагінація */}
          <div className="flex items-center justify-center gap-2 border-t border-slate-100 px-4 sm:px-5 md:px-6 py-4">
            <Button tone="ghost" size="sm" onClick={() => prevUrl && load(prevUrl)} disabled={!prevUrl || loading}>
              ← Назад
            </Button>
            <Button tone="ghost" size="sm" onClick={() => nextUrl && load(nextUrl)} disabled={!nextUrl || loading}>
              Далі →
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
