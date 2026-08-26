import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { verifyPayment } from "@/lib/chapa";
import { sendSmsNotification, SmsTemplates } from "@/lib/sms";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const txRef = searchParams.get("tx_ref");

  if (!txRef) {
    return NextResponse.json({ error: "Missing tx_ref" }, { status: 400 });
  }

  try {
    // 1. Verify transaction with Chapa
    const verification = await verifyPayment(txRef);

    if (verification.success) {
      let orderId: string | undefined;

      // Extract order prefix from txRef (TX-orderIdPrefix-timestamp)
      const parts = txRef.split("-");
      if (parts.length >= 2) {
        const orderPrefix = parts[1];
        const foundOrder = await prisma.order.findFirst({
          where: { id: { startsWith: orderPrefix } },
        });
        orderId = foundOrder?.id;
      }

      if (orderId) {
        // Update Order status
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "PAID",
            paymentStatus: "PAID",
          },
        });

        // Update Transaction to COMPLETED
        await prisma.transaction.updateMany({
          where: { orderId },
          data: { status: "COMPLETED" },
        });

        // Send SMS Notification
        if (updatedOrder.customerPhone) {
          try {
            await sendSmsNotification(
              updatedOrder.customerPhone,
              SmsTemplates.paymentReceived(updatedOrder.customerName)
            );
          } catch (smsErr) {
            console.error("SMS notification error:", smsErr);
          }
        }

        // Revalidate admin cache paths so order appears instantly
        revalidatePath("/am/admin/tasks");
        revalidatePath("/am/admin/in-progress");
        revalidatePath("/am/shop/new-order");
        revalidatePath("/en/admin/tasks");

        return NextResponse.redirect(
          new URL(`/am/shop/new-order?payment=success&orderId=${orderId}`, request.url)
        );
      }
    }

    return NextResponse.redirect(
      new URL("/am/shop/new-order?payment=failed", request.url)
    );
  } catch (error) {
    console.error("Chapa Verification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

