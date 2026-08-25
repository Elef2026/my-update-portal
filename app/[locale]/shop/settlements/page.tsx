"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DollarSign, CheckCircle2, ReceiptText, AlertTriangle } from "lucide-react";
import { approveReceiptAndArchive } from "@/app/actions/settlement";

export default function ShopSettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

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

  const handleApproveReceipt = async (settlementId: string, shopId: string) => {
    if (!confirm("የባንክ ደረሰኙን በትክክል መመልከትዎን እና ገንዘቡ በባንክዎ መግባቱን ያረጋግጣሉ? (Approve transfer receipt & archive tasks?)")) return;

    setApprovingId(settlementId);
    try {
      const res = await approveReceiptAndArchive(settlementId, shopId);
      if (res.success) {
        alert("ክፍያው ጸድቋል! የሳምንቱ ስራዎች ወደ ማህደር (Archive) ተዛውረዋል።");
        fetchSettlements();
      } else {
        alert(res.error || "ስህተት ተፈጥሯል");
      }
    } catch (err) {
      console.error(err);
      alert("ስህተት ተፈጥሯል");
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">እየጫነ ነው (Loading)...</div>;
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 bg-card p-6 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
            <DollarSign className="h-6 w-6" /> 
            የገንዘብ ክፍፍል እና ገቢ (Settlements & Income)
          </h1>
          <p className="text-muted-foreground mt-1">
            የሳምንታዊ ክፍያ ማረጋገጫ እና የእሁድ የባንክ ደረሰኝ ማጽደቂያ
          </p>
        </div>
        <Button variant="outline" onClick={fetchSettlements}>አድስ (Refresh)</Button>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
        <p className="text-sm text-amber-900">
          <strong>ማሳሰቢያ፦</strong> አድሚኑ የላከውን የባንክ ማስተላለፊያ ደረሰኝ (Receipt) አይተው <strong>"በትክክል ገብቶልኛል (Approve)"</strong> እስካልጫኑ ድረስ፣ የሳምንቱ ስራዎች ወደ 'Old Completed' ማህደር አይዛወሩም።
        </p>
      </div>

      {settlements.length === 0 ? (
        <div className="p-8 text-center bg-card rounded-lg border">
          <h2 className="text-xl font-bold mb-2">ምንም የሂሳብ ማወራረድያ የለም</h2>
          <p className="text-muted-foreground">በአድሚን የተላከ የሳምንት ክፍያ እስካሁን የለም።</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settlements.map((settlement) => {
            const isPendingApproval = settlement.status === "PENDING_SHOP_APPROVAL";
            const isApproved = settlement.status === "APPROVED_AND_ARCHIVED";

            return (
              <Card key={settlement.id} className={`border-l-4 shadow-sm flex flex-col justify-between ${
                isApproved ? 'border-l-blue-500 bg-blue-50/10' : 'border-l-emerald-500'
              }`}>
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="flex justify-between items-start text-lg">
                    <span>
                      {new Date(settlement.weekStartDate).toLocaleDateString()} - {new Date(settlement.weekEndDate).toLocaleDateString()}
                    </span>
                    <span className={`text-xs font-normal px-2.5 py-1 rounded text-white ${
                      isApproved ? 'bg-blue-600' : 'bg-emerald-600'
                    }`}>
                      {isApproved ? "ተረጋግጦ ተዘግቷል (Archived)" : "ደረሰኝ ተልኳል (Action Required)"}
                    </span>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-muted p-2.5 rounded text-center">
                      <p className="text-muted-foreground text-xs">ጠቅላላ ያገኙት ገቢ</p>
                      <p className="font-bold text-emerald-600 text-base">{settlement.totalEarned} ETB</p>
                    </div>
                    <div className="bg-muted p-2.5 rounded text-center">
                      <p className="text-muted-foreground text-xs">በጥሬ ገንዘብ (Cash) እዳ</p>
                      <p className="font-bold text-destructive text-base">{settlement.totalOwed} ETB</p>
                    </div>
                  </div>
                  
                  <div className="bg-primary/10 p-3 rounded-md text-center">
                    <p className="text-xs uppercase font-bold text-primary mb-1">
                      {Number(settlement.netPayout) < 0 
                        ? "እርስዎ ለአድሚኑ መላክ ያለብዎት (Debt)" 
                        : "ወደ ባንክዎ የተላለፈው የተጣራ ክፍያ (Net Payout)"}
                    </p>
                    <p className="text-2xl font-black text-primary">{Math.abs(settlement.netPayout)} ETB</p>
                  </div>

                  {settlement.receiptUrl && (
                    <div className="p-3 bg-muted rounded text-center">
                      <a 
                        href={settlement.receiptUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 font-semibold underline text-sm"
                      >
                        <ReceiptText className="w-4 h-4" /> አድሚኑ የላከውን የባንክ ደረሰኝ እይ (View Receipt)
                      </a>
                    </div>
                  )}
                </CardContent>

                {isPendingApproval && (
                  <CardFooter className="mt-auto flex flex-col gap-2 pt-2">
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2"
                      disabled={approvingId === settlement.id}
                      onClick={() => handleApproveReceipt(settlement.id, settlement.shopId)}
                    >
                      <CheckCircle2 className="h-4 w-4" /> 
                      {approvingId === settlement.id ? "በማጽደቅ ላይ..." : "በትክክል ገብቶልኛል (Approve Receipt & Archive)"}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
