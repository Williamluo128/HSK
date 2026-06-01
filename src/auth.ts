import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours, matching legacy checkbrute()

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const member = await prisma.member.findUnique({
          where: { email },
          include: { account: true },
        });
        if (!member) return null;

        // Brute-force protection: too many recent failures locks the account.
        const since = new Date(Date.now() - WINDOW_MS);
        const recentFailures = await prisma.loginAttempt.count({
          where: { userId: member.id, attemptedAt: { gt: since } },
        });
        if (recentFailures >= MAX_ATTEMPTS) return null;

        const valid = await verifyPassword(password, member.password);
        if (!valid) {
          await prisma.loginAttempt.create({ data: { userId: member.id } });
          return null;
        }

        // Successful login — clear the failure counter.
        await prisma.loginAttempt.deleteMany({ where: { userId: member.id } });

        return {
          id: String(member.id),
          email: member.email,
          name: member.username,
          username: member.username,
          memberLevel: member.account?.memberLevel ?? 0,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.username = user.username;
        token.memberLevel = user.memberLevel;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      session.user.memberLevel = (token.memberLevel as number) ?? 0;
      return session;
    },
  },
});
