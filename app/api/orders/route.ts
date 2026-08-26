import { NextResponse } from "next/server";
import { PrismaClient, OrderStatus, OrderSource } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { sendSmsNotification, SmsTemplates } from "@/lib/sms";
import { authOptions } from "@/lib/auth";

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

    let initialPaymentStatus = paymentMethod === "CASH_TO_SHOP" ? "WAITING_ADMIN_APPROVAL" : "PENDING";
    if (isAdminInitiated) {
      initialPaymentStatus = "PAID";
    }

    // Set order status so Admin pending tasks page immediately sees incoming orders from shops
    const initialOrderStatus = isAdminInitiated 
      ? OrderStatus.ADMIN_PROCESSING 
      : OrderStatus.PAID;

    // Process files array if passed
    const filesToCreate = Array.isArray(files) && files.length > 0 
      ? files.map((f: any) => typeof f === "string" ? { fileUrl: f, fileType: "DOCUMENT" } : { fileUrl: f.fileUrl || f.url, fileType: f.fileType || "DOCUMENT" })
      : [];

    const primaryAttachment = customerAttachmentUrl || (filesToCreate.length > 0 ? filesToCreate[0].fileUrl : null);

    const newOrder = await prisma.order.create({
      data: {
        source: isAdminInitiated ? OrderSource.FROM_ADMIN : OrderSource.FROM_SHOP,
        shopId: isAdminInitiated ? null : session.user.id,
        assignedShopId: isAdminInitiated ? assignedShopId : null,
        adminInitiated: isAdminInitiated,
        
        customerName,
        customerPhone,
        selectedServices, 
        
        oldData: oldData || {},
        newData: newData || {},
        totalPaid: totalPaid || 0,
        orderType,
        paymentMethod,
        paymentStatus: initialPaymentStatus as any,
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

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
      // Print shop sees orders they created OR orders assigned to them by admin
      whereClause = {
        OR: [
          { shopId: session.user.id },
          { assignedShopId: session.user.id }
        ]
      };
    }

    if (statusFilter) {
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

