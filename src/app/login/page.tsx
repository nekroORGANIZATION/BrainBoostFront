'use client';

import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';

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
                setError('Невірний e-mail або пароль.');
                return;
            }

            const data = await res.json();
            const token = data.access;
            login(token);

            localStorage.setItem('access', data.access);
            localStorage.setItem('refresh', data.refresh);

            const profileRes = await fetch('http://127.0.0.1:8000/accounts/api/profile/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!profileRes.ok) {
                setError('Вхід успішний, але не вдалося отримати профіль.');
                return;
            }

            const profileData = await profileRes.json();
            localStorage.setItem('userId', profileData.id);
            localStorage.setItem('username', profileData.username);
            localStorage.setItem('isAdmin', profileData.is_admin);

            router.push('/profile');
        } catch (err) {
            console.error(err);
            setError('Серверна помилка.');
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Left side */}
            <div className="w-full md:w-1/2 flex flex-col px-16 py-12">
                {/* ЛОГО */}
                <Link href="/" className="text-2xl font-extrabold text-blue-700 hover:underline mb-10">
                    BrainBoost
                </Link>

                <div>
                    <h1 className="text-4xl font-extrabold text-[#0B1120] mb-10">Вхід</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="text-md text-gray-700 mb-1 block">E-mail</label>
                            <input
                                name="username"
                                type="username"
                                required
                                className="w-full border border-gray-300 rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="text-md text-gray-700 mb-1 block">Пароль</label>
                            <input
                                name="password"
                                type="password"
                                required
                                className="w-full border border-gray-300 rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white text-lg py-4 rounded-xl font-semibold transition"
                        >
                            Вхід
                        </button>

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </form>

                    <div className="my-6 text-center text-gray-500 text-md">або</div>

                    <button
                        type="button"
                        className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-xl hover:bg-gray-100 transition"
                    >
                        <img
                            src="/images/google-login.png"
                            alt="Google"
                            className="w-5 h-5"
                        />
                        <span className="text-md font-medium">Sign in with Google</span>
                    </button>

                    <div className="text-center text-sm text-gray-500 mt-6">
                        <a href="#" className="hover:underline">Не памʼятаю пароль</a>
                    </div>

                    <div className="text-center text-sm text-gray-500 mt-2">
                        Немає акаунту?{' '}
                        <a href="/register" className="text-gray-600 hover:underline">Зареєструватися</a>
                    </div>
                </div>
            </div>

            {/* Right side */}
            <div className="hidden md:block w-1/2 bg-blue-900">
                <img
                    src="/images/dog-login.png"
                    alt="Dog with laptop"
                    className="w-full h-full object-cover"
                />
            </div>
        </div>
    );
}
