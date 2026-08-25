"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Undo2, ReceiptText, AlertCircle } from "lucide-react";

export default function ShopRefundsPage() {
  const [activeTab, setActiveTab] = useState<"REQUEST" | "HISTORY">("REQUEST");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for requesting refund
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (activeTab === "REQUEST") {
        // Fetch in-progress or rejected orders that could be refunded
        const res = await fetch("/api/orders?status=ADMIN_PROCESSING");
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } else {
        // Fetch refunded orders
        const res = await fetch("/api/orders?status=REFUNDED");
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch refund orders", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRefund = async (orderId: string) => {
    if (!reason) return alert("እባክዎ የሪፈንድ ምክንያቱን ያስገቡ (Please enter reason)");
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          newStatus: "REJECTED"
        })
      });
      if (res.ok) {
        alert("የሪፈንድ ጥያቄዎ በተሳካ ሁኔታ ተልኳል! (Refund request submitted)");
        setReason("");
        setSelectedOrderId("");
        fetchOrders();
      } else {
        alert("ስህተት ተፈጥሯል (Error submitting refund)");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 bg-card p-6 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-destructive flex items-center gap-2">
            <Undo2 className="h-6 w-6" /> 
            የሪፈንድ ጥያቄዎች (Refund Requests)
          </h1>
          <p className="text-muted-foreground mt-1">ጊዜ ስላለፈባቸው ስራዎች ገንዘብ እንዲመለስ መጠየቂያ እና ታሪክ</p>
        </div>
        <div className="flex bg-muted rounded-md p-1">
          <Button 
            variant={activeTab === "REQUEST" ? "default" : "ghost"}
            className={activeTab === "REQUEST" ? "bg-background text-foreground shadow-sm hover:bg-background" : ""}
            onClick={() => setActiveTab("REQUEST")}
          >
            አዲስ ጥያቄ አቅርብ
          </Button>
          <Button 
            variant={activeTab === "HISTORY" ? "default" : "ghost"}
            className={activeTab === "HISTORY" ? "bg-background text-foreground shadow-sm hover:bg-background" : ""}
            onClick={() => setActiveTab("HISTORY")}
          >
            የተመለሱ ታሪክ (History)
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">እየጫነ ነው (Loading)...</div>
      ) : activeTab === "REQUEST" ? (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <p className="text-sm text-amber-800">
              አድሚኑ በሰዓቱ ያልጨረሰውን ወይም ቀን ያለፈበትን ስራ እዚህ መርጠው የሪፈንድ ጥያቄ ማቅረብ ይችላሉ። አድሚኑ ሲያረጋግጥ የባንክ ደረሰኝ ይልክልዎታል።
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="p-8 text-center bg-card rounded-lg border">
              <h2 className="text-xl font-bold mb-2">ምንም ጥያቄ የሚቀርብበት ስራ የለም</h2>
              <p className="text-muted-foreground">ሁሉም ስራዎች በተገቢው ሁኔታ ላይ ናቸው።</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map((order) => (
                <Card key={order.id} className="border-l-4 border-l-destructive shadow-sm flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{order.customerName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-muted p-2 rounded text-sm">
                      <p><strong>አገልግሎት:</strong> {order.selectedServices?.join(", ")}</p>
                      <p><strong>የተከፈለ መጠን:</strong> {order.totalPaid} ETB</p>
                    </div>

                    {selectedOrderId === order.id ? (
                      <div className="space-y-2 mt-2">
                        <Input 
                          placeholder="የሪፈንድ ምክንያት (Reason, e.g. ቀን አልፎበታል)..." 
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </div>
                    ) : null}
                  </CardContent>
                  <CardFooter className="mt-auto">
                    {selectedOrderId === order.id ? (
                      <div className="flex gap-2 w-full">
                        <Button 
                          variant="destructive" 
                          className="w-full"
                          disabled={submitting}
                          onClick={() => handleRequestRefund(order.id)}
                        >
                          {submitting ? "በመላክ ላይ..." : "ጥያቄውን አረጋግጥ"}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => { setSelectedOrderId(""); setReason(""); }}
                        >
                          ሰርዝ
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        ሪፈንድ ጠይቅ (Request Refund)
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="p-8 text-center bg-card rounded-lg border">
              <h2 className="text-xl font-bold mb-2">ምንም የተመለሰ ሪፈንድ የለም</h2>
              <p className="text-muted-foreground">እስካሁን የተጠናቀቀ የሪፈንድ ታሪክ የለም።</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map((order) => (
                <Card key={order.id} className="border-l-4 border-l-slate-500 shadow-sm flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{order.customerName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-muted p-2 rounded text-sm space-y-1">
                      <p className="text-destructive font-bold text-lg">{order.totalPaid} ETB (ተመልሷል)</p>
                      <p><strong>አገልግሎት:</strong> {order.selectedServices?.join(", ")}</p>
                    </div>

                    {order.refundReceiptUrl && (
                      <div className="mt-2 text-sm text-blue-500 underline flex items-center gap-1">
                        <ReceiptText className="w-4 h-4" />
                        <a href={order.refundReceiptUrl} target="_blank" rel="noreferrer">
                          የባንክ ደረሰኝ ይመልከቱ (View Receipt)
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
