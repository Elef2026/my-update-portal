"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Eye, Wallet, DollarSign, ArrowDownRight, ArrowUpRight } from "lucide-react";
import OrderDetailsModal from "@/components/OrderDetailsModal";

export default function ShopCompletedPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [filter, setFilter] = useState<"ALL" | "UPDATE_ONLY" | "PRINT_COMPLETED" | "CASH" | "CHAPA">("ALL");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch completed orders awaiting Sunday settlement for shop
      const res = await fetch("/api/orders?status=PRINTED_AWAITING_SETTLEMENT");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch completed orders", err);
    } finally {
      setLoading(false);
    }
  };

  // Financial Calculations
  let totalShopEarned = 0;
  let totalCashCollected = 0;
  let totalChapaEarnings = 0;

  for (const o of orders) {
    const shopE = Number(o.shopEarnings || 0);
    const adminE = Number(o.adminCommission || 0);
    const fees = Number(o.serverFee || 10) + Number(o.smsFee || 10);

    totalShopEarned += shopE;

    if (o.paymentMethod === "CASH_TO_SHOP") {
      // Shop collected cash directly from customer, owes admin fees & adminCut
      totalCashCollected += adminE + fees;
    } else {
      // Admin holds online Chapa payment, owes shop shopE
      totalChapaEarnings += shopE;
    }
  }

  // Net Balance: Positive = Admin pays Shop, Negative = Shop owes Admin
  const netBalance = totalChapaEarnings - totalCashCollected;

  const filteredOrders = orders.filter((o) => {
    if (filter === "UPDATE_ONLY") return o.orderType === "UPDATE_ONLY";
    if (filter === "PRINT_COMPLETED") return o.orderType === "FULL_SERVICE";
    if (filter === "CASH") return o.paymentMethod === "CASH_TO_SHOP";
    if (filter === "CHAPA") return o.paymentMethod === "CHAPA";
    return true;
  });

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground font-medium">እየጫነ ነው (Loading completed tasks)...</div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" /> 
            የተጠናቀቁ ስራዎች እና የሳምንቱ ገቢ (Completed Tasks & Earnings)
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            ፕሪንት ተደርገው ወይም አብዴት ብቻ አልቀው እሁድ ክፍያ ማወራረድ የሚጠበቁ ስራዎች
          </p>
        </div>
        <Button variant="outline" onClick={fetchOrders}>አድስ (Refresh)</Button>
      </div>

      {/* Live Financial Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-card p-5 rounded-xl border shadow-sm space-y-1">
          <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
            <span>የእርስዎ ጠቅላላ ገቢ (Shop Total Earned)</span>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">{totalShopEarned.toFixed(2)} ETB</p>
          <p className="text-[11px] text-muted-foreground">ከተሰሩት ስራዎች የተሰበሰበ</p>
        </div>

        <div className="bg-card p-5 rounded-xl border shadow-sm space-y-1">
          <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
            <span>በጥሬ ገንዘብ የተሰበሰበ እዳ (Cash Owed to Admin)</span>
            <ArrowDownRight className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-amber-600">{totalCashCollected.toFixed(2)} ETB</p>
          <p className="text-[11px] text-muted-foreground">ለአድሚኑ የሚተላለፍ ክፍያ</p>
        </div>

        <div className={`p-5 rounded-xl border shadow-sm space-y-1 ${netBalance >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
          <div className="flex justify-between items-center text-xs font-semibold">
            <span>የተጣራ የሳምንት ሂሳብ (Net Balance)</span>
            {netBalance >= 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-amber-600" />}
          </div>
          <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {Math.abs(netBalance).toFixed(2)} ETB
          </p>
          <p className="text-[11px] font-semibold text-foreground">
            {netBalance >= 0 ? "አድሚን ለእርስዎ የሚከፍለው" : "እርስዎ ለአድሚን የሚከፍሉት (እዳ)"}
          </p>
        </div>

      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-4">
        <Button 
          variant={filter === "ALL" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setFilter("ALL")}
          className="text-xs"
        >
          ሁሉም የተጠናቀቁ ({orders.length})
        </Button>
        <Button 
          variant={filter === "UPDATE_ONLY" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setFilter("UPDATE_ONLY")}
          className="text-xs"
        >
          አብዴት ብቻ ({orders.filter(o => o.orderType === "UPDATE_ONLY").length})
        </Button>
        <Button 
          variant={filter === "PRINT_COMPLETED" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setFilter("PRINT_COMPLETED")}
          className="text-xs"
        >
          ህትመት ተጠናቆ ያለቀ ({orders.filter(o => o.orderType === "FULL_SERVICE").length})
        </Button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-xl border">
          <h2 className="text-xl font-bold mb-2">ምንም የተጠናቀቀ ስራ የለም</h2>
          <p className="text-muted-foreground text-sm">በዚህ ክፍል የተጠናቀቀ እና እሁድ ማወራረድ የሚጠበቅ ስራ አልተገኘም።</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const isUpdateOnly = order.orderType === "UPDATE_ONLY";

            return (
              <Card key={order.id} className={`border-l-4 ${isUpdateOnly ? 'border-l-blue-500' : 'border-l-emerald-500'} shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-start text-lg">
                    <span>{order.customerName}</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${isUpdateOnly ? 'bg-blue-500/10 text-blue-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                      {isUpdateOnly ? "አብዴት ብቻ" : "አብዴት እና ፕሪንት"}
                    </span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-mono">{order.customerPhone}</p>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1.5 border">
                    <p><strong>አገልግሎቶች:</strong> {Array.isArray(order.selectedServices) ? order.selectedServices.join(", ") : order.selectedServices}</p>
                    <div className="pt-1.5 border-t space-y-1">
                      <p className="flex justify-between">
                        <span>የእርስዎ ገቢ:</span> 
                        <strong className="text-emerald-600 font-bold">{Number(order.shopEarnings || 0).toFixed(2)} ETB</strong>
                      </p>
                      <p className="flex justify-between">
                        <span>ለአድሚን የሚተላለፍ:</span> 
                        <strong className="text-blue-600 font-semibold">{(Number(order.adminCommission || 0) + Number(order.serverFee || 10) + Number(order.smsFee || 10)).toFixed(2)} ETB</strong>
                      </p>
                    </div>
                  </div>

                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary hover:text-primary-foreground font-semibold"
                    onClick={() => setSelectedTask(order)}
                  >
                    <Eye className="w-4 h-4" />
                    <span>ሞር ዲቴል (More Details / ሰነድ ማውረጃ)</span>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
