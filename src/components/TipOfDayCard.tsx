'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'https://brainboost.pp.ua/api';

type Tip = { id: number; date: string; text: string; source?: string };
type Props = { className?: string };

export default function TipOfDayCard({ className = '' }: Props) {
  const [tip, setTip] = React.useState<Tip | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`${API_BASE}/api/tips/daily/`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: Tip = await r.json();
      setTip(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Помилка завантаження';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl bg-white/90 ring-1 ring-[#E5ECFF] p-5 shadow-[0_8px_24px_rgba(2,28,78,0.06)] ${className}`}
    >
      <h3 className="text-[#0F2E64] font-extrabold text-[18px]">Порада дня</h3>

      {loading && (
        <div className="mt-3 space-y-2">
          <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
        </div>
      )}

      {err && (
        <div className="mt-3 rounded-lg bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 text-sm">
          {err}
        </div>
      )}

      {tip && !loading && !err && (
        <p className="text-sm text-slate-700 mt-2">{tip.text}</p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={load}
          className="px-3 py-1.5 rounded-xl ring-1 ring-[#E5ECFF] bg-white hover:ring-[#1345DE] active:translate-y-[1px] text-sm transition"
        >
          Оновити
        </button>
        {tip?.source && (
          <span className="text-xs text-slate-500">Джерело: {tip.source}</span>
        )}
      </div>
    </motion.div>
  );
}
