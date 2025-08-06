'use client';

import { useState, useEffect } from 'react';

export default function UserDetailsForm({ onNext, onBack, updateData, values }: any) {
  const [name, setName] = useState(values?.name || '');
  const [email, setEmail] = useState(values?.email || '');
  const [password, setPassword] = useState(values?.password || '');

  useEffect(() => {
    updateData({ name, email, password });
  }, [name, email, password]);

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center px-4">
      <div className="absolute top-8 left-8 text-xl font-bold text-blue-950">LOGO</div>

      <div className="absolute top-150 left-0 w-64 h-64 bg-blue-600 clip-diagonal" />

      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold mb-8">Реєстрація</h1>

        <label className="block text-gray-600 mb-1" htmlFor="name">Ім’я</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:outline-none"
        />

        <label className="block text-gray-600 mb-1" htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:outline-none"
        />

        <label className="block text-gray-600 mb-1" htmlFor="password">Пароль</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-3 mb-2 border border-gray-300 rounded-lg focus:outline-none"
        />

        <p className="text-sm text-gray-500 mb-6">
          Вже є акаунт? <a href="/login" className="text-gray-500 underline">Увійди</a>
        </p>

        <div className="flex gap-4">
          <button
            onClick={onNext}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-lg"
          >
            Далі
          </button>
        </div>
      </div>

      <style jsx>{`
        .clip-diagonal {
          clip-path: polygon(0 0, 100% 0, 0 100%);
        }
      `}</style>
    </div>
  );
}
