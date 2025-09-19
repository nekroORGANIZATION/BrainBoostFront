'use client';

import { useEffect, useState } from 'react';
import type { RegisterFormData } from './page';
import Link from 'next/link';
import Image from 'next/image';

type Props = {
  onNext: () => void;
  onBack: () => void;
  updateData: (patch: Partial<RegisterFormData>) => void;
  values: RegisterFormData;
};

export default function UserDetailsForm({ onNext, onBack, updateData, values }: Props) {
  const [name, setName] = useState(values?.name || '');
  const [email, setEmail] = useState(values?.email || '');
  const [password, setPassword] = useState(values?.password || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    updateData({ name, email, password });
  }, [name, email, password]); // eslint-disable-line

  const validate = () => {
    if (!name.trim()) return 'Введіть ім’я.';
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!okEmail) return 'Некоректний e-mail.';
    if (password.length < 6) return 'Пароль має містити мінімум 6 символів.';
    return null;
  };

  const handleNext = () => {
    const msg = validate();
    if (msg) { setError(msg); return; }
    setError(null);
    onNext();
  };

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center px-4">
      <Link href="/" aria-label="На головну"
        className="absolute left-6 top-6 z-50 inline-flex items-center rounded-xl
                  bg-white/70 backdrop-blur px-3 py-2 ring-1 ring-black/5 hover:bg-white/80">
        <Image
          src="/images/logo.png"
          alt="Brand logo"
          width={262}
          height={56}
          priority
          className="select-none"
        />
      </Link>
      <div className="absolute top-36 left-0 w-64 h-64 bg-blue-600"
           style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />

      <div className="w-full max-w-md bg-white">
        <h1 className="text-4xl font-bold mb-8">Реєстрація</h1>

        <label className="block text-gray-600 mb-1" htmlFor="name">Ім’я</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="block text-gray-600 mb-1" htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="block text-gray-600 mb-1" htmlFor="password">Пароль</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-3 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <p className="text-sm text-gray-500 mb-6">
          Вже є акаунт? <a href="/login" className="text-blue-700 underline">Увійди</a>
        </p>

        {error && <div className="text-red-600 text-sm font-medium mb-2">{error}</div>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 border border-gray-300 py-3 rounded-lg text-lg hover:bg-gray-50"
          >
            Назад
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-lg"
          >
            Далі
          </button>
        </div>
      </div>
    </div>
  );
}
