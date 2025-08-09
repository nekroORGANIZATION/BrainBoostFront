import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      console.log("🔑 Вход через Google:", user);

      try {
        const res = await axios.post("http://127.0.0.1:8000/accounts/api/google-login/", {
          email: user.email,
        });

        const data = res.data;

        if (typeof window !== "undefined") {
          localStorage.setItem("access", data.access);
          localStorage.setItem("refresh", data.refresh);
        }

        return true;
      } catch (err) {
        console.error("❌ Ошибка входа через Google:", err);
        return false;
      }
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
