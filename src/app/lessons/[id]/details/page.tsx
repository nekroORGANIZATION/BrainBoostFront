'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

type CourseTheory = {
  id: number;
  theory_text: string;
  image?: string | null;
};

type Lesson = {
  id: number;
  title: string;
  description: string;
  course: number;
  theories: CourseTheory[];
};

export default function LessonDetailsPage() {
  const { id } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;

    axios
      .get(`http://172.17.10.22:8000/api/lesson/lessons/${id}/`)
      .then((res) => {
        console.log('📦 Дані уроку:', res.data);
        setLesson(res.data);
      })
      .catch((err) => console.error('Помилка завантаження уроку:', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-center text-lg text-gray-400">Завантаження...</p>;
  if (!lesson) return <p className="text-center text-lg text-red-500">Урок не знайдено</p>;

  return (
    <main className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-xl rounded-xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">{lesson.title}</h1>
      <p className="text-gray-600 mb-2">{lesson.description}</p>
      <div className="text-sm text-gray-500 mb-6">
        <p><span className="font-semibold">ID:</span> {lesson.id}</p>
        <p><span className="font-semibold">Course ID:</span> {lesson.course}</p>
      </div>

      {lesson.theories && lesson.theories.length > 0 ? (
      <div className="prose max-w-none mt-6">
        <h2 className="text-xl font-semibold mb-2">Теорія</h2>
        {lesson.theories[lesson.theories.length - 1] && (
          <>
            <div
              dangerouslySetInnerHTML={{
                __html: lesson.theories[lesson.theories.length - 1].theory_text,
              }}
            />
            {lesson.theories[lesson.theories.length - 1].image && (
              <img
                src={`http://172.17.10.22:8000${lesson.theories[lesson.theories.length - 1].image}`}
                alt="Ілюстрація до теорії"
                className="mt-4 rounded shadow"
              />
            )}
          </>
        )}
      </div>
      ) : (
        <p className="mt-6 text-gray-400 italic">Теорія ще не додана</p>
      )}

      <div className="flex gap-4">
        <button
            onClick={() => router.push(`/lessons/${lesson.id}/theory`)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
        >
            Переглянути теорію
        </button>
        <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition">
          Розпочати тест
        </button>
      </div>
    </main>
  );
}
