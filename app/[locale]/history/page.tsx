"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, Eye } from "lucide-react";
import OrderDetailsModal from "@/components/OrderDetailsModal";

export default function HistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders?status=SETTLED_ARCHIVED");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">እየጫነ ነው (Loading)...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold mb-2">ምንም መረጃ የለም</h2>
        <p className="text-muted-foreground">የተጠናቀቁ ስራዎች (Old Completed) እዚህ ጋር ይገኛሉ።</p>
        <Button variant="outline" onClick={fetchOrders}>አድስ (Refresh)</Button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 bg-card p-6 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
            <Archive className="h-6 w-6" /> 
            የተጠናቀቁ (Old Completed History)
          </h1>
          <p className="text-muted-foreground mt-1">ሙሉ በሙሉ አልቀው፣ ክፍያ ተፈፅሞ የተዘጉ ፋይሎች።</p>
        </div>
        <Button variant="outline" onClick={fetchOrders}>አድስ (Refresh)</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="border-l-4 border-l-slate-400 shadow-sm flex flex-col justify-between opacity-90 hover:opacity-100 transition-opacity">
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-start text-lg">
                <span>{order.customerName}</span>
                <span className="text-xs font-normal bg-secondary text-secondary-foreground px-2 py-1 rounded">
                  {order.orderType === "UPDATE_ONLY" ? "አብዴት ብቻ" : "አብዴት እና ፕሪንት"}
                </span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted p-3 rounded text-sm space-y-1">
                <p><strong>የተመረጡ አገልግሎቶች:</strong> {Array.isArray(order.selectedServices) ? order.selectedServices.join(", ") : order.selectedServices}</p>
                <p><strong>ክፍያ:</strong> {order.paymentMethod === "CHAPA" ? "በቻፓ" : "ጥሬ ገንዘብ"} ({order.totalPaid} ETB)</p>
                <p className="text-xs text-muted-foreground mt-2">
                  የተጠናቀቀው: {new Date(order.updatedAt).toLocaleDateString()}
                </p>
              </div>

              <Button 
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary hover:text-primary-foreground font-semibold"
                onClick={() => setSelectedTask(order)}
              >
                <Eye className="w-4 h-4" />
                <span>ሞር ዲቴል (More Details / መረጃ ማውረጃ)</span>
              </Button>
            </CardContent>
          </Card>
        ))}
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
