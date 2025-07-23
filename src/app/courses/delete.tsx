'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

export default function CourseDeletePage() {
  const { id } = useParams();
  const router = useRouter();
  const [courseTitle, setCourseTitle] = useState('');

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/courses/${id}/`)
      .then(res => setCourseTitle(res.data.title))
      .catch(err => console.error(err));
  }, [id]);

  const handleDelete = async () => {
    try {
      await axios.delete(`http://127.0.0.1:8000/courses/${id}/delete/`, {
        withCredentials: true,
      });
      router.push('/courses');
    } catch (err) {
      console.error('Помилка при видаленні:', err);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '3rem auto', padding: '1.5rem', border: '1px solid #ccc', borderRadius: 8, textAlign: 'center' }}>
      <h2 style={{ color: 'red', marginBottom: '1rem' }}>Підтвердження видалення</h2>
      <p style={{ marginBottom: '1.5rem' }}>
        Ви дійсно хочете <strong>видалити</strong> курс <br />
        <span style={{ fontWeight: 'bold', color: '#b22222' }}>{courseTitle}</span>?
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button
          onClick={handleDelete}
          style={{ backgroundColor: '#b22222', color: 'white', border: 'none', padding: '0.5rem 1.2rem', borderRadius: 4, cursor: 'pointer' }}
        >
          Так, видалити
        </button>
        <button
          onClick={() => router.push(`/courses/${id}`)}
          style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Скасувати
        </button>
      </div>
    </div>
  );
}
