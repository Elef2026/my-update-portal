"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startProcessingTask } from "@/app/actions/admin-tasks";

type Task = {
  id: string;
  customerName: string;
  customerPhone: string;
  selectedServices: string[];
  shop?: {
    shopName: string | null;
  } | null;
};

export default function TasksTable({ initialTasks }: { initialTasks: Task[] }) {
  const [isPending, startTransition] = useTransition();

  const handleStartProcessing = (id: string) => {
    if (!confirm("ይህንን ስራ መጀመርዎን እርግጠኛ ነዎት? (Are you sure you want to start?)")) return;
    
    startTransition(async () => {
      const res = await startProcessingTask(id);
      if (res.success) {
        alert("ስራው በሚገባ ተጀምሯል! (Task is now In Progress)");
      } else {
        alert("ስህተት ተፈጥሯል (Error starting task): " + res.error);
      }
    });
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-6 py-4 font-medium">የመለያ ቁጥር (ID)</th>
            <th className="px-6 py-4 font-medium">ማተሚያ ቤት (Shop)</th>
            <th className="px-6 py-4 font-medium">የደንበኛ ስም (Customer)</th>
            <th className="px-6 py-4 font-medium">አገልግሎት (Service)</th>
            <th className="px-6 py-4 font-medium">ሁኔታ (Status)</th>
            <th className="px-6 py-4 font-medium">እርምጃ (Action)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {initialTasks.map((task) => (
            <tr key={task.id} className="hover:bg-muted/50 transition-colors">
              <td className="px-6 py-4 font-medium">{task.id.slice(0, 8)}...</td>
              <td className="px-6 py-4">{task.shop?.shopName || "Unknown Shop"}</td>
              <td className="px-6 py-4">
                {task.customerName} <br/>
                <span className="text-muted-foreground text-xs">{task.customerPhone}</span>
              </td>
              <td className="px-6 py-4">{task.selectedServices.join(", ")}</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-600 rounded-md text-xs font-medium">
                  ተከፍሏል (Paid)
                </span>
              </td>
              <td className="px-6 py-4">
                <Button 
                  onClick={() => handleStartProcessing(task.id)} 
                  size="sm"
                  disabled={isPending}
                >
                  {isPending ? "በመጫን ላይ..." : "ስራ ጀምር"}
                </Button>
              </td>
            </tr>
          ))}
          {initialTasks.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                ምንም አዲስ ጥያቄ የለም (No pending tasks)
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
