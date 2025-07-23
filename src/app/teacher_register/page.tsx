'use client';
import { useState } from 'react';
import { registerTeacher } from '../../services/AuthService';

export default function TeacherRegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [documents, setDocuments] = useState<FileList | null>(null);

    const handleRegister = async () => {
        if (!documents || documents.length === 0) {
            alert('Please upload at least one qualification document.');
            return;
        }

        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        Array.from(documents).forEach((file) => {
            formData.append('documents', file); // ключ должен совпадать с DRF-сериализатором
        });

        try {
            await registerTeacher(formData);
            alert('Teacher registered! Awaiting verification.');
        } catch (error) {
            alert('Registration failed');
        }
    };

    return (
        <div className="p-4 bg-white max-w-md mx-auto rounded shadow">
            <h2 className="text-xl font-bold mb-4">Teacher Registration</h2>
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="block w-full mb-2 p-2 border"
            />
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="block w-full mb-2 p-2 border"
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="block w-full mb-2 p-2 border"
            />
            <input
                type="file"
                multiple
                onChange={e => setDocuments(e.target.files)}
                className="block w-full mb-4"
            />
            <button
                onClick={handleRegister}
                className="bg-blue-600 text-white px-4 py-2 rounded"
            >
                Register as Teacher
            </button>
        </div>
    );
}
