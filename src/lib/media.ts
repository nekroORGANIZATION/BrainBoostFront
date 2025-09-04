// lib/media.ts
import { API_BASE } from './http';

export function isAbsUrl(u?: string) {
  return !!u && (/^https?:\/\//i.test(u) || u.startsWith('data:') || u.startsWith('blob:'));
}
export function mediaUrl(u?: string) {
  if (!u) return '';
  return isAbsUrl(u) ? u : `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`;
}
export function mapImages<T extends { image: string }>(items?: T[]) {
  return (items || []).map((x) => ({ ...x, image: mediaUrl(x.image) }));
}
