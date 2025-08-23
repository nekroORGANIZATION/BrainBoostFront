'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

type Lesson = {
    id: number;
    title: string;
    description: string;
    course: number;
};

export default function LessonPage() {
    const { id } = useParams();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        axios
            .get(`http://127.0.0.1:8000/api/lessons/${id}/`)
            .then((res) => setLesson(res.data))
            .catch((err) => console.error('Помилка завантаження уроку:', err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <p style={{ color: 'white' }}>Завантаження...</p>;
    if (!lesson) return <p style={{ color: 'white' }}>Урок не знайдено</p>;

    return (
        <main style={{ padding: '2rem', color: 'white' }}>
            <h1>{lesson.title}</h1>
            <p>{lesson.description}</p>
            <p><strong>ID:</strong> {lesson.id}</p>
            <p><strong>Course ID:</strong> {lesson.course}</p>
        </main>
    );
}
