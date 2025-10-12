'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Search, MessageSquareText, Sparkles } from 'lucide-react';

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
  return d.toLocaleDateString('uk-UA');
}

export default function TeacherChatsPage() {
  const { isAuthenticated, accessToken, user } = useAuth() as {
    isAuthenticated: boolean;
    accessToken: string | null;
    user?: { id?: number } | null;
  };

  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [q, setQ] = useState('');

  const headers: HeadersInit = useMemo(
    () => (accessToken ? ({ Authorization: `Bearer ${accessToken}` } as Record<string, string>) : {}),
    [accessToken]
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
    return () => { cancelled = true; };
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
      <main className="min-h-screen grid place-items-center p-6 bg-[url('/images/back.png')] bg-cover bg-top">
        <div className="rounded-2xl bg-white/90 backdrop-blur ring-1 ring-[#E5ECFF] p-6 max-w-md text-center shadow-[0_18px_50px_rgba(2,28,78,0.12)]">
          <h1 className="text-2xl font-extrabold text-[#021C4E]">Потрібен вхід</h1>
          <p className="text-slate-600 mt-1">Авторизуйтесь, щоб побачити чати.</p>
          <Link href="/login" className="inline-flex mt-4 px-5 py-2 rounded-xl bg-[#1345DE] text-white font-semibold hover:brightness-110">
            Увійти
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      {/* м’яке підсвічування поверх фону */}
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(900px_500px_at_110%_20%,rgba(238,243,255,.9),transparent),radial-gradient(900px_500px_at_-10%_-10%,rgba(247,249,255,.9),transparent)]" />

      <div className="relative mx-auto max-w-screen-2xl grid grid-cols-1 lg:grid-cols-[420px_1fr] h-[100dvh]">
        {/* Sidebar */}
        <aside className="relative border-r border-[#E5ECFF]/70 bg-white/70 backdrop-blur-xl flex flex-col">
          {/* Top brand + search */}
          <div className="px-5 pt-5 pb-3 border-b border-[#E5ECFF]/70">
            <div className="flex items-center justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  {/* Ліва частина: іконка + заголовки */}
  <div className="flex items-center gap-3 sm:min-w-0 sm:flex-1">
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 grid place-items-center text-white shadow-md">
      <MessageSquareText className="w-5 h-5" />
    </div>
    <div className="min-w-0 text-center sm:text-left">
      <div className="text-xs text-slate-600">Панель викладача</div>
      <div className="text-lg font-extrabold text-[#021C4E] leading-tight truncate">Мої чати</div>
    </div>
  </div>

  {/* Права частина: бейдж + кнопка */}
  <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 sm:gap-3 sm:shrink-0">

    <Link
      href="/teacher"
      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-semibold shadow-[0_10px_24px_rgba(2,28,78,0.20)] ring-1 ring-indigo-500/30 hover:brightness-110 active:translate-y-[1px] transition w-full sm:w-auto"
      title="До панелі викладача"
      aria-label="Перейти на головну сторінку викладача"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 13h8V3H3v10Zm10 8h8v-6h-8v6ZM3 21h8v-6H3v6Zm10-8h8V3h-8v10Z" />
      </svg>
      <span className="hidden sm:inline">Головна викладача</span>
      <span className="sm:hidden">Головна</span>
    </Link>
  </div>
</div>

            </div>

            <div className="mt-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white focus-within:ring-indigo-300 transition">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Пошук за темою, уроком або останнім повідомленням…"
                  className="w-full outline-none bg-transparent text-[15px]"
                />
              </div>
            </div>
          </div>

          {/* Chats list */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {loading ? (
              <ul className="p-3 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <li key={i} className="rounded-2xl bg-white ring-1 ring-[#E5ECFF] p-3 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100" />
                      <div className="min-w-0 flex-1">
                        <div className="h-4 w-2/3 bg-slate-100 rounded mb-2" />
                        <div className="h-3 w-4/5 bg-slate-100 rounded" />
                      </div>
                      <div className="w-10 h-3 bg-slate-100 rounded" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-10 text-center text-slate-500">
                Немає чатів {q ? 'за вашим запитом' : 'поки що'}.
              </div>
            ) : (
              <ul className="p-3 space-y-2">
                {filtered.map((c) => {
                  const previewRaw = c.last_message_preview?.text || '';
                  const preview =
                    previewRaw.trim() === '' ? 'Без повідомлень' :
                    previewRaw.length > 120 ? `${previewRaw.slice(0, 120)}…` : previewRaw;

                  const when = c.last_message_preview?.created_at || c.updated_at;
                  const unread = c.unread_count > 0;

                  const subtitle =
                    c.theory?.title ||
                    c.title ||
                    (c.theory?.lesson_title ? `Урок: ${c.theory.lesson_title}` : 'Чат');

                  const isMe = !!(c.last_message_preview?.sender && user?.id && c.last_message_preview.sender === user.id);
                  const badgeLetter = (subtitle || 'Чат').slice(0, 1).toUpperCase();

                  return (
                    <li key={c.id}>
                      <Link
                        href={`/teacher/chats/${c.id}`}
                        className="group flex items-stretch gap-3 rounded-2xl bg-white ring-1 ring-[#E5ECFF] p-3 hover:shadow-[0_14px_34px_rgba(2,28,78,0.10)] hover:-translate-y-[1px] transition"
                      >
                        {/* Monogram */}
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 ring-1 ring-[#E5ECFF] grid place-items-center text-indigo-700 font-extrabold">
                            {badgeLetter}
                          </div>
                          {unread && (
                            <span className="absolute -right-1 -top-1 text-[10px] min-w-[18px] h-[18px] px-1 rounded-full grid place-items-center text-white bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md">
                              {c.unread_count}
                            </span>
                          )}
                        </div>

                        {/* Main */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold text-[#0F2E64] truncate pr-2">{subtitle}</div>
                            <div className="text-[11px] text-slate-500 shrink-0">{timeAgo(when)}</div>
                          </div>

                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-600 flex-wrap">
                            {c.theory?.lesson_title ? (
                              <span className="px-2 py-0.5 rounded-full bg-[#EEF3FF] text-[#1345DE] ring-1 ring-[#E5ECFF]">
                                {c.theory.lesson_title}
                              </span>
                            ) : null}
                            {c.theory?.title ? (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                Теорія
                              </span>
                            ) : null}
                            {unread ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                                Нові: {c.unread_count}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 ring-1 ring-slate-200">
                                Прочитано
                              </span>
                            )}
                          </div>

                          <div className={`mt-1 text-[13px] truncate ${unread ? 'text-[#0F2E64]/90 font-medium' : 'text-slate-600'}`}>
                            {isMe ? <span className="text-indigo-600 mr-1">Ви:</span> : null}
                            {preview}
                          </div>
                        </div>

                        {/* affordance */}
                        <div className="hidden sm:flex items-center">
                          <span className="px-2 py-1 text-[11px] rounded-lg text-indigo-700 bg-indigo-50 ring-1 ring-indigo-200 opacity-0 group-hover:opacity-100 transition">
                            Відкрити →
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Right pane */}
        <section className="hidden lg:flex items-center justify-center relative">
          <div className="absolute inset-0 bg-[radial-gradient(500px_300px_at_70%_20%,rgba(238,243,255,.9),transparent)] pointer-events-none" />
          <div className="text-center">
            <div className="text-3xl font-extrabold text-[#021C4E] mb-2">Виберіть чат</div>
            <p className="text-slate-600 max-w-md mx-auto">
              Зліва — список діалогів зі студентами. Оберіть чат, щоб перейти до розмови,
              переслати матеріали чи відповісти на питання.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
