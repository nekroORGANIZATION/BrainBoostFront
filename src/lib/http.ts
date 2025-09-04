// lib/http.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'https://brainboost.pp.ua/api';

export const LOGIN_URL    = '/accounts/api/login/';
export const REGISTER_URL = '/accounts/api/register/';
export const ME_URL       = '/accounts/api/profile/';
export const REFRESH_URL  = '/accounts/api/token/refresh/';

const inBrowser = typeof window !== 'undefined';

// ---- ЄДИНИЙ спосіб прокинути токен в інстанс (ніяких читань зі storage тут!)
let currentAccessHeader: string | null = null;

export function setAuthHeader(token?: string | null) {
  currentAccessHeader = token ? `Bearer ${token}` : null;
  if (currentAccessHeader) {
    (http.defaults.headers as any).Authorization = currentAccessHeader;
  } else {
    if (http.defaults.headers) delete (http.defaults.headers as any).Authorization;
  }
}

const http = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ---- завжди додаємо саме те, що виставив setAuthHeader()
http.interceptors.request.use((config) => {
  if (currentAccessHeader) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = currentAccessHeader;
  }
  return config;
});

// ---- (необов'язково) refresh-логіка, якщо користуєшся refresh-токеном
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function notifyQueue(token: string | null) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

async function refreshAccess(): Promise<string | null> {
  try {
    // якщо ти зберігаєш refresh у storage — прочитай його тут (ОДИН ключ, напр. localStorage['refresh'])
    const refresh = inBrowser ? (sessionStorage.getItem('refresh') ?? localStorage.getItem('refresh')) : null;
    if (!refresh) return null;
    const res = await axios.post(`${API_BASE}${REFRESH_URL}`, { refresh });
    const newAccess = (res.data?.access as string) || null;
    if (newAccess) {
      // поклади в storage (якщо треба) і найголовніше — в setAuthHeader
      if (inBrowser) localStorage.setItem('access', newAccess);
      setAuthHeader(newAccess);
      return newAccess;
    }
  } catch {}
  return null;
}

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean });
    const status = error.response?.status;

    if (status === 401 && !original?._retry) {
      original._retry = true;

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

      try {
        isRefreshing = true;
        const token = await refreshAccess();
        isRefreshing = false;
        notifyQueue(token);

        if (!token) {
          if (inBrowser) {
            localStorage.removeItem('access'); sessionStorage.removeItem('access');
            localStorage.removeItem('refresh'); sessionStorage.removeItem('refresh');
            if (!location.pathname.startsWith('/login')) window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        original.headers = original.headers || {};
        (original.headers as any).Authorization = `Bearer ${token}`;
        return http(original);
      } catch (e) {
        isRefreshing = false;
        notifyQueue(null);
        if (inBrowser) {
          localStorage.removeItem('access'); sessionStorage.removeItem('access');
          localStorage.removeItem('refresh'); sessionStorage.removeItem('refresh');
          if (!location.pathname.startsWith('/login')) window.location.href = '/login';
        }
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default http;
