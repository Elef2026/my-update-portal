"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { rejectTaskWithReason } from "@/app/actions/settlement";

export default function InProgressPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, newStatus })
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleReject = async (orderId: string) => {
    if (!rejectionReason.trim()) {
      alert("እባክዎ የውድቅ ማድረጊያ ምክንያት ያስገቡ (Rejection reason is required)");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await rejectTaskWithReason(orderId, rejectionReason);
      if (res.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setRejectingOrderId(null);
        setRejectionReason("");
        alert("ስራው ውድቅ ተደርጓል፤ ምክንያቱም ለማተሚያ ቤቱ ታይቷል");
      } else {
        alert(res.error || "ስህተት ተፈጥሯል");
      }
    } catch (err) {
      console.error(err);
      alert("ስህተት ተፈጥሯል");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">እየጫነ ነው (Loading)...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">በሂደት ላይ ያሉ ስራዎች የሉም</h2>
        <p className="text-muted-foreground">ምንም አይነት አዲስ ስራ አልተገኘም። (No tasks in progress)</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 bg-card p-6 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-amber-500 flex items-center gap-2">
            <Clock className="h-6 w-6" /> 
            በሂደት ላይ ያሉ (In Progress)
          </h1>
          <p className="text-muted-foreground mt-1">የቀን ገደብ ያላቸው እና አብዴት እየተደረጉ ያሉ ስራዎች</p>
        </div>
        <Button variant="outline" onClick={fetchOrders}>አድስ (Refresh)</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <OrderCard 
            key={order.id} 
            order={order} 
            onSendToPrint={(id) => updateOrderStatus(id, "READY_FOR_PRINT_SHOP")}
            isRejecting={rejectingOrderId === order.id}
            rejectionReason={rejectionReason}
            onSetRejectionReason={setRejectionReason}
            onStartReject={(id) => { setRejectingOrderId(id); setRejectionReason(""); }}
            onCancelReject={() => { setRejectingOrderId(null); setRejectionReason(""); }}
            onConfirmReject={handleReject}
            isSubmitting={isSubmitting}
          />
        ))}
      </div>
    </div>
  );
}

function OrderCard({ 
  order, 
  onSendToPrint, 
  isRejecting, 
  rejectionReason, 
  onSetRejectionReason, 
  onStartReject, 
  onCancelReject, 
  onConfirmReject,
  isSubmitting
}: { 
  order: any;
  onSendToPrint: (id: string) => void;
  isRejecting: boolean;
  rejectionReason: string;
  onSetRejectionReason: (val: string) => void;
  onStartReject: (id: string) => void;
  onCancelReject: () => void;
  onConfirmReject: (id: string) => void;
  isSubmitting: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!order.deadline) {
      setTimeLeft("የቀን ገደብ የለውም");
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
        {order.shop?.shopName && (
           <p className="text-xs text-muted-foreground pt-1">ማተሚያ ቤት: {order.shop.shopName}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-muted p-3 rounded text-sm space-y-1">
          <p><strong>አገልግሎቶች:</strong> {order.selectedServices?.join(", ")}</p>
          <p><strong>ክፍያ:</strong> {order.paymentMethod === "CHAPA" ? "በቻፓ (Admin holds)" : "ጥሬ ገንዘብ (Shop holds)"} ({order.totalPaid} ETB)</p>
        </div>

        <div className={`p-2.5 rounded-md text-center font-mono font-bold ${isOverdue ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600'}`}>
          {timeLeft}
        </div>

        {isRejecting && (
          <div className="space-y-2 pt-2 border-t">
            <label className="text-xs font-semibold text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> የውድቅ ማድረጊያ ምክንያት (Rejection Reason)
            </label>
            <Input 
              placeholder="ምክንያቱን እዚህ ይጻፉ (ለምሳሌ: የተያያዘው ፎቶ ግልጽ አይደለም)..."
              value={rejectionReason}
              onChange={(e) => onSetRejectionReason(e.target.value)}
              className="text-xs"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 mt-auto">
        {isRejecting ? (
          <div className="flex gap-2 w-full">
            <Button 
              variant="destructive" 
              className="w-full text-xs"
              disabled={isSubmitting}
              onClick={() => onConfirmReject(order.id)}
            >
              {isSubmitting ? "በማስመዝገብ ላይ..." : "ውድቅ ማድረጉን አረጋግጥ"}
            </Button>
            <Button 
              variant="outline" 
              className="text-xs"
              onClick={onCancelReject}
            >
              ሰርዝ
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 w-full">
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 text-xs"
              onClick={() => onSendToPrint(order.id)}
            >
              <CheckCircle className="h-4 w-4" /> ወደ ፕሪንት ላክ (Send to Print)
            </Button>
            <Button 
              variant="outline" 
              className="text-destructive border-destructive/50 hover:bg-destructive hover:text-white flex items-center justify-center gap-1 text-xs"
              onClick={() => onStartReject(order.id)}
            >
              <XCircle className="h-4 w-4" /> ውድቅ አድርግ
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
