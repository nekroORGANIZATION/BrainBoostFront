'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/lesson/lessons/')
      .then((res) => {
        setLessons(res.data.results || []); // берем только results
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Ошибка загрузки уроков');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center mt-10">Загрузка...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Уроки</h1>
        <Link href="/lessons/create" className="bg-blue-500 text-white px-4 py-2 rounded">
          + Додати
        </Link>
      </div>
      <ul className="space-y-4">
        {lessons.map((lesson) => (
          <li key={lesson.id} className="border p-4 rounded">
            <h2 className="text-xl font-semibold">{lesson.title}</h2>
            <p>{lesson.description}</p>

            <div className="mt-2">
              <Link
                href={`/lessons/${lesson.id}/details`}
                className="text-sm text-white bg-blue-500 px-3 py-1 rounded hover:bg-blue-600"
              >
                Деталі
              </Link>
            </div>

          </li>
        ))}
      </ul>
    </div>
  );
}
