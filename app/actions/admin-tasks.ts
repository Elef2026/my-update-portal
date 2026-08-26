"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPendingTasks() {
  try {
    const tasks = await prisma.order.findMany({
      where: { status: "PAID" },
      include: { shop: true },
      orderBy: { createdAt: "asc" }
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
      include: { shop: true },
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
      include: { shop: true },
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
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "ADMIN_PROCESSING" }
    });
    
    // revalidate caches so UI updates instantly
    revalidatePath("/am/admin/tasks");
    revalidatePath("/am/admin/in-progress");
    revalidatePath("/en/admin/tasks");
    revalidatePath("/en/admin/in-progress");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update task", error);
    return { success: false, error: "Failed to start processing task" };
  }
}

export async function finishTask(orderId: string, adminAttachmentUrl: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: "READY_FOR_PRINT_SHOP",
        adminAttachmentUrl
      }
    });
    
    revalidatePath("/am/admin/in-progress");
    revalidatePath("/am/admin/ready-for-print");
    revalidatePath("/en/admin/in-progress");
    revalidatePath("/en/admin/ready-for-print");

    return { success: true };
  } catch (error) {
    console.error("Failed to update task", error);
    return { success: false, error: "Failed to finish task" };
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

