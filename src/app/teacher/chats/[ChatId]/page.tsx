'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Paperclip, Send, Smile, Loader2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://brainboost.pp.ua/api';
const CHATS_URL = `${API_BASE}/api/chat/chats/`;
const MESSAGES_URL = `${API_BASE}/api/chat/messages/`; // GET ?chat=ID, POST { chat, text }
const READ_URL = `${API_BASE}/api/chat/read/`;

type MiniTheory = {
  id: number;
  title: string;
  lesson_id?: number | null;
  lesson_title?: string | null;
};

type ChatInfo = {
  id: number;
  title?: string | null;
  theory?: MiniTheory | null;
  student: number;
  teacher: number;
  unread_count: number;
  updated_at: string;
};

type Msg = {
  id: number;
  chat: number;
  sender: number;
  text: string;
  created_at: string;
  is_deleted: boolean;
};

type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] };

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' });
}
function sameDay(a: string, b: string) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}
function isPaginated<T>(x: any): x is Paginated<T> {
  return x && typeof x === 'object' && Array.isArray(x.results);
}
async function collectAll<T>(firstUrl: string, headers?: HeadersInit): Promise<T[]> {
  const acc: T[] = [];
  let url: string | null = firstUrl;

  while (url) {
    const r = await fetch(url, { headers, cache: 'no-store' });
    if (!r.ok) break;

    const data: unknown = await r.json();

    if (Array.isArray(data)) {
      acc.push(...(data as T[]));
      break;
    }
    if (isPaginated<T>(data)) {
      acc.push(...data.results);
      url = data.next;
    } else {
      break;
    }
  }
  return acc;
}

