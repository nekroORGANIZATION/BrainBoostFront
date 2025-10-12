'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { register } from '@/services/AuthService'; // <-- ВАЖЛИВО: використовуємо твою функцію register

// Тип з твоєї сторінки-майстра
export type RegisterFormData = {
  role: 'student' | 'teacher' | '' ;
  name: string;
  email: string;
  password: string;
  birthDate: string; // YYYY-MM-DD
};

type Props = {
  onBack: () => void;
  updateData: (patch: Partial<RegisterFormData>) => void;
  values: RegisterFormData;
};

function pad2(n: number | string) {
  return String(n).padStart(2, '0');
}

export default function BirthDateForm({ onBack, updateData, values }: Props) {
  // дефолт: 31.12.2005
  const [day, setDay] = useState('31');
  const [month, setMonth] = useState('12');
  const [year, setYear] = useState('2005');

  const [age, setAge] = useState<number | null>(null);
  const [formattedDate, setFormattedDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { login } = useAuth();

  const monthsUA = useMemo(
    () => [
      'січня','лютого','березня','квітня','травня','червня',
      'липня','серпня','вересня','жовтня','листопада','грудня',
    ],
    []
  );

  // Підрахунок віку + синхронізація ISO-дати в майстер-формі
  useEffect(() => {
    const d = Number(day), m = Number(month), y = Number(year);
    if (!d || !m || !y) return;

    const birth = new Date(y, m - 1, d);
    if (Number.isNaN(birth.getTime())) return;

    // відсікаємо неможливі дати типу 31.04
    if (birth.getDate() !== d || birth.getMonth() !== m - 1 || birth.getFullYear() !== y) return;

    const today = new Date();
    let a = today.getFullYear() - y;
    const mdiff = today.getMonth() - (m - 1);
    if (mdiff < 0 || (mdiff === 0 && today.getDate() < d)) a -= 1;

    setAge(a);
    setFormattedDate(`${d} ${monthsUA[m - 1]} ${y} р.`);
    updateData({ birthDate: `${y}-${pad2(m)}-${pad2(d)}` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, month, year, monthsUA]);

  const validateAll = () => {
    if (!values.role) return 'Оберіть роль.';
    if (!values.name.trim()) return 'Введіть ім’я.';
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim());
    if (!okEmail) return 'Некоректний e-mail.';
    if ((values.password || '').length < 6) return 'Пароль має містити мінімум 6 символів.';
    if (!values.birthDate) return 'Вкажіть дату народження.';
    if (age === null || age < 10) return 'Мінімальний вік — 10 років.';
    return null;
  };

  async function handleSubmit() {
    const msg = validateAll();
    if (msg) { setError(msg); return; }

    setError(null);
    setBusy(true);
    try {
      // Використовуємо твою функцію register(...)
      const data = await register(
        values.role,
        values.name,
        values.email,
        values.password,
        values.birthDate, // YYYY-MM-DD
      );

      // Якщо бек одразу повертає токени — логінимось прозоро
      const access =
        data?.access ??
        data?.access_token ??
        data?.tokens?.access ??
        null;

      const refresh =
        data?.refresh ??
        data?.refresh_token ??
        data?.tokens?.refresh ??
        null;

      if (access) {
        // режим login(access, refresh)
        await (login as (a: string, r?: string | null) => Promise<void>)(access, refresh ?? null);
        router.push('/profile');
        return;
      }

      // Інакше — на логін з прапорцем про успішну реєстрацію
      router.push('/login?registered=1');
    } catch (e: any) {
      // Витягнемо читабельну помилку з бекенда
      const resp = e?.response?.data;
      let msg =
        (typeof resp === 'string' && resp) ||
        resp?.detail ||
        e?.message ||
        'Помилка реєстрації.';

      // Якщо бек повернув помилки полів об’єктом — склеїмо їх
      if (!msg || msg === 'Помилка реєстрації.') {
        if (resp && typeof resp === 'object') {
          const parts = Object.entries(resp).map(([k, v]) => {
            const text = Array.isArray(v) ? v.join(' ') : String(v);
            return `${k}: ${text}`;
          });
          if (parts.length) msg = parts.join(' | ');
        }
      }
      setError(String(msg));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-white relative overflow-hidden">
      <Link
        href="/"
        aria-label="На головну"
        className="absolute left-6 top-6 z-50 inline-flex items-center rounded-xl
                   bg-white/70 backdrop-blur px-3 py-2 ring-1 ring-black/5 hover:bg-white/80"
      >
        <Image
          src="/images/logo.png"
          alt="Brand logo"
          width={262}
          height={56}
          priority
          className="select-none"
        />
      </Link>

      {/* Декор */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-700" style={{ clipPath: 'polygon(0 100%, 0 0, 100% 100%)' }} />
      <div className="absolute top-1/2 right-0 w-[350px] h-[300px] bg-blue-700 -translate-y-1/2" style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />

      <div
        className="bg-white flex flex-col items-center justify-between rounded-2xl border border-gray-100 shadow md:shadow-none"
        style={{ width: '652px', minHeight: '450px' }}
      >
        <h2 className="text-3xl font-bold mt-10 mb-6 text-center">Напиши свій день народження</h2>

        <div className="flex gap-10 mb-6">
          {/* День */}
          <div className="flex flex-col items-center">
            <div className="w-20 border-t border-gray-400 mb-2" />
            <input
              type="number"
              min={1}
              max={31}
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="text-center text-xl w-20 focus:outline-none"
            />
            <div className="w-20 border-b border-gray-400 mt-2" />
          </div>

          {/* Місяць */}
          <div className="flex flex-col items-center">
            <div className="w-20 border-t border-gray-400 mb-2" />
            <input
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-center text-xl w-20 focus:outline-none"
            />
            <div className="w-20 border-b border-gray-400 mt-2" />
          </div>

          {/* Рік */}
          <div className="flex flex-col items-center">
            <div className="w-24 border-t border-gray-400 mb-2" />
            <input
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="text-center text-xl w-24 focus:outline-none"
            />
            <div className="w-24 border-b border-gray-400 mt-2" />
          </div>
        </div>

        <div className="flex justify-between items-center border rounded px-6 py-3 mb-4 w-[480px] text-gray-700 text-lg">
          <span>{formattedDate}</span>
          <span>{age !== null ? `${age} років` : ''}</span>
        </div>

        {error && (
          <div className="text-red-600 text-sm font-medium mb-2 px-4 text-center">
            {error}
          </div>
        )}

        <div className="flex gap-3 mb-8">
          <button
            onClick={onBack}
            className="border border-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-50"
          >
            Назад
          </button>
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white px-10 py-3 rounded-lg"
          >
            {busy ? 'Реєструємо…' : 'Реєстрація'}
          </button>
        </div>
      </div>
    </div>
  );
}
