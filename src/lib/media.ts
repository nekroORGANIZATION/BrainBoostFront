import { API_BASE } from './http';

const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_URL || API_BASE.replace(/\/api\/?$/, '');

export function isAbsUrl(u?: string) {
  return !!u && (/^https?:\/\//i.test(u) || u.startsWith('data:') || u.startsWith('blob:'));
}

export function mediaUrl(u?: string) {
  if (!u) return '';
  return isAbsUrl(u) ? u : `${MEDIA_BASE}${u.startsWith('/') ? '' : '/'}${u}`;
}

export function mapImages<T extends { image: string | null }>(items?: T[]) {
  return (items || []).map((x) => ({ ...x, image: mediaUrl(x.image || '') }));
}
