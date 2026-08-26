"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPendingTasks() {
  try {
    const tasks = await prisma.order.findMany({
      where: {
        status: "PAID",
        OR: [
          // 1. Chapa orders that are verified and PAID
          { paymentMethod: "CHAPA", paymentStatus: "PAID" },
          // 2. Cash orders submitted directly by print shop
          { paymentMethod: "CASH_TO_SHOP" },
          // 3. Admin initiated orders
          { adminInitiated: true },
        ]
      },
      include: { 
        shop: true, 
        assignedShop: true, 
        files: true 
      },
      orderBy: { createdAt: "desc" }
    });
    return { success: true, data: tasks };
  } catch (error) {
    console.error("Failed to fetch tasks", error);
    return { success: false, error: "Failed to fetch pending tasks" };
  }
}

export async function getInProgressTasks() {
  try {
    const tasks = await prisma.order.findMany({
      where: { status: "ADMIN_PROCESSING" },
      include: { 
        shop: true,
        assignedShop: true,
        files: true,
      },
      orderBy: { createdAt: "asc" }
    });
    return { success: true, data: tasks };
  } catch (error) {
    console.error("Failed to fetch tasks", error);
    return { success: false, error: "Failed to fetch in-progress tasks" };
  }
}

export async function getReadyForPrintTasks() {
  try {
    const tasks = await prisma.order.findMany({
      where: { status: "READY_FOR_PRINT_SHOP" },
      include: { 
        shop: true,
        assignedShop: true,
        files: true,
      },
      orderBy: { createdAt: "desc" }
    });
    return { success: true, data: tasks };
  } catch (error) {
    console.error("Failed to fetch tasks", error);
    return { success: false, error: "Failed to fetch ready tasks" };
  }
}

export async function startProcessingTask(orderId: string) {
  try {
    // Default 24 hours deadline from starting moment if not set
    const defaultDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: "ADMIN_PROCESSING",
        deadline: defaultDeadline,
      }
    });
    
    // revalidate caches so UI updates instantly
    revalidatePath("/am/admin/tasks");
    revalidatePath("/am/admin/in-progress");
    revalidatePath("/en/admin/tasks");
    revalidatePath("/en/admin/in-progress");
    
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update task", error);
    return { success: false, error: error?.message || "Failed to start processing task" };
  }
}

export async function finishTask(orderId: string, adminAttachmentUrl?: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { success: false, error: "ትዕዛዙ አልተገኘም" };

    const isUpdateOnly = order.orderType === "UPDATE_ONLY";
    const targetStatus = isUpdateOnly ? "PRINTED_AWAITING_SETTLEMENT" : "READY_FOR_PRINT_SHOP";

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: targetStatus,
        ...(adminAttachmentUrl !== undefined && { adminAttachmentUrl }),
        ...(isUpdateOnly ? { printedAt: new Date() } : {})
      }
    });
    
    revalidatePath("/am/admin/in-progress");
    revalidatePath("/am/admin/ready-for-print");
    revalidatePath("/am/admin/history");
    revalidatePath("/am/shop/in-progress");
    revalidatePath("/am/shop/print-queue");
    revalidatePath("/am/shop/history");

    return { 
      success: true, 
      order: updated, 
      isUpdateOnly, 
      message: isUpdateOnly 
        ? "የአብዴት ስራው ተጠናቋል! ወደ ተጠናቀቁ ማህደር ተዛውሯል።" 
        : "ስራው ተጠናቆ ወደ ህትመት ቤቱ ፕሪንት ማድረጊያ ተልኳል!" 
    };
  } catch (error) {
    console.error("Failed to update task", error);
    return { success: false, error: "ስራውን ማጠናቀቅ አልተቻለም" };
  }
}

export async function updateOrderDetails(
  orderId: string,
  payload: {
    customerName?: string;
    customerPhone?: string;
    oldData?: any;
    newData?: any;
    customerAttachmentUrl?: string;
    selectedServices?: any[];
  }
) {
  try {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(payload.customerName !== undefined && { customerName: payload.customerName }),
        ...(payload.customerPhone !== undefined && { customerPhone: payload.customerPhone }),
        ...(payload.oldData !== undefined && { oldData: payload.oldData }),
        ...(payload.newData !== undefined && { newData: payload.newData }),
        ...(payload.customerAttachmentUrl !== undefined && { customerAttachmentUrl: payload.customerAttachmentUrl }),
        ...(payload.selectedServices !== undefined && { selectedServices: payload.selectedServices }),
      },
    });

    revalidatePath("/am/admin/tasks");
    revalidatePath("/am/admin/in-progress");
    revalidatePath("/am/admin/ready-for-print");
    revalidatePath("/am/admin/history");
    revalidatePath("/en/admin/tasks");
    revalidatePath("/en/admin/in-progress");
    revalidatePath("/en/admin/ready-for-print");
    revalidatePath("/en/admin/history");

    return { success: true, order: updated };
  } catch (error) {
    console.error("Failed to update order details", error);
    return { success: false, error: "መረጃውን ማስተካከል አልተቻለም (Failed to update order details)" };
  }
}

