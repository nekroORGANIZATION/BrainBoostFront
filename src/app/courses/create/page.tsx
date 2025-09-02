'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function CreateCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [language, setLanguage] = useState('');
  const [topic, setTopic] = useState('');
  const [rating, setRating] = useState('0.0');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file)); // Для прев’ю зображення
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Відсутній токен авторизації.');
      return;
    }

    // Опціонально: валідація рейтингу
    const ratingValue = parseFloat(rating);
    if (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 5) {
      setError('Рейтинг має бути числом від 0.0 до 5.0.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('language', language);
    formData.append('topic', topic);
    formData.append('rating', ratingValue.toString());
    if (image) formData.append('image', image);

    try {
      const response = await axios.post('http://172.17.10.22:8000/courses/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Course created:', response.data);
      router.push('/courses');
    } catch (err: unknown) {
      console.error('Error creating course:', err);
      setError('Помилка при створенні курсу.');
    }
  };

  return (
    <main className="p-6 max-w-xl mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Створити курс</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Назва курсу"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2"
          required
        />
        <textarea
          placeholder="Опис курсу"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2"
          required
        />
        <input
          type="text"
          placeholder="Ціна (наприклад, 49.99)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border p-2"
          required
        />
        <input
          type="text"
          placeholder="Мова (наприклад, Ukrainian)"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full border p-2"
          required
        />
        <input
          type="text"
          placeholder="Тема (наприклад, Програмування)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full border p-2"
          required
        />

        <input
          type="number"
          placeholder="Рейтинг (0.0 - 5.0)"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          min="0"
          max="5"
          step="0.1"
          className="w-full border p-2"
          required
        />

        <div>
          <label className="block text-sm font-medium">Зображення курсу</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {preview && (
            <img
              src={preview}
              alt="Прев'ю"
              className="mt-2 w-32 h-32 object-cover border"
            />
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Створити курс
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </main>
  );
}
