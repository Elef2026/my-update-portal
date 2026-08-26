"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import OrderDetailsModal from "@/components/OrderDetailsModal";

const getStatusBadge = (status: string, orderType?: string) => {
  switch (status) {
    case "PENDING_PAYMENT": 
      return <span className="px-2.5 py-1 bg-yellow-500/20 text-yellow-600 rounded-md text-xs font-semibold">ክፍያ ይጠብቃል</span>;
    case "PAID": 
      return <span className="px-2.5 py-1 bg-blue-500/20 text-blue-600 rounded-md text-xs font-semibold">ተከፍሏል (Paid)</span>;
    case "ADMIN_PROCESSING": 
      return <span className="px-2.5 py-1 bg-amber-500/20 text-amber-600 rounded-md text-xs font-semibold">በስራ ላይ (In Progress)</span>;
    case "READY_FOR_PRINT_SHOP": 
      return <span className="px-2.5 py-1 bg-purple-500/20 text-purple-600 rounded-md text-xs font-semibold">ለህትመት ደርሷል</span>;
    case "PRINTED_AWAITING_SETTLEMENT": 
      return (
        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-700 rounded-md text-xs font-semibold">
          {orderType === "UPDATE_ONLY" ? "አብዴት ተጠናቋል (Finished)" : "ፕሪንት ተደርጓል (Printed)"}
        </span>
      );
    case "SETTLED_ARCHIVED": 
      return <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-600 rounded-md text-xs font-semibold">ተወራርዶ ተጠናቋል (Archived)</span>;
    case "REJECTED": 
      return <span className="px-2.5 py-1 bg-red-500/20 text-red-600 rounded-md text-xs font-semibold">ውድቅ ተደርጓል (Rejected)</span>;
    default: 
      return <span className="text-xs">{status}</span>;
  }
};

export default function ShopHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "COMPLETED" | "REJECTED">("ALL");
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch order history", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "REJECTED") return o.status === "REJECTED";
    if (filter === "COMPLETED") return ["PRINTED_AWAITING_SETTLEMENT", "SETTLED_ARCHIVED"].includes(o.status);
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
          <div>
            <h1 className="text-3xl font-bold">የታሪክ ማህደር እና ሪከርድ (History / Records)</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              የተጠናቀቁ፣ ፕሪንት የተደረጉ እና በአድሚን ውድቅ የተደረጉ ስራዎች ዝርዝር
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-muted p-1 rounded-md flex gap-1 text-xs font-medium">
              <Button 
                variant={filter === "ALL" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setFilter("ALL")}
              >
                ሁሉም ({orders.length})
              </Button>
              <Button 
                variant={filter === "COMPLETED" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setFilter("COMPLETED")}
              >
                የተጠናቀቁ
              </Button>
              <Button 
                variant={filter === "REJECTED" ? "destructive" : "ghost"} 
                size="sm" 
                onClick={() => setFilter("REJECTED")}
              >
                ውድቅ የተደረጉ
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={fetchOrders}>አድስ</Button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">እየጫነ ነው (Loading)...</div>
        ) : (
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">የመለያ ቁጥር (ID)</th>
                  <th className="px-6 py-4 font-medium">የደንበኛ ስም</th>
                  <th className="px-6 py-4 font-medium">አገልግሎት</th>
                  <th className="px-6 py-4 font-medium">ክፍያ</th>
                  <th className="px-6 py-4 font-medium">ሁኔታ (Status)</th>
                  <th className="px-6 py-4 font-medium">እርምጃዎች (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium font-mono text-xs">{order.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold">{order.customerName}</span> <br />
                      <span className="text-xs text-muted-foreground font-mono">{order.customerPhone}</span>
                    </td>
                    <td className="px-6 py-4">{Array.isArray(order.selectedServices) ? order.selectedServices.join(", ") : (order.selectedServices || "-")}</td>
                    <td className="px-6 py-4 font-medium">
                      {order.totalPaid} ETB <br />
                      <span className="text-xs text-muted-foreground">
                        {order.paymentMethod === "CHAPA" ? "በቻፓ" : "ጥሬ ገንዘብ"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(order.status, order.orderType)}</td>
                    <td className="px-6 py-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center gap-1 text-xs"
                        onClick={() => setSelectedTask(order)}
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-500" />
                        <span>ሞር ዲቴል (More Details)</span>
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      ምንም መረጃ አልተገኘም (No records found)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Modal */}
      {selectedTask && (
        <OrderDetailsModal
          order={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onOrderUpdated={() => {
            setSelectedTask(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}