/** Надійно дістаємо chatId із params */
function useChatId(): number | null {
  const params = useParams() as any;
  const raw =
    params.chatId ?? params.ChatId ?? params.id ?? params.Id ?? params.chat ?? params.Chat ?? null;
  const num = Array.isArray(raw) ? Number(raw[0]) : Number(raw);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export default function ChatThreadPage() {
  const chatId = useChatId();

  const { isAuthenticated, accessToken, user } = useAuth() as {
    isAuthenticated: boolean;
    accessToken: string | null;
    user?: { id?: number } | null;
  };

  const myId = user?.id ?? -1;

  const headers: HeadersInit = useMemo(
    () => (accessToken ? ({ Authorization: `Bearer ${accessToken}` } as Record<string, string>) : {}),
    [accessToken]
  );

  const [chat, setChat] = useState<ChatInfo | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // автоскрол в кінець
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // завантаження + polling
  useEffect(() => {
    let cancelled = false;
    let pollTimer: any = null;

    async function loadThread() {
      if (!isAuthenticated || !accessToken || !chatId) {
        setLoading(false);
        return;
      }
      setErr(null);
      setLoading(true);

      try {
        const rChat = await fetch(`${CHATS_URL}${chatId}/`, { headers, cache: 'no-store' });
        if (!rChat.ok) throw new Error('Не вдалося завантажити чат');
        const info = (await rChat.json()) as ChatInfo;
        if (!cancelled) setChat(info);

        const list = await collectAll<Msg>(`${MESSAGES_URL}?chat=${chatId}&page_size=200`, headers);
        if (!cancelled) setMsgs(list);

        // позначити як прочитане
        if (list.length) {
          const lastId = list[list.length - 1].id;
          fetch(READ_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(headers || {}) },
            body: JSON.stringify({ chat: chatId, last_read_message_id: lastId }),
          }).catch(() => {});
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Помилка завантаження.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function poll() {
      if (!chatId) return;
      try {
        const list = await collectAll<Msg>(`${MESSAGES_URL}?chat=${chatId}&page_size=200`, headers);
        setMsgs((prev) => {
          const prevLast = prev[prev.length - 1]?.id;
          const nextLast = list[list.length - 1]?.id;
          if (prevLast !== nextLast) {
            if (list.length) {
              const lastId = list[list.length - 1].id;
              fetch(READ_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(headers || {}) },
                body: JSON.stringify({ chat: chatId, last_read_message_id: lastId }),
              }).catch(() => {});
            }
            return list;
          }
          return prev;
        });
      } catch {
        /* ігноруємо */
      }
    }

    loadThread();
    pollTimer = setInterval(poll, 5000);

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [isAuthenticated, accessToken, chatId, headers]);

  async function send() {
    const text = input.trim();
    if (!text || !chatId) return;
    setInput('');

    // оптимістичне повідомлення
    const optimistic: Msg = {
      id: Date.now(),
      chat: chatId,
      sender: myId,
      text,
      created_at: new Date().toISOString(),
      is_deleted: false,
    };
    setMsgs((p) => [...p, optimistic]);

    try {
      await fetch(MESSAGES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(headers || {}) },
        body: JSON.stringify({ chat: chatId, text }),
      });
      // оновлення підтягне poll
    } catch {
      setMsgs((p) => [
        ...p,
        {
          id: Date.now() + 1,
          chat: chatId,
          sender: -9999,
          text: '❌ Не вдалося надіслати. Перевірте мережу.',
          created_at: new Date().toISOString(),
          is_deleted: false,
        },
      ]);
    }
  }

  const title =
    chat?.theory?.title ||
    chat?.title ||
    (chat?.theory?.lesson_title ? `Урок: ${chat?.theory?.lesson_title}` : 'Чат');

  // групування за днем для роздільників
  const grouped = useMemo(() => {
    const out: Array<{ date: string; items: Msg[] }> = [];
    msgs.forEach((m) => {
      const d = fmtDate(m.created_at);
      const last = out[out.length - 1];
      if (!last || last.date !== d) out.push({ date: d, items: [m] });
      else last.items.push(m);
    });
    return out;
  }, [msgs]);

  // GUARDS
  if (!isAuthenticated || !accessToken) {
    return (
      <main className="min-h-screen grid place-items-center p-6 bg-[url('/images/back.png')] bg-cover bg-top">
        <div className="rounded-2xl bg-white/90 backdrop-blur ring-1 ring-[#E5ECFF] p-6 max-w-md text-center shadow-[0_18px_50px_rgba(2,28,78,0.12)]">
          <h1 className="text-2xl font-extrabold text-[#021C4E]">Потрібен вхід</h1>
          <p className="text-slate-600 mt-1">Авторизуйтесь, щоб переглянути чат.</p>
          <Link href="/login" className="inline-flex mt-4 px-5 py-2 rounded-xl bg-[#1345DE] text-white font-semibold hover:brightness-110">
            Увійти
          </Link>
        </div>
      </main>
    );
  }

  if (!chatId) {
    return (
      <main className="min-h-screen grid place-items-center p-6 bg-[url('/images/back.png')] bg-cover bg-top">
        <div className="rounded-2xl bg-white/90 backdrop-blur ring-1 ring-[#E5ECFF] p-6 max-w-md text-center shadow-[0_18px_50px_rgba(2,28,78,0.12)]">
          <h1 className="text-2xl font-extrabold text-[#021C4E]">Невірний URL</h1>
          <p className="text-slate-600 mt-1">ID чату не знайдено у шляху.</p>
          <Link href="/teacher/chats" className="inline-flex mt-4 px-5 py-2 rounded-xl bg-[#1345DE] text-white font-semibold hover:brightness-110">
            Мої чати
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      {/* мʼякі radial-підсвітки поверх фону */}
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(900px_500px_at_110%_20%,rgba(238,243,255,.85),transparent),radial-gradient(900px_500px_at_-10%_-10%,rgba(247,249,255,.85),transparent)]" />

      <div className="relative mx-auto max-w-screen-2xl grid grid-cols-1 lg:grid-cols-[380px_1fr] h-[100dvh]">
        {/* Sidebar (мінімальний) */}
        <aside className="hidden lg:flex flex-col border-r border-[#E5ECFF]/70 bg-white/70 backdrop-blur-xl">
          <div className="p-4">
            <Link
              href="/teacher/chats"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white hover:ring-[#1345DE] transition text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Мої чати
            </Link>
          </div>
          <div className="m-4 p-4 rounded-2xl ring-1 ring-[#E5ECFF] bg-white/90">
            <div className="text-xs text-slate-500 mb-1">Чат</div>
            <div className="text-[#0F2E64] font-semibold">{title}</div>
            {typeof chat?.unread_count === 'number' && (
              <div className="mt-2 text-xs px-2 py-1 inline-flex rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
                Непрочитаних: {chat.unread_count}
              </div>
            )}
          </div>
        </aside>

        {/* Thread */}
        <section className="relative bg-transparent flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 px-4 md:px-6 py-3">
            <div className="rounded-2xl bg-white/80 backdrop-blur ring-1 ring-[#E5ECFF] px-3 py-2 flex items-center justify-between shadow-[0_10px_30px_rgba(2,28,78,0.10)]">
              <div className="min-w-0 flex items-center gap-3">
                <Link href="/teacher/chats" className="lg:hidden shrink-0 p-2 rounded-lg ring-1 ring-[#E5ECFF] bg-white">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="min-w-0">
                  <div className="text-sm text-slate-600 truncate">{chat?.theory?.lesson_title || 'Діалог'}</div>
                  <div className="text-[17px] font-semibold text-[#0F2E64] truncate">{title}</div>
                </div>
              </div>
              {loading ? (
                <div className="text-xs text-slate-500 inline-flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Завантаження…
                </div>
              ) : null}
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-6">
            {err && (
              <div className="mx-auto max-w-xl rounded-xl bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2">
                {err}
              </div>
            )}
            {!loading && !err && msgs.length === 0 && (
              <div className="mx-auto max-w-xl text-center text-slate-600">
                Повідомлень поки немає. Напишіть перше!
              </div>
            )}

            {grouped.map((group, gi) => (
              <div key={gi} className="space-y-3">
                {/* day separator */}
                <div className="sticky top-12 z-0 flex justify-center">
                  <span className="px-3 py-1 rounded-full text-xs bg-white/80 backdrop-blur ring-1 ring-[#E5ECFF] text-slate-600">
                    {group.date}
                  </span>
                </div>

                {group.items.map((m, i) => {
                  const mine = m.sender === myId;
                  const prev = group.items[i - 1];
                  const withTail = !prev || !sameDay(prev.created_at, m.created_at) || prev.sender !== m.sender;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={[
                          'max-w-[82%] md:max-w-[70%] rounded-2xl px-3 py-2 shadow-sm',
                          mine
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
                            : 'bg-white ring-1 ring-[#E5ECFF] text-slate-800',
                        ].join(' ')}
                        style={{ borderTopRightRadius: mine && withTail ? 6 : 16, borderTopLeftRadius: !mine && withTail ? 6 : 16 }}
                      >
                        <div className={`text-[11px] mb-0.5 ${mine ? 'text-emerald-50/90' : 'text-slate-500'}`}>
                          {fmtTime(m.created_at)}
                        </div>
                        <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                          {m.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            <div ref={endRef} />
          </div>

          {/* Composer */}
          <div className="px-3 md:px-6 pb-4">
            <div className="rounded-2xl bg-white/85 backdrop-blur ring-1 ring-[#E5ECFF] shadow-[0_10px_30px_rgba(2,28,78,0.10)] p-2">
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  className="shrink-0 p-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white hover:ring-[#1345DE]"
                  onClick={() => fileRef.current?.click()}
                  title="Прикріпити файл (демо)"
                >
                  <Paperclip className="w-5 h-5 text-slate-600" />
                </button>

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  placeholder="Напишіть повідомлення…"
                  className="flex-1 resize-none max-h-40 outline-none px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-[15px]"
                />

                <button
                  type="button"
                  onClick={send}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1345DE] text-white font-medium hover:brightness-110"
                >
                  <Send className="w-4 h-4" /> Надіслати
                </button>
              </div>

              {/* прихований інпут файл (якщо знадобиться) */}
              <input ref={fileRef} type="file" hidden onChange={() => { /* інтегруйте аплоад за потреби */ }} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
