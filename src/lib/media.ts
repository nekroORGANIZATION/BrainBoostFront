// lib/media.ts

/** Проверка абсолютного URL */
export function isAbsUrl(u?: string) {
  return !!u && /^https?:\/\//i.test(u);
}

/** Достаём только имя файла из пути */
function basename(path?: string | null): string {
  if (!path) return '';
  try {
    if (/^https?:\/\//i.test(path)) {
      const u = new URL(path);
      return u.pathname.split('/').filter(Boolean).pop() || '';
    }
    const parts = path.split('/').filter(Boolean);
    return parts.pop() || '';
  } catch {
    const parts = String(path).split('/').filter(Boolean);
    return parts.pop() || '';
  }
}

/**
 * Строим путь к локальной статике (public/course_image)
 */
export function mediaUrl(u?: string | null): string {
  const file = basename(u);
  if (!file) return '';
  return `/course_image/${file}`;
}

/** Маппер для массивов */
export function mapImages<T extends { image?: string | null }>(items?: T[]) {
  return (items || []).map((x) => ({
    ...x,
    image: mediaUrl(x.image || ''),
  }));
}
