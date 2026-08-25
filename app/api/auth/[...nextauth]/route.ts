import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";

import { AuthOptions } from "next-auth";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "shop@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // ==========================================
        // MOCK CREDENTIALS FOR TESTING WITHOUT DB
        // ==========================================
        if (credentials.email === "admin@portal.com" && credentials.password === "admin123") {
          return {
            id: "admin-1",
            email: "admin@portal.com",
            role: "ADMIN",
            shopName: "System Admin",
          };
        }

        if (credentials.email === "shop@portal.com" && credentials.password === "shop123") {
          return {
            id: "shop-1",
            email: "shop@portal.com",
            role: "PRINT_SHOP",
            shopName: "አዲስ ህትመት",
          };
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
          });

          if (user) {
            return {
              id: user.id,
              email: user.email,
              role: user.role,
              shopName: user.shopName,
            };
          }
        } catch (error) {
          console.log("Database not configured yet, using mock users.");
        }
        
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as "ADMIN" | "PRINT_SHOP";
        token.shopName = user.shopName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.shopName = token.shopName;
      }
      return session;
    }
  },
  pages: {
    signIn: "/en/login", // Redirect to our custom login page
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-dev",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
