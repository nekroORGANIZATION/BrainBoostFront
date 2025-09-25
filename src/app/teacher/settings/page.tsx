'use client';

import { useA11y } from '@/context/AccessibilityContext';
import { motion } from 'framer-motion';
import { SlidersHorizontal, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

export default function SettingsA11yPage() {
  const { prefs, setPrefs, reset } = useA11y();

  // 👇 ВАЖНО: узнаём класс на <html> только в браузере
  const [isOdys, setIsOdys] = useState(false);
  useEffect(() => {
    // безопасно в браузере
    const has = typeof document !== 'undefined' &&
      document.documentElement.classList.contains('font-odys');
    setIsOdys(Boolean(has));
  }, [prefs.font]);

  const previewStyle = useMemo<React.CSSProperties>(
    () => ({
      fontFamily: isOdys ? '"OpenDyslexic", system-ui' : undefined,
    }),
    [isOdys]
  );

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="mx-auto w-[1000px] max-w-full px-5 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-indigo-50 to-sky-50 ring-1 ring-slate-200/60 p-6 shadow"
        >
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="text-indigo-600" />
            <h1 className="text-xl font-semibold text-slate-800">Налаштування відображення</h1>
            <div className="ml-auto text-sm">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                title="Скинути до стандартних"
              >
                <RefreshCw className="h-4 w-4" /> Скинути
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white/90 backdrop-blur-md ring-1 ring-slate-200/70 shadow p-6 space-y-8"
        >
          {/* Шрифт/текст */}
          <section className="grid md:grid-cols-2 gap-6">
            <Card title="Розмір тексту">
              <input
                type="range" min={0.8} max={1.6} step={0.05}
                value={prefs.textScale}
                onChange={(e) => setPrefs({ textScale: Number(e.target.value) })}
                className="w-full accent-indigo-600"
              />
              <div className="text-sm text-slate-600 mt-2">Поточне значення: {(prefs.textScale).toFixed(2)}×</div>
            </Card>

            <Card title="Міжрядковий інтервал">
              <select
                value={prefs.lineHeight}
                onChange={(e) => setPrefs({ lineHeight: e.target.value as any })}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-100"
              >
                <option value="normal">Звичайний</option>
                <option value="relaxed">Трохи збільшений</option>
                <option value="loose">Великий</option>
              </select>
            </Card>

            <Card title="Шрифт">
              <div className="flex flex-wrap gap-2">
                {(['system','serif','mono','opendyslexic'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setPrefs({ font: opt })}
                    className={`px-3 py-1.5 rounded-xl ring-1 transition ${
                      prefs.font === opt ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white ring-slate-200'
                    }`}
                  >
                    {opt === 'system' ? 'System' :
                     opt === 'serif'  ? 'Serif'  :
                     opt === 'mono'   ? 'Mono'   : 'OpenDyslexic'}
                  </button>
                ))}
              </div>
              <p className="text-sm text-slate-600 mt-2">OpenDyslexic — зручніший для дислексії (додай файл шрифту в <code>/public/fonts</code>).</p>
            </Card>

            <Card title="Трекінг (відстань між літерами)">
              <div className="flex gap-2">
                <button
                  onClick={() => setPrefs({ letterSpacing: 'normal' })}
                  className={`px-3 py-1.5 rounded-xl ring-1 ${prefs.letterSpacing === 'normal' ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white ring-slate-200'}`}
                >
                  Нормально
                </button>
                <button
                  onClick={() => setPrefs({ letterSpacing: 'wide' })}
                  className={`px-3 py-1.5 rounded-xl ring-1 ${prefs.letterSpacing === 'wide' ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white ring-slate-200'}`}
                >
                  Трошки ширше
                </button>
              </div>
            </Card>
          </section>

          {/* Тема/контраст/рух/масштаб */}
          <section className="grid md:grid-cols-2 gap-6">
            <Card title="Тема">
              <div className="flex gap-2">
                {(['system','light','dark'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setPrefs({ theme: t })}
                    className={`px-3 py-1.5 rounded-xl ring-1 ${prefs.theme === t ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white ring-slate-200'}`}
                  >
                    {t === 'system' ? 'Системна' : t === 'light' ? 'Світла' : 'Темна'}
                  </button>
                ))}
              </div>
            </Card>

            <Card title="Контраст">
              <div className="flex gap-2">
                <button
                  onClick={() => setPrefs({ contrast: 'normal' })}
                  className={`px-3 py-1.5 rounded-xl ring-1 ${prefs.contrast === 'normal' ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white ring-slate-200'}`}
                >
                  Звичайний
                </button>
                <button
                  onClick={() => setPrefs({ contrast: 'high' })}
                  className={`px-3 py-1.5 rounded-xl ring-1 ${prefs.contrast === 'high' ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white ring-slate-200'}`}
                >
                  Високий
                </button>
              </div>
            </Card>

            <Card title="Рух/анімації">
              <div className="flex gap-2">
                {(['system','allow','reduce'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setPrefs({ motion: m })}
                    className={`px-3 py-1.5 rounded-xl ring-1 ${prefs.motion === m ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white ring-slate-200'}`}
                  >
                    {m === 'system' ? 'За системою' : m === 'allow' ? 'Дозволити' : 'Зменшити'}
                  </button>
                ))}
              </div>
            </Card>

            <Card title="Масштаб інтерфейсу">
              <div className="flex gap-2">
                <button
                  onClick={() => setPrefs({ uiScale: 'md' })}
                  className={`px-3 py-1.5 rounded-xl ring-1 ${prefs.uiScale === 'md' ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white ring-slate-200'}`}
                >
                  Звичайний
                </button>
                <button
                  onClick={() => setPrefs({ uiScale: 'lg' })}
                  className={`px-3 py-1.5 rounded-xl ring-1 ${prefs.uiScale === 'lg' ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white ring-slate-200'}`}
                >
                  Трохи більший
                </button>
              </div>
              <p className="text-sm text-slate-600 mt-2">Збільшує скруглення/відступи через змінні.</p>
            </Card>
          </section>

          {/* Превʼю */}
          <section>
            <h3 className="text-slate-800 font-semibold mb-2">Превʼю</h3>
            <div className="rounded-2xl ring-1 ring-slate-200 p-5 bg-white" style={previewStyle}>
              <h4 className="text-lg font-bold text-slate-800">Заголовок прикладу</h4>
              <p className="text-slate-700 mt-1">
                Це приклад абзацу. Змінюйте розмір тексту, інтервал, шрифт і побачите, як система миттєво підлаштовується.
              </p>
              <Link href="/courses" className="inline-block mt-3 rounded-xl bg-indigo-600 text-white px-3 py-2 hover:bg-indigo-700">
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
    <div className="rounded-2xl ring-1 ring-slate-200 p-4 bg-white/80">
      <div className="text-slate-800 font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}
