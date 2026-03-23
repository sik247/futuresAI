import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { signInSchema } from "./lib/zod";
import { usersService } from "./lib/services/users/users.service";

export const authOptions: NextAuthOptions = {
  providers: [
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
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.role = token.role;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.email = user.email ?? "";
        token.name = user.name ?? "";
        token.role = (user as { role?: string }).role ?? "USER";
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
