import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Default services seed
const DEFAULT_SERVICES = [
  { serviceType: "NAME_CHANGE", price: 200, adminCommission: 100, shopCut: 80, copyExpense: 0, isActive: true },
  { serviceType: "NATIONALITY", price: 150, adminCommission: 75, shopCut: 55, copyExpense: 0, isActive: true },
  { serviceType: "GENDER", price: 150, adminCommission: 75, shopCut: 55, copyExpense: 0, isActive: true },
  { serviceType: "DOB", price: 200, adminCommission: 100, shopCut: 80, copyExpense: 0, isActive: true },
  { serviceType: "ADDRESS", price: 150, adminCommission: 75, shopCut: 55, copyExpense: 0, isActive: true },
  { serviceType: "PHONE", price: 100, adminCommission: 50, shopCut: 30, copyExpense: 0, isActive: true },
  { serviceType: "EMAIL", price: 100, adminCommission: 50, shopCut: 30, copyExpense: 0, isActive: true },
  { serviceType: "PO_BOX", price: 100, adminCommission: 50, shopCut: 30, copyExpense: 0, isActive: true },
  { serviceType: "PHOTO", price: 250, adminCommission: 100, shopCut: 130, copyExpense: 0, isActive: true },
  { serviceType: "FIN_FAN", price: 150, adminCommission: 75, shopCut: 55, copyExpense: 0, isActive: true },
  { serviceType: "FAIDA_PRINT_ONLY", price: 150, adminCommission: 50, shopCut: 80, copyExpense: 0, isActive: true },
  { serviceType: "COURT_ORDER", price: 300, adminCommission: 150, shopCut: 130, copyExpense: 100, isActive: true },
];

export async function GET() {
  try {
    let config = await prisma.serviceConfig.findFirst({
      include: { services: true }
    });

    if (!config) {
      // Seed default config and services if DB is empty
      config = await prisma.serviceConfig.create({
        data: {
          serverFee: 10.00,
          smsFee: 10.00,
          shopExtraExpense: 0.00,
          adminExtraExpense: 0.00,
          isFourthFreeDiscount: true,
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
          isUnifiedPricing,
          unifiedPrice,
        }
      });
    }

    // Update each service pricing row
    if (Array.isArray(services) && services.length > 0) {
      for (const s of services) {
        await prisma.servicePricing.upsert({
          where: { serviceType: s.serviceType },
          update: {
            price: Number(s.price),
            adminCommission: Number(s.adminCommission || s.adminCut),
            shopCut: Number(s.shopCut || 50),
            copyExpense: Number(s.copyExpense || 0),
            isActive: s.isActive ?? true,
          },
          create: {
            configId: config.id,
            serviceType: s.serviceType,
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
