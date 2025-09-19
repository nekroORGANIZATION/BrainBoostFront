'use client';

import { useA11y } from '@/context/AccessibilityContext';
import { motion } from 'framer-motion';
import { SlidersHorizontal, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

export default function SettingsA11yPage() {
  const { prefs, setPrefs, reset } = useA11y();

  // Превʼю під опції шрифту; fallback без помилки на SSR
  const previewStyle = useMemo<React.CSSProperties>(() => {
    const isOpendys =
      prefs.font === 'opendyslexic' ||
      (typeof document !== 'undefined' &&
        document.documentElement.classList.contains('font-odys'));
    return isOpendys ? { fontFamily: '"OpenDyslexic", system-ui' } : {};
  }, [prefs.font]);

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-top bg-cover">
      <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 py-8 space-y-6">
        {/* Хедер */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-indigo-50 to-sky-50 ring-1 ring-slate-200/60 p-5 sm:p-6 md:p-8 shadow"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex items-center gap-3">
              <SlidersHorizontal className="h-5 w-5 text-indigo-600" />
              <h1 className="font-semibold text-slate-800 leading-tight text-[clamp(18px,3.5vw,22px)] md:text-[26px]">
                Налаштування відображення
              </h1>
            </div>
            <div className="sm:ml-auto">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                title="Скинути до стандартних"
                aria-label="Скинути налаштування до стандартних"
              >
                <RefreshCw className="h-4 w-4" /> Скинути
              </button>
            </div>
          </div>
        </motion.div>

        {/* Контент */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white/90 backdrop-blur-md ring-1 ring-slate-200/70 shadow p-5 sm:p-6 md:p-8 space-y-8"
        >
          {/* Шрифт/текст */}
          <section className="grid gap-6 md:grid-cols-2">
            <Card title="Розмір тексту">
              <label className="block">
                <input
                  type="range"
                  min={0.8}
                  max={1.6}
                  step={0.05}
                  value={prefs.textScale}
                  onChange={(e) => setPrefs({ textScale: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                  aria-label="Розмір тексту"
                />
                <div className="mt-2 text-sm text-slate-600">
                  Поточне значення: {prefs.textScale.toFixed(2)}×
                </div>
              </label>
            </Card>

            <Card title="Міжрядковий інтервал">
              <label>
                <span className="sr-only">Міжрядковий інтервал</span>
                <select
                  value={prefs.lineHeight}
                  onChange={(e) => setPrefs({ lineHeight: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-100"
                  aria-label="Міжрядковий інтервал"
                >
                  <option value="normal">Звичайний</option>
                  <option value="relaxed">Трохи збільшений</option>
                  <option value="loose">Великий</option>
                </select>
              </label>
            </Card>

            <Card title="Шрифт">
              <div className="flex flex-wrap gap-2">
                {(['system', 'serif', 'mono', 'opendyslexic'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setPrefs({ font: opt })}
                    className={`px-3 py-1.5 rounded-xl ring-1 transition ${
                      prefs.font === opt
                        ? 'bg-indigo-600 text-white ring-indigo-600'
                        : 'bg-white ring-slate-200 hover:bg-slate-50'
                    }`}
                    aria-pressed={prefs.font === opt}
                    aria-label={`Шрифт: ${
                      opt === 'system' ? 'System' : opt === 'serif' ? 'Serif' : opt === 'mono' ? 'Mono' : 'OpenDyslexic'
                    }`}
                  >
                    {opt === 'system'
                      ? 'System'
                      : opt === 'serif'
                      ? 'Serif'
                      : opt === 'mono'
                      ? 'Mono'
                      : 'OpenDyslexic'}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-600">
                OpenDyslexic — зручніший для дислексії (додай файл шрифту в <code>/public/fonts</code>).
              </p>
            </Card>

            <Card title="Трекінг (відстань між літерами)">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPrefs({ letterSpacing: 'normal' })}
                  className={`px-3 py-1.5 rounded-xl ring-1 ${
                    prefs.letterSpacing === 'normal'
                      ? 'bg-indigo-600 text-white ring-indigo-600'
                      : 'bg-white ring-slate-200 hover:bg-slate-50'
                  }`}
                  aria-pressed={prefs.letterSpacing === 'normal'}
                >
                  Нормально
                </button>
                <button
                  onClick={() => setPrefs({ letterSpacing: 'wide' })}
                  className={`px-3 py-1.5 rounded-xl ring-1 ${
                    prefs.letterSpacing === 'wide'
                      ? 'bg-indigo-600 text-white ring-indigo-600'
                      : 'bg-white ring-slate-200 hover:bg-slate-50'
                  }`}
                  aria-pressed={prefs.letterSpacing === 'wide'}
                >
                  Трошки ширше
                </button>
              </div>
            </Card>
          </section>

          {/* Тема/контраст/рух/масштаб */}
          <section className="grid gap-6 md:grid-cols-2">
            <Card title="Тема">
              <div className="flex flex-wrap gap-2">
                {(['system', 'light', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPrefs({ theme: t })}
                    className={`px-3 py-1.5 rounded-xl ring-1 ${
                      prefs.theme === t
                        ? 'bg-indigo-600 text-white ring-indigo-600'
                        : 'bg-white ring-slate-200 hover:bg-slate-50'
                    }`}
                    aria-pressed={prefs.theme === t}
                  >
                    {t === 'system' ? 'Системна' : t === 'light' ? 'Світла' : 'Темна'}
                  </button>
                ))}
              </div>
            </Card>

            <Card title="Контраст">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPrefs({ contrast: 'normal' })}
                  className={`px-3 py-1.5 rounded-xl ring-1 ${
                    prefs.contrast === 'normal'
                      ? 'bg-indigo-600 text-white ring-indigo-600'
                      : 'bg-white ring-slate-200 hover:bg-slate-50'
                  }`}
                  aria-pressed={prefs.contrast === 'normal'}
                >
                  Звичайний
                </button>
                <button
                  onClick={() => setPrefs({ contrast: 'high' })}
                  className={`px-3 py-1.5 rounded-xl ring-1 ${
                    prefs.contrast === 'high'
                      ? 'bg-indigo-600 text-white ring-indigo-600'
                      : 'bg-white ring-slate-200 hover:bg-slate-50'
                  }`}
                  aria-pressed={prefs.contrast === 'high'}
                >
                  Високий
                </button>
              </div>
            </Card>

            <Card title="Рух/анімації">
              <div className="flex flex-wrap gap-2">
                {(['system', 'allow', 'reduce'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPrefs({ motion: m })}
                    className={`px-3 py-1.5 rounded-xl ring-1 ${
                      prefs.motion === m
                        ? 'bg-indigo-600 text-white ring-indigo-600'
                        : 'bg-white ring-slate-200 hover:bg-slate-50'
                    }`}
                    aria-pressed={prefs.motion === m}
                  >
                    {m === 'system' ? 'За системою' : m === 'allow' ? 'Дозволити' : 'Зменшити'}
                  </button>
                ))}
              </div>
            </Card>

            <Card title="Масштаб інтерфейсу">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPrefs({ uiScale: 'md' })}
                  className={`px-3 py-1.5 rounded-xl ring-1 ${
                    prefs.uiScale === 'md'
                      ? 'bg-indigo-600 text-white ring-indigo-600'
                      : 'bg-white ring-slate-200 hover:bg-slate-50'
                  }`}
                  aria-pressed={prefs.uiScale === 'md'}
                >
                  Звичайний
                </button>
                <button
                  onClick={() => setPrefs({ uiScale: 'lg' })}
                  className={`px-3 py-1.5 rounded-xl ring-1 ${
                    prefs.uiScale === 'lg'
                      ? 'bg-indigo-600 text-white ring-indigo-600'
                      : 'bg-white ring-slate-200 hover:bg-slate-50'
                  }`}
                  aria-pressed={prefs.uiScale === 'lg'}
                >
                  Трохи більший
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-600">Збільшує скруглення/відступи через змінні.</p>
            </Card>
          </section>

          {/* Превʼю */}
          <section>
            <h3 className="mb-2 font-semibold text-slate-800">Превʼю</h3>
            <div
              className="rounded-2xl ring-1 ring-slate-200 p-4 sm:p-5 bg-white"
              style={previewStyle}
            >
              <h4 className="text-slate-800 font-bold text-[clamp(16px,3.2vw,20px)]">Заголовок прикладу</h4>
              <p className="mt-1 text-slate-700">
                Це приклад абзацу. Змінюйте розмір тексту, інтервал, шрифт — і система миттєво підлаштовується.
              </p>
              <Link
                href="/courses"
                className="mt-3 inline-block rounded-xl bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
              >
                Перейти до курсів
              </Link>
            </div>
          </section>
        </motion.div>
      </div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl ring-1 ring-slate-200 p-4 sm:p-5 bg-white/80">
      <h2 className="mb-2 font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}
