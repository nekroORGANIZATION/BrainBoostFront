'use client';

import { useRouter } from 'next/navigation';
import http from '@/lib/http';

const DELETE_URL = (id: string|number) => `/courses/all/${id}/delete/`;

export default function DangerTab({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  async function remove() {
    if (!confirm('Точно видалити курс? Дію не можна відмінити.')) return;
    try {
      await http.delete(DELETE_URL(id));
      alert('Курс видалено.');
      router.push('/teacher/courses');
    } catch (e) {
      alert(e?.response?.data ? JSON.stringify(e.response.data) : 'Не вдалося видалити');
    }
  }

  return (
    <div className="rounded-2xl ring-1 ring-red-200 bg-red-50 p-5">
      <h2 className="text-red-800 font-extrabold text-lg">Небезпечна зона</h2>
      <p className="text-red-700 mt-2">
        Видалення назавжди прибере курс і всі пов’язані уроки. Це незворотно.
      </p>
      <button onClick={remove} className="mt-3 px-5 py-2 rounded bg-red-600 text-white">
        Видалити курс
      </button>
    </div>
  );
}
