// lib/api.ts

import http, {
  API_BASE,
  LOGIN_URL,
  REGISTER_URL,
  ME_URL,
  REFRESH_URL,
} from './http';


/* =========================
   Token helpers (сумісність)
========================= */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access') || localStorage.getItem('accessToken');
}
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh') || localStorage.getItem('refreshToken');
}
export function setAccessToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access', token);
  localStorage.setItem('accessToken', token);
}
export function setRefreshToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('refresh', token);
  localStorage.setItem('refreshToken', token);
}
export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refresh');
  localStorage.removeItem('refreshToken');
}

/* =========================
   Low-level fetch helpers
   (залишено для сумісності з існуючим кодом)
========================= */
export async function fetchJson(input: RequestInfo, init: RequestInit = {}) {
  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchWithAuth(url: string, init: RequestInit = {}) {
  const token = getAccessToken();
  const headers = {
    ...(init.headers || {}),
    Authorization: token ? `Bearer ${token}` : '',
  };
  return fetch(url, { ...init, headers, cache: 'no-store' });
}

/* =========================
   Media helpers
========================= */
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

/* =========================
   Types
========================= */
export type Category = { id: number; name: string; slug?: string };
export type Course = {
  id: number;
  slug: string;
  title: string;
  description: string;
  price: string; // Decimal як рядок
  author: number | { id: number; username: string };
  language: string;
  topic: string;
  image?: string | null;
  rating: string; // Decimal як рядок
  category?: Category | number | null;
  created_at?: string;
};
export type Profile = {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string | null;
  is_teacher: boolean;
  is_superuser: boolean;
  is_certified_teacher: boolean;
};
export type ReviewPublic = {
  id: number;
  course: number;
  rating: number;
  text: string;
  tags: string;
  video_url: string;
  user_name: string;
  user_avatar: string;
  images: { id: number; image: string }[];
  created_at: string;
};
export type TestStart = {
  attempt_id: number;
  test: { id: number; title: string; time_limit_sec?: number; max_attempts?: number; pass_threshold?: number };
  questions: Array<
    | { id: number; type: 'MC' | 'TF'; text: string; shuffle?: boolean; choices: { id: number; text: string }[] }
    | { id: number; type: 'TXT'; text: string; max_length?: number }
  >;
  started_at: string;
  expires_at?: string | null;
};
export type TestSubmitReq = {
  attempt_id: number;
  answers: Array<
    | { question_id: number; selected_choice_ids?: number[] } // MC
    | { question_id: number; is_true?: boolean }              // TF
    | { question_id: number; text?: string }                  // TXT
  >;
};
export type TestSubmitRes = {
  attempt_id: number;
  test_id: number;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  details: { question_id: number; is_correct: boolean; correct?: string | number[] }[];
};

/* =========================
   Auth API
========================= */
export async function login(username: string, password: string) {
  const { data } = await http.post(LOGIN_URL, { username, password });
  if (data?.access) setAccessToken(data.access);
  if (data?.refresh) setRefreshToken(data.refresh);
  return data;
}

export async function registerUser(
  role: string,
  name: string,
  email: string,
  password: string,
  birthDate: string
) {
  const body = {
    role,
    username: name,
    email,
    password,
    confirm_password: password,
    birth_date: birthDate,
  };
  const { data } = await http.post(REGISTER_URL, body);
  return data;
}

export async function refreshTokenApi(refresh?: string) {
  const r = refresh || getRefreshToken();
  if (!r) throw new Error('No refresh token');
  const { data } = await http.post(REFRESH_URL, { refresh: r });
  if (data?.access) setAccessToken(data.access);
  return data;
}

export async function getProfile(): Promise<Profile> {
  const { data } = await http.get(ME_URL);
  return data;
}

export function logout() {
  clearTokens();
}

/* =========================
   Courses API
========================= */
const COURSES_LIST = '/courses/all/';
const COURSES = '/courses/';
const CATEGORIES = '/courses/all/categories/';

type Paginated<T> = { count: number; results: T[] };

export async function getCourses(params?: Record<string, string | number>) {
  const { data } = await http.get<Paginated<Course>>(COURSES_LIST, { params });
  return data;
}

export async function getCategories() {
  const { data } = await http.get<{ results?: Category[] } | Category[]>(CATEGORIES);
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function getCourse(id: number) {
  const { data } = await http.get<Course>(`${COURSES}${id}/`);
  return data;
}

// Перевага — по slug (якщо бек матиме /courses/by-slug/<slug>/). Інакше — фолбек через список.
export async function getCourseBySlug(slug: string): Promise<Course> {
  try {
    const { data } = await http.get<Course>(`/courses/by-slug/${encodeURIComponent(slug)}/`);
    return data;
  } catch {
    const list = await getCourses({ page_size: 500 });
    const found = list.results.find((c: any) => c.slug === slug);
    if (!found) throw new Error('Course not found by slug');
    return found as Course;
  }
}

export async function createCourse(formData: FormData) {
  // створення курсу (multipart)
  const { data } = await http.post(COURSES, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data as Course;
}

export async function updateCourse(id: number, formData: FormData) {
  const { data } = await http.patch(`${COURSES}${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data as Course;
}

export async function deleteCourse(id: number) {
  await http.delete(`${COURSES}${id}/`);
}

/* =========================
   Reviews (public)
========================= */
export async function getPublicReviews(courseId?: number) {
  const url = courseId
    ? `${API_BASE}/api/reviews/?course=${courseId}`
    : `${API_BASE}/api/reviews/`;

  const raw = await fetchJson(url);
  const arr: ReviewPublic[] = Array.isArray(raw) ? raw : (raw?.results || []);
  return arr.map((r) => ({
    ...r,
    user_avatar: mediaUrl(r.user_avatar),
    images: mapImages(r.images),
  }));
}

/* =========================
   Tests API
========================= */
// старт спроби
export async function startTest(testId: number, courseId: number, lessonId: number) {
  const body = { test_id: testId, course_id: courseId, lesson_id: lessonId };
  const { data } = await http.post<TestStart>(`/api/tests/${testId}/start/`, body);
  return data;
}

// відправка відповідей
export async function submitTest(payload: TestSubmitReq) {
  const { data } = await http.post<TestSubmitRes>(`/api/tests/submit/`, payload);
  return data;
}
