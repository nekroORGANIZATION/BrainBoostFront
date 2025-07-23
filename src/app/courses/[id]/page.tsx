'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

type Course = {
    id: number;
    title: string;
    description: string;
    owner_id: number;
};

export default function CourseDetailsPage() {
    const { id } = useParams();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        axios
        .get(`http://127.0.0.1:8000/courses/${id}/`)
        .then((res) => setCourse(res.data))
        .catch((err) => console.error('Ошибка загрузки курса:', err))
        .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <p style={{ color: 'white' }}>Загрузка...</p>;
    if (!course) return <p style={{ color: 'white' }}>Курс не найден</p>;

    return (
        <main style={{ padding: '2rem', color: 'white' }}>
        <h1>{course.title}</h1>
        <p>{course.description}</p>
        <p><strong>ID:</strong> {course.id}</p>
        <p><strong>Owner ID:</strong> {course.owner_id}</p>
        </main>
    );
}
