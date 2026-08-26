import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPayment } from "@/lib/chapa";
import { sendSmsNotification, SmsTemplates } from "@/lib/sms";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const event = body.event;
    const txRef = body.tx_ref || body.trx_ref;

    // We handle charge.success events
    if (event === "charge.success" || body.status === "success") {
      if (txRef) {
        // Double verify with Chapa API for safety
        const verification = await verifyPayment(txRef);
        
        if (verification.success) {
          // Extract order ID
          const parts = txRef.split("-");
          let orderId: string | undefined;
          if (parts.length >= 2) {
            const orderPrefix = parts[1];
            const foundOrder = await prisma.order.findFirst({
              where: { id: { startsWith: orderPrefix } },
            });
            orderId = foundOrder?.id;
          }

          if (orderId) {
            const updatedOrder = await prisma.order.update({
              where: { id: orderId },
              data: {
                status: "PAID",
                paymentStatus: "PAID",
              },
            });

            await prisma.transaction.updateMany({
              where: { orderId },
              data: { status: "COMPLETED" },
            });

            if (updatedOrder.customerPhone) {
              try {
                await sendSmsNotification(
                  updatedOrder.customerPhone,
                  SmsTemplates.paymentReceived(updatedOrder.customerName)
                );
              } catch (smsErr) {
                console.error("SMS notification error on webhook:", smsErr);
              }
            }
          }
        }
      }
    }

    // Always acknowledge Chapa webhook with 200 OK
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Chapa Webhook Processing Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
