'use client';

import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        try {
            const res = await fetch('http://127.0.0.1:8000/accounts/api/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                setError('Invalid credentials.');
                return;
            }

            const data = await res.json();
            login(data.access);   // <<< Зберігаємо access token в AuthContext
            router.push('/profile');  // Можеш перенаправити користувача
        } catch (err) {
            setError('Server error.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4" style={{ maxWidth: '400px', margin: 'auto', backgroundColor: 'white' }}>
            <input name="username" placeholder="Username" className="border p-2 mb-2 block" />
            <input type="password" name="password" placeholder="Password" className="border p-2 mb-2 block" />
            <button type="submit" className="bg-black text-white px-4 py-2">Login</button>
            {error && <p className="text-red-500">{error}</p>}
        </form>
    );
}
