'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://brainboost.pp.ua/api';
const CHATS_URL = `${API_BASE}/api/chat/chats/`;

type MiniTheory = {
  id: number;
  title: string;
  lesson_id?: number | null;
  lesson_title?: string | null;
};

type ChatPreview = {
  id: number;
  title?: string | null;
  theory?: MiniTheory | null;
  student: number;
  teacher: number;
  last_message?: {
    id: number;
    sender: number;
    text: string;
    created_at: string;
    is_deleted: boolean;
  } | null;
  last_message_preview?: {
    id: number;
    sender: number;
    text: string;
    created_at: string;
    is_deleted: boolean;
  } | null;
  unread_count: number;
  updated_at: string;
};

function timeAgo(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'щойно';
  if (diff < 3600) return `${Math.floor(diff / 60)} хв`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} год`;
  return d.toLocaleDateString();
}

export default function TeacherChatsPage() {
  const { isAuthenticated, accessToken, user } = useAuth() as {
    isAuthenticated: boolean;
    accessToken: string | null;
    user?: { id?: number; username?: string; is_teacher?: boolean; is_superuser?: boolean } | null;
  };

  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [q, setQ] = useState('');

  const headers: HeadersInit = useMemo(
    () => (accessToken ? ({ Authorization: `Bearer ${accessToken}` } as Record<string, string>) : {}),
    [accessToken],
    );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isAuthenticated || !accessToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const r = await fetch(CHATS_URL, { headers, cache: 'no-store' });
        const data = r.ok ? ((await r.json()) as any) : [];
        const arr: ChatPreview[] = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
        if (!cancelled) setChats(arr);
      } catch {
        if (!cancelled) setChats([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, accessToken, headers]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return chats;
    return chats.filter((c) => {
      const t = c.title || '';
      const th = c.theory?.title || '';
      const lt = c.theory?.lesson_title || '';
      const last = c.last_message_preview?.text || '';
      return [t, th, lt, last].some((x) => x?.toLowerCase().includes(s));
    });
  }, [q, chats]);

  if (!isAuthenticated || !accessToken) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 max-w-md text-center">
          <h1 className="text-xl font-bold">Потрібен вхід</h1>
          <p className="text-slate-600 mt-1">Авторизуйтесь, щоб побачити чати.</p>
          <Link href="/login" className="inline-flex mt-3 px-4 py-2 rounded-xl bg-[#1345DE] text-white">Увійти</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-screen-2xl grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-0 h-screen">
        {/* Sidebar */}
        <aside className="border-r bg-white flex flex-col">
          <div className="p-4 border-b">
            <div className="text-lg font-bold">Мої чати</div>
            <div className="mt-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Пошук по чатах…"
                className="w-full rounded-xl border p-2"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="p-4 text-slate-500">Завантаження…</div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="p-4 text-slate-500">Немає чатів</div>
            )}

            <ul className="divide-y">
              {filtered.map((c) => {
                const preview = c.last_message_preview?.text || 'Без повідомлень';
                const when = c.last_message_preview?.created_at || c.updated_at;
                const unread = c.unread_count > 0;
                const subtitle =
                  c.theory?.title ||
                  c.title ||
                  (c.theory?.lesson_title ? `Урок: ${c.theory.lesson_title}` : 'Чат');
                return (
                  <li key={c.id} className="hover:bg-slate-50">
                    <Link href={`/teacher/chats/${c.id}`} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 grid place-items-center text-indigo-700 font-bold">
                        {subtitle.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold truncate">{subtitle}</div>
                          <div className="text-xs text-slate-500 shrink-0">{timeAgo(when)}</div>
                        </div>
                        <div className="text-sm text-slate-600 truncate">{preview}</div>
                      </div>
                      {unread && (
                        <span className="ml-2 shrink-0 inline-flex items-center justify-center px-2 min-w-6 h-6 rounded-full bg-[#1345DE] text-white text-xs">
                          {c.unread_count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Right pane (placeholder) */}
        <section className="hidden lg:flex items-center justify-center">
          <div className="text-center text-slate-500">
            <div className="text-2xl font-bold text-slate-700 mb-2">Виберіть чат</div>
            <div>Зліва — список чатів. Клацніть, щоб відкрити діалог.</div>
          </div>
        </section>
      </div>
    </main>
  );
}
