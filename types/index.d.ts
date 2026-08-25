import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

// Extend NextAuth Session to include user Role and ID
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "PRINT_SHOP";
      shopName?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "ADMIN" | "PRINT_SHOP";
    shopName?: string | null;
  }
}

// Extend NextAuth JWT
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: "ADMIN" | "PRINT_SHOP";
    shopName?: string | null;
  }
}

// Global Interfaces for JSONB data stored in Prisma
export interface DocumentData {
  amharicName?: string;
  englishName?: string;
  dob?: string;
  nationality?: string;
  gender?: "MALE" | "FEMALE";
  addressRegion?: string;
  addressZone?: string;
  addressWoreda?: string;
  phone?: string;
  email?: string;
  poBox?: string;
  fin?: string;
  fan?: string;
  [key: string]: any; // Allow extensibility
}
