import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { signInSchema } from "./lib/zod";
import { usersService } from "./lib/services/users/users.service";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    // Telegram login via credentials (bot token verification)
    CredentialsProvider({
      id: "telegram",
      name: "Telegram",
      credentials: {
        id: { label: "Telegram ID", type: "text" },
        first_name: { label: "First Name", type: "text" },
        username: { label: "Username", type: "text" },
        hash: { label: "Hash", type: "text" },
        auth_date: { label: "Auth Date", type: "text" },
      },
      authorize: async (credentials) => {
        if (!credentials?.id || !credentials?.hash) return null;

        // Verify Telegram auth data
        const crypto = require("crypto");
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) return null;

        const secretKey = crypto.createHash("sha256").update(botToken).digest();
        const checkData = Object.entries(credentials)
          .filter(([k]) => k !== "hash" && k !== "callbackUrl" && k !== "csrfToken" && k !== "redirect" && k !== "json")
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}=${v}`)
          .join("\n");

        const hmac = crypto.createHmac("sha256", secretKey).update(checkData).digest("hex");

        if (hmac !== credentials.hash) {
          // In dev, allow without hash verification
          if (process.env.NODE_ENV === "production") return null;
        }

        // Check auth_date is not too old (1 day)
        const authDate = parseInt(credentials.auth_date || "0");
        if (Date.now() / 1000 - authDate > 86400) {
          if (process.env.NODE_ENV === "production") return null;
        }

        const telegramId = credentials.id;
        const name = credentials.first_name || credentials.username || `User ${telegramId}`;
        const email = `tg_${telegramId}@telegram.user`;

        // Find or create user
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name,
              nickname: credentials.username || "",
              role: "USER",
            },
          });
        }

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
    // Email/password login
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
