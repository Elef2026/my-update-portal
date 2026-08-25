"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "PENDING_PAYMENT": 
      return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 rounded-md text-xs font-medium">ክፍያ ይጠብቃል</span>;
    case "PAID": 
      return <span className="px-2 py-1 bg-blue-500/20 text-blue-600 rounded-md text-xs font-medium">ተከፍሏል (Paid)</span>;
    case "ADMIN_PROCESSING": 
      return <span className="px-2 py-1 bg-purple-500/20 text-purple-600 rounded-md text-xs font-medium">በስራ ላይ (In Progress)</span>;
    case "READY_FOR_PRINT_SHOP": 
      return <span className="px-2 py-1 bg-indigo-500/20 text-indigo-600 rounded-md text-xs font-medium">ለህትመት ደርሷል</span>;
    case "PRINTED_AWAITING_SETTLEMENT": 
      return <span className="px-2 py-1 bg-amber-500/20 text-amber-700 rounded-md text-xs font-medium">ፕሪንት ተደርጓል (ማወራረድ ይጠብቃል)</span>;
    case "SETTLED_ARCHIVED": 
      return <span className="px-2 py-1 bg-emerald-500/20 text-emerald-600 rounded-md text-xs font-medium">ተወራርዶ ተጠናቋል (Archived)</span>;
    case "REJECTED": 
      return <span className="px-2 py-1 bg-red-500/20 text-red-600 rounded-md text-xs font-medium">ውድቅ ተደርጓል (Rejected)</span>;
    case "REFUNDED": 
      return <span className="px-2 py-1 bg-gray-500/20 text-gray-600 rounded-md text-xs font-medium">ተመላሽ ተደርጓል (Refunded)</span>;
    default: 
      return <span className="text-xs">{status}</span>;
  }
};

export default function ShopHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "REJECTED" | "ARCHIVED">("ALL");

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
    if (filter === "ARCHIVED") return o.status === "SETTLED_ARCHIVED";
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">የታሪክ ማህደር እና ሪከርድ (History / Records)</h1>
            <p className="text-muted-foreground mt-1">
              የተጠናቀቁ፣ በማወራረድ ላይ ያሉ እና በአድሚን ውድቅ የተደረጉ ስራዎች ዝርዝር
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-muted p-1 rounded-md flex gap-1 text-sm">
              <Button 
                variant={filter === "ALL" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setFilter("ALL")}
              >
                ሁሉም
              </Button>
              <Button 
                variant={filter === "ARCHIVED" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setFilter("ARCHIVED")}
              >
                የተወራረዱ (Archived)
              </Button>
              <Button 
                variant={filter === "REJECTED" ? "destructive" : "ghost"} 
                size="sm" 
                onClick={() => setFilter("REJECTED")}
              >
                ውድቅ የተደረጉ (Rejected)
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
                  <th className="px-6 py-4 font-medium">ማስታወሻ / የውድቅ ምክንያት</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium font-mono text-xs">{order.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4">
                      {order.customerName} <br />
                      <span className="text-xs text-muted-foreground">{order.customerPhone}</span>
                    </td>
                    <td className="px-6 py-4">{order.selectedServices?.join(", ") || "-"}</td>
                    <td className="px-6 py-4 font-medium">
                      {order.totalPaid} ETB <br />
                      <span className="text-xs text-muted-foreground">
                        {order.paymentMethod === "CHAPA" ? "በቻፓ (Chapa)" : "ጥሬ ገንዘብ (Cash)"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4">
                      {order.status === "REJECTED" && order.rejectionReason ? (
                        <div className="bg-destructive/10 border border-destructive/20 p-2 rounded text-destructive text-xs flex items-start gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span><strong>ምክንያት:</strong> {order.rejectionReason}</span>
                        </div>
                      ) : order.printedAt ? (
                        <span className="text-xs text-muted-foreground">
                          ፕሪንት የተደረገው: {new Date(order.printedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
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
    </div>
  );
}
