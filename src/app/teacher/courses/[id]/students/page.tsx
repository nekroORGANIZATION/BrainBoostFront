'use client';

import { useEffect, useState } from 'react';
import http from '@/lib/http';
import { useParams } from 'next/navigation';

type Row = {
  id?: number;
  username?: string;
  email?: string;
  enrolled_at?: string;
  progress_pct?: number;
};

export default function StudentsPage() {
  const { id } = useParams() as { id: string };
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function softLoad(url: string) {
    try {
      const r = await http.get(url);
      return Array.isArray(r.data?.results) ? r.data.results : (r.data || []);
    } catch { return null; }
  }

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true); setErr(null);

      // Послідовність спроб, щоб підлаштуватись під бек
      let data =
        (await softLoad(`/courses/${id}/students/`)) ||
        (await softLoad(`/courses/${id}/enrollments/`)) ||
        (await softLoad(`/courses/${id}/purchases/`));

      if (!data) {
        setErr('Не вдалося завантажити список студентів');
        setRows([]);
        setLoading(false);
        return;
      }

      // Нормалізація
      const normalized: Row[] = data.map((x: any) => ({
        id: x.id || x.user?.id,
        username: x.username || x.user?.username || x.user_name,
        email: x.email || x.user?.email,
        enrolled_at: x.enrolled_at || x.created_at || x.date,
        progress_pct: Number(x.progress_pct ?? x.progress ?? 0),
      }));

      if (!cancel) {
        setRows(normalized);
        setLoading(false);
      }
    })();

    return () => { cancel = true; };
  }, [id]);

  if (loading) return <p>Завантаження…</p>;

  return (
    <div>
      <h2 className="text-[#0F2E64] font-extrabold text-[20px] mb-3">Студенти курсу</h2>
      {err && <div className="bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 rounded mb-3">{err}</div>}

      {rows.length === 0 ? (
        <div className="text-slate-600">Поки що немає студентів.</div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left">
              <tr className="border-b">
                <th className="py-2 pr-4">Користувач</th>
                <th className="py-2 pr-4">E-mail</th>
                <th className="py-2 pr-4">Дата</th>
                <th className="py-2 pr-4">Прогрес</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.id}-${i}`} className="border-b last:border-0">
                  <td className="py-2 pr-4">{r.username || '—'}</td>
                  <td className="py-2 pr-4">{r.email || '—'}</td>
                  <td className="py-2 pr-4">{r.enrolled_at ? new Date(r.enrolled_at).toLocaleString() : '—'}</td>
                  <td className="py-2 pr-4">{Number(r.progress_pct ?? 0).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
