'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

type Course = {
  id: number;
  title: string;
  description: string;
  author: number; // user ID
};

export default function CoursesList() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/courses/all/')
      .then(res => setCourses(res.data))
      .catch(err => console.error('Error loading courses:', err));
  }, []);





  return (
    <main className="container">
      <h1 className="page-title">Список курсів</h1>
      <ul className="course-list">
        {courses.map(course => (
          <li key={course.id} className="course-item">
            <h2 className="course-title">{course.title}</h2>
            <p className="course-description">{course.description?.slice(0, 120)}...</p>
            <div className="course-actions">
              <Link href={`/courses/${course.id}/details`} className="btn btn-details">🔍 Деталі</Link>
            </div>
          </li>
        ))}
      </ul>

      <style jsx>{`
        .container {
          max-width: 900px;
          margin: 2rem auto;
          padding: 1rem 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
            Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          background-color: #f9f5ff; /* світлий фіолетовий фон */
          border-radius: 16px;
          box-shadow: 0 0 40px rgba(157, 50, 182, 0.25); /* ніжна фіолетова тінь для контейнера */
        }
        .page-title {
          text-align: center;
          font-size: 2.8rem;
          color: #5b21b6; /* насичений фіолетовий */
          margin-bottom: 3rem;
          text-shadow: 0 0 8px #db2777; /* рожево-фіолетове світіння */
        }
        .course-list {
          list-style: none;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill,minmax(280px,1fr));
          gap: 2rem;
        }
        .course-item {
          background: #ffffff;
          border-radius: 20px;
          padding: 1.8rem 2rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow:
            0 0 15px #a855f7, /* фіолетова тінь */
            0 0 30px #ec4899;  /* рожево-фіолетова тінь */
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
        }
        .course-item:hover {
          transform: translateY(-8px);
          box-shadow:
            0 0 30px #8b5cf6,
            0 0 60px #f43f5e;
        }
        .course-title {
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
          color: #6b21a8;
          font-weight: 700;
          letter-spacing: 0.03em;
        }
        .course-description {
          flex-grow: 1;
          color: #7c3aed;
          margin-bottom: 1.5rem;
          font-size: 1rem;
          line-height: 1.4;
          opacity: 0.85;
        }
        .course-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .btn {
          text-decoration: none;
          padding: 0.6rem 1.4rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          user-select: none;
          cursor: pointer;
          transition: background-color 0.35s ease, box-shadow 0.35s ease;
          border: 2px solid transparent;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: white;
          background: linear-gradient(45deg, #db2777, #9333ea);
          box-shadow: 0 4px 15px #db2777aa;
        }
        .btn:hover {
          background: linear-gradient(45deg, #9333ea, #db2777);
          box-shadow: 0 6px 20px #f43f5ecc;
        }
      `}</style>
    </main>
  );
}
