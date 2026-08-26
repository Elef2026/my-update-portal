"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { startProcessingTask } from "@/app/actions/admin-tasks";
import OrderDetailsModal from "@/components/OrderDetailsModal";
import { Eye, PlayCircle } from "lucide-react";

export default function TasksTable({ initialTasks }: { initialTasks: any[] }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks || []);
  const [isPending, startTransition] = useTransition();
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  useEffect(() => {
    setTasks(initialTasks || []);
  }, [initialTasks]);

  const handleStartProcessing = (id: string) => {
    if (!confirm("ይህንን ስራ መጀመርዎን እርግጠኛ ነዎት? (Are you sure you want to start?)")) return;
    
    startTransition(async () => {
      const res = await startProcessingTask(id);
      if (res.success) {
        // Remove task immediately from local state
        setTasks((prev) => prev.filter((t) => t.id !== id));
        router.refresh();
        alert("ስራው በሚገባ ተጀምሯል! ወደ 'በሂደት ላይ ያሉ' (In Progress) ገጽ ተዛውሯል።");
      } else {
        alert("ስህተት ተፈጥሯል (Error starting task): " + res.error);
      }
    });
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden space-y-4">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-6 py-4 font-medium">የመለያ ቁጥር (ID)</th>
            <th className="px-6 py-4 font-medium">ማተሚያ ቤት (Shop)</th>
            <th className="px-6 py-4 font-medium">የደንበኛ ስም (Customer)</th>
            <th className="px-6 py-4 font-medium">አገልግሎት (Service)</th>
            <th className="px-6 py-4 font-medium">ሁኔታ (Status)</th>
            <th className="px-6 py-4 font-medium">እርምጃዎች (Actions)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-muted/50 transition-colors">
              <td className="px-6 py-4 font-mono font-medium">{task.id.slice(0, 8)}...</td>
              <td className="px-6 py-4">{task.shop?.shopName || task.assignedShop?.shopName || "Unknown Shop"}</td>
              <td className="px-6 py-4">
                <span className="font-semibold">{task.customerName}</span> <br/>
                <span className="text-muted-foreground text-xs font-mono">{task.customerPhone}</span>
              </td>
              <td className="px-6 py-4">
                {Array.isArray(task.selectedServices) ? task.selectedServices.join(", ") : task.selectedServices}
              </td>
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 bg-blue-500/20 text-blue-600 rounded-md text-xs font-semibold">
                  ተከፍሏል (Paid)
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setSelectedTask(task)} 
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    <span>ሞር ዲቴል (More Details)</span>
                  </Button>

                  <Button 
                    onClick={() => handleStartProcessing(task.id)} 
                    size="sm"
                    disabled={isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 text-xs"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>{isPending ? "በመጫን ላይ..." : "ስራ ጀምር"}</span>
                  </Button>
                </div>
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

      {/* Modal */}
      {selectedTask && (
        <OrderDetailsModal
          order={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onOrderUpdated={() => {
            setSelectedTask(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
