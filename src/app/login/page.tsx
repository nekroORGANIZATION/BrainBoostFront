// app/login/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import http, { ME_URL, LOGIN_URL } from '@/lib/http';

export default function LoginPage() {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);

  // зручні хелпери для зберігання токенів у ВСІ потрібні ключі
  function persistTokens(access: string, refresh: string) {
    localStorage.setItem('access', access);
    localStorage.setItem('refresh', refresh);
    // дублікати для сумісності зі старим кодом
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);

    if (remember) {
      sessionStorage.setItem('access', access);
      sessionStorage.setItem('refresh', refresh);
      sessionStorage.setItem('accessToken', access);
      sessionStorage.setItem('refreshToken', refresh);
    } else {
      sessionStorage.removeItem('access');
      sessionStorage.removeItem('refresh');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const username = String(formData.get('username') || '').trim();
    const password = String(formData.get('password') || '');

    try {
      // 1) прямий логін на бек
      const res = await http.post(LOGIN_URL, { username, password });
      const access = res.data?.access as string | undefined;
      const refresh = res.data?.refresh as string | undefined;

      if (!access || !refresh) {
        throw new Error('Сервер не повернув токени доступу.');
      }

      // 2) зберегти токени під усіма ключами
      persistTokens(access, refresh);

      // 3) перевірити доступ до профілю (додасть заголовок інтерцептор)
      await http.get(ME_URL).catch(() => {});

      // 4) редірект
      router.push('/profile');
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        'Невірний логін або пароль.';
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  }

  const handleGoogleLogin = () => {
    // TODO: заміни на реальний endpoint коли буде OAuth
    alert('Google Sign-In буде додано після узгодження OAuth.');
  };

  const handleReset = async () => {
    try {
      // ПІДЛАШТУЙ під свій бекенд reset (URL/поле email)
      const res = await http.post('/accounts/reset-password/', { email: resetEmail });
      if (res.status === 200) {
        setShowResetModal(false);
        setShowSuccessModal(true);
        setResetMessage(null);
      } else {
        setResetMessage(res.data?.error || 'Помилка скидання пароля.');
      }
    } catch {
      setResetMessage('Серверна помилка.');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Ліва колонка */}
      <div className="w-full md:w-1/2 flex flex-col px-8 sm:px-12 lg:px-16 py-10">
        <Link href="/" className="text-2xl font-extrabold text-blue-700 hover:underline mb-10">
          BrainBoost
        </Link>

        <div className="max-w-md">
          <h1 className="text-4xl font-extrabold text-[#0B1120] mb-8">Вхід</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="text-sm text-gray-700 mb-1 block">
                E-mail або логін
              </label>
              <input
                name="username"
                type="text"
                required
                autoComplete="username"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm text-gray-700 mb-1 block">
                Пароль
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-black"
                >
                  {showPass ? 'Сховати' : 'Показати'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember((e.target as HTMLInputElement).checked)}
                  className="accent-blue-600"
                />
                Запамʼятати мене
              </label>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="text-sm text-gray-600 hover:underline"
              >
                Забув пароль?
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-lg py-3.5 rounded-xl font-semibold transition"
            >
              {submitting ? 'Входимо…' : 'Вхід'}
            </button>

            {error && <p className="text-red-500 text-sm">{error}</p>}
          </form>

          <div className="my-6 text-center text-gray-500 text-sm">або</div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-xl hover:bg-gray-100 transition"
          >
            <img src="/images/google-login.png" alt="Google" className="w-5 h-5" />
            <span className="text-sm font-medium">Увійти через Google</span>
          </button>

          <div className="text-center text-sm text-gray-500 mt-6">
            Немає акаунту?{' '}
            <Link href="/register" className="text-gray-700 font-semibold hover:underline">
              Зареєструватися
            </Link>
          </div>
        </div>
      </div>

      {/* Права колонка */}
      <div className="hidden md:block w-1/2 bg-blue-900">
        <img src="/images/dog-login.png" alt="Dog with laptop" className="w-full h-full object-cover" />
      </div>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
          <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-md p-8 relative">
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-black"
            >
              ×
            </button>

            <h2 className="text-lg font-semibold text-center text-gray-900 mb-4">Скидання пароля</h2>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Вкажіть e-mail, на який надіслати посилання для відновлення.
            </p>

            <input
              type="email"
              placeholder="email@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />

            {resetMessage && <p className="text-center text-sm text-red-500 mb-3">{resetMessage}</p>}

            <button
              onClick={handleReset}
              className="w-full border border-blue-500 text-blue-700 text-base py-2.5 rounded-xl font-semibold hover:bg-blue-50 transition"
            >
              Надіслати
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
          <div className="bg-white rounded-2xl shadow-xl max-w-md p-8 relative text-center border border-blue-100 w-[90%]">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-black"
            >
              ×
            </button>

            <div className="mx-auto mb-3 w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-md bg-white -mt-12">
              <img src="/images/avatar.png" alt="Avatar" className="w-full h-full object-cover" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Дякуємо</h2>
            <p className="text-sm font-medium text-gray-800 mb-1">Лист для скидання пароля вже в дорозі.</p>
            <p className="text-sm text-gray-600">Перевірте вашу пошту.</p>
          </div>
        </div>
      )}
    </div>
  );
}
