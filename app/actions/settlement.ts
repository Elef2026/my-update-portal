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
  weekStartDate: Date,
  weekEndDate: Date,
  receiptUrl: string
) {
  try {
    // በሳምንቱ ውስጥ ፕሪንት ተደርገው ክፍያ የሚጠብቁትን ስራዎች ብቻ ማምጣት
    const eligibleOrders = await prisma.order.findMany({
      where: {
        shopId,
        status: "PRINTED_AWAITING_SETTLEMENT",
        printedAt: { gte: weekStartDate, lte: weekEndDate },
      },
    });

    if (eligibleOrders.length === 0) {
      return { success: false, error: "ለዚህ ሳምንት የሚወራረድ ምንም ስራ አልተገኘም" };
    }

    let totalShopEarnings = 0;
    let totalCashCollected = 0;
    let totalChapaEarnings = 0;
    let totalDeductions = 0;

    for (const o of eligibleOrders) {
      const shopEarning = Number(o.shopEarnings);
      const adminCut = Number(o.adminCommission);
      const fees = Number(o.smsFee) + Number(o.serverFee);

      totalShopEarnings += shopEarning;
      totalDeductions += fees;

      if (o.paymentMethod === "CHAPA") {
        totalChapaEarnings += shopEarning;
      } else {
        totalCashCollected += adminCut + fees;
      }
    }

    const netPayout = totalChapaEarnings - totalCashCollected - totalDeductions;

    const settlement = await prisma.weeklySettlement.create({
      data: {
        shopId,
        weekStartDate,
        weekEndDate,
        totalEarned: totalShopEarnings,
        totalOwed: totalCashCollected,
        netPayout,
        receiptUrl,
        status: "PENDING_SHOP_APPROVAL",
        orders: {
          connect: eligibleOrders.map((o) => ({ id: o.id })),
        },
      },
    });

    revalidatePath("/am/admin/settlements");
    revalidatePath("/am/shop/settlements");
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
