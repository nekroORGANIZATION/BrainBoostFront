// src/lib/http.ts
import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  RawAxiosRequestHeaders,
} from 'axios';

/** ===================== Endpoints ===================== */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'https://brainboost.pp.ua/api';

export const LOGIN_URL    = '/accounts/api/login/';
export const REGISTER_URL = '/accounts/api/register/';
export const ME_URL       = '/accounts/api/profile/';
export const REFRESH_URL  = '/accounts/api/token/refresh/';

const inBrowser = typeof window !== 'undefined';

/** ======================================================
 *   Глобальный access header (истина — только тут)
 * ====================================================== */
let currentAccessHeader: string | null = null;

/** Единый способ обновить Authorization в инстансе */
export function setAuthHeader(token?: string | null): void {
  currentAccessHeader = token ? `Bearer ${token}` : null;

  // defaults.headers может быть AxiosHeaders или объект
  const d = http.defaults.headers as unknown;
  const headersAsAxios = d as AxiosHeaders;
  const headersAsRaw = d as RawAxiosRequestHeaders;

  if (currentAccessHeader) {
    if (typeof headersAsAxios.set === 'function') {
      headersAsAxios.set('Authorization', currentAccessHeader);
    } else {
      headersAsRaw.Authorization = currentAccessHeader;
    }
  } else {
    if (typeof headersAsAxios.delete === 'function') {
      headersAsAxios.delete('Authorization');
    } else {
      delete headersAsRaw.Authorization;
    }
  }
}

/** ===================== Axios instance ===================== */
const http = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

/** Всегда подставляем актуальный Authorization */
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (currentAccessHeader) {
      const h = (config.headers ??
        {}) as AxiosHeaders | RawAxiosRequestHeaders;

      if (typeof (h as AxiosHeaders).set === 'function') {
        (h as AxiosHeaders).set('Authorization', currentAccessHeader);
        config.headers = h as InternalAxiosRequestConfig['headers'];
      } else {
        const raw: RawAxiosRequestHeaders = {
          ...(h as RawAxiosRequestHeaders),
          Authorization: currentAccessHeader,
        };
        config.headers = raw as InternalAxiosRequestConfig['headers'];
      }
    }
    return config;
  }
);

/** ===================== Refresh logic (optional) ===================== */
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function notifyQueue(token: string | null): void {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

async function refreshAccess(): Promise<string | null> {
  try {
    // Если refresh хранится в storage — читаем его здесь
    const refresh = inBrowser
      ? sessionStorage.getItem('refresh') ?? localStorage.getItem('refresh')
      : null;

    if (!refresh) return null;

    const res: AxiosResponse<{ access?: string }> = await axios.post(
      `${API_BASE}${REFRESH_URL}`,
      { refresh }
    );

    const newAccess = res.data?.access ?? null;

    if (newAccess) {
      if (inBrowser) localStorage.setItem('access', newAccess);
      setAuthHeader(newAccess);
      return newAccess;
    }
  } catch {
    /* ignore */
  }
  return null;
}

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError): Promise<never | AxiosResponse> => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry) {
      original._retry = true;

      // уже идёт refresh — ждём его
      if (isRefreshing) {
        return new Promise<AxiosResponse>((resolve, reject) => {
          pendingQueue.push((token) => {
            if (!token) {
              reject(error);
              return;
            }
            const existing = (original.headers ??
              {}) as AxiosHeaders | RawAxiosRequestHeaders;

            if (typeof (existing as AxiosHeaders).set === 'function') {
              (existing as AxiosHeaders).set('Authorization', `Bearer ${token}`);
              original.headers = existing;
            } else {
              original.headers = {
                ...(existing as RawAxiosRequestHeaders),
                Authorization: `Bearer ${token}`,
              } as RawAxiosRequestHeaders;
            }
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
            localStorage.removeItem('access');
            sessionStorage.removeItem('access');
            localStorage.removeItem('refresh');
            sessionStorage.removeItem('refresh');
            if (!location.pathname.startsWith('/login')) {
              window.location.href = '/login';
            }
          }
          // пробрасываем исходную ошибку
          return Promise.reject(error);
        }

        const hdrs = (original.headers ??
          {}) as AxiosHeaders | RawAxiosRequestHeaders;
        if (typeof (hdrs as AxiosHeaders).set === 'function') {
          (hdrs as AxiosHeaders).set('Authorization', `Bearer ${token}`);
          original.headers = hdrs;
        } else {
          original.headers = {
            ...(hdrs as RawAxiosRequestHeaders),
            Authorization: `Bearer ${token}`,
          } as RawAxiosRequestHeaders;
        }

        return http(original);
      } catch (e) {
        isRefreshing = false;
        notifyQueue(null);
        if (inBrowser) {
          localStorage.removeItem('access');
          sessionStorage.removeItem('access');
          localStorage.removeItem('refresh');
          sessionStorage.removeItem('refresh');
          if (!location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default http;
