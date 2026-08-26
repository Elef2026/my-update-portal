import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { shopName, email, phone, password } = await request.json();

    const dataToUpdate: any = { shopName, email, phone };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.passwordHash = await bcrypt.hash(password, salt);
    }

    const updatedShop = await prisma.user.update({
      where: { id: params.id },
      data: dataToUpdate,
      select: {
        id: true,
        shopName: true,
        email: true,
        phone: true,
      }
    });

    return NextResponse.json({ success: true, shop: updatedShop });
  } catch (error) {
    console.error("Error updating shop:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const shopId = params.id;

    // Execute cascade cleanup inside a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Find all order IDs related to this shop
      const shopOrders = await tx.order.findMany({
        where: {
          OR: [{ shopId }, { assignedShopId: shopId }]
        },
        select: { id: true }
      });
      const orderIds = shopOrders.map((o) => o.id);

      if (orderIds.length > 0) {
        // Delete order files
        await tx.orderFile.deleteMany({
          where: { orderId: { in: orderIds } }
        });

        // Delete transactions
        await tx.transaction.deleteMany({
          where: {
            OR: [
              { orderId: { in: orderIds } },
              { shopId }
            ]
          }
        });

        // Delete refund requests
        await tx.refundRequest.deleteMany({
          where: {
            OR: [
              { orderId: { in: orderIds } },
              { shopId }
            ]
          }
        });

        // Delete orders
        await tx.order.deleteMany({
          where: { id: { in: orderIds } }
        });
      }

      // Delete weekly settlements
      await tx.weeklySettlement.deleteMany({
        where: { shopId }
      });

      // Delete the shop user
      await tx.user.delete({
        where: { id: shopId }
      });
    });

    return NextResponse.json({ success: true, message: "Shop and all associated records deleted successfully" });
  } catch (error) {
    console.error("Error deleting shop:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
