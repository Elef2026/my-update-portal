import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
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

        try {
          // 1. Check if user exists in the database
          let user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
          });

          // Master Admin fallback check
          if (credentials.email === "elefachew1144@gmail.com" && credentials.password === "faydaupdate2026") {
            if (!user) {
              const hash = await bcrypt.hash("faydaupdate2026", 10);
              user = await prisma.user.create({
                data: {
                  email: "elefachew1144@gmail.com",
                  passwordHash: hash,
                  role: "ADMIN",
                  shopName: "System Admin",
                  phone: "0911000000",
                }
              });
            }
            return {
              id: user.id,
              email: user.email,
              role: user.role,
              shopName: user.shopName,
            };
          }

          // Default demo print shop fallback check
          if (credentials.email === "shop@portal.com" && credentials.password === "shop123") {
            if (!user) {
              const hash = await bcrypt.hash("shop123", 10);
              user = await prisma.user.create({
                data: {
                  email: "shop@portal.com",
                  passwordHash: hash,
                  role: "PRINT_SHOP",
                  shopName: "አዲስ ህትመት",
                  phone: "0911000000",
                }
              });
            }
            return {
              id: user.id,
              email: user.email,
              role: user.role,
              shopName: user.shopName,
            };
          }

          // 2. Standard Database User check
          if (user && user.passwordHash) {
            const passwordMatch = await bcrypt.compare(credentials.password, user.passwordHash);
            if (passwordMatch) {
              return {
                id: user.id,
                email: user.email,
                role: user.role,
                shopName: user.shopName,
              };
            }
          }
        } catch (error) {
          console.error("Auth database error:", error);
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
