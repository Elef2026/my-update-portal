import { NextResponse } from "next/server";
import { PrismaClient, OrderStatus } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// POST: Trigger weekly settlement (Admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { weekStartDate, weekEndDate, shopId: targetShopId, receiptUrl } = await request.json();

    const startDate = weekStartDate ? new Date(weekStartDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = weekEndDate ? new Date(weekEndDate) : new Date();

    // Query all orders awaiting settlement that don't already have an approved settlement
    let whereClause: any = {
      status: "PRINTED_AWAITING_SETTLEMENT",
      settlementId: null,
    };

    if (targetShopId) {
      whereClause.OR = [
        { shopId: targetShopId },
        { assignedShopId: targetShopId }
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: "ለዚህ ማተሚያ ቤት የሚወራረድ ምንም ያልተጠናቀቀ ስራ አልተገኘም (No orders awaiting settlement)" }, { status: 400 });
    }

    // Group orders by shop
    const shopOrdersMap: Record<string, typeof orders> = {};

    for (const order of orders) {
      const sId = order.assignedShopId || order.shopId;
      if (!sId) continue;
      if (!shopOrdersMap[sId]) shopOrdersMap[sId] = [];
      shopOrdersMap[sId].push(order);
    }

    const settlementsCreated = [];

    for (const [sId, shopOrdersList] of Object.entries(shopOrdersMap)) {
      let totalShopEarnings = 0;
      let totalCashDebt = 0;
      let totalChapaEarnings = 0;

      for (const o of shopOrdersList) {
        const sEarned = Number(o.shopEarnings || 0);
        const adminCut = Number(o.adminCommission || 0);
        const fees = Number(o.serverFee || 10) + Number(o.smsFee || 10);

        totalShopEarnings += sEarned;

        if (o.paymentMethod === "CASH_TO_SHOP") {
          // Shop collected total customer price in cash. Admin share (adminCut + fees) is debt.
          totalCashDebt += adminCut + fees;
        } else {
          // Admin collected total via Chapa. Shop share (shopEarnings) is payable.
          totalChapaEarnings += sEarned;
        }
      }

      // Net Payout: Positive = Admin pays Shop, Negative = Shop pays Admin
      const netPayout = Number((totalChapaEarnings - totalCashDebt).toFixed(2));

      const settlement = await prisma.weeklySettlement.create({
        data: {
          shopId: sId,
          weekStartDate: startDate,
          weekEndDate: endDate,
          totalEarned: Number(totalShopEarnings.toFixed(2)),
          totalOwed: Number(totalCashDebt.toFixed(2)),
          netPayout,
          receiptUrl: receiptUrl || null,
          status: "PENDING_SHOP_APPROVAL",
          orders: {
            connect: shopOrdersList.map((o) => ({ id: o.id })),
          },
        },
      });

      settlementsCreated.push(settlement);
    }

    return NextResponse.json({ success: true, count: settlementsCreated.length, data: settlementsCreated }, { status: 201 });
  } catch (error) {
    console.error("Error creating settlements:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET: Fetch settlements
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let whereClause: any = {};
    if (session.user.role === "PRINT_SHOP") {
      whereClause = { shopId: session.user.id };
    }

    const settlements = await prisma.weeklySettlement.findMany({
      where: whereClause,
      include: {
        shop: { select: { shopName: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(settlements);
  } catch (error) {
    console.error("Error fetching settlements:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH: Update settlement status (Admin sends money -> PAID_BY_ADMIN, Shop verifies -> COMPLETED)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status, receiptUrl } = await request.json();

    const updateData: any = {};
    if (status) updateData.status = status;
    if (receiptUrl) updateData.receiptUrl = receiptUrl;

    if (session.user.role === "PRINT_SHOP") {
      // Shop can only verify and complete
      if (status === "COMPLETED") {
        updateData.shopVerified = true;
      } else {
        return NextResponse.json({ error: "Unauthorized action" }, { status: 403 });
      }
    }

    const settlement = await prisma.weeklySettlement.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(settlement);
  } catch (error) {
    console.error("Error updating settlement:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
