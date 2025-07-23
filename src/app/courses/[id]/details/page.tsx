'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation'; // ✅ для App Router
import Link from 'next/link';

type Course = {
  id: number;
  title: string;
  description: string;
  author: number;
  language: string;
  topic: string;
  price: number;
  rating: number;
  image?: string | null;
};

export default function CourseDetail() {
  const params = useParams(); // ✅ отримуємо params із URL
  const courseId = params?.id;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;

    axios.get(`http://127.0.0.1:8000/courses/all/${courseId}/details/`)
      .then(res => {
        setCourse(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Не вдалося завантажити курс');
        setLoading(false);
      });
  }, [courseId]);

  if (loading) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Завантаження...</p>;
  if (error) return <p style={{ textAlign: 'center', marginTop: '2rem', color: 'red' }}>{error}</p>;
  if (!course) return null;

  return (
    <>
      <main className="container">
        <h1 className="title">{course.title}</h1>

        {course.image && (
          <div className="image-wrapper">
            <img src={course.image} alt={course.title} />
          </div>
        )}

        <div className="info">
          <p className="description">{course.description}</p>

          <ul className="details-list">
            <li><strong>Автор:</strong> {course.author}</li>
            <li><strong>Мова:</strong> {course.language}</li>
            <li><strong>Тема:</strong> {course.topic}</li>
            <li><strong>Ціна:</strong> ${Number(course.price).toFixed(2)}</li>
            <li><strong>Рейтинг:</strong> {Number(course.rating).toFixed(2)}</li>
          </ul>
          <Link href="/lessons/create" className="text-blue-600 underline">
          + Добавить урок
        </Link>
        </div>
      </main>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 3rem auto;
          padding: 2rem 2.5rem;
          background-color: #f0f4f8;
          border-radius: 20px;
          box-shadow:
            0 8px 20px rgba(100, 100, 150, 0.1),
            0 4px 10px rgba(100, 100, 150, 0.05);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
            Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          color: #334155;
        }

        .title {
          font-size: 2.8rem;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 1.5rem;
          text-align: center;
          text-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
        }

        .image-wrapper {
          width: 100%;
          max-height: 350px;
          overflow: hidden;
          border-radius: 18px;
          margin-bottom: 2rem;
          box-shadow: 0 8px 16px rgba(75, 85, 99, 0.15);
          display: flex;
          justify-content: center;
          align-items: center;
          background: white;
        }

        .image-wrapper img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 18px;
        }

        .info {
          font-size: 1.1rem;
          line-height: 1.6;
        }

        .description {
          margin-bottom: 2rem;
          color: #475569;
        }

        .details-list {
          list-style: none;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem 2rem;
          font-weight: 600;
          color: #334155;
        }

        .details-list li {
          background: white;
          padding: 0.8rem 1.2rem;
          border-radius: 12px;
          box-shadow:
            0 2px 8px rgba(59, 130, 246, 0.1);
          transition: box-shadow 0.3s ease;
        }

        .details-list li:hover {
          box-shadow:
            0 8px 20px rgba(59, 130, 246, 0.2);
        }
      `}</style>
    </>
  );
}
