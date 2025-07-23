'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

type Course = {
    id: number;
    title: string;
};

export default function Home() {
    const [courses, setCourses] = useState<Course[]>([]);

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/courses/all/')
        .then(res => setCourses(res.data))
        .catch(err => console.error(err));
    }, []);

    return (
        <main style={{ padding: '2rem' }}>
        <h1>Home page</h1>

        </main>
    );
}
