'use client';

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import axios from 'axios';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Создаем axios instance с interceptor
    const axiosInstance = axios.create({
        baseURL: "http://127.0.0.1:8000/",
        headers: {
            "Content-Type": "application/json",
        },
    });

    axiosInstance.interceptors.request.use(
        (config) => {
            const access = localStorage.getItem("access");
            if (access) {
                config.headers["Authorization"] = `Bearer ${access}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    axiosInstance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            if (
                error.response?.status === 401 &&
                !originalRequest._retry &&
                localStorage.getItem("refresh")
            ) {
                originalRequest._retry = true;
                try {
                    const res = await axios.post("http://127.0.0.1:8000/accounts/api/token/refresh/", {
                        refresh: localStorage.getItem("refresh"),
                    });
                    localStorage.setItem("access", res.data.access);
                    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${res.data.access}`;
                    return axiosInstance(originalRequest);
                } catch (err) {
                    localStorage.clear();
                    window.location.href = "/login";
                    return Promise.reject(err);
                }
            }
            return Promise.reject(error);
        }
    );

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        try {
            const res = await axiosInstance.post('/accounts/api/login/', {
                username,
                password,
            });

            const data = res.data;
            console.log("✅ Ответ при логине:", data);

            localStorage.setItem('access', data.access);
            localStorage.setItem('refresh', data.refresh);

            const profileRes = await axiosInstance.get('/accounts/api/profile/');
            const profileData = profileRes.data;


            localStorage.setItem('userId', profileData.id);
            localStorage.setItem('username', profileData.username);
            localStorage.setItem('isAdmin', profileData.is_admin);

            login(data.access);

            router.push('/profile');
        } catch (err) {
            console.error("❌ Ошибка при логине:", err);
            setError('Невірний e-mail або пароль.');
        }
    };

    const handleGoogleLogin = async () => {
        console.log("🔑 Попытка входа через Google");
        await signIn("google");
        console.log(Credential)
    };


    const handleReset = async () => {
        try {
            const res = await axios.post('http://127.0.0.1:8000/accounts/reset-password/', {
                email: resetEmail,
            });

            if (res.status === 200) {
                setShowResetModal(false);
                setShowSuccessModal(true);
            } else {
                setResetMessage(res.data.error || 'Помилка скидання пароля.');
            }
        } catch (err) {
            setResetMessage('Серверна помилка.');
        }
    };

    return (
        <div className="flex h-screen overflow-hidden relative">
            <div className="w-full md:w-1/2 flex flex-col px-16 py-12">
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
                        onClick={handleGoogleLogin}
                        type="button"
                        className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-xl hover:bg-gray-100 transition"
                    >
                        <img src="/images/google-login.png" alt="Google" className="w-5 h-5" />
                        <span className="text-md font-medium">Sign in with Google</span>
                    </button>

                    <div className="text-center text-sm text-gray-500 mt-6">
                        <button
                            onClick={() => setShowResetModal(true)}
                            className="hover:underline"
                        >
                            Не памʼятаю пароль
                        </button>
                    </div>

                    <div className="text-center text-sm text-gray-500 mt-2">
                        Немає акаунту?{' '}
                        <a href="/register" className="text-gray-600 hover:underline">Зареєструватися</a>
                    </div>
                </div>
            </div>

            {/* Правая часть */}
            <div className="hidden md:block w-1/2 bg-blue-900">
                <img
                    src="/images/dog-login.png"
                    alt="Dog with laptop"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Reset Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/10">
                    <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-md p-8 relative">
                        <button
                            onClick={() => setShowResetModal(false)}
                            className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-black"
                        >
                            ×
                        </button>

                        <h2 className="text-xl font-semibold text-center text-gray-900 mb-6">
                            Введіть електронну адресу<br /> або номер телефону
                        </h2>

                        <input
                            type="email"
                            placeholder="Ваша електронна пошта"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                        />

                        {resetMessage && (
                            <p className="text-center text-sm text-red-500 mb-4">{resetMessage}</p>
                        )}

                        <button
                            onClick={handleReset}
                            className="w-full border border-blue-500 text-blue-700 text-lg py-3 rounded-xl font-semibold hover:bg-blue-50 transition"
                        >
                            Далі
                        </button>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/10">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md p-8 relative text-center border border-blue-400"
                        style={{ width: '694px', height: '207px' }}>
                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-black"
                        >
                            ×
                        </button>

                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
                            <img src="/images/avatar.png" alt="Avatar" className="w-full h-full object-cover" />
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mt-4 mb-4" style={{ fontSize: '30px' }}>Дякуємо</h2>
                        <p className="text-md font-semibold text-gray-800 mb-1">
                            Лист для скидання пароля вже в дорозі.
                        </p>
                        <p className="text-md text-gray-700">Зазирніть у вашу електронну скриньку</p>
                    </div>
                </div>
            )}
        </div>
    );
}
