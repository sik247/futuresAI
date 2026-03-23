import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import KakaoProvider from "next-auth/providers/kakao";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { signInSchema } from "./lib/zod";
import { usersService } from "./lib/services/users/users.service";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const { email, password } = await signInSchema.parseAsync(credentials);
        const user = await usersService.login(email, password);
        if (!user) {
          throw new Error("User not found.");
        }
        return user;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Allow credentials login as-is
      if (account?.provider === "credentials") return true;

      // For OAuth, PrismaAdapter handles user/account creation automatically
      return true;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.role = token.role;
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id ?? "";
        token.email = user.email ?? "";
        token.name = user.name ?? "";
        token.role = (user as any).role ?? "USER";
      }
      // For OAuth sign-in, fetch user from DB to get role
      if (account && account.provider !== "credentials") {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
  },
};

/**
 * Server-side session helper — wraps getServerSession(authOptions)
 * so existing `import { auth } from "@/auth"` calls keep working.
 */
export const auth = () => getServerSession(authOptions);
