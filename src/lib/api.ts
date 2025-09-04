// lib/api.ts
import http, { API_BASE, LOGIN_URL, REGISTER_URL, ME_URL, REFRESH_URL } from './http';

export async function login(username: string, password: string) {
  const { data } = await http.post(LOGIN_URL, { username, password });
  if (typeof window !== 'undefined') {
    if (data?.access) localStorage.setItem('access', data.access);
    if (data?.refresh) localStorage.setItem('refresh', data.refresh);
  }
  return data;
}

export async function getProfile() {
  const { data } = await http.get(ME_URL);
  return data;
}

// Публічні відгуки
export async function getPublicReviews(courseId?: number) {
  const url = courseId ? `${API_BASE}/api/reviews/?course=${courseId}` : `${API_BASE}/api/reviews/`;
  const { data } = await http.get(url);
  return Array.isArray(data) ? data : (data?.results || []);
}

// Куплені курси користувача
export async function getMyPurchased() {
  const { data } = await http.get('/courses/me/purchased/');
  const list = Array.isArray(data) ? data : (data?.results || []);
  return list.map((p: any) => p.course).filter(Boolean);
}

// Створити відгук
export async function createReview(payload: { course: number; rating: number; text: string; video_url?: string }) {
  const { data } = await http.post('/api/reviews/create/', payload);
  return data;
}

// Адмін: список / модерація / видалення
export async function adminListReviews() {
  const { data } = await http.get('/api/reviews/admin/');
  return Array.isArray(data) ? data : (data?.results || []);
}
export async function adminModerateReview(id: number, body: { status: 'approved'|'rejected'|'pending'; moderation_reason?: string }) {
  const { data } = await http.patch(`/api/reviews/${id}/moderate/`, body);
  return data;
}
export async function adminDeleteReview(id: number) {
  await http.delete(`/api/reviews/${id}/`);
}
