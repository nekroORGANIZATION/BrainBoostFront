// src/app/tests/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getTestById as getTestByIdRaw,
  updateTest as updateTestRaw,
} from '@/services/tests';

/** ========= локальные типы под эту страницу ========= */
type TestDetails = {
  id: number;
  title: string;
  description: string;
};

type UpdateTestPayload = {
  title: string;
  description: string;
};

/** ========= адаптеры поверх сервиса (без any) ========= */
const getTestById = getTestByIdRaw as unknown as (id: number) => Promise<TestDetails>;
const updateTest = updateTestRaw as unknown as (
  id: number,
  data: UpdateTestPayload
) => Promise<{ id: number }>;

/** ========= страница ========= */
export default function EditTestPage() {
  const router = useRouter();
  const params = useParams();

  // корректно разбираем id из useParams
  const idParam = Array.isArray(params?.id) ? params.id[0] : String(params?.id ?? '');
  const id = /^\d+$/.test(idParam) ? Number(idParam) : NaN;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (Number.isNaN(id)) {
      setErr('Некорректный идентификатор теста');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await getTestById(id);
        if (!cancelled) {
          setTitle(data.title ?? '');
          setDescription(data.description ?? '');
        }
      } catch (e) {
        if (!cancelled) setErr('Не удалось загрузить тест');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (Number.isNaN(id)) return;
    try {
      await updateTest(id, { title, description });
      router.push('/tests');
    } catch {
      setErr('Не удалось сохранить изменения');
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Редактировать тест</h1>

      {loading ? (
        <div className="space-y-3">
          <div className="h-10 w-full bg-slate-200 animate-pulse rounded" />
          <div className="h-24 w-full bg-slate-200 animate-pulse rounded" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Название"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <textarea
            placeholder="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Сохранить
          </button>
        </form>
      )}

      {err ? <div className="mt-3 text-sm text-red-600">{err}</div> : null}
    </div>
  );
}
