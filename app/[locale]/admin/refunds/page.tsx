"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ReceiptText, Undo2 } from "lucide-react";

export default function RefundsPage() {
  const [activeTab, setActiveTab] = useState<"REQUESTS" | "COMPLETED">("REQUESTS");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab]);

  const fetchOrders = async (tab: string) => {
    setLoading(true);
    const status = tab === "REQUESTS" ? "REJECTED" : "REFUNDED";
    try {
      const res = await fetch(`/api/orders?status=${status}`);
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

  const processRefund = async (orderId: string, receiptUrl: string) => {
    if (!receiptUrl) return alert("እባክዎ ደረሰኝ ሊንክ ያስገቡ (Please enter receipt URL)");
    
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          orderId, 
          newStatus: "REFUNDED",
          refundReceiptUrl: receiptUrl
        })
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 bg-card p-6 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-destructive flex items-center gap-2">
            <Undo2 className="h-6 w-6" /> 
            ሪፈንድ ጥያቄዎች (Refunds)
          </h1>
          <p className="text-muted-foreground mt-1">የደንበኛ ብር የሚመለስባቸው ትዕዛዞች</p>
        </div>
        <div className="flex bg-muted rounded-md p-1">
          <Button 
            variant={activeTab === "REQUESTS" ? "default" : "ghost"}
            className={activeTab === "REQUESTS" ? "bg-background text-foreground shadow-sm hover:bg-background" : ""}
            onClick={() => setActiveTab("REQUESTS")}
          >
            አዲስ ጥያቄዎች (Requests)
          </Button>
          <Button 
            variant={activeTab === "COMPLETED" ? "default" : "ghost"}
            className={activeTab === "COMPLETED" ? "bg-background text-foreground shadow-sm hover:bg-background" : ""}
            onClick={() => setActiveTab("COMPLETED")}
          >
            የተመለሱ (Old Refunds)
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">እየጫነ ነው (Loading)...</div>
      ) : orders.length === 0 ? (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">ምንም መረጃ የለም</h2>
          <p className="text-muted-foreground">በዚህ ገፅ ላይ የሚታይ ሪፈንድ የለም።</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <RefundCard 
              key={order.id} 
              order={order} 
              isCompleted={activeTab === "COMPLETED"}
              onRefund={processRefund} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RefundCard({ order, isCompleted, onRefund }: { order: any, isCompleted: boolean, onRefund: (id: string, url: string) => void }) {
  const [receipt, setReceipt] = useState("");

  return (
    <Card className="border-l-4 border-l-destructive shadow-sm flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-start text-lg">
          <span>{order.customerName}</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
        {order.shop?.shopName && (
           <p className="text-xs text-muted-foreground pt-1">ማተሚያ ቤት: {order.shop.shopName}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-muted p-3 rounded text-sm space-y-1">
          <p className="text-destructive font-bold text-lg">{order.totalPaid} ETB</p>
          <p><strong>የተመረጡ አገልግሎቶች:</strong> {order.selectedServices?.join(", ")}</p>
          <p><strong>የከፈሉበት:</strong> {order.paymentMethod === "CHAPA" ? "በቻፓ" : "ጥሬ ገንዘብ"}</p>
        </div>

        {!isCompleted && (
          <div className="space-y-2">
             <label className="text-xs font-semibold">የደረሰኝ ሊንክ / ፎቶ URL (Receipt URL)</label>
             <Input 
                placeholder="https://.../receipt.jpg" 
                value={receipt}
                onChange={(e) => setReceipt(e.target.value)}
             />
          </div>
        )}

        {isCompleted && order.refundReceiptUrl && (
          <div className="mt-2 text-sm text-blue-500 underline flex items-center gap-1">
            <ReceiptText className="w-4 h-4" />
            <a href={order.refundReceiptUrl} target="_blank" rel="noreferrer">ደረሰኝ ይመልከቱ (View Receipt)</a>
          </div>
        )}
      </CardContent>

      {!isCompleted && (
        <CardFooter className="mt-auto">
          <Button 
            className="w-full"
            onClick={() => onRefund(order.id, receipt)}
          >
            ተመላሽ አድርግ (Process Refund)
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
