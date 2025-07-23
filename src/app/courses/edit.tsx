'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';

export default function CourseEditPage() {
  const router = useRouter();
  const { id } = useParams();

  const [course, setCourse] = useState({
    title: '',
    description: '',
    price: '',
    language: '',
    topic: '',
  });

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/courses/${id}/`)
      .then(res => setCourse(res.data))
      .catch(err => console.error(err));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCourse({ ...course, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`http://127.0.0.1:8000/courses/${id}/edit/`, course, {
        withCredentials: true,
      });
      router.push(`/courses/${id}`);
    } catch (err) {
      console.error('Помилка при оновленні:', err);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1rem', border: '1px solid #ccc', borderRadius: 8 }}>
      <h1 style={{ marginBottom: '1rem' }}>Редагування курсу</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          name="title"
          value={course.title}
          onChange={handleChange}
          required
          placeholder="Назва"
          style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
        />

        <textarea
          name="description"
          value={course.description}
          onChange={handleChange}
          required
          placeholder="Опис"
          rows={4}
          style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
        />

        <input
          name="price"
          value={course.price}
          onChange={handleChange}
          required
          type="number"
          placeholder="Ціна"
          style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
        />

        <input
          name="language"
          value={course.language}
          onChange={handleChange}
          placeholder="Мова"
          style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
        />

        <input
          name="topic"
          value={course.topic}
          onChange={handleChange}
          placeholder="Тема"
          style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            type="submit"
            style={{ padding: '0.5rem 1.5rem', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Зберегти
          </button>
          <button
            type="button"
            onClick={() => router.push(`/courses/${id}`)}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Скасувати
          </button>
        </div>
      </form>
    </div>
  );
}
