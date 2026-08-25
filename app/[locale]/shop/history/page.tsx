"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// Mock data for demonstration
const mockOrders = [
  { id: "ORD-001", customerName: "አበበ ከበደ", phone: "0911223344", service: "የስም ማስተካከያ", status: "PENDING_PAYMENT", date: "2023-10-25" },
  { id: "ORD-002", customerName: "አለሚቱ በቀለ", phone: "0922334455", service: "የትውልድ ዘመን", status: "IN_PROGRESS", date: "2023-10-24" },
  { id: "ORD-003", customerName: "ተስፋዬ አበራ", phone: "0933445566", service: "ህትመት ብቻ", status: "COMPLETED", date: "2023-10-23" },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "PENDING_PAYMENT": return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 rounded-md text-xs font-medium">ክፍያ ይጠብቃል (Pending)</span>;
    case "PAYMENT_DONE": return <span className="px-2 py-1 bg-blue-500/20 text-blue-600 rounded-md text-xs font-medium">ተከፍሏል (Paid)</span>;
    case "IN_PROGRESS": return <span className="px-2 py-1 bg-purple-500/20 text-purple-600 rounded-md text-xs font-medium">በስራ ላይ (In Progress)</span>;
    case "COMPLETED": return <span className="px-2 py-1 bg-emerald-500/20 text-emerald-600 rounded-md text-xs font-medium">ተጠናቋል (Completed)</span>;
    case "DELIVERED": return <span className="px-2 py-1 bg-gray-500/20 text-gray-600 rounded-md text-xs font-medium">ተወስዷል (Delivered)</span>;
    default: return <span>{status}</span>;
  }
};

export default function ShopHistoryPage() {
  const [orders] = useState(mockOrders);

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold">የታሪክ ማህደር (Order History)</h1>
          <p className="text-muted-foreground mt-2">
            እስከዛሬ የላኳቸውን የደንበኞች ማደሻ ጥያቄዎች እና የት ደረጃ ላይ እንዳሉ ከታች ባለው ሰንጠረዥ ይከታተሉ።
          </p>
        </div>

        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">የመለያ ቁጥር (ID)</th>
                <th className="px-6 py-4 font-medium">የደንበኛ ስም (Customer)</th>
                <th className="px-6 py-4 font-medium">ስልክ (Phone)</th>
                <th className="px-6 py-4 font-medium">አገልግሎት (Service)</th>
                <th className="px-6 py-4 font-medium">ሁኔታ (Status)</th>
                <th className="px-6 py-4 font-medium">ቀን (Date)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{order.id}</td>
                  <td className="px-6 py-4">{order.customerName}</td>
                  <td className="px-6 py-4">{order.phone}</td>
                  <td className="px-6 py-4">{order.service}</td>
                  <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4 text-muted-foreground">{order.date}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    ምንም መረጃ አልተገኘም (No orders found)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
