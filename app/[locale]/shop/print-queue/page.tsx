"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Printer, CheckCircle, Download } from "lucide-react";
import { confirmPrintedAndLogRevenue } from "@/app/actions/settlement";

export default function PrintQueuePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders?status=READY_FOR_PRINT_SHOP");
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

  const handleMarkAsPrinted = async (orderId: string, shopId: string) => {
    if (!confirm("ፕሪንት ማጠናቀቅዎን እና ገቢዎን መመዝገብዎን ያረጋግጣሉ? (Confirm print & log revenue?)")) return;

    setProcessingId(orderId);
    try {
      const res = await confirmPrintedAndLogRevenue(orderId, shopId);
      if (res.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        alert("ፕሪንት መደረጉ እና ገቢዎ በተሳካ ሁኔታ ተመዝግቧል! (Revenue officially logged)");
      } else {
        alert(res.error || "ስህተት ተፈጥሯል");
      }
    } catch (err) {
      console.error(err);
      alert("ስህተት ተፈጥሯል");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">እየጫነ ነው (Loading)...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">ምንም ፕሪንት የሚደረግ የለም</h2>
        <p className="text-muted-foreground">ከአድሚን የተላከ አዲስ ፕሪንት የሚደረግ ሰነድ የለም። (Queue is empty)</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 bg-card p-6 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-indigo-500 flex items-center gap-2">
            <Printer className="h-6 w-6" /> 
            ፕሪንት የሚደረጉ (Print Queue)
          </h1>
          <p className="text-muted-foreground mt-1">
            አድሚኑ ሰርቶ የላካቸውን ፋይሎች አውርደው ፕሪንት ሲያደርጉ "ፕሪንት አድርጌያለሁ" የሚለውን በመጫን ገቢዎን ያስመዝግቡ።
          </p>
        </div>
        <Button variant="outline" onClick={fetchOrders}>አድስ (Refresh)</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="border-l-4 border-l-indigo-500 shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {order.customerName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded text-sm space-y-2">
                <p><strong>አገልግሎቶች:</strong> {order.selectedServices?.join(", ")}</p>
                <p><strong>የእርስዎ ገቢ:</strong> <span className="font-bold text-emerald-600">{order.shopEarnings || order.totalPaid} ETB</span></p>
                
                {order.adminAttachmentUrl ? (
                  <a 
                    href={order.adminAttachmentUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold underline text-sm pt-1"
                  >
                    <Download className="w-4 h-4" /> ፋይሉን አውርድ (Download Print File)
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground italic">ፋይል አልተያያዘም</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 text-white font-medium"
                disabled={processingId === order.id}
                onClick={() => handleMarkAsPrinted(order.id, order.shopId)}
              >
                <CheckCircle className="h-4 w-4" /> 
                {processingId === order.id ? "በመመዝገብ ላይ..." : "ፕሪንት አድርጌያለሁ (Printed)"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
