import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const DEFAULT_SERVICES = [
  { serviceType: "NAME_CHANGE", titleAmharic: "የስም ማስተካከያ", titleEnglish: "Name Change", price: 200, adminCommission: 100, shopCut: 80, copyExpense: 0, isActive: true },
  { serviceType: "NATIONALITY", titleAmharic: "ዜግነት", titleEnglish: "Nationality", price: 150, adminCommission: 75, shopCut: 55, copyExpense: 0, isActive: true },
  { serviceType: "GENDER", titleAmharic: "ፆታ", titleEnglish: "Gender", price: 150, adminCommission: 75, shopCut: 55, copyExpense: 0, isActive: true },
  { serviceType: "DOB", titleAmharic: "የትውልድ ዘመን (እድሜ)", titleEnglish: "DOB", price: 200, adminCommission: 100, shopCut: 80, copyExpense: 0, isActive: true },
  { serviceType: "ADDRESS", titleAmharic: "አድራሻ (ክልል/ዞን/ወረዳ)", titleEnglish: "Address", price: 150, adminCommission: 75, shopCut: 55, copyExpense: 0, isActive: true },
  { serviceType: "PHONE", titleAmharic: "ስልክ ቁጥር", titleEnglish: "Phone Number", price: 100, adminCommission: 50, shopCut: 30, copyExpense: 0, isActive: true },
  { serviceType: "EMAIL", titleAmharic: "ኢሜል (Email)", titleEnglish: "Email", price: 100, adminCommission: 50, shopCut: 30, copyExpense: 0, isActive: true },
  { serviceType: "PO_BOX", titleAmharic: "ፖስታ ሳጥን ቁጥር", titleEnglish: "PO Box", price: 100, adminCommission: 50, shopCut: 30, copyExpense: 0, isActive: true },
  { serviceType: "PHOTO", titleAmharic: "ፎቶ ማስተካከል", titleEnglish: "Photo Update", price: 250, adminCommission: 100, shopCut: 130, copyExpense: 0, isActive: true },
  { serviceType: "FIN_FAN", titleAmharic: "ፊን እና ፋን ማስተካከያ", titleEnglish: "FIN/FAN", price: 150, adminCommission: 75, shopCut: 55, copyExpense: 0, isActive: true },
  { serviceType: "FAIDA_PRINT_ONLY", titleAmharic: "ፋይዳ ፕሪንት ብቻ", titleEnglish: "Faida Print Only", price: 150, adminCommission: 50, shopCut: 80, copyExpense: 0, isActive: true },
  { serviceType: "COURT_ORDER", titleAmharic: "የፍርድ ቤት ውሳኔ", titleEnglish: "Court Order", price: 300, adminCommission: 150, shopCut: 130, copyExpense: 100, isActive: true },
];

export async function GET() {
  try {
    let config = await prisma.serviceConfig.findFirst({
      include: { services: true }
    });

    if (!config) {
      config = await prisma.serviceConfig.create({
        data: {
          serverFee: 10.00,
          smsFee: 10.00,
          shopExtraExpense: 0.00,
          adminExtraExpense: 0.00,
          isFourthFreeDiscount: true,
          freeThreshold: "AFTER_3",
          services: {
            create: DEFAULT_SERVICES as any
          }
        },
        include: { services: true }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching pricing config:", error);
    return NextResponse.json({ error: "Failed to load pricing config" }, { status: 500 });
  }
}

// POST: Save configuration and batch update/create services (Update/Create)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      serverFee = 10, 
      smsFee = 10, 
      shopExtraExpense = 0, 
      adminExtraExpense = 0, 
      isFourthFreeDiscount = true, 
      freeThreshold = "AFTER_3",
      isUnifiedPricing = false,
      unifiedPrice = 300,
      services = [] 
    } = body;

    let config = await prisma.serviceConfig.findFirst();

    if (!config) {
      config = await prisma.serviceConfig.create({
        data: {
          serverFee,
          smsFee,
          shopExtraExpense,
          adminExtraExpense,
          isFourthFreeDiscount,
          freeThreshold,
          isUnifiedPricing,
          unifiedPrice,
        }
      });
    } else {
      config = await prisma.serviceConfig.update({
        where: { id: config.id },
        data: {
          serverFee,
          smsFee,
          shopExtraExpense,
          adminExtraExpense,
          isFourthFreeDiscount,
          freeThreshold,
          isUnifiedPricing,
          unifiedPrice,
        }
      });
    }

    if (Array.isArray(services) && services.length > 0) {
      for (const s of services) {
        await prisma.servicePricing.upsert({
          where: { serviceType: s.serviceType },
          update: {
            titleAmharic: s.titleAmharic || null,
            titleEnglish: s.titleEnglish || null,
            price: Number(s.price),
            adminCommission: Number(s.adminCommission || s.adminCut),
            shopCut: Number(s.shopCut || 50),
            copyExpense: Number(s.copyExpense || 0),
            isActive: s.isActive ?? true,
          },
          create: {
            configId: config.id,
            serviceType: s.serviceType,
            titleAmharic: s.titleAmharic || null,
            titleEnglish: s.titleEnglish || null,
            price: Number(s.price),
            adminCommission: Number(s.adminCommission || s.adminCut),
            shopCut: Number(s.shopCut || 50),
            copyExpense: Number(s.copyExpense || 0),
            isActive: s.isActive ?? true,
          }
        });
      }
    }

    const updatedConfig = await prisma.serviceConfig.findFirst({
      include: { services: true }
    });

    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error) {
    console.error("Error saving pricing config:", error);
    return NextResponse.json({ error: "Failed to save pricing configuration" }, { status: 500 });
  }
}

// DELETE: Remove a service from the pricing table (Delete)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get("serviceType");

    if (!serviceType) {
      return NextResponse.json({ error: "serviceType parameter required" }, { status: 400 });
    }

    await prisma.servicePricing.delete({
      where: { serviceType: serviceType as any }
    });

    return NextResponse.json({ success: true, deleted: serviceType });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
