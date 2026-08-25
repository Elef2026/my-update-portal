import { NextResponse } from "next/server";
import { PrismaClient, OrderStatus } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

// POST: Trigger weekly settlement manually (Admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { weekStartDate, weekEndDate } = await request.json();

    if (!weekStartDate || !weekEndDate) {
      return NextResponse.json({ error: "Missing start or end date" }, { status: 400 });
    }

    const startDate = new Date(weekStartDate);
    const endDate = new Date(weekEndDate);

    // Find all completed orders in this date range
    const orders = await prisma.order.findMany({
      where: {
        status: "DELIVERED_TO_CUSTOMER",
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Group by shopId
    const shopStats: Record<string, { totalEarned: number; totalOwed: number }> = {};

    for (const order of orders) {
      // The shop that gets paid is either the assignedShop (if admin initiated) or the creating shop
      const shopId = order.assignedShopId || order.shopId;
      if (!shopId) continue;

      if (!shopStats[shopId]) {
        shopStats[shopId] = { totalEarned: 0, totalOwed: 0 };
      }

      // Add their earnings for this order
      shopStats[shopId].totalEarned += Number(order.shopEarnings);

      // If they collected cash, they owe the admin the total minus their earnings
      // Wait, if they collected cash, they collected the TOTAL amount. 
      // They keep their earnings, so they owe Admin: totalPaid - shopEarnings
      // Or simply, they owe the admin totalPaid, and admin owes them shopEarnings.
      // Net payout = totalEarned - totalOwed
      if (order.paymentMethod === "CASH_TO_SHOP") {
        shopStats[shopId].totalOwed += Number(order.totalPaid);
      }
    }

    const settlementsCreated = [];

    // Create settlement records
    for (const [shopId, stats] of Object.entries(shopStats)) {
      const netPayout = stats.totalEarned - stats.totalOwed;

      const settlement = await prisma.weeklySettlement.create({
        data: {
          shopId,
          weekStartDate: startDate,
          weekEndDate: endDate,
          totalEarned: stats.totalEarned,
          totalOwed: stats.totalOwed,
          netPayout: netPayout,
          status: "PENDING",
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
