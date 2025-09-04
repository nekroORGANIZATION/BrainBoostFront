'use client';

import React, { useEffect, useMemo, useRef as _useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function isPaginated<T>(x): x is Paginated<T> {
  return x && typeof x === 'object' && Array.isArray(x.results);
}
async function collectAll<T>(firstUrl: string, headers?: HeadersInit): Promise<T[]> {
  const acc: T[] = [];
  let url: string | null = firstUrl;

  while (url) {
    const init: RequestInit = { headers, cache: 'no-store' as RequestCache };
    const r: Response = await fetch(url, init);
    if (!r.ok) break;

    const data: unknown = await r.json();

    if (Array.isArray(data)) {
      acc.push(...(data as T[]));
      break; // plain array => финальная «страница»
    }

    if (isPaginated<T>(data)) {
      const page = data as Paginated<T>;
      acc.push(...page.results);
      url = page.next;
    } else {
      break;
    }
  }

  return acc;
}

function useChatId(): number | null {
  const params = useParams();
  const raw =
    (params as unknown).chatId ??
    (params as unknown).ChatId ??
    (params as unknown).id ??
    (params as unknown).Id ??
    (params as unknown).chat ??
    (params as unknown).Chat ??
    null;
  const num = typeof raw === 'string' ? Number(raw) : Array.isArray(raw) ? Number(raw[0]) : Number(raw);
  return Number.isFinite(num) && num > 0 ? num : null;
}
function titleOf(c?: ChatInfo | null) {
  if (!c) return 'Чат';
  return c.theory?.title || c.title || (c.theory?.lesson_title ? `Урок: ${c.theory.lesson_title}` : `Чат #${c.id}`);
}

export default function StudentChatThreadPage() {
  const chatId = useChatId();

  const { isAuthenticated, accessToken, user } = useAuth() as {
    isAuthenticated: boolean;
    accessToken: string | null;
    user?: { id?: number } | null;
  };
  const myId = user?.id ?? -1;
  const headers: HeadersInit = useMemo(
    () => (accessToken ? ({ Authorization: `Bearer ${accessToken}` } as Record<string, string>) : {}),
    [accessToken],
    );

  const [chat, setChat] = useState<ChatInfo | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  useEffect(() => {
    let cancelled = false;
    let pollTimer = null;

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

        if (list.length) {
          const lastId = list[list.length - 1].id;
          fetch(READ_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(headers || {}) },
            body: JSON.stringify({ chat: chatId, last_read_message_id: lastId }),
          }).catch(() => {});
        }
      } catch (e) {
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
      } catch { /* ignore */ }
    }

    loadThread();
    pollTimer = setInterval(poll, 6000);

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [isAuthenticated, accessToken, chatId, headers]);

  async function send() {
    const text = input.trim();
    if (!text || !chatId) return;
    setInput('');

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

  if (!isAuthenticated || !accessToken) {
    return (
      <main className="min-h-screen bg-slate-50 grid place-items-center p-6">
        <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-6 max-w-xl text-center">
          <h1 className="text-xl font-bold">Потрібен вхід</h1>
          <p className="text-slate-600 mt-2">Авторизуйтесь, щоб переглянути чат.</p>
          <div className="mt-3">
            <Link href="/login" className="px-4 py-2 rounded-xl bg-[#1345DE] text-white">Увійти</Link>
          </div>
        </div>
      </main>
    );
  }

  if (!chatId) {
    return (
      <main className="min-h-screen bg-slate-50 grid place-items-center p-6">
        <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-6 max-w-xl text-center">
          <h1 className="text-xl font-bold">Невірний URL</h1>
          <p className="text-slate-600 mt-2">ID чату не знайдено у шляху.</p>
          <div className="mt-3">
            <Link href="/student/notifications" className="px-4 py-2 rounded-xl bg-[#1345DE] text-white">Мої чати</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-screen-2xl grid grid-cols-1 lg:grid-cols-[360px_1fr] h-screen">
        {/* Sidebar */}
        <aside className="border-r bg-white p-4 hidden lg:block">
          <Link
            href="/student/notifications"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl ring-1 ring-slate-200 hover:ring-[#1345DE] transition"
            title="До списку чатів"
          >
            ← Мої чати
          </Link>
        </aside>

        {/* Thread */}
        <section className="bg-white flex flex-col">
          <header className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-semibold truncate">{titleOf(chat)}</div>
            <Link href="/student/notifications" className="lg:hidden text-[#1345DE]">Мої чати</Link>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-slate-50">
            {loading && <div className="text-slate-500">Завантаження…</div>}
            {err && !loading && (
              <div className="text-red-600 bg-red-50 border border-red-200 rounded p-2">{err}</div>
            )}
            {!loading && !err && msgs.length === 0 && (
              <div className="text-slate-500">Повідомлень поки немає</div>
            )}

            {msgs.map((m) => {
              const mine = m.sender === myId;
              return (
                <div
                  key={m.id}
                  className={`max-w-[80%] rounded-lg p-2 ${
                    mine ? 'bg-blue-100 ml-auto text-right' : 'bg-white ring-1 ring-slate-200'
                  }`}
                >
                  <div className="text-xs text-slate-500 mb-1">{fmtTime(m.created_at)}</div>
                  <div className="whitespace-pre-wrap break-words">{m.text}</div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <div className="border-t p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              className="flex-1 border rounded-xl p-2"
              placeholder="Напишіть повідомлення…"
            />
            <button onClick={send} className="px-4 py-2 rounded-xl bg-[#1345DE] text-white">
              Надіслати
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
