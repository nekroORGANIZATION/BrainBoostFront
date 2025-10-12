// lib/media.ts

/** Перевірка абсолютного URL */
export function isAbsUrl(u?: string | null): boolean {
  return !!u && /^https?:\/\//i.test(u);
}

/** Склейка двох частин шляху без подвійних слешів */
function joinUrl(a: string, b: string): string {
  return a.replace(/\/+$/, '') + '/' + String(b).replace(/^\/+/, '');
}

/** База бекенда (для абсолютів типу /media/...) */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '');

/** Дістаємо лише ім’я файлу з URL/шляху */
function basename(path?: string | null): string {
  if (!path) return '';
  try {
    const v = String(path);
    if (/^https?:\/\//i.test(v)) {
      const u = new URL(v);
      return u.pathname.split('/').filter(Boolean).pop() || '';
    }
    return v.split('/').filter(Boolean).pop() || '';
  } catch {
    return String(path || '').split('/').filter(Boolean).pop() || '';
  }
}

/* =========================
   КУРСИ — СТАРА ЛОГІКА
   (просто ім’я файлу -> /course_image/<file>)
========================= */
export function mediaUrl(u?: string | null): string {
  const file = basename(u);
  if (!file) return '';
  return `/course_image/${file}`;
}

/* =========================
   ІСТОРІЇ — КОВЕРИ
========================= */

/** Папка для історій у медіа бекенда */
const STORY_COVERS_PREFIX = '/media/stories/covers';

/**
 * Нормалізує шлях до обкладинки історії:
 * - http(s)://... → як є
 * - /media/... | /static/... → префіксує доменом бекенда (якщо задано API_BASE)
 * - media/...  | static/...   → те саме (попередньо додаємо /)
 * - лише ім’я файлу (story-01.png) → збираємо як /media/stories/covers/<file> (+ API_BASE)
 * - інше → повертаємо як є (без насильного мапінгу на /course_image)
 */
export function storyCoverUrl(u?: string | null): string {
  if (!u) return '';
  const v = String(u).trim();

  // Абсолютний URL
  if (/^https?:\/\//i.test(v)) return v;

  // Абсолютні шляхи бекенда
  if (v.startsWith('/media/') || v.startsWith('/static/')) {
    return API_BASE ? joinUrl(API_BASE, v) : v;
  }

  // Відносні шляхи бекенда
  if (v.startsWith('media/') || v.startsWith('static/')) {
    return API_BASE ? joinUrl(API_BASE, v) : '/' + v;
  }

  // Лише ім'я файлу -> стандартна папка історій
  if (!v.includes('/')) {
    const path = `${STORY_COVERS_PREFIX}/${v}`;
    return API_BASE ? joinUrl(API_BASE, path) : path;
  }

  // Інакше лишаємо як є
  return v;
}

/* =========================
   Утиліти для масивів
========================= */

/** Маппер для масиву з полем image (сумісно з попереднім кодом) */
export function mapImages<T extends { image?: string | null }>(items?: T[]) {
  return (items || []).map((x) => ({
    ...x,
    image: mediaUrl(x.image || ''),
  }));
}
