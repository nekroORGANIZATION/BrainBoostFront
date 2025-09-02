import NextAuth, { type AuthOptions, type User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";

export interface ICustomUser {
  id: number;
  username: string;
  email?: string;
  is_email_verified: boolean;
  is_teacher: boolean;
  is_certified_teacher?: boolean | null;
  profile_picture?: string | null;
  groups?: Array<{
    id: number;
    name: string;
  }>;
  user_permissions?: Array<{
    id: number;
    name: string;
    codename: string;
  }>;
}

const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn(params) {
      const user = params.user as User & ICustomUser;
      console.log("Вхід через Google:", user);

      try {
        const res = await axios.post("http://172.17.10.22:8000/accounts/api/google-login/", {
          email: user.email,
        });

        const data = res.data;

        if (typeof window !== "undefined") {
          localStorage.setItem("access", data.access);
          localStorage.setItem("refresh", data.refresh);
        }

        return true;
      } catch (err) {
        console.error("Помилка входу через Google:", err);
        return false;
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
