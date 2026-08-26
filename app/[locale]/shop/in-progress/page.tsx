"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, Sparkles, Paperclip, Eye, Download, ShieldCheck, X } from "lucide-react";
import OrderDetailsModal from "@/components/OrderDetailsModal";

export default function ShopInProgressPage() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams?.get("payment");
  const successOrderId = searchParams?.get("orderId");

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(paymentStatus === "success");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

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

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* CELEBRATORY PAYMENT SUCCESS BANNER */}
      {showSuccessModal && (
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-400/30 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute top-0 right-0 p-4">
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shrink-0">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider">
                  Chapa Verified ✅
                </span>
                <span className="text-white/80 text-xs font-mono">{successOrderId ? `Order #${successOrderId.substring(0, 8)}` : ""}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                ክፍያው በቻፓ በስኬት ተጠናቋል! (Payment Successful)
              </h2>
              <p className="text-sm text-emerald-100 max-w-2xl">
                ክፍያዎ በሲስተሙ ተረጋግጧል፤ ትዕዛዙ በቀጥታ ለአድሚኑ ደርሶ ስራው ተጀምሯል። ደንበኛው የ SMS ማረጋገጫ መልእክት ደርሶታል!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2.5">
            <Clock className="h-6 w-6 text-amber-500" /> 
            በሂደት ላይ ያሉ ስራዎች (In-Progress Tasks)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">አድሚኑ ጋር የደረሱ እና በመሰራት ላይ ያሉ ስራዎች ዝርዝር እና የቀን ገደብ ቆጣሪ</p>
        </div>
        <Button variant="outline" onClick={fetchOrders} className="rounded-xl">አድስ (Refresh)</Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold">ስራዎችን በማምጣት ላይ (Loading)...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border space-y-2">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto opacity-70" />
          <h2 className="text-lg font-bold">በሂደት ላይ ያለ ስራ የለም</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">አድሚን ጋር በመሰራት ላይ ያለ ምንም ሰነድ የለም። አዲስ ስራ ለመላክ ወደ "አዲስ ስራ ማስገቢያ" ገጽ ይሂዱ።</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <ShopOrderCard 
              key={order.id} 
              order={order} 
              onViewDetails={() => setSelectedOrder(order)} 
            />
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal 
          isOpen={true}
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onOrderUpdated={() => {
            setSelectedOrder(null);
            fetchOrders();
          }} 
        />
      )}

    </div>
  );
}

function ShopOrderCard({ order, onViewDetails }: { order: any; onViewDetails: () => void }) {
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

  const fileCount = (order.files?.length || 0) + (order.customerAttachmentUrl ? 1 : 0);

  return (
    <Card className={`border-2 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${isOverdue ? 'border-destructive/40' : 'border-border'}`}>
      <CardHeader className="pb-3 bg-muted/20 border-b">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-bold text-foreground">{order.customerName}</CardTitle>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{order.customerPhone}</p>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${order.paymentMethod === 'CHAPA' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>
            {order.paymentMethod === "CHAPA" ? "በቻፓ የተከፈለ" : "ጥሬ ገንዘብ"}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-4">
        <div className="bg-muted/40 p-3.5 rounded-xl text-xs space-y-1.5 border">
          <div className="flex justify-between">
            <span className="text-muted-foreground">የስራ አይነት:</span>
            <span className="font-semibold">{order.orderType === "UPDATE_ONLY" ? "አብዴት ብቻ" : "አብዴት + ፕሪንት"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ጠቅላላ ክፍያ:</span>
            <span className="font-bold text-foreground">{order.totalPaid} ETB</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t">
            <span className="text-muted-foreground">የተያያዙ ሰነዶች:</span>
            <span className="font-semibold flex items-center gap-1 text-primary">
              <Paperclip className="w-3.5 h-3.5" />
              {fileCount} ፋይሎች
            </span>
          </div>
        </div>

        {/* Countdown timer */}
        <div className={`p-3 rounded-xl text-center font-mono text-xs font-bold ${isOverdue ? 'bg-destructive/10 text-destructive border border-destructive/30' : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'}`}>
          {timeLeft}
        </div>

        {/* Action Button to View Details & Download Files */}
        <Button 
          onClick={onViewDetails}
          variant="outline" 
          className="w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>ዝርዝር እና የተያያዙ ፋይሎችን እይ (View & Download)</span>
        </Button>
      </CardContent>
    </Card>
  );
}

