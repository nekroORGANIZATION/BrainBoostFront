'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';

/** ===== Types ===== */
export type ModuleLite = {
  id: number;
  title: string | null;
  order: number | null;
};

export interface Lesson {
  id: number;
  title: string;
  summary?: string;
  duration_min?: number | null;
  order?: number | null;
  module?: ModuleLite | null;
  completed?: boolean | null;
  result_percent?: number | null;
}

type Group = {
  module: ModuleLite | null;
  items: { lesson: Lesson; idx: number }[];
};

type Props = {
  courseId: string;
  groups: Group[];
  lockAfterIndex: number;
};

/** ===== Helpers ===== */
function modTitle(m?: ModuleLite | null) {
  return m?.title || 'Без розділу';
}

function isCompleted(l: Lesson) {
  if (typeof l.completed === 'boolean') return l.completed;
  return typeof l.result_percent === 'number' && l.result_percent >= 100;
}

/** ===== Motion variants (типи виправлені) ===== */
const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      when: 'beforeChildren' as const,
    },
  },
} satisfies Variants;

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'tween' as const,
      duration: 0.18,
    },
  },
} satisfies Variants;

/** ===== Component ===== */
export default function CourseLessonsSections({ courseId, groups, lockAfterIndex }: Props) {
  // За замовчуванням закриваємо лише модулі, де всі уроки заблоковані
  const initiallyClosed = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const g of groups) {
      const lockedAll = g.items.every(({ lesson, idx }) => {
        const completed = isCompleted(lesson);
        const locked = idx > lockAfterIndex && !completed;
        return locked;
      });
      map.set(g.module?.id ?? 0, lockedAll);
    }
    return map;
  }, [groups, lockAfterIndex]);

  const [open, setOpen] = useState<Record<number, boolean>>(() => {
    const entries: Record<number, boolean> = {};
    for (const g of groups) {
      const key = g.module?.id ?? 0;
      // Відкрито, якщо модуль не повністю заблокований
      entries[key] = !(initiallyClosed.get(key) ?? false);
    }
    return entries;
  });

  return (
    <div className="space-y-4">
      {groups.map((sec) => {
        const key = sec.module?.id ?? 0;
        const lockedAll = initiallyClosed.get(key) ?? false;
        const isOpen = open[key];

        return (
          <motion.section
            key={key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden"
          >
            {/* Заголовок модуля */}
            <button
              type="button"
              aria-expanded={!!isOpen}
              onClick={() => setOpen((p) => ({ ...p, [key]: !p[key] }))}
              className={`group w-full px-4 py-3 border-b flex items-center justify-between ${
                lockedAll ? 'text-gray-400' : 'text-gray-900'
              } transition-colors`}
            >
              <div className="flex items-center gap-2">
                <motion.span
                  aria-hidden
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ type: 'tween', duration: 0.18 }}
                  className="inline-block"
                >
                  ▸
                </motion.span>
                <span className="text-lg font-semibold">{modTitle(sec.module)}</span>
                {lockedAll && (
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 border border-gray-200">
                    Всі уроки заблоковані
                  </span>
                )}
              </div>
              <span className={`text-sm ${lockedAll ? 'text-gray-400' : 'text-gray-500'}`}>
                {sec.items.length} урок(ів)
              </span>
            </button>

            {/* Контент модуля */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto' as any, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <motion.ul
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                    className="p-4 space-y-2"
                  >
                    {sec.items.map(({ lesson, idx }) => {
                      const completed = isCompleted(lesson);
                      const locked = idx > lockAfterIndex && !completed;

                      const progress =
                        typeof lesson.result_percent === 'number'
                          ? Math.max(0, Math.min(100, Math.round(lesson.result_percent)))
                          : null;

                      const ProgressChip = progress !== null && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${
                            completed
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                          title="Прогрес проходження уроку"
                        >
                          {progress}%
                        </span>
                      );

                      const StatusChip = locked ? (
                        <span
                          className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700"
                          title="Цей урок буде доступний після завершення попереднього"
                        >
                          🔒 Заблоковано
                        </span>
                      ) : completed ? (
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                          ✔ Пройдено
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                          ▶ Можна проходити
                        </span>
                      );

                      const inner = (
                        <>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {StatusChip}
                              <h3 className="text-lg font-medium">{lesson.title}</h3>
                              {ProgressChip}
                            </div>

                            {typeof lesson.duration_min === 'number' && (
                              <span className="text-sm text-gray-500">
                                ⏱ {lesson.duration_min} хв
                              </span>
                            )}
                          </div>

                          {lesson.summary && (
                            <p className="text-gray-600 mt-1">{lesson.summary}</p>
                          )}
                        </>
                      );

                      const cardBase =
                        'border p-4 rounded-lg transition relative will-change-transform';
                      const hover = locked ? '' : 'hover:bg-gray-50';
                      const mask = locked
                        ? 'bg-gray-100 opacity-60 grayscale cursor-not-allowed'
                        : '';

                      return (
                        <motion.li
                          key={lesson.id}
                          variants={itemVariants}
                          whileHover={!locked ? { scale: 1.01 } : {}}
                          className={`${cardBase} ${hover} ${mask}`}
                        >
                          {locked ? (
                            <div aria-disabled className="block select-none">
                              {inner}
                            </div>
                          ) : (
                            <Link
                              href={`/student/courses/${courseId}/lessons/${lesson.id}`}
                              className="block"
                              prefetch={false}
                            >
                              {inner}
                            </Link>
                          )}
                        </motion.li>
                      );
                    })}
                  </motion.ul>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        );
      })}
    </div>
  );
}
