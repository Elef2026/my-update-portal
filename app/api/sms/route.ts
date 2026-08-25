import { NextResponse } from "next/server";
import { sendSmsNotification } from "@/lib/sms";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Protect this route: only ADMINs can manually trigger custom SMS if needed
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json({ error: "Phone and message are required" }, { status: 400 });
    }

    const result = await sendSmsNotification(phone, message);

    if (result.success) {
      return NextResponse.json({ success: true, message: "SMS triggered successfully" });
    } else {
      return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
    }
  } catch (error) {
    console.error("SMS API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
