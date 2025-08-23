// lib/http.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

// ---- auth endpoints (єдині джерела правди)
export const LOGIN_URL   = '/accounts/api/login/';
export const REGISTER_URL= '/accounts/api/register/';
export const ME_URL      = '/accounts/api/profile/';
export const REFRESH_URL = '/accounts/api/token/refresh/';

const http = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ---- додавання access у кожен запит
http.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const access = localStorage.getItem('access');
    if (access) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${access}`;
    }
  }
  return config;
});

// ---- координація одночасних refresh-запитів
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function notifyQueue(token: string | null) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

async function refreshAccess(): Promise<string | null> {
  const refresh = (typeof window !== 'undefined') ? localStorage.getItem('refresh') : null;
  if (!refresh) return null;

  // важливо: напряму через axios, щоб не зловити інтерцепторів http та рекурсію
  const res = await axios.post(`${API_BASE}${REFRESH_URL}`, { refresh });
  const newAccess = res.data?.access as string | undefined;
  if (newAccess) {
    localStorage.setItem('access', newAccess);
    return newAccess;
  }
  return null;
}

// ---- авто-повтор при 401
http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean });
    const status = error.response?.status;

    if (status === 401 && !original?._retry) {
      original._retry = true;

      // Якщо інший refresh вже в процесі — чекаємо
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push((token) => {
            if (!token) return reject(error);
            original.headers = original.headers || {};
            (original.headers as any).Authorization = `Bearer ${token}`;
            resolve(http(original));
          });
        });
      }

      // Інакше запускаємо refresh самі
      try {
        isRefreshing = true;
        const token = await refreshAccess();
        isRefreshing = false;
        notifyQueue(token);

        if (!token) {
          // refresh провалився — чистимо і ведемо на /login
          if (typeof window !== 'undefined') {
            localStorage.clear();
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        original.headers = original.headers || {};
        (original.headers as any).Authorization = `Bearer ${token}`;
        return http(original);
      } catch (e) {
        isRefreshing = false;
        notifyQueue(null);
        if (typeof window !== 'undefined') {
          localStorage.clear();
          window.location.href = '/login';
        }
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default http;
