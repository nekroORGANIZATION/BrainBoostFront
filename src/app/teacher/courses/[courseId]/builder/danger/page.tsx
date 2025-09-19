// src/app/teacher/courses/[courseId]/builder/danger/page.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import http from '@/lib/http';
import { AlertTriangle, Trash2, ArrowLeft } from 'lucide-react';

export default function DangerPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = React.use(params); // ✅ більше немає warning
  const router = useRouter();

  async function remove() {
    if (!confirm('Точно видалити курс? Дію не можна відмінити.')) return;
    try {
      // Основний шлях
      try {
        await http.delete(`/courses/${courseId}/`);
      } catch (e: any) {
        // Якщо бек під /api
        if (e?.response?.status === 404 || e?.response?.status === 405) {
          await http.delete(`/api/courses/${courseId}/`);
        } else {
          throw e;
        }
      }
      alert('Курс видалено.');
      router.replace('/teacher/courses');
    } catch (e: any) {
      alert(e?.response?.data ? JSON.stringify(e.response.data) : e?.message || 'Не вдалося видалити');
    }
  }

  return (
    <div className="rounded-2xl ring-1 ring-red-200 bg-red-50 p-6 space-y-4">
      <div className="flex items-center gap-2 text-red-800">
        <AlertTriangle className="w-5 h-5" />
        <h1 className="text-lg font-extrabold">Небезпечна зона</h1>
      </div>

      <p className="text-red-700">
        Видалення назавжди прибере курс і всі пов’язані уроки. Це незворотно.
      </p>

      <div className="flex gap-2">
        <button
          onClick={remove}
          className="inline-flex items-center gap-2 px-5 py-2 rounded bg-red-600 text-white"
        >
          <Trash2 className="w-4 h-4" /> Видалити курс
        </button>
        <Link
          href={`/teacher/courses/${courseId}/builder/overview`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded ring-1 ring-red-200 text-red-700 bg-white"
        >
          <ArrowLeft className="w-4 h-4" /> Назад
        </Link>
      </div>
    </div>
  );
}
