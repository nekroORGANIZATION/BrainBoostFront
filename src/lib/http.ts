// src/lib/http.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

// ← звір ці шляхи з бекендом і поправ, якщо інші:
export const LOGIN_URL    = '/accounts/api/login/';
export const REGISTER_URL = '/accounts/api/register/';
export const ME_URL       = '/accounts/api/profile/';
export const REFRESH_URL  = '/accounts/api/token/refresh/';

const inBrowser = typeof window !== 'undefined';

/** =================================================================
 *  Єдина “істина” щодо токена в памʼяті. В заголовки його штовхає
 *  лише setAuthHeader(). Запити підстраховуються: якщо токен не
 *  виставлений — спробують дістати зі storage.
 * ================================================================= */
let currentAccessToken: string | null = null;
const AUTH_SCHEME = 'Bearer'; // для SimpleJWT: 'Bearer'; якщо у вас 'JWT' — заміни тут.

export function setAuthHeader(token?: string | null) {
  currentAccessToken = token ?? null;

  if (currentAccessToken) {
    http.defaults.headers.common.Authorization = `${AUTH_SCHEME} ${currentAccessToken}`;
  } else {
    delete http.defaults.headers.common.Authorization;
  }
}

/** Яке сховище містить конкретний ключ (session чи local) */
function whichStorageHas(key: 'access' | 'refresh'): 'session' | 'local' | null {
  if (!inBrowser) return null;
  if (sessionStorage.getItem(key)) return 'session';
  if (localStorage.getItem(key)) return 'local';
  return null;
}

function readStored(key: 'access' | 'refresh'): string | null {
  if (!inBrowser) return null;
  return sessionStorage.getItem(key) ?? localStorage.getItem(key);
}

function writeStored(key: 'access' | 'refresh', val: string | null, prefer: 'session' | 'local' | null) {
  if (!inBrowser) return;
  const target = prefer === 'session' ? sessionStorage : prefer === 'local' ? localStorage : localStorage;
  const other  = target === localStorage ? sessionStorage : localStorage;

  if (val === null) {
    target.removeItem(key);
  } else {
    target.setItem(key, val);
  }
  // Тримаємо копію тільки в одному сховищі
  other.removeItem(key);
}

function clearAllTokens() {
  if (!inBrowser) return;
  localStorage.removeItem('access');  localStorage.removeItem('refresh');
  sessionStorage.removeItem('access'); sessionStorage.removeItem('refresh');
}

/** =================================================================
 *  Axios інстанс
 * ================================================================= */
const http = axios.create({
  baseURL: API_BASE,
  // НЕ задаємо тут Content-Type — нехай Axios сам ставить для JSON/FormData
  withCredentials: false,
});

/** -----------------------------------------------------------------
 *  REQUEST: підстраховка — якщо заголовок не виставили через
 *  setAuthHeader, дістанемо токен зі storage (session → local).
 * ----------------------------------------------------------------- */
http.interceptors.request.use((config) => {
  const hasAuth = !!config.headers?.Authorization;
  if (!hasAuth) {
    if (currentAccessToken) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `${AUTH_SCHEME} ${currentAccessToken}`;
    } else {
      // Легка підстраховка: дістати токен зі storage (щоб перший рендер не ловив 401)
      const stored = readStored('access');
      if (stored) {
        setAuthHeader(stored);
        config.headers = config.headers || {};
        (config.headers as any).Authorization = `${AUTH_SCHEME} ${stored}`;
      }
    }
  }
  return config;
});

/** =================================================================
 *  RESPONSE: refresh-token flow із чергою під час оновлення
 * ================================================================= */
let isRefreshing = false;
let pendingQueue: Array<(tkn: string | null) => void> = [];

function flushQueue(token: string | null) {
  pendingQueue.forEach((cb) => {
    try { cb(token); } catch {}
  });
  pendingQueue = [];
}

async function refreshAccess(): Promise<{ access: string | null, store: 'session' | 'local' | null }> {
  const store = whichStorageHas('refresh');
  const refresh = readStored('refresh');
  if (!refresh) return { access: null, store: null };

  try {
    const res = await axios.post(`${API_BASE}${REFRESH_URL}`, { refresh });
    const newAccess: string | null = res.data?.access || null;
    return { access: newAccess, store };
  } catch {
    return { access: null, store };
  }
}

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean });

    if (status === 401 && !original?._retry) {
      original._retry = true;

      // Якщо вже йде рефреш — підпишемося в чергу
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push((token) => {
            if (!token) return reject(error);
            original.headers = original.headers || {};
            (original.headers as any).Authorization = `${AUTH_SCHEME} ${token}`;
            resolve(http(original));
          });
        });
      }

      isRefreshing = true;

      try {
        const { access: newAccess, store } = await refreshAccess();
        isRefreshing = false;

        if (!newAccess) {
          flushQueue(null);
          clearAllTokens();
          setAuthHeader(null);
          if (inBrowser && !location.pathname.startsWith('/login')) {
            // мʼякий редірект на логін
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        // Зберігаємо оновлений access в те ж сховище, де був refresh
        writeStored('access', newAccess, store);
        setAuthHeader(newAccess);
        flushQueue(newAccess);

        // Повторюємо оригінальний запит з новим токеном
        original.headers = original.headers || {};
        (original.headers as any).Authorization = `${AUTH_SCHEME} ${newAccess}`;
        return http(original);
      } catch (e) {
        isRefreshing = false;
        flushQueue(null);
        clearAllTokens();
        setAuthHeader(null);
        if (inBrowser && !location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(e);
      }
    }

    // інші помилки — далі по ланцюжку
    return Promise.reject(error);
  }
);

export default http;
