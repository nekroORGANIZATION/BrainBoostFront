'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function LessonsPage() {
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/lesson/lessons/')
      .then((res) => setLessons(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Уроки</h1>
        <Link href="/lessons/create" className="bg-blue-500 text-white px-4 py-2 rounded">
          + Добавить
        </Link>
      </div>
      <ul className="space-y-4">
        {lessons.map((lesson: any) => (
          <li key={lesson.id} className="border p-4 rounded">
            <h2 className="text-xl font-semibold">{lesson.title}</h2>
            <p>{lesson.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
