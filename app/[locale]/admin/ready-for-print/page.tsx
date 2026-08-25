"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer } from "lucide-react";

export default function ReadyForPrintPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">እየጫነ ነው (Loading)...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">ለህትመት የተዘጋጀ የለም</h2>
        <p className="text-muted-foreground">ሁሉም ስራዎች ህትመት ቤቶች ጋር ደርሰዋል።</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 bg-card p-6 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-indigo-500 flex items-center gap-2">
            <Printer className="h-6 w-6" /> 
            ለህትመት የተላኩ (For Print)
          </h1>
          <p className="text-muted-foreground mt-1">አብዴት ተደርገው፣ ህትመት ቤቱ ፕሪንት እስኪያደርጋቸው የሚጠበቁ (Waiting for shop to print)</p>
        </div>
        <Button variant="outline" onClick={fetchOrders}>አድስ (Refresh)</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="border-l-4 border-l-indigo-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-start text-lg">
                <span>{order.customerName}</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
              {order.shop?.shopName && (
                <p className="text-xs text-indigo-600 pt-1 font-medium">የሚታተመው: {order.shop.shopName}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded text-sm space-y-1">
                <p><strong>የተመረጡ አገልግሎቶች:</strong> {order.selectedServices?.join(", ")}</p>
                <p><strong>ክፍያ:</strong> {order.totalPaid} ETB</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
