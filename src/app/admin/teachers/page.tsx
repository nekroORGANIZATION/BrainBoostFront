'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

// ===== Types =====
type TeacherApplication = {
  id: number;
  user: { id: number; username: string; email?: string };
  status: 'pending'|'approved'|'rejected';
  selfie_photo?: string | null;
  id_photo?: string | null;
  diploma_photo?: string | null;
  note?: string | null;
  created_at: string;
};

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[20px] bg-white ring-1 ring-[#E5ECFF] p-5 shadow-[0_8px_24px_rgba(2,28,78,0.06)] ${className}`}>
      {children}
    </div>
  );
}

function Badge({ children, tone = 'amber' as 'amber'|'emerald'|'rose'|'slate' }) {
  const map: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-800',
    emerald: 'bg-emerald-100 text-emerald-700',
    rose: 'bg-rose-100 text-rose-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[tone]}`}>{children}</span>;
}

export default function AdminTeacherApplicationsPage() {
  const { isAuthenticated, user, accessToken } = useAuth() as any;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apps, setApps] = useState<TeacherApplication[]>([]);
  const [filter, setFilter] = useState<'pending'|'approved'|'rejected'>('pending');

  const notLoggedIn = !isAuthenticated || !accessToken;
  const notAdmin = !!user && !user.is_superuser;

  async function fetchApps(signal?: AbortSignal) {
    const headers: HeadersInit = { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' };
    const res = await fetch(`${API_BASE}/admin_panel/api/teacher-applications/?status=${filter}`, { headers, cache: 'no-store', signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    return Array.isArray(raw) ? raw : raw.results || [];
  }

  useEffect(() => {
    if (notLoggedIn || notAdmin) { setLoading(false); return; }
    const ctl = new AbortController();
    setLoading(true); setError(null);
    fetchApps(ctl.signal)
      .then(list => setApps(list))
      .catch(e => setError(e?.message || 'Помилка завантаження'))
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [accessToken, notLoggedIn, notAdmin, filter]);

  async function approve(id: number) {
    const headers: HeadersInit = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const res = await fetch(`${API_BASE}/admin_panel/api/teacher-applications/${id}/approve/`, { method: 'POST', headers });
    if (res.ok) setApps(prev => prev.filter(a => a.id !== id));
  }
  async function reject(id: number) {
    const headers: HeadersInit = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const res = await fetch(`${API_BASE}/admin_panel/api/teacher-applications/${id}/reject/`, { method: 'POST', headers, body: JSON.stringify({ reason: 'Not enough documents' }) });
    if (res.ok) setApps(prev => prev.filter(a => a.id !== id));
  }

  if (notLoggedIn) {
    return (
      <main className="min-h-screen grid place-items-center">
        <Card><h1>Потрібен вхід</h1></Card>
      </main>
    );
  }
  if (notAdmin) {
    return (
      <main className="min-h-screen grid place-items-center">
        <Card><h1>Тільки для адмінів</h1></Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <section className="w-[1280px] max-w-[95vw] mx-auto pt-[120px] pb-16">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#0F2E64]">Заявки викладачів</h1>
              <p className="text-slate-600 text-sm">Перевіряйте документи та підтверджуйте профілі викладачів</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="h-10 px-3 rounded-lg ring-1 ring-[#E5ECFF]">
                <option value="pending">В очікуванні</option>
                <option value="approved">Підтверджені</option>
                <option value="rejected">Відхилені</option>
              </select>
              <Link href="/admin" className="text-[#1345DE] hover:underline text-sm">← Повернутись назад</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-slate-100 animate-pulse" />
              ))
            ) : apps.length ? (
              apps.map((a) => (
                <div key={a.id} className="rounded-xl ring-1 ring-[#E5ECFF] p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#0F2E64]">{a.user.username}</div>
                      <div className="text-xs text-slate-500">{a.user.email || '—'}</div>
                    </div>
                    {a.status === 'pending' ? <Badge>Очікує</Badge> : a.status === 'approved' ? <Badge tone='emerald'>Підтверджено</Badge> : <Badge tone='rose'>Відхилено</Badge>}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {a.selfie_photo ? (<Image src={a.selfie_photo} alt="selfie" width={300} height={200} className="rounded-lg object-cover w-full h-24" />) : <div className="h-24 rounded bg-slate-100" />}
                    {a.id_photo ? (<Image src={a.id_photo} alt="id" width={300} height={200} className="rounded-lg object-cover w-full h-24" />) : <div className="h-24 rounded bg-slate-100" />}
                    {a.diploma_photo ? (<Image src={a.diploma_photo} alt="diploma" width={300} height={200} className="rounded-lg object-cover w-full h-24" />) : <div className="h-24 rounded bg-slate-100" />}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => approve(a.id)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm">Підтвердити</button>
                    <button onClick={() => reject(a.id)} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-sm">Відхилити</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">Немає заявок</div>
            )}
          </div>

          {error ? <div className="mt-4 text-red-600 text-sm">{error}</div> : null}
        </Card>
      </section>
    </main>
  );
}
