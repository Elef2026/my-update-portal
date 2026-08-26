"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, Eye, CheckCircle2, Printer, FileCheck, XCircle } from "lucide-react";
import OrderDetailsModal from "@/components/OrderDetailsModal";

export default function HistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [filter, setFilter] = useState<"ALL" | "UPDATE_ONLY" | "PRINT_COMPLETED" | "REJECTED">("ALL");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch both COMPLETED and REJECTED orders
      const [compRes, rejRes] = await Promise.all([
        fetch("/api/orders?status=COMPLETED"),
        fetch("/api/orders?status=REJECTED")
      ]);

      let compData: any[] = [];
      let rejData: any[] = [];

      if (compRes.ok) compData = await compRes.json();
      if (rejRes.ok) rejData = await rejRes.json();

      setOrders([...compData, ...rejData]);
    } catch (err) {
      console.error("Failed to fetch history orders", err);
    } finally {
      setLoading(false);
    }
  };

  const updateOnlyCount = orders.filter(o => o.orderType === "UPDATE_ONLY" && o.status !== "REJECTED").length;
  const printCompletedCount = orders.filter(o => o.orderType === "FULL_SERVICE" && o.status !== "REJECTED").length;
  const rejectedCount = orders.filter(o => o.status === "REJECTED").length;
  const totalCompletedCount = updateOnlyCount + printCompletedCount;

  const filteredOrders = orders.filter((o) => {
    if (filter === "UPDATE_ONLY") return o.orderType === "UPDATE_ONLY" && o.status !== "REJECTED";
    if (filter === "PRINT_COMPLETED") return o.orderType === "FULL_SERVICE" && o.status !== "REJECTED";
    if (filter === "REJECTED") return o.status === "REJECTED";
    return true;
  });

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">እየጫነ ነው (Loading)...</div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Archive className="h-6 w-6 text-primary" /> 
            የተጠናቀቁ ስራዎች መቆጣጠሪያ (Completed & Archived Tasks Dashboard)
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            አብዴት ብቻ አልቀው የተጠናቀቁ እና ማተሚያ ቤት ፕሪንት ተደርገው ያለቁ ስራዎች በሙሉ
          </p>
        </div>
        <Button variant="outline" onClick={fetchOrders}>አድስ (Refresh)</Button>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-xl border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">ጠቅላላ የተጠናቀቁ (Total)</p>
            <p className="text-2xl font-bold text-emerald-600">{totalCompletedCount}</p>
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-lg">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">አብዴት ብቻ (Update Only)</p>
            <p className="text-2xl font-bold text-blue-600">{updateOnlyCount}</p>
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-lg">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">ህትመት ተጠናቆ ያለቀ (Print)</p>
            <p className="text-2xl font-bold text-indigo-600">{printCompletedCount}</p>
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-600 rounded-lg">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">ውድቅ የተደረጉ (Rejected)</p>
            <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
          </div>
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
          ሁሉም ({orders.length})
        </Button>
        <Button 
          variant={filter === "UPDATE_ONLY" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setFilter("UPDATE_ONLY")}
          className="text-xs"
        >
          አብዴት ብቻ ያለቁ ({updateOnlyCount})
        </Button>
        <Button 
          variant={filter === "PRINT_COMPLETED" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setFilter("PRINT_COMPLETED")}
          className="text-xs"
        >
          ህትመት ተጠናቆ ያለቀ ({printCompletedCount})
        </Button>
        <Button 
          variant={filter === "REJECTED" ? "destructive" : "outline"} 
          size="sm" 
          onClick={() => setFilter("REJECTED")}
          className="text-xs"
        >
          ውድቅ የተደረጉ ({rejectedCount})
        </Button>
      </div>

      {/* Content Grid */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-xl border">
          <h2 className="text-xl font-bold mb-2">ምንም መረጃ አልተገኘም</h2>
          <p className="text-muted-foreground text-sm">በዚህ ዘበብ ውስጥ የተጠናቀቀ ስራ የለም።</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const isRejected = order.status === "REJECTED";
            const isUpdateOnly = order.orderType === "UPDATE_ONLY";

            return (
              <Card key={order.id} className={`border-l-4 ${isRejected ? 'border-l-red-500' : isUpdateOnly ? 'border-l-blue-500' : 'border-l-indigo-500'} shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-start text-lg">
                    <span>{order.customerName}</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${isUpdateOnly ? 'bg-blue-500/10 text-blue-600' : 'bg-indigo-500/10 text-indigo-600'}`}>
                      {isUpdateOnly ? "አብዴት ብቻ" : "አብዴት እና ፕሪንት"}
                    </span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-mono">{order.customerPhone}</p>
                  {order.shop?.shopName && (
                    <p className="text-xs text-muted-foreground pt-1">ማተሚያ ቤት: <strong className="font-semibold text-foreground">{order.shop.shopName}</strong></p>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1 border">
                    <p><strong>አገልግሎቶች:</strong> {Array.isArray(order.selectedServices) ? order.selectedServices.join(", ") : order.selectedServices}</p>
                    <p><strong>ክፍያ:</strong> {order.paymentMethod === "CHAPA" ? "በቻፓ" : "ጥሬ ገንዘብ"} ({order.totalPaid} ETB)</p>
                    <p className="text-[11px] text-muted-foreground pt-1">
                      {isRejected 
                        ? `ውድቅ ተደርጓል: ${new Date(order.updatedAt).toLocaleDateString()}` 
                        : isUpdateOnly 
                          ? `አብዴት የተጠናቀቀው: ${new Date(order.updatedAt).toLocaleDateString()}` 
                          : `ፕሪንት የተደረገው: ${new Date(order.printedAt || order.updatedAt).toLocaleDateString()}`}
                    </p>
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
