import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopName, email, phone, password } = body;

    if (!shopName || !email || !password) {
      return NextResponse.json(
        { error: "እባክዎን ሁሉንም አስፈላጊ መረጃዎች ያስገቡ (Missing required fields)" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "የይለፍ ቃል ቢያንስ 6 ፊደላት/ቁጥሮች መሆን አለበት (Password must be at least 6 characters)" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "በዚህ ኢሜይል የተመዘገበ ማተሚያ ቤት አስቀድሞ አለ (Shop with this email already exists)" },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create print shop user
    const newShop = await prisma.user.create({
      data: {
        shopName: shopName.trim(),
        email: normalizedEmail,
        passwordHash,
        phone: phone ? phone.trim() : null,
        role: "PRINT_SHOP",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "ማተሚያ ቤቱ በስኬት ተመዝግቧል! አሁን መግባት ይችላሉ። (Shop registered successfully)",
        shop: {
          id: newShop.id,
          shopName: newShop.shopName,
          email: newShop.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering print shop:", error);
    return NextResponse.json(
      { error: "የምዝገባ ስህተት ተፈጥሯል (Internal server error)" },
      { status: 500 }
    );
  }
}
