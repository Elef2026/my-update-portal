"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DollarSign, CheckCircle2, Store, ArrowUpRight, ArrowDownRight, Receipt, ExternalLink, Calendar, AlertCircle, Sparkles, X } from "lucide-react";

interface ShopBalance {
  shopId: string;
  shopName: string;
  phone: string;
  email: string;
  orderCount: number;
  totalShopEarnings: number;
  totalCashDebt: number;
  totalChapaEarnings: number;
  netPayout: number;
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [shopBalances, setShopBalances] = useState<ShopBalance[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Settle
  const [selectedShop, setSelectedShop] = useState<ShopBalance | null>(null);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch existing settlements
      const resSettlements = await fetch(`/api/settlements`);
      if (resSettlements.ok) {
        const data = await resSettlements.json();
        setSettlements(data);
      }

      // 2. Fetch active completed orders awaiting settlement
      const resOrders = await fetch("/api/orders?status=PRINTED_AWAITING_SETTLEMENT");
      if (resOrders.ok) {
        const orders: any[] = await resOrders.json();
        
        // Filter out orders that already have a settlement
        const unsettledOrders = orders.filter((o) => !o.settlementId);

        // Group by shop
        const map: Record<string, ShopBalance> = {};

        for (const o of unsettledOrders) {
          const sId = o.assignedShopId || o.shopId;
          if (!sId) continue;

          if (!map[sId]) {
            map[sId] = {
              shopId: sId,
              shopName: o.shop?.shopName || "Unknown Shop",
              phone: o.shop?.phone || "",
              email: o.shop?.email || "",
              orderCount: 0,
              totalShopEarnings: 0,
              totalCashDebt: 0,
              totalChapaEarnings: 0,
              netPayout: 0,
            };
          }

          const sEarned = Number(o.shopEarnings || 0);
          const adminCut = Number(o.adminCommission || 0);
          const fees = Number(o.serverFee || 10) + Number(o.smsFee || 10);

          map[sId].orderCount += 1;
          map[sId].totalShopEarnings += sEarned;

          if (o.paymentMethod === "CASH_TO_SHOP") {
            map[sId].totalCashDebt += adminCut + fees;
          } else {
            map[sId].totalChapaEarnings += sEarned;
          }
        }

        // Calculate netPayout for each shop
        const list = Object.values(map).map((s) => ({
          ...s,
          totalShopEarnings: Number(s.totalShopEarnings.toFixed(2)),
          totalCashDebt: Number(s.totalCashDebt.toFixed(2)),
          totalChapaEarnings: Number(s.totalChapaEarnings.toFixed(2)),
          netPayout: Number((s.totalChapaEarnings - s.totalCashDebt).toFixed(2)),
        }));

        setShopBalances(list);
      }
    } catch (err) {
      console.error("Failed to fetch settlement data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettleModal = (shop: ShopBalance) => {
    setSelectedShop(shop);
    setReceiptUrl("");
  };

  const handleCloseSettleModal = () => {
    setSelectedShop(null);
    setReceiptUrl("");
  };

  const handleExecuteSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: selectedShop.shopId,
          receiptUrl: receiptUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("የእሁድ ሂሳብ ማወራረጃ በስኬት ተጠናቅቋል! ለህትመት ቤቱ ማረጋገጫ ተልኳል።");
        handleCloseSettleModal();
        fetchData();
      } else {
        alert(data.error || "ስህተት ተፈጥሯል");
      }
    } catch (err) {
      console.error(err);
      alert("የኔትወርክ ስህተት ተፈጥሯል");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
            <DollarSign className="h-8 w-8 text-emerald-600 shrink-0" /> 
            የእሁድ ገንዘብ ማካካሻ እና ማወራረጃ (Sunday Settlements)
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            ለእያንዳንዱ ህትመት ቤት በጥሬ የተሰበሰበውን እዳ እና በቻፓ የገባውን ገቢ በማስላት ክፍያ መፈጸሚያ
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} className="rounded-xl">
          አድስ (Refresh)
        </Button>
      </div>

      {/* SECTION 1: Active Unsettled Balances Per Shop */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            የማተሚያ ቤቶች ያልተወራረደ ወቅታዊ ሂሳብ ({shopBalances.length} Shops Awaiting Settlement)
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border">
            እየጫነ ነው (Loading)...
          </div>
        ) : shopBalances.length === 0 ? (
          <div className="p-8 text-center bg-card rounded-2xl border border-dashed text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-foreground">ሁሉም ሂሳቦች ተወራርደዋል!</p>
            <p className="text-xs text-muted-foreground mt-1">አሁን ላይ ያልተወራረደ ክፍያ የሚጠብቅ ማተሚያ ቤት የለም።</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shopBalances.map((shop) => {
              const isAdminPayingShop = shop.netPayout > 0;
              const isShopOwingAdmin = shop.netPayout < 0;

              return (
                <Card key={shop.shopId} className="border-2 hover:border-primary/50 shadow-sm transition-all flex flex-col justify-between rounded-2xl overflow-hidden">
                  <CardHeader className="bg-muted/40 pb-3 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <Store className="w-4 h-4 text-primary" /> {shop.shopName}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">
                          {shop.phone || shop.email}
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                        {shop.orderCount} ስራዎች
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
                        <p className="text-muted-foreground font-semibold flex items-center gap-1">
                          <ArrowDownRight className="w-3.5 h-3.5 text-destructive" /> በጥሬ (Cash) የወሰዱት
                        </p>
                        <p className="text-base font-bold text-destructive mt-1">{shop.totalCashDebt} ETB</p>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                        <p className="text-muted-foreground font-semibold flex items-center gap-1">
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> በቻፓ (Chapa) የገባቸው
                        </p>
                        <p className="text-base font-bold text-emerald-600 mt-1">{shop.totalChapaEarnings} ETB</p>
                      </div>
                    </div>

                    {/* Verdict Card */}
                    <div className={`p-4 rounded-xl text-center border ${
                      isAdminPayingShop 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400" 
                        : isShopOwingAdmin 
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400" 
                        : "bg-muted border-muted-foreground/20 text-muted-foreground"
                    }`}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-1">
                        {isAdminPayingShop 
                          ? "አድሚኑ ለህትመት ቤቱ የሚከፍለው (Pay to Shop)" 
                          : isShopOwingAdmin 
                          ? "ህትመት ቤቱ ለአድሚኑ የሚከፍለው እዳ (Shop Owes Admin)" 
                          : "ሂሳቡ የተስተካከለ ነው (Balanced)"}
                      </p>
                      <p className="text-2xl font-black">{Math.abs(shop.netPayout)} ETB</p>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 pb-5 px-5">
                    <Button 
                      onClick={() => handleOpenSettleModal(shop)}
                      className="w-full h-11 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md text-white flex items-center justify-center gap-2"
                    >
                      <Receipt className="w-4 h-4" /> ሂሳብ አወራርድ እና ደረሰኝ ላክ (Settle)
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Settlement History & Approvals */}
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          የተወራረዱ እና በሂደት ላይ ያሉ ማወራረድያዎች (Settlement History & Approvals)
        </h2>

        {settlements.length === 0 ? (
          <div className="p-8 text-center bg-card rounded-2xl border text-muted-foreground text-sm">
            እስካሁን የተፈጠረ የማወራረጃ ታሪክ የለም።
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settlements.map((settlement) => {
              const isApproved = settlement.status === "APPROVED_AND_ARCHIVED";

              return (
                <Card key={settlement.id} className={`rounded-2xl border-l-4 shadow-sm flex flex-col justify-between ${
                  isApproved ? 'border-l-blue-600 bg-blue-50/10' : 'border-l-emerald-500'
                }`}>
                  <CardHeader className="pb-2 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-bold">
                          {settlement.shop?.shopName || "Unknown Shop"}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(settlement.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${
                        isApproved ? 'bg-blue-600' : 'bg-emerald-600'
                      }`}>
                        {isApproved ? "ተረጋግጦ ተዘግቷል (Archived)" : "ማረጋገጫ ይጠብቃል (Pending)"}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 space-y-3 text-sm">
                    <div className="flex justify-between items-center bg-muted/60 p-2.5 rounded-lg text-xs">
                      <span className="text-muted-foreground font-medium">የተጣራ ሂሳብ (Net Payout):</span>
                      <span className="font-bold text-sm text-primary">{Math.abs(settlement.netPayout)} ETB</span>
                    </div>

                    {settlement.receiptUrl && (
                      <div className="text-center pt-1">
                        <a 
                          href={settlement.receiptUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline"
                        >
                          <Receipt className="w-3.5 h-3.5" /> የተያያዘ የባንክ ደረሰኝ እይ (View Receipt) <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Settle Modal */}
      {selectedShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b bg-muted/30">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                {selectedShop.shopName} - የእሁድ ሂሳብ ማወራረጃ
              </h2>
              <button onClick={handleCloseSettleModal} className="p-2 hover:bg-muted rounded-full">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleExecuteSettlement} className="p-6 space-y-5">
              <div className="bg-muted/40 p-4 rounded-2xl space-y-2 text-sm border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ያለቁ ስራዎች ብዛት፡</span>
                  <span className="font-bold">{selectedShop.orderCount} ስራዎች</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>በጥሬ (Cash) የተወሰደ እዳ፡</span>
                  <span className="font-bold">{selectedShop.totalCashDebt} ETB</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>በቻፓ (Chapa) የተገኘ ገቢ፡</span>
                  <span className="font-bold">{selectedShop.totalChapaEarnings} ETB</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-base">
                  <span>የተጣራ የሚወራረድ ሂሳብ፡</span>
                  <span className="text-primary font-black">{Math.abs(selectedShop.netPayout)} ETB</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">
                  የባንክ ማስተላለፊያ ደረሰኝ ፎቶ ሊንክ (Bank Transfer / Receipt URL)
                </label>
                <Input 
                  placeholder="https://example.com/receipt-photo.jpg"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  className="rounded-xl font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  ደረሰኙን በማያያዝ ማተሚያ ቤቱ በራሱ ዳሽቦርድ ላይ ደረሰኙን እንዲያይና እንዲያጸድቅ ይደረጋል።
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <Button type="button" variant="outline" onClick={handleCloseSettleModal} className="w-full rounded-xl">
                  ሰርዝ (Cancel)
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 font-bold text-white shadow-md"
                >
                  {isSubmitting ? "በማወራረድ ላይ..." : "አወራርድ (Confirm & Settle)"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
