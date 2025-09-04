// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://brainboost.pp.ua/api';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    /**
     * Серверный колбек входа. Никакого localStorage здесь быть не должно.
     * Если почты нет — отклоняем вход.
     */
    async signIn({ user }: { user: { email?: string | null } }) {
      const email = user?.email ?? null;
      if (!email) return false;

      try {
        // дергаем ваш бэкенд, чтобы он создал/синхронизировал пользователя
        await axios.post(`${API_BASE}/accounts/api/google-login/`, { email });
        return true;
      } catch (err) {
        console.error('Google sign-in failed:', err);
        return false;
      }
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
