"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function ShopInProgressPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders?status=ADMIN_PROCESSING");
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
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">በሂደት ላይ ያለ ስራ የለም</h2>
        <p className="text-muted-foreground">አድሚን ጋር በመሰራት ላይ ያለ ምንም ሰነድ አልተገኘም።</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 bg-card p-6 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-amber-500 flex items-center gap-2">
            <Clock className="h-6 w-6" /> 
            በሂደት ላይ ያሉ ስራዎች (In-Progress Tasks)
          </h1>
          <p className="text-muted-foreground mt-1">አድሚኑ ጋር የደረሱ እና በመሰራት ላይ ያሉ ስራዎች የቀን ገደብ ቆጣሪ</p>
        </div>
        <Button variant="outline" onClick={fetchOrders}>አድስ (Refresh)</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <ShopOrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}

function ShopOrderCard({ order }: { order: any }) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!order.deadline) {
      setTimeLeft("የቀን ገደብ አልተወሰነም");
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const deadlineDate = new Date(order.deadline).getTime();
      const distance = deadlineDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft("ጊዜው አልፏል (Overdue)");
        setIsOverdue(true);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        setTimeLeft(`${days}ቀን ${hours}ሰዓት ${minutes}ደቂቃ ${seconds}ሰከንድ`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [order.deadline]);

  return (
    <Card className={`border-l-4 ${isOverdue ? 'border-l-destructive' : 'border-l-amber-500'} shadow-sm flex flex-col justify-between`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-start text-lg">
          <span>{order.customerName}</span>
          <span className="text-xs font-normal bg-secondary text-secondary-foreground px-2 py-1 rounded">
            {order.orderType === "UPDATE_ONLY" ? "አብዴት ብቻ" : "አብዴት እና ፕሪንት"}
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-muted p-3 rounded text-sm space-y-1">
          <p><strong>አገልግሎቶች:</strong> {order.selectedServices?.join(", ")}</p>
          <p><strong>ክፍያ:</strong> {order.paymentMethod === "CHAPA" ? "በቻፓ" : "ጥሬ ገንዘብ"} ({order.totalPaid} ETB)</p>
          <p className="text-xs text-muted-foreground pt-1">ሁኔታ: አድሚኑ እየሰራው ይገኛል</p>
        </div>

        <div className={`p-3 rounded-md text-center font-mono font-bold ${isOverdue ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600'}`}>
          {timeLeft}
        </div>
      </CardContent>
    </Card>
  );
}
