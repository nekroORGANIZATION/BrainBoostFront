'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import http, { API_BASE, ME_URL, LOGIN_URL, REFRESH_URL } from '@/lib/http';
import { setAuthHeader } from '@/lib/http';

/* =========================
   Типи
========================= */
export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  profile_picture: string | null;
  is_teacher: boolean;
  is_superuser: boolean;
  is_certified_teacher: boolean;
};

type LoginOverload =
  ((username: string, password: string, remember?: boolean) => Promise<void>) |
  ((access: string, refresh?: string | null) => Promise<void>);

export interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: User | null;
  login: LoginOverload;
  logout: () => void;
  /** Контекст начитался и синхронизировался с хранилищами */
  bootstrapped: boolean;
}

/* =========================
   Контекст
========================= */
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  accessToken: null,
  user: null,
  login: async () => {},
  logout: () => {},
  bootstrapped: false,
});

export const useAuth = () => useContext(AuthContext);

/* =========================
   Helpers (storage)
========================= */
const inBrowser = typeof window !== 'undefined';

function readStored(key: 'access' | 'refresh'): string | null {
  if (!inBrowser) return null;
  return sessionStorage.getItem(key) ?? localStorage.getItem(key);
}

/** Куди писати токени — в local чи session — вирішуємо прапорцем remember */
function writeStored(key: 'access' | 'refresh', value: string | null, remember: boolean) {
  if (!inBrowser) return;
  const target = remember ? localStorage : sessionStorage;
  const other  = remember ? sessionStorage : localStorage;

  if (value === null) {
    target.removeItem(key);
    other.removeItem(key);
  } else {
    target.setItem(key, value);
    other.removeItem(key);
  }
}

function clearAllTokens() {
  if (!inBrowser) return;
  localStorage.removeItem('access');  localStorage.removeItem('refresh');
  sessionStorage.removeItem('access'); sessionStorage.removeItem('refresh');
}

function looksLikeJwt(t?: string | null) {
  return !!t && t.split('.').length === 3;
}

/** Визначаємо, чи "remember" був true, дивлячись де лежить refresh */
function rememberFromRefreshStorage(): boolean {
  if (!inBrowser) return true;
  return localStorage.getItem('refresh') != null;
}

/* =========================
   Provider
========================= */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken]   = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [rememberFlag, setRememberFlag] = useState<boolean>(true);
  const [user, setUser]                 = useState<User | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  // 1) Первичная инициализация токенов и возможный refresh
  useEffect(() => {
    const a = readStored('access');
    const r = readStored('refresh');

    setAccessToken(a);
    setRefreshToken(r);
    if (inBrowser) setRememberFlag(rememberFromRefreshStorage());
    setAuthHeader(a || null);

    (async () => {
      try {
        if (!a && r) {
          const res = await axios.post(`${API_BASE}${REFRESH_URL}`, { refresh: r });
          const newAccess: string | null = res.data?.access || null;

          if (newAccess && looksLikeJwt(newAccess)) {
            const remember = rememberFromRefreshStorage();
            writeStored('access', newAccess, remember);
            setAuthHeader(newAccess);
            setAccessToken(newAccess);
            setRememberFlag(remember);
          } else {
            clearAllTokens();
            setAuthHeader(null);
            setAccessToken(null);
            setRefreshToken(null);
            setUser(null);
          }
        }
      } catch {
        clearAllTokens();
        setAuthHeader(null);
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
      } finally {
        setBootstrapped(true);
      }
    })();
  }, []);

  // 2) Быстрая автосинхронизация на случай, когда после логина сделали router.replace('/profile'),
  //    но login-page НЕ вызывает контекстный login()
  useEffect(() => {
    if (!inBrowser) return;
    // короткий "мягкий" поллинг в первые 2 секунды после монтирования,
    // чтобы подхватить токены, записанные страницей логина перед редиректом
    let ticks = 0;
    const id = window.setInterval(() => {
      ticks++;
      const a = readStored('access');
      const r = readStored('refresh');
      if (a && a !== accessToken) {
        setAccessToken(a);
        setAuthHeader(a);
      }
      if (r && r !== refreshToken) {
        setRefreshToken(r);
      }
      if (ticks >= 10 || a) {
        window.clearInterval(id);
      }
    }, 200);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3) Любая смена accessToken → обновляем заголовок http-инстанса
  useEffect(() => {
    setAuthHeader(accessToken || null);
  }, [accessToken]);

  // 4) Тянем профайл, когда появился access
  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      return;
    }
    http
      .get(ME_URL)
      .then(res => setUser(res.data as User))
      .catch(() => setUser(null));
  }, [accessToken]);

  /* =========================
     login (два режими)
  ========================= */
  async function loginImpl(a: string, b?: string, remember?: boolean): Promise<void> {
    const isCredentialsMode = typeof remember === 'boolean';

    if (isCredentialsMode) {
      const username   = a;
      const password   = b ?? '';
      const rememberMe = !!remember;

      const res  = await axios.post(`${API_BASE}${LOGIN_URL}`, { username, password });
      const data = res.data || {};

      const access =
        data.access ??
        data.access_token ??
        data?.tokens?.access ??
        null;

      const refresh =
        data.refresh ??
        data.refresh_token ??
        data?.tokens?.refresh ??
        null;

      if (!looksLikeJwt(access)) {
        clearAllTokens();
        setAuthHeader(null);
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        throw new Error('Сервер не повернув коректний JWT access-токен.');
      }

      writeStored('access', access, rememberMe);
      if (refresh) writeStored('refresh', refresh, rememberMe);

      setAuthHeader(access);
      setAccessToken(access);
      setRefreshToken(refresh);
      setRememberFlag(rememberMe);

      try {
        const me = await http.get(ME_URL);
        setUser(me.data as User);
      } catch {
        setUser(null);
      }
      return;
    }

    // Старый режим — готовые токены
    const access  = a;
    const refresh = b || null;

    if (!looksLikeJwt(access)) {
      throw new Error('login(access, refresh): "access" некоректний. Викличте login(username, password, remember).');
    }

    writeStored('access', access, rememberFlag);
    if (refresh) writeStored('refresh', refresh, rememberFlag);

    setAuthHeader(access);
    setAccessToken(access);
    setRefreshToken(refresh);

    try {
      const me = await http.get(ME_URL);
      setUser(me.data as User);
    } catch {
      setUser(null);
    }
  }

  const login = loginImpl as AuthContextType['login'];

  function logout() {
    clearAllTokens();
    setAuthHeader(null);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!accessToken,
        accessToken,
        user,
        login,
        logout,
        bootstrapped,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
