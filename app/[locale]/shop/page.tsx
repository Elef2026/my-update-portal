import Link from "next/link";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PlusCircle, Clock, Printer, DollarSign, Undo2, History, CheckCircle2 } from "lucide-react";

export default async function ShopDashboardPage() {
  const session = await getServerSession(authOptions);

  // Calculate live shop earnings and net balance from active completed orders
  let shopEarned = 0;
  let netBalance = 0;
  if (session?.user?.id) {
    try {
      const orders = await prisma.order.findMany({
        where: {
          OR: [{ shopId: session.user.id }, { assignedShopId: session.user.id }],
          status: "PRINTED_AWAITING_SETTLEMENT"
        }
      });
      let cashDebt = 0;
      let chapaEarned = 0;
      for (const o of orders) {
        const e = Number(o.shopEarnings || 0);
        const adminCut = Number(o.adminCommission || 0) + Number(o.serverFee || 10) + Number(o.smsFee || 10);
        shopEarned += e;
        if (o.paymentMethod === "CASH_TO_SHOP") {
          cashDebt += adminCut;
        } else {
          chapaEarned += e;
        }
      }
      netBalance = chapaEarned - cashDebt;
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold">እንኳን ደህና መጡ! (Print Shop Dashboard)</h1>
            <p className="text-muted-foreground mt-1 text-sm">የዕለታዊ ስራዎን፣ ህትመቶችን እና ፋይናንስዎን እዚህ ይቆጣጠሩ</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-muted-foreground uppercase">የተጣራ የሳምንት ሂሳብ (Net Balance)</p>
            <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {Math.abs(netBalance).toFixed(2)} ETB
            </p>
            <p className="text-[11px] font-semibold text-foreground mt-0.5">
              {netBalance >= 0 ? "አድሚን ለእርስዎ የሚከፍለው" : "እርስዎ ለአድሚን የሚከፍሉት (እዳ)"}
            </p>
          </div>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Dedicated Completed Tasks Route */}
          <div className="bg-card p-6 rounded-xl border-2 border-emerald-500/40 shadow-sm hover:border-emerald-500 transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
              <h2 className="text-lg font-bold text-emerald-600">ያለቁ ስራዎች እና ገቢ (Completed & Debt)</h2>
              <p className="text-muted-foreground text-sm mt-1">ፕሪንት ተደርገው ወይም አብዴት ብቻ አልቀው እሁድ ክፍያ ማወራረድ የሚጠበቁ።</p>
            </div>
            <Link href="/am/shop/completed" className="w-full">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold">ያለቁትን እና ሂሳብ እይ</Button>
            </Link>
          </div>

          {/* 1. Submit New Task */}
          <div className="bg-card p-6 rounded-xl border shadow-sm hover:border-primary transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <PlusCircle className="w-10 h-10 text-primary mb-2" />
              <h2 className="text-lg font-bold">አዲስ ስራ መላኪያ (Submit Task)</h2>
              <p className="text-muted-foreground text-sm mt-1">ሙሉ ስራ ወይም አብዴት ብቻ መርጠው ፋይል በማያያዝ ወደ አድሚን ይላኩ።</p>
            </div>
            <Link href="/am/shop/new-order" className="w-full">
              <Button className="w-full">አዲስ ስራ ላክ</Button>
            </Link>
          </div>

          {/* 2. Pending & In-Progress Tasks */}
          <div className="bg-card p-6 rounded-xl border shadow-sm hover:border-amber-500 transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <Clock className="w-10 h-10 text-amber-500 mb-2" />
              <h2 className="text-lg font-bold text-amber-500">በሂደት ላይ ያሉ (In Progress)</h2>
              <p className="text-muted-foreground text-sm mt-1">አድሚን ጋር በመሰራት ላይ ያሉ ስራዎች እና የቀን ገደብ ቆጣሪ ማሳያ።</p>
            </div>
            <Link href="/am/shop/in-progress" className="w-full">
              <Button variant="outline" className="w-full text-amber-500 border-amber-500 hover:bg-amber-500 hover:text-white font-semibold">
                በሂደት ያሉትን እይ
              </Button>
            </Link>
          </div>
          
          {/* 3. Ready for Print */}
          <div className="bg-card p-6 rounded-xl border shadow-sm hover:border-indigo-500 transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <Printer className="w-10 h-10 text-indigo-500 mb-2" />
              <h2 className="text-lg font-bold text-indigo-500">ለህትመት የደረሱ (Print Queue)</h2>
              <p className="text-muted-foreground text-sm mt-1">አድሚኑ ሰርቶ የጨረሳቸውን ፋይሎች አውርደው ፕሪንት አድርገው የሚያጸድቁበት።</p>
            </div>
            <Link href="/am/shop/print-queue" className="w-full">
              <Button variant="outline" className="w-full text-indigo-500 border-indigo-500 hover:bg-indigo-500 hover:text-white font-semibold">
                ፕሪንት የሚደረጉትን እይ
              </Button>
            </Link>
          </div>

          {/* 4. Financials & Settlements */}
          <div className="bg-card p-6 rounded-xl border shadow-sm hover:border-emerald-500 transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <DollarSign className="w-10 h-10 text-emerald-500 mb-2" />
              <h2 className="text-lg font-bold text-emerald-500">የእሁድ ክፍያ ማወራረድ (Settlements)</h2>
              <p className="text-muted-foreground text-sm mt-1">የሳምንቱ የተጣራ ክፍያ፣ የ SMS/ሰርቨር ተቀናሾች እና የባንክ ደረሰኝ ማረጋገጫ።</p>
            </div>
            <Link href="/am/shop/settlements" className="w-full">
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600 font-semibold">
                የገንዘብ ክፍፍል ይመልከቱ
              </Button>
            </Link>
          </div>

          {/* 5. History / Old Completed */}
          <div className="bg-card p-6 rounded-xl border shadow-sm hover:border-slate-500 transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <History className="w-10 h-10 text-slate-500 mb-2" />
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">የተወራረዱ ታሪክ (Archived History)</h2>
              <p className="text-muted-foreground text-sm mt-1">እሁድ ክፍያ ተፈፅሞባቸው የተወራረዱ የድሮ ስራዎች ማህደር።</p>
            </div>
            <Link href="/am/shop/history" className="w-full">
              <Button variant="outline" className="w-full">
                ታሪክ ይመልከቱ
              </Button>
            </Link>
          </div>
          
        </div>

      </div>
    </div>
  );
}
