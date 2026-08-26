"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. ማተሚያ ቤቱ "ፕሪንት አድርጌያለሁ" ሲል ገቢው በይፋ ይመዘገባል
export async function confirmPrintedAndLogRevenue(orderId: string, shopId: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.shopId !== shopId) {
      return { success: false, error: "ትዕዛዙ አልተገኘም ወይም ፈቃድ የለዎትም" };
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PRINTED_AWAITING_SETTLEMENT",
        printedAt: new Date(),
      },
    });

    revalidatePath("/am/shop/print-queue");
    revalidatePath("/am/shop/settlements");
    revalidatePath("/am/shop/history");
    return { success: true, order: updated };
  } catch (error) {
    console.error("Error logging print revenue:", error);
    return { success: false, error: "የህትመት ገቢውን መመዝገብ አልተቻለም" };
  }
}

// 2. አድሚን ስራን በምክንያት ውድቅ ሲያደርግ (Reject Task with Mandatory Reason)
export async function rejectTaskWithReason(orderId: string, reason: string) {
  try {
    if (!reason || reason.trim().length === 0) {
      return { success: false, error: "የውድቅ ማድረጊያ ምክንያት ማስገባት ግዴታ ነው" };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "REJECTED",
        rejectionReason: reason.trim(),
        rejectedAt: new Date(),
      },
    });

    revalidatePath("/am/admin/tasks");
    revalidatePath("/am/admin/in-progress");
    revalidatePath("/am/shop/history");
    revalidatePath("/am/shop/refunds");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting task:", error);
    return { success: false, error: "ስራውን ውድቅ ማድረግ አልተቻለም" };
  }
}

// 3. አድሚኑ እሁድ ሂሳብ አስልቶ ደረሰኝ ሲልክ (Sunday Settlement Dispatch)
export async function generateSundaySettlement(
  shopId: string,
  weekStartDate?: Date,
  weekEndDate?: Date,
  receiptUrl?: string
) {
  try {
    const startDate = weekStartDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = weekEndDate || new Date();

    // በሳምንቱ ውስጥ ተጠናቀው ክፍያ የሚጠብቁትን ስራዎች በሙሉ ማምጣት
    const eligibleOrders = await prisma.order.findMany({
      where: {
        OR: [{ shopId }, { assignedShopId: shopId }],
        status: "PRINTED_AWAITING_SETTLEMENT",
        settlementId: null,
      },
    });

    if (eligibleOrders.length === 0) {
      return { success: false, error: "ለዚህ ማተሚያ ቤት የሚወራረድ ምንም ያልተጠናቀቀ ስራ አልተገኘም" };
    }

    let totalShopEarnings = 0;
    let totalCashCollected = 0;
    let totalChapaEarnings = 0;

    for (const o of eligibleOrders) {
      const shopEarning = Number(o.shopEarnings || 0);
      const adminCut = Number(o.adminCommission || 0);
      const fees = Number(o.smsFee || 10) + Number(o.serverFee || 10);

      totalShopEarnings += shopEarning;

      if (o.paymentMethod === "CASH_TO_SHOP") {
        totalCashCollected += adminCut + fees;
      } else {
        totalChapaEarnings += shopEarning;
      }
    }

    const netPayout = Number((totalChapaEarnings - totalCashCollected).toFixed(2));

    const settlement = await prisma.weeklySettlement.create({
      data: {
        shopId,
        weekStartDate: startDate,
        weekEndDate: endDate,
        totalEarned: Number(totalShopEarnings.toFixed(2)),
        totalOwed: Number(totalCashCollected.toFixed(2)),
        netPayout,
        receiptUrl: receiptUrl || null,
        status: "PENDING_SHOP_APPROVAL",
        orders: {
          connect: eligibleOrders.map((o) => ({ id: o.id })),
        },
      },
    });

    revalidatePath("/am/admin/settlements");
    revalidatePath("/am/shop/settlements");
    revalidatePath("/am/admin/completed");
    revalidatePath("/am/shop/completed");
    return { success: true, settlementId: settlement.id };
  } catch (error) {
    console.error("Error generating settlement:", error);
    return { success: false, error: "ማወራረድያውን ማመንጨት አልተቻለም" };
  }
}

// 4. ማተሚያ ቤቱ ደረሰኙን አጽድቆ ስራዎቹን ወደ 'Old Completed' ማህደር ሲያዛውር (Strict Archive Approval)
export async function approveReceiptAndArchive(settlementId: string, shopId: string) {
  try {
    const settlement = await prisma.weeklySettlement.findFirst({
      where: { id: settlementId, shopId, status: "PENDING_SHOP_APPROVAL" },
    });

    if (!settlement) {
      return { success: false, error: "ማወራረድያው አልተገኘም ወይም አስቀድሞ ጸድቋል" };
    }

    await prisma.$transaction([
      prisma.weeklySettlement.update({
        where: { id: settlementId },
        data: {
          status: "APPROVED_AND_ARCHIVED",
          approvedAt: new Date(),
          shopVerified: true,
        },
      }),
      prisma.order.updateMany({
        where: { settlementId },
        data: {
          status: "SETTLED_ARCHIVED",
        },
      }),
    ]);

    revalidatePath("/am/shop/settlements");
    revalidatePath("/am/shop/history");
    revalidatePath("/am/admin/history");
    revalidatePath("/am/admin/settlements");
    return { success: true };
  } catch (error) {
    console.error("Error approving receipt and archiving:", error);
    return { success: false, error: "ደረሰኙን ማጽደቅ አልተቻለም" };
  }
}
