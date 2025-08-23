'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function CreateLessonPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [course, setCourse] = useState(1);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
        const response = await axios.post('http://127.0.0.1:8000/api/lesson/lessons/', {
            title,
            description,
            course,
        });
        console.log('Lesson created:', response.data);
        router.push('/lessons');
        } catch (error) {
        console.error('Error creating lesson:', error);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-10">
        <h1 className="text-2xl font-bold mb-4">Створення урока</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
            <input
            type="text"
            placeholder="Назва"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            />
            <textarea
            placeholder="Опис"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            />
            <input
            type="number"
            placeholder="ID курса"
            value={course}
            onChange={(e) => setCourse(Number(e.target.value))}
            className="w-full p-2 border rounded"
            />
            <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
            Створити урок
            </button>
        </form>
        </div>
    );
}
