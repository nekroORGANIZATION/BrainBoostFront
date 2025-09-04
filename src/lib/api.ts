// src/lib/api.ts
import http, { API_BASE, LOGIN_URL, ME_URL } from './http';

/** Универсальная пагинация (DRF-стиль) */
type Paginated<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
};

/** Безопасно достаём список из ответа (поддерживает Array и Paginated<T>) */
function extractList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && 'results' in (payload as Record<string, unknown>)) {
    const p = payload as Paginated<T>;
    return Array.isArray(p.results) ? p.results : [];
  }
  return [];
}

/** ------- auth & profile ------- */
type LoginResponse = { access?: string; refresh?: string } & Record<string, unknown>;

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>(LOGIN_URL, { username, password });
  if (typeof window !== 'undefined') {
    if (data?.access) localStorage.setItem('access', data.access);
    if (data?.refresh) localStorage.setItem('refresh', data.refresh);
  }
  return data;
}

export async function getProfile<T = unknown>(): Promise<T> {
  const { data } = await http.get<T>(ME_URL);
  return data;
}

/** ------- reviews (public) ------- */
export async function getPublicReviews<T = unknown>(courseId?: number): Promise<T[]> {
  const url = courseId
    ? `${API_BASE}/api/reviews/?course=${courseId}`
    : `${API_BASE}/api/reviews/`;
  const { data } = await http.get<unknown>(url);
  return extractList<T>(data);
}

/** ------- purchased courses (me) ------- */
type PurchasedItem = { course?: unknown };

export async function getMyPurchased<T = unknown>(): Promise<T[]> {
  const { data } = await http.get<unknown>('/courses/me/purchased/');
  const items = extractList<PurchasedItem>(data);
  return items
    .map((p) => p.course)
    .filter((c): c is T => c != null);
}

/** ------- reviews (admin) ------- */
export async function createReview(payload: {
  course: number;
  rating: number;
  text: string;
  video_url?: string;
}) {
  const { data } = await http.post(`${API_BASE}/api/reviews/create/`, payload);
  return data as unknown;
}

export async function adminListReviews<T = unknown>(): Promise<T[]> {
  const { data } = await http.get<unknown>(`${API_BASE}/api/reviews/admin/`);
  return extractList<T>(data);
}

export async function adminModerateReview(
  id: number,
  body: { status: 'approved' | 'rejected' | 'pending'; moderation_reason?: string }
) {
  const { data } = await http.patch(`${API_BASE}/api/reviews/${id}/moderate/`, body);
  return data as unknown;
}

export async function adminDeleteReview(id: number): Promise<void> {
  await http.delete(`${API_BASE}/api/reviews/${id}/`);
}
