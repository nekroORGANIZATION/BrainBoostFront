// context/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios, { AxiosInstance } from 'axios';

type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture: string | null;
  is_teacher: boolean;
  is_superuser: boolean;
  is_certified_teacher: boolean;
};

type LoginOverload =
  | ((username: string, password: string, remember?: boolean) => Promise<void>) // новий спосіб
  | ((access: string, refresh?: string) => Promise<void>);                      // старий спосіб

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: User | null;
  login: LoginOverload;
  logout: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

const PROFILE_URL = '/accounts/api/profile/';
const LOGIN_URL   = '/accounts/api/login/';
const REFRESH_URL = '/accounts/api/token/refresh/';

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  accessToken: null,
  user: null,
  // заповнюється реальними імплементаціями нижче
  login: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

/* ========= helpers ========= */
const inBrowser = typeof window !== 'undefined';

function getStored(key: 'access'|'refresh'): string | null {
  if (!inBrowser) return null;
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function writeStored(key: 'access'|'refresh', value: string | null, remember: boolean) {
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

/** Дуже простенька перевірка на JWT-подібний рядок */
function looksLikeJwt(token?: string | null) {
  return !!token && token.split('.').length === 3;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [rememberFlag, setRememberFlag] = useState<boolean>(true); // куди писати токени
  const [user, setUser] = useState<User | null>(null);

  // єдиний axios instance з baseURL і авторизацією
  const http: AxiosInstance = useMemo(() => {
    const i = axios.create({
      baseURL: API_BASE,
      headers: { 'Content-Type': 'application/json' },
    });
    return i;
  }, []);

  // підхопити токени при старті
  useEffect(() => {
    const a = getStored('access');
    const r = getStored('refresh');
    setAccessToken(a);
    setRefreshToken(r);

    // визначимо "запам'ятати" за місцем збереження access
    if (inBrowser) {
      const inLocal = localStorage.getItem('access') != null;
      setRememberFlag(inLocal); // true -> localStorage, false -> sessionStorage
    }
  }, []);

  // проставляємо Authorization в інстансі
  useEffect(() => {
    if (accessToken) {
      http.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      delete http.defaults.headers.common['Authorization'];
    }
  }, [http, accessToken]);

  // тягнемо профіль при наявності access
  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      return;
    }
    http.get(PROFILE_URL)
      .then(res => setUser(res.data as User))
      .catch(() => setUser(null));
  }, [http, accessToken]);

  // авто-refresh на 401
  useEffect(() => {
    const id = http.interceptors.response.use(
      (resp) => resp,
      async (error) => {
        const original = error.config;
        if (
          error?.response?.status === 401 &&
          !original._retry &&
          refreshToken
        ) {
          original._retry = true;
          try {
            const res = await axios.post(`${API_BASE}${REFRESH_URL}`, { refresh: refreshToken });
            const newAccess = res.data?.access as string;
            // зберігаємо новий access у ту ж “пам'ять”, що й попередній
            writeStored('access', newAccess, rememberFlag);
            setAccessToken(newAccess);
            http.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
            original.headers['Authorization'] = `Bearer ${newAccess}`;
            return http(original);
          } catch (e) {
            // рефреш не вдалось — розлогін
            logout();
          }
        }
        return Promise.reject(error);
      }
    );
    return () => http.interceptors.response.eject(id);
  }, [http, refreshToken, rememberFlag]);

  /* ========= login (два режими) ========= */
  async function loginImpl(a: string, b?: string, remember?: boolean): Promise<void> {
    // якщо прийшло 3-й аргумент (remember) — це режим username/password
    const isCredentialsMode = typeof remember === 'boolean';

    if (isCredentialsMode) {
      const username = a;
      const password = b ?? '';
      const rememberMe = !!remember;

      const res = await axios.post(`${API_BASE}${LOGIN_URL}`, { username, password });
      const { access, refresh } = res.data as { access: string; refresh: string };

      writeStored('access', access, rememberMe);
      writeStored('refresh', refresh, rememberMe);
      setAccessToken(access);
      setRefreshToken(refresh);
      setRememberFlag(rememberMe);

      http.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      const me = await http.get(PROFILE_URL);
      setUser(me.data as User);
      return;
    }

    // інакше — це режим “старий” із токенами
    const access = a;
    const refresh = b || null;
    const rememberMe = rememberFlag; // залишаємо попередній спосіб збереження

    // якщо дали не-JWT access — сприймемо як помилковий виклик
    if (!looksLikeJwt(access)) {
      throw new Error('login(access, refresh): "access" виглядає некоректно. Або викличте login(username, password, remember).');
    }

    writeStored('access', access, rememberMe);
    if (refresh) writeStored('refresh', refresh, rememberMe);

    setAccessToken(access);
    setRefreshToken(refresh);
    http.defaults.headers.common['Authorization'] = `Bearer ${access}`;

    try {
      const me = await http.get(PROFILE_URL);
      setUser(me.data as User);
    } catch {
      setUser(null);
    }
  }

  // підписи-оверлоади для підказок TS
  const login = loginImpl as AuthContextType['login'];

  function logout() {
    if (inBrowser) {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      sessionStorage.removeItem('access');
      sessionStorage.removeItem('refresh');
    }
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    delete http.defaults.headers.common['Authorization'];
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
