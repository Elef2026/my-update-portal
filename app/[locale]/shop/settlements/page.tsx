"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DollarSign, CheckCircle2 } from "lucide-react";

export default function ShopSettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/settlements`);
      if (res.ok) {
        const data = await res.json();
        setSettlements(data);
      }
    } catch (err) {
      console.error("Failed to fetch settlements", err);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (id: string) => {
    try {
      const res = await fetch("/api/settlements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "COMPLETED" })
      });
      if (res.ok) {
        alert("ክፍያ መቀበልዎን አረጋግጠዋል (Verified successfully)");
        fetchSettlements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">እየጫነ ነው (Loading)...</div>;
  }

  if (settlements.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">ምንም የሂሳብ ሪፖርት የለም</h2>
        <p className="text-muted-foreground">በአድሚን የተላከ የሳምንት ክፍያ ወይም እዳ እስካሁን የለም።</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 bg-card p-6 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-emerald-500 flex items-center gap-2">
            <DollarSign className="h-6 w-6" /> 
            የገንዘብ ክፍፍል እና ገቢ (Settlements)
          </h1>
          <p className="text-muted-foreground mt-1">የየሳምንቱን ገቢዎን እና አድሚኑ የላከውን ክፍያ ማረጋገጫ</p>
        </div>
        <Button variant="outline" onClick={fetchSettlements}>አድስ (Refresh)</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settlements.map((settlement) => (
          <ShopSettlementCard 
            key={settlement.id} 
            settlement={settlement} 
            onVerify={verifyPayment}
          />
        ))}
      </div>
    </div>
  );
}

function ShopSettlementCard({ settlement, onVerify }: { settlement: any, onVerify: (id: string) => void }) {
  const isPending = settlement.status === "PENDING";
  const isPaid = settlement.status === "PAID_BY_ADMIN";
  const isCompleted = settlement.status === "COMPLETED";

  return (
    <Card className={`border-l-4 shadow-sm flex flex-col justify-between ${
      isCompleted ? 'border-l-blue-500 bg-blue-50/10' : 
      isPaid ? 'border-l-emerald-500' : 'border-l-amber-500'
    }`}>
      <CardHeader className="pb-2 border-b">
        <CardTitle className="flex justify-between items-start text-lg">
          <span>{new Date(settlement.weekStartDate).toLocaleDateString()} - {new Date(settlement.weekEndDate).toLocaleDateString()}</span>
          <span className={`text-xs font-normal px-2 py-1 rounded text-white ${
            isCompleted ? 'bg-blue-500' : isPaid ? 'bg-emerald-500' : 'bg-amber-500'
          }`}>
            {isCompleted ? "ተረጋግጧል (Verified)" : isPaid ? "ገንዘቡ ተልኳል (Money Sent)" : "በሂደት ላይ (Pending)"}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-muted p-2 rounded text-center">
            <p className="text-muted-foreground text-xs">ጠቅላላ የሰሩት (Earned)</p>
            <p className="font-bold text-emerald-600">{settlement.totalEarned} ETB</p>
          </div>
          <div className="bg-muted p-2 rounded text-center">
            <p className="text-muted-foreground text-xs">ካሽ የተቀበሉት እዳ (Debt)</p>
            <p className="font-bold text-destructive">{settlement.totalOwed} ETB</p>
          </div>
        </div>
        
        <div className="bg-primary/10 p-3 rounded-md text-center">
           <p className="text-xs uppercase font-bold text-primary mb-1">
             {Number(settlement.netPayout) < 0 ? "እርስዎ ለአድሚኑ መላክ ያለብዎት" : "ወደ አካውንትዎ የሚገባው የተጣራ ክፍያ"}
           </p>
           <p className="text-2xl font-black text-primary">{Math.abs(settlement.netPayout)} ETB</p>
        </div>

        {(isPaid || isCompleted) && settlement.receiptUrl && (
          <div className="text-sm text-blue-500 underline text-center mt-2">
            <a href={settlement.receiptUrl} target="_blank" rel="noreferrer">አድሚኑ የላከውን ደረሰኝ ይመልከቱ (View Admin Receipt)</a>
          </div>
        )}
      </CardContent>

      {isPaid && (
        <CardFooter className="mt-auto flex flex-col gap-2">
          <p className="text-xs text-muted-foreground text-center">ገንዘቡ መግባቱን በባንክዎ ካረጋገጡ በኋላ ከታች ያለውን ቁልፍ ይጫኑ።</p>
          <Button 
            className="w-full bg-blue-500 hover:bg-blue-600 flex items-center gap-2"
            onClick={() => onVerify(settlement.id)}
          >
            <CheckCircle2 className="h-4 w-4" /> ገንዘቡ እንደገባ አረጋግጫለሁ (Verify Receipt)
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
