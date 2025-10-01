// lib/media.ts
import { API_BASE } from './http';

/** Вытаскиваем origin из API_BASE (https://host[:port]) */
function getOrigin(url?: string) {
  try {
    if (!url) return '';
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return '';
  }
}

const API_ORIGIN = getOrigin(API_BASE);

/**
 * Где лежат медиа/статика (origin бэкенда, без /api).
 * Задай в .env.local:
 *   NEXT_PUBLIC_MEDIA_URL=https://brainboost.pp.ua
 * Локально:
 *   NEXT_PUBLIC_MEDIA_URL=http://127.0.0.1:8000
 */
const MEDIA_ORIGIN =
  process.env.NEXT_PUBLIC_MEDIA_URL || API_ORIGIN.replace(/\/api\/?$/, '') || '';

/** Префиксы можно переопределить в .env при желании */
const MEDIA_PREFIX = process.env.NEXT_PUBLIC_MEDIA_PREFIX || '/media';
const STATIC_PREFIX = process.env.NEXT_PUBLIC_STATIC_PREFIX || '/static';

export function isAbsUrl(u?: string) {
  return !!u && (/^https?:\/\//i.test(u) || u.startsWith('data:') || u.startsWith('blob:'));
}

/**
 * Делает абсолютный URL к картинке.
 * Обрабатывает:
 *  - абсолютные http(s) / data / blob — возвращает как есть
 *  - '/media/...', 'media/...'
 *  - '/static/...', 'static/...'
 *  - 'course_image/...' и прочие относительные — префиксует '/media/'
 */
export function mediaUrl(u?: string | null): string {
  if (!u) return '';
  const s = u.trim();
  if (isAbsUrl(s)) return s;

  // Уже с ведущим /media|/static
  if (s.startsWith(`${MEDIA_PREFIX}/`)) return `${MEDIA_ORIGIN}${s}`;
  if (s.startsWith(`${STATIC_PREFIX}/`)) return `${MEDIA_ORIGIN}${s}`;

  // Без ведущего слеша: 'media/...', 'static/...'
  if (s.startsWith('media/')) return `${MEDIA_ORIGIN}/${s}`;
  if (s.startsWith('static/')) return `${MEDIA_ORIGIN}/${s}`;

  // Если прислали корневой путь, но не media/static — считаем это валидным корнем
  if (s.startsWith('/')) return `${MEDIA_ORIGIN}${s}`;

  // Обычный относительный путь типа 'course_image/xxx.jpg'
  // — по умолчанию кладём под /media
  return `${MEDIA_ORIGIN}${MEDIA_PREFIX}/${s}`;
}

export function mapImages<T extends { image?: string | null }>(items?: T[]) {
  return (items || []).map((x) => ({ ...x, image: mediaUrl(x.image || '') }));
}
