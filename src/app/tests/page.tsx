'use client';
import { useEffect, useState } from 'react';
import { getTests, deleteTest } from '@/services/tests';
import Link from 'next/link';

export default function TestListPage() {
    const [tests, setTests] = useState<Test[]>([]);

    useEffect(() => {
        getTests().then(setTests);
    }, []);

    const handleDelete = async (id: number) => {
        await deleteTest(id);
        setTests(tests.filter(t => t.id !== id));
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">🧪 Список тестов</h1>
            <Link href="/tests/create" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">Создать тест</Link>
            <ul className="mt-6 space-y-4">
                {tests.map(test => (
                <li key={test.id} className="bg-white shadow p-4 rounded-lg flex justify-between items-center">
                    <Link href={`/tests/${test.id}`} className="text-lg font-medium text-blue-600 hover:underline">
                        {test.title}
                    </Link>
                    <div className="space-x-2">
                        <Link href={`/tests/${test.id}/edit`} className="text-yellow-500 hover:underline">Редактировать</Link>
                        <button onClick={() => handleDelete(test.id)} className="text-red-500 hover:underline">Удалить</button>
                    </div>
                </li>
                ))}
            </ul>
        </div>
    );
}