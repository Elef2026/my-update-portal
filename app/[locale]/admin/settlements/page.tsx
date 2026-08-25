"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DollarSign, CheckCircle2 } from "lucide-react";

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // For generating new settlement
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [generating, setGenerating] = useState(false);

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

  const generateSettlement = async () => {
    if (!startDate || !endDate) return alert("ቀን ይምረጡ (Select dates)");
    
    setGenerating(true);
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStartDate: startDate, weekEndDate: endDate })
      });
      if (res.ok) {
        alert("ተሳክቷል! (Settlements generated successfully)");
        fetchSettlements();
      } else {
        alert("ስህተት ተፈጥሯል (Error generating)");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const markPaid = async (id: string, receiptUrl: string) => {
    if (!receiptUrl) return alert("ደረሰኝ ሊንክ ያስገቡ (Enter receipt URL)");
    try {
      const res = await fetch("/api/settlements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "PAID_BY_ADMIN", receiptUrl })
      });
      if (res.ok) {
        fetchSettlements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-card p-6 rounded-lg border shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-500 flex items-center gap-2">
            <DollarSign className="h-6 w-6" /> 
            የገንዘብ ክፍፍል (Weekly Settlements)
          </h1>
          <p className="text-muted-foreground mt-1">በየሳምንቱ የሚሰራ የሂሳብ ማወራረድያ እና ክፍያ መፈፀሚያ</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 bg-muted p-2 rounded items-end">
           <div className="flex flex-col">
              <label className="text-xs mb-1">ከ (Start Date)</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
           </div>
           <div className="flex flex-col">
              <label className="text-xs mb-1">እስከ (End Date)</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
           </div>
           <Button onClick={generateSettlement} disabled={generating} className="bg-emerald-500 hover:bg-emerald-600">
             {generating ? "..." : "አስላ (Generate)"}
           </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">እየጫነ ነው (Loading)...</div>
      ) : settlements.length === 0 ? (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">ምንም መረጃ የለም</h2>
          <p className="text-muted-foreground">የሂሳብ ማወራረድያ እስካሁን አልተሰራም።</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settlements.map((settlement) => (
            <SettlementCard 
              key={settlement.id} 
              settlement={settlement} 
              onMarkPaid={markPaid}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SettlementCard({ settlement, onMarkPaid }: { settlement: any, onMarkPaid: (id: string, url: string) => void }) {
  const [receipt, setReceipt] = useState("");
  
  const isPending = settlement.status === "PENDING";
  const isPaid = settlement.status === "PAID_BY_ADMIN";
  const isCompleted = settlement.status === "COMPLETED"; // Verified by shop

  return (
    <Card className={`border-l-4 shadow-sm flex flex-col justify-between ${
      isCompleted ? 'border-l-blue-500 bg-blue-50/10' : 
      isPaid ? 'border-l-emerald-500' : 'border-l-amber-500'
    }`}>
      <CardHeader className="pb-2 border-b">
        <CardTitle className="flex justify-between items-start text-lg">
          <span>{settlement.shop?.shopName || "Unknown Shop"}</span>
          <span className={`text-xs font-normal px-2 py-1 rounded text-white ${
            isCompleted ? 'bg-blue-500' : isPaid ? 'bg-emerald-500' : 'bg-amber-500'
          }`}>
            {isCompleted ? "ተረጋግጧል (Verified)" : isPaid ? "ተልኳል (Paid)" : "አልተከፈለም (Pending)"}
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {new Date(settlement.weekStartDate).toLocaleDateString()} - {new Date(settlement.weekEndDate).toLocaleDateString()}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-muted p-2 rounded text-center">
            <p className="text-muted-foreground text-xs">ጠቅላላ የሰራው (Earned)</p>
            <p className="font-bold text-emerald-600">{settlement.totalEarned} ETB</p>
          </div>
          <div className="bg-muted p-2 rounded text-center">
            <p className="text-muted-foreground text-xs">እዳ (Owed/Cash taken)</p>
            <p className="font-bold text-destructive">{settlement.totalOwed} ETB</p>
          </div>
        </div>
        
        <div className="bg-primary/10 p-3 rounded-md text-center">
           <p className="text-xs uppercase font-bold text-primary mb-1">የሚላክለት የተጣራ ክፍያ (Net Payout)</p>
           <p className="text-2xl font-black text-primary">{settlement.netPayout} ETB</p>
           {Number(settlement.netPayout) < 0 && (
             <p className="text-xs text-destructive mt-1">ማተሚያ ቤቱ አድሚን ላይ እዳ አለበት!</p>
           )}
        </div>

        {isPending && (
          <div className="space-y-2 mt-4">
             <label className="text-xs font-semibold">የክፍያ ደረሰኝ ሊንክ (Receipt URL)</label>
             <Input 
                placeholder="https://.../transfer.jpg" 
                value={receipt}
                onChange={(e) => setReceipt(e.target.value)}
             />
          </div>
        )}

        {(isPaid || isCompleted) && settlement.receiptUrl && (
          <div className="text-sm text-blue-500 underline text-center mt-2">
            <a href={settlement.receiptUrl} target="_blank" rel="noreferrer">ደረሰኝ ይመልከቱ (View Receipt)</a>
          </div>
        )}
      </CardContent>

      {isPending && (
        <CardFooter className="mt-auto">
          <Button 
            className="w-full bg-emerald-500 hover:bg-emerald-600 flex items-center gap-2"
            onClick={() => onMarkPaid(settlement.id, receipt)}
          >
            <CheckCircle2 className="h-4 w-4" /> ደረሰኝ ላክ (Mark as Paid)
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
