'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';
const CHATS_URL = `${API_BASE}/api/chat/chats/`;

type MiniTheory = {
  id: number;
  title: string;
  lesson_id?: number | null;
  lesson_title?: string | null;
};

type LastPreview = {
  id: number;
  sender: number;
  text: string;
  created_at: string;
  is_deleted: boolean;
};

type ChatItem = {
  id: number;
  title?: string | null;
  theory?: MiniTheory | null;
  student: number;
  teacher: number;
  unread_count: number;
  updated_at: string;
  last_message?: number | null;
  last_message_preview?: LastPreview | null;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function isPaginated<T>(x: unknown): x is Paginated<T> {
  return !!x && typeof x === 'object' && Array.isArray((x as any).results);
}

// ---- fetch all pages safely (no implicit any) ----
async function collectAll<T>(firstUrl: string, headers?: HeadersInit): Promise<T[]> {
  const acc: T[] = [];
  let url: string | null = firstUrl;

  while (url) {
    const init: RequestInit = { headers, cache: 'no-store' };
    const r: Response = await fetch(url, init);
    if (!r.ok) break;

    const data: unknown = await r.json();

    if (Array.isArray(data)) {
      acc.push(...(data as T[]));
      break; // server returned plain array => stop
    }

    if (isPaginated<T>(data)) {
      acc.push(...(data as Paginated<T>).results);
      url = (data as Paginated<T>).next;
    } else {
      break; // unknown shape => stop to avoid loop
    }
  }

  return acc;
}

function fmtRel(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function titleOf(c: ChatItem) {
  return (
    c?.theory?.title ||
    c?.title ||
    (c?.theory?.lesson_title ? `Урок: ${c.theory.lesson_title}` : `Чат #${c.id}`)
  );
}

export default function StudentChatsListPage() {
  const { isAuthenticated, accessToken } = useAuth() as {
    isAuthenticated: boolean;
    accessToken: string | null;
  };

  const headers: HeadersInit = useMemo(
    () => (accessToken ? ({ Authorization: `Bearer ${accessToken}` } as Record<string, string>) : {}),
    [accessToken],
    );

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    let pollTimer: any = null;

    async function load() {
      if (!isAuthenticated || !accessToken) {
        setLoading(false);
        return;
      }
      setErr(null);
      setLoading(true);
      try {
        const all = await collectAll<ChatItem>(`${CHATS_URL}?ordering=-updated_at&page_size=200`, headers);
        if (!cancelled) {
          all.sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
          setItems(all);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Помилка завантаження.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function poll() {
      try {
        const all = await collectAll<ChatItem>(`${CHATS_URL}?ordering=-updated_at&page_size=200`, headers);
        all.sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
        setItems(all);
      } catch {
        /* ignore */
      }
    }

    load();
    pollTimer = setInterval(poll, 7000);
    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [isAuthenticated, accessToken, headers]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((c) => {
      const t = titleOf(c).toLowerCase();
      const prev = (c.last_message_preview?.text || '').toLowerCase();
      return t.includes(needle) || prev.includes(needle);
    });
  }, [q, items]);

  if (!isAuthenticated || !accessToken) {
    return (
      <main className="min-h-screen bg-slate-50 grid place-items-center p-6">
        <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-6 max-w-xl text-center">
          <h1 className="text-xl font-bold">Потрібен вхід</h1>
          <p className="text-slate-600 mt-2">Авторизуйтесь, щоб переглянути чати.</p>
          <div className="mt-3">
            <Link href="/login" className="px-4 py-2 rounded-xl bg-[#1345DE] text-white">Увійти</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-screen-md pt-20 px-4">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0F2E64]">Мої чати</h1>
          <Link href="/student" className="text-[#1345DE] hover:underline">Головна</Link>
        </header>

        <div className="bg-white rounded-2xl ring-1 ring-slate-200 p-3 mb-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Пошук чатів…"
            className="w-full px-3 py-2 rounded-xl border"
          />
        </div>

        {loading && <div className="text-slate-600">Завантаження…</div>}
        {err && <div className="text-red-600 bg-red-50 border border-red-200 rounded p-2">{err}</div>}

        <div className="bg-white rounded-2xl ring-1 ring-slate-200 divide-y">
          {filtered.length === 0 && !loading && !err && (
            <div className="p-4 text-slate-500">Чатів поки немає.</div>
          )}

          {filtered.map((c) => {
            const href = `/student/notifications/${c.id}`;
            const preview = c.last_message_preview?.text || '';
            const time = fmtRel(c.last_message_preview?.created_at || c.updated_at);
            return (
              <Link
                key={c.id}
                href={href}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition"
              >
                <div className="w-10 h-10 rounded-full bg-[#EEF3FF] grid place-items-center text-[#1345DE] font-bold">
                  {String(titleOf(c)).slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-[#0F2E64] truncate">{titleOf(c)}</div>
                    <div className="text-xs text-slate-500 shrink-0">{time}</div>
                  </div>
                  <div className="text-sm text-slate-600 truncate">{preview}</div>
                </div>
                {c.unread_count > 0 && (
                  <div className="ml-2 shrink-0 px-2 py-0.5 rounded-full bg-[#1345DE] text-white text-xs font-semibold">
                    {c.unread_count}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
