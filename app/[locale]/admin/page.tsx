import Link from "next/link";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { CheckCircle2, Clock, Printer, DollarSign, Undo2, Archive, ShoppingBag, Settings, Store, Sliders } from "lucide-react";

export default async function AdminDashboardPage() {
  // Fetch real-time total commission and shop count from DB
  let totalAdminCommission = 0;
  let printShopCount = 0;
  try {
    const orders = await prisma.order.findMany({
      where: { status: { not: "REJECTED" } },
      select: { adminCommission: true, serverFee: true, smsFee: true }
    });
    totalAdminCommission = orders.reduce(
      (sum, o) => sum + Number(o.adminCommission || 0) + Number(o.serverFee || 10) + Number(o.smsFee || 10),
      0
    );

    printShopCount = await prisma.user.count({
      where: { role: "PRINT_SHOP" }
    });
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold">አድሚን ዳሽቦርድ (Admin Dashboard)</h1>
            <p className="text-muted-foreground mt-1 text-sm">የጠቅላላ ሲስተሙን እና የማተሚያ ቤቶችን ስራ ይቆጣጠሩ (Manage all operations)</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-muted-foreground uppercase">ጠቅላላ የአድሚን ገቢ (Total Admin Commission)</p>
            <p className="text-3xl font-bold text-emerald-600">{totalAdminCommission.toFixed(2)} ETB</p>
          </div>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Print Shops Management */}
          <div className="bg-card p-6 rounded-xl border-2 border-blue-500/40 shadow-sm hover:border-blue-500 transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <Store className="w-10 h-10 text-blue-500 mb-2" />
              <h2 className="text-lg font-bold text-blue-600">ህትመት ቤቶች ({printShopCount} Shops)</h2>
              <p className="text-muted-foreground text-sm mt-1">አዳዲስ ህትመት ቤቶችን ይመዝግቡ፣ መረጃቸውን ያስተካክሉ ወይም አጠቃላይ ዝርዝራቸውን ይቆጣጠሩ።</p>
            </div>
            <Link href="/am/admin/shops" className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 font-bold">ህትመት ቤቶችን አስተዳድር (Manage Shops)</Button>
            </Link>
          </div>

          {/* Dedicated Pricing & Financial Control Page */}
          <div className="bg-card p-6 rounded-xl border-2 border-primary/50 shadow-sm hover:border-primary transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <Sliders className="w-10 h-10 text-primary mb-2" />
              <h2 className="text-lg font-bold text-primary">የገንዘብ እና ታሪፍ መቆጣጠሪያ (Pricing & Rules Control)</h2>
              <p className="text-muted-foreground text-sm mt-1">የአድሚን/ህትመት ቤት ኮሚሽን፣ የ 10 ETB ክፍያዎች፣ ተጨማሪ ወጪዎች እና የነፃ ቅናሽ ህጎች መቆጣጠሪያ።</p>
            </div>
            <Link href="/am/admin/pricing" className="w-full">
              <Button className="w-full bg-primary hover:bg-primary/90 font-bold">ታሪፍ እና ኮሚሽን አስተካክል (Manage Pricing)</Button>
            </Link>
          </div>

          {/* Completed Tasks */}
          <div className="bg-card p-6 rounded-xl border-2 border-emerald-500/40 shadow-sm hover:border-emerald-500 transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
              <h2 className="text-lg font-bold text-emerald-600">ያለቁ ስራዎች እና እዳ (Completed Tasks & Debt)</h2>
              <p className="text-muted-foreground text-sm mt-1">ህትመታቸው ወይም አብዴታቸው ተጠናቆ እሁድ ክፍያ የሚጠብቁ ስራዎች እና የፋይናንስ ሂሳብ።</p>
            </div>
            <Link href="/am/admin/completed" className="w-full">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold">የተጠናቀቁትን እና ሂሳብ እይ</Button>
            </Link>
          </div>

          <div className="bg-card p-6 rounded-xl border shadow-sm hover:border-primary transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <ShoppingBag className="w-10 h-10 text-primary mb-2" />
              <h2 className="text-lg font-bold">አዳዲስ ጥያቄዎች (New Tasks)</h2>
              <p className="text-muted-foreground text-sm mt-1">ከማተሚያ ቤቶች የተላኩ አዳዲስ የሰነድ ማደሻ ጥያቄዎችን ለማየት እና ለማጽደቅ።</p>
            </div>
            <Link href="/am/admin/tasks" className="w-full">
              <Button className="w-full">ጥያቄዎችን ይመልከቱ (Review Tasks)</Button>
            </Link>
          </div>

          <div className="bg-card p-6 rounded-xl border shadow-sm hover:border-amber-500 transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <Clock className="w-10 h-10 text-amber-500 mb-2" />
              <h2 className="text-lg font-bold text-amber-500">በሂደት ላይ ያሉ (In Progress)</h2>
              <p className="text-muted-foreground text-sm mt-1">የቀን ገደብ (Deadline) ተሰጥቷቸው እየተሰሩ ያሉ ስራዎች።</p>
            </div>
            <Link href="/am/admin/in-progress" className="w-full">
              <Button variant="outline" className="w-full text-amber-500 border-amber-500 hover:bg-amber-500 hover:text-white font-semibold">በሂደት ላይ ያሉትን እይ</Button>
            </Link>
          </div>

          <div className="bg-card p-6 rounded-xl border shadow-sm hover:border-indigo-500 transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <Printer className="w-10 h-10 text-indigo-500 mb-2" />
              <h2 className="text-lg font-bold text-indigo-500">ለህትመት የተላኩ (For Print)</h2>
              <p className="text-muted-foreground text-sm mt-1">አብዴት ተደርገው፣ ህትመት ቤቱ ፕሪንት እስኪያደርጋቸው የሚጠበቁ።</p>
            </div>
            <Link href="/am/admin/ready-for-print" className="w-full">
              <Button variant="outline" className="w-full text-indigo-500 border-indigo-500 hover:bg-indigo-500 hover:text-white font-semibold">ለህትመት የተላኩትን እይ</Button>
            </Link>
          </div>

          <div className="bg-card p-6 rounded-xl border shadow-sm hover:border-emerald-500 transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <DollarSign className="w-10 h-10 text-emerald-500 mb-2" />
              <h2 className="text-lg font-bold text-emerald-500">የገንዘብ ክፍፍል (Settlements)</h2>
              <p className="text-muted-foreground text-sm mt-1">የእሁድ ክፍያ ማወራረድያ እና የባንክ ደረሰኞች መቆጣጠሪያ።</p>
            </div>
            <Link href="/am/admin/settlements" className="w-full">
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600 font-semibold">ወደ ፋይናንስ ሂድ</Button>
            </Link>
          </div>

          <div className="bg-card p-6 rounded-xl border shadow-sm hover:border-slate-500 transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <Archive className="w-10 h-10 text-slate-600 mb-2" />
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">የተወራረዱ ታሪክ (Archived History)</h2>
              <p className="text-muted-foreground text-sm mt-1">እሁድ ክፍያ ተፈፅሞባቸው የተወራረዱ እና የተዘጉ የድሮ ፋይሎች።</p>
            </div>
            <Link href="/am/admin/history" className="w-full">
              <Button variant="outline" className="w-full">የተወራረደ ታሪክ እይ</Button>
            </Link>
          </div>
          
        </div>

      </div>
    </div>
  );
}
