import { NextResponse } from "next/server";
import { PrismaClient, OrderStatus, OrderSource, PaymentStatus } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { sendSmsNotification, SmsTemplates } from "@/lib/sms";
import { authOptions } from "@/lib/auth";

import { calculateOrderFinances } from "@/lib/pricing";
import { initiatePayment } from "@/lib/chapa";

const prisma = new PrismaClient();

// POST: Create a new order (From Shop OR From Admin)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      customerName, 
      customerPhone, 
      selectedServices, // Array of strings like ["NAME_CHANGE", "PHOTO"]
      oldData, 
      newData, 
      totalPaid,
      assignedShopId, // Only passed if Admin initiates
      orderType = "FULL_SERVICE",
      paymentMethod = "CHAPA",
      customerAttachmentUrl,
      files, // Array of file URLs or objects { fileUrl, fileType }
    } = body;

    const isAdminInitiated = session.user.role === "ADMIN";

    let initialPaymentStatus: PaymentStatus = paymentMethod === "CASH_TO_SHOP" ? PaymentStatus.WAITING_ADMIN_APPROVAL : PaymentStatus.PENDING;
    let initialOrderStatus: OrderStatus = OrderStatus.PAID;

    if (isAdminInitiated) {
      initialPaymentStatus = PaymentStatus.PAID;
      initialOrderStatus = OrderStatus.ADMIN_PROCESSING;
    } else if (paymentMethod === "CHAPA") {
      initialPaymentStatus = PaymentStatus.PENDING;
      initialOrderStatus = OrderStatus.PENDING_PAYMENT;
    }

    // Process files array if passed
    const filesToCreate = Array.isArray(files) && files.length > 0 
      ? files.map((f: any) => typeof f === "string" ? { fileUrl: f, fileType: "DOCUMENT" } : { fileUrl: f.fileUrl || f.url, fileType: f.fileType || "DOCUMENT" })
      : [];

    const primaryAttachment = customerAttachmentUrl || (filesToCreate.length > 0 ? filesToCreate[0].fileUrl : null);

    // Calculate accurate financial breakdown
    const finances = await calculateOrderFinances(selectedServices || [], orderType, totalPaid);

    // Resolve shopId safely to prevent foreign key violations
    let resolvedShopId: string | null = null;
    if (!isAdminInitiated) {
      let dbShop = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!dbShop && session.user.email) {
        dbShop = await prisma.user.findUnique({
          where: { email: session.user.email },
        });
      }

      if (!dbShop && session.user.email) {
        // Auto-create or ensure valid database user
        dbShop = await prisma.user.create({
          data: {
            email: session.user.email,
            shopName: session.user.shopName || "Print Shop",
            role: "PRINT_SHOP",
            phone: customerPhone || "0911000000",
          }
        });
      }

      resolvedShopId = dbShop ? dbShop.id : session.user.id;
    }

    const newOrder = await prisma.order.create({
      data: {
        source: isAdminInitiated ? OrderSource.FROM_ADMIN : OrderSource.FROM_SHOP,
        shopId: resolvedShopId,
        assignedShopId: isAdminInitiated ? assignedShopId : null,
        adminInitiated: isAdminInitiated,
        
        customerName,
        customerPhone,
        selectedServices, 
        
        oldData: oldData || {},
        newData: newData || {},
        
        // Accurate Financial Tracking
        totalPaid: finances.totalPaid,
        adminCommission: finances.adminCommission,
        shopEarnings: finances.shopEarnings,
        serverFee: finances.serverFee,
        smsFee: finances.smsFee,

        orderType,
        paymentMethod,
        paymentStatus: initialPaymentStatus,
        status: initialOrderStatus,
        customerAttachmentUrl: primaryAttachment,
        files: filesToCreate.length > 0 ? { create: filesToCreate } : undefined,
      },
      include: {
        shop: { select: { shopName: true, phone: true } },
        assignedShop: { select: { shopName: true, phone: true } },
        files: true,
      }
    });

    let checkoutUrl: string | null = null;

    // If Chapa payment is requested, initiate real Chapa transaction
    if (paymentMethod === "CHAPA" && !isAdminInitiated) {
      const chapaRes = await initiatePayment({
        orderId: newOrder.id,
        amount: finances.totalPaid,
        customerName,
        customerPhone,
        customerEmail: session.user.email || undefined,
      });

      if (chapaRes.success && chapaRes.checkoutUrl) {
        checkoutUrl = chapaRes.checkoutUrl;

        // Record transaction in DB
        await prisma.transaction.create({
          data: {
            orderId: newOrder.id,
            shopId: resolvedShopId || session.user.id,
            amount: finances.totalPaid,
            paymentMethod: "CHAPA",
            status: "PENDING",
          },
        });
      } else {
        console.warn("Chapa payment initialization notice:", chapaRes.error);
      }
    }

    return NextResponse.json({
      ...newOrder,
      checkoutUrl,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

// GET: Fetch orders (Admin sees all, Shop sees their own created or assigned)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") as OrderStatus | null;

    let whereClause: any = {};
    
    if (session.user.role === "PRINT_SHOP") {
      let dbShop = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (!dbShop && session.user.email) {
        dbShop = await prisma.user.findUnique({ where: { email: session.user.email } });
      }
      const actualShopId = dbShop ? dbShop.id : session.user.id;

      // Print shop sees orders they created OR orders assigned to them by admin
      whereClause = {
        OR: [
          { shopId: actualShopId },
          { assignedShopId: actualShopId }
        ]
      };
    }

    if (statusFilter === ("COMPLETED" as any)) {
      whereClause.status = { in: ["PRINTED_AWAITING_SETTLEMENT", "SETTLED_ARCHIVED"] };
    } else if (statusFilter) {
      whereClause.status = statusFilter;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        shop: { select: { shopName: true, phone: true, email: true } },
        assignedShop: { select: { shopName: true, phone: true, email: true } },
        files: true,
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH: Update order status & 4-Stage SMS Lifecycle
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, newStatus, newPaymentStatus, deadline, refundReceiptUrl } = body as any;

    // Strict access control: Only Admin can move to READY_FOR_PRINT_SHOP
    // Shop can move from READY_FOR_PRINT_SHOP to DELIVERED_TO_CUSTOMER
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const isShop = session.user.role === "PRINT_SHOP";
    const isAdmin = session.user.role === "ADMIN";
    
    // Only assigned shop can mark as printed/delivered
    if (isShop && newStatus === "PRINTED_AWAITING_SETTLEMENT") {
       if (order.shopId !== session.user.id && order.assignedShopId !== session.user.id) {
         return NextResponse.json({ error: "Not assigned to this shop" }, { status: 403 });
       }
    } else if (isShop && newStatus !== undefined) {
       // Shop cannot do other status updates
       return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updateData: any = {};
    if (newStatus) updateData.status = newStatus;
    
    // Admin only updates
    if (isAdmin) {
      if (newPaymentStatus) updateData.paymentStatus = newPaymentStatus;
      if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
      if (refundReceiptUrl !== undefined) updateData.refundReceiptUrl = refundReceiptUrl;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // 4-Stage SMS Notification Lifecycle Trigger
    if (updatedOrder.customerPhone) {
      
      switch (newStatus) {
        // Stage 1: PAID (Handled usually by Chapa Webhook, but fallback here)
        case "PAID":
          await sendSmsNotification(updatedOrder.customerPhone, SmsTemplates.paymentReceived(updatedOrder.customerName));
          break;
          
        // Stage 2: ADMIN_PROCESSING
        case "ADMIN_PROCESSING":
          await sendSmsNotification(updatedOrder.customerPhone, "ውድ ደንበኛ፣ ጥያቄዎ በአድሚን እየተሰራ ይገኛል። (Your request is being processed).");
          break;
          
        // Stage 3: READY_FOR_PRINT_SHOP
        case "READY_FOR_PRINT_SHOP":
          await sendSmsNotification(updatedOrder.customerPhone, "ውድ ደንበኛ፣ የሰነድ ማደስ ስራው ተጠናቋል! ወደ ማተሚያ ቤት በመሄድ መውሰድ ይችላሉ።");
          break;
          
        // Stage 4: PRINTED_AWAITING_SETTLEMENT
        case "PRINTED_AWAITING_SETTLEMENT":
          await sendSmsNotification(updatedOrder.customerPhone, `ውድ ${updatedOrder.customerName}፣ አገልግሎታችንን ስለተጠቀሙ እናመሰግናለን! (Thank you for using our service!)`);
          break;

        case "REJECTED":
          await sendSmsNotification(updatedOrder.customerPhone, `ውድ ${updatedOrder.customerName}፣ ጥያቄዎ ውድቅ ተደርጓል። (Your request was rejected).`);
          break;
      }
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

