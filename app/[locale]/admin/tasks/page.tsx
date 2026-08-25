"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// Mock data for Admin tasks
const mockTasks = [
  { id: "ORD-001", shop: "አዲስ ህትመት", customer: "አበበ ከበደ", service: "የስም ማስተካከያ", status: "PAYMENT_DONE", date: "2023-10-25" },
  { id: "ORD-004", shop: "ፍጥነት ማተሚያ", customer: "ሰላማዊት ተሾመ", service: "የትውልድ ዘመን", status: "PAYMENT_DONE", date: "2023-10-26" },
];

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState(mockTasks);

  const processTask = (id: string) => {
    // In a real app, this would update the status to IN_PROGRESS in the DB
    alert(`ስራው ተጀምሯል! (Task ${id} moved to IN_PROGRESS)`);
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold">አዳዲስ ጥያቄዎች (Pending Tasks)</h1>
          <p className="text-muted-foreground mt-2">
            ክፍያ ፈጽመው ማረጋገጫ የሚጠብቁ የደንበኞች ሰነድ ማደሻ ጥያቄዎችን እዚህ ይመለከታሉ፤ ስራውንም መጀመር ይችላሉ።
          </p>
        </div>

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
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{task.id}</td>
                  <td className="px-6 py-4">{task.shop}</td>
                  <td className="px-6 py-4">{task.customer}</td>
                  <td className="px-6 py-4">{task.service}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-600 rounded-md text-xs font-medium">
                      ተከፍሏል (Paid)
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button onClick={() => processTask(task.id)} size="sm">
                      ስራ ጀምር (Start Processing)
                    </Button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    ምንም አዲስ ጥያቄ የለም (No pending tasks)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
