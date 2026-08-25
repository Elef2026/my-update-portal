"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Printer, CheckCircle } from "lucide-react";

export default function PrintQueuePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // The backend /api/orders automatically filters for this shop's orders
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

  const markAsDelivered = async (orderId: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, newStatus: "DELIVERED_TO_CUSTOMER" })
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        alert("በተሳካ ሁኔታ አልቋል (Completed successfully)");
      }
    } catch (err) {
      console.error("Failed to update status", err);
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
          <p className="text-muted-foreground mt-1">አድሚኑ አብዴት አድርጎ የጨረሳቸው እና ለደንበኛው ፕሪንት አድርገው የሚሰጧቸው ሰነዶች።</p>
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
              <div className="bg-muted p-3 rounded text-sm space-y-1">
                <p><strong>የተመረጡ አገልግሎቶች:</strong> {order.selectedServices?.join(", ")}</p>
                <p><strong>ፋይሉ ያለበት:</strong> 
                  <a href="#" className="text-indigo-600 underline ml-1 font-semibold">ፋይሉን አውርድ (Download File)</a>
                </p>
              </div>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button 
                className="w-full bg-indigo-500 hover:bg-indigo-600 flex items-center gap-2"
                onClick={() => markAsDelivered(order.id)}
              >
                <CheckCircle className="h-4 w-4" /> ፕሪንት አድርጌ ሰጥቻለሁ (Mark as Printed)
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
