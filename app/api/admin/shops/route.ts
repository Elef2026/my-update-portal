import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { shopName, email, phone, password } = await request.json();

    if (!shopName || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if shop already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Shop with this email already exists" }, { status: 400 });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create the shop
    const newShop = await prisma.user.create({
      data: {
        shopName,
        email,
        passwordHash,
        phone,
        role: "PRINT_SHOP",
      },
    });

    return NextResponse.json({ 
      success: true, 
      shop: {
        id: newShop.id,
        shopName: newShop.shopName,
        email: newShop.email,
      } 
    });
  } catch (error) {
    console.error("Error creating shop:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
