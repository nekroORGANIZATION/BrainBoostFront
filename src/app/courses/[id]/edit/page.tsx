'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios, { isAxiosError } from 'axios';

interface Category {
  id: number;
  name: string;
}

export default function CourseEditPage() {
  const { id } = useParams();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    language: '',
    category: '',
    topic: '',
  });
  const [image, setImage] = useState<File | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    if (!id || !token) return;

    axios
      .get(`http://172.17.10.22:8000/courses/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        const course = res.data;
        setFormData({
          title: course.title || '',
          description: course.description || '',
          price: course.price ? String(course.price) : '',
          language: course.language || '',
          category: course.category?.id ? String(course.category.id) : '',
          topic: course.topic || '',
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Помилка при завантаженні курсу:', err);
        setError('Не вдалося завантажити курс');
        setLoading(false);
      });
  }, [id, token]);

  // Завантаження категорій
  useEffect(() => {
    axios
      .get('http://127.0.0.1:8000/courses/all/categories/')
      .then(res => {
        setCategories(res.data.results || res.data); // залежить від pagination
      })
      .catch(err => {
        console.error('Помилка при завантаженні категорій:', err);
      });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      alert('Ви не авторизовані!');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('language', formData.language);
      data.append('category', formData.category);
      data.append('topic', formData.topic);
      if (image) {
        data.append('image', image);
      }

      await axios.patch(
        `http://127.0.0.1:8000/courses/all/${id}/edit/`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      router.push(`/courses`);
    } catch (err: unknown) {
      console.error('Помилка при збереженні:', err);
      if (isAxiosError(err) && err.response?.data) {
        console.log('Помилки від бекенду:', err.response.data);
      }
      setError('Не вдалося зберегти зміни. Перевірте обовʼязкові поля.');
      setSaving(false);
    }
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '3rem' }}>Завантаження...</p>;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '3rem auto',
        padding: '2rem',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#2c3e50' }}>Редагування курсу</h1>

      {error && (
        <p style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        {/* Назва */}
        <label style={labelStyle}>Назва курсу</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        {/* Опис */}
        <label style={labelStyle}>Опис</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={5}
          style={inputStyle}
        />

        {/* Ціна */}
        <label style={labelStyle}>Ціна</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          min="0"
          step="0.01"
          required
          style={inputStyle}
        />

        {/* Мова */}
        <label style={labelStyle}>Мова</label>
        <input
          type="text"
          name="language"
          value={formData.language}
          onChange={handleChange}
          required
          placeholder="Наприклад: Українська"
          style={inputStyle}
        />

        {/* Тема */}
        <label style={labelStyle}>Тема</label>
        <input
          type="text"
          name="topic"
          value={formData.topic}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        {/* Категорія */}
        <label style={labelStyle}>Категорія</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          style={inputStyle}
        >
          <option value="" disabled>Виберіть категорію</option>
          {categories.map(cat => (
            <option key={cat.id} value={String(cat.id)}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Зображення */}
        <label style={labelStyle}>Зображення</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#2c3e50',
            color: 'white',
            fontSize: '1.2rem',
            borderRadius: '8px',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Збереження...' : 'Зберегти зміни'}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  marginBottom: '1.5rem',
  borderRadius: '6px',
  border: '1px solid #ccc',
  fontSize: '1rem',
  boxSizing: 'border-box' as const,
};

const labelStyle = {
  display: 'block',
  marginBottom: 8,
  fontWeight: 'bold',
};
