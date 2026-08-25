import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { chapa } from "@/lib/chapa";
import { sendSmsNotification, SmsTemplates } from "@/lib/sms";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const txRef = searchParams.get("tx_ref");

  if (!txRef) {
    return NextResponse.json({ error: "Missing tx_ref" }, { status: 400 });
  }

  try {
    // 1. Verify the transaction with Chapa
    const verification = await chapa.verify({ tx_ref: txRef });

    if (verification.status === "success" || verification.data?.status === "success") {
      
      // Extract the orderId from the txRef (Assuming format TX-orderId-timestamp)
      const orderId = txRef.split("-")[1];

      if (orderId) {
        // 2. Update Order status in Database
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: { status: "PAYMENT_DONE" },
        });

        // 3. Send SMS Notification (Stage 1)
        if (updatedOrder.customerPhone) {
          await sendSmsNotification(
            updatedOrder.customerPhone,
            SmsTemplates.paymentReceived(updatedOrder.customerName)
          );
        }
      }

      // 4. Redirect user to success page or history
      // In a real app, you would redirect to a proper UI page
      return NextResponse.redirect(new URL("/am/shop/history?payment=success", request.url));
    }

    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });

  } catch (error) {
    console.error("Chapa Verification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
