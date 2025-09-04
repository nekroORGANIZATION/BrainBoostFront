// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState as _useState } from 'react';
import axios from 'axios';
import http, { API_BASE, ME_URL, LOGIN_URL } from '@/lib/http';
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
  // новий спосіб: креди + прапорець remember
  ((username: string, password: string, remember?: boolean) => Promise<void>) |
  // старий спосіб: готові токени
  ((access: string, refresh?: string | null) => Promise<void>);

export interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: User | null;
  login: LoginOverload;
  logout: () => void;
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
});

export const useAuth = () => useContext(AuthContext);

/* =========================
   Helpers (storage)
========================= */
const inBrowser = typeof window !== 'undefined';

function readStored(key: 'access' | 'refresh'): string | null {
  if (!inBrowser) return null;
  // спершу шукаємо в sessionStorage, потім у localStorage
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
    other.removeItem(key); // тримаємо токен лише в одному місці
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

/* =========================
   Provider
========================= */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken]   = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [rememberFlag, setRememberFlag] = useState<boolean>(true);
  const [user, setUser]                 = useState<User | null>(null);

  // 1) Старт: синхронно підхопити токени та ОДРАЗУ прокинути їх в axios через setAuthHeader
  useEffect(() => {
    const a = readStored('access');
    const r = readStored('refresh');
    setAccessToken(a);
    setRefreshToken(r);
    // якщо токен у localStorage — вважаємо "remember = true"
    if (inBrowser) setRememberFlag(localStorage.getItem('access') != null);
    // критично: відразу в http, щоб перші запити мали Authorization
    setAuthHeader(a || null);
  }, []);

  // 2) Будь-яка зміна accessToken → оновлюємо заголовок інстанса
  useEffect(() => {
    setAuthHeader(accessToken || null);
  }, [accessToken]);

  // 3) Тягнемо профіль, коли зʼявився access
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

    // Режим 1: логін по username/password (+ remember)
    if (isCredentialsMode) {
      const username   = a;
      const password   = b ?? '';
      const rememberMe = !!remember;

      // логінимось БЕЗ інтерцептора (через axios напряму або той же http — вже не принципово)
      const res  = await axios.post(`${API_BASE}${LOGIN_URL}`, { username, password });
      const data = res.data || {};

      // підтримуємо різні формати відповіді
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

      // зберегти в storage згідно remember
      writeStored('access', access, rememberMe);
      if (refresh) writeStored('refresh', refresh, rememberMe);

      // в памʼять та в axios
      setAuthHeader(access);
      setAccessToken(access);
      setRefreshToken(refresh);
      setRememberFlag(rememberMe);

      // перший прогрів профілю
      try {
        const me = await http.get(ME_URL);
        setUser(me.data as User);
      } catch {
        setUser(null);
      }
      return;
    }

    // Режим 2: старий API — передають готові токени
    const access  = a;
    const refresh = b || null;

    if (!looksLikeJwt(access)) {
      throw new Error('login(access, refresh): "access" некоректний. Викличте login(username, password, remember).');
    }

    // використовуємо поточний rememberFlag (де вже лежать токени — там і лишаємо)
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
