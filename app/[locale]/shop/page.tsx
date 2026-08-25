import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Clock, Printer, DollarSign, Undo2, History } from "lucide-react";

export default function ShopDashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center bg-card p-6 rounded-lg border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold">እንኳን ደህና መጡ! (Print Shop Dashboard)</h1>
            <p className="text-muted-foreground mt-1">የዕለታዊ ስራዎን፣ ህትመቶችን እና ፋይናንስዎን እዚህ ይቆጣጠሩ</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">የተጣራ የሳምንት ገቢ (Net Balance)</p>
            <p className="text-3xl font-bold text-emerald-500">0.00 ETB</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 1. Submit New Task */}
          <div className="bg-card p-6 rounded-lg border shadow-sm hover:border-primary transition-colors flex flex-col justify-between items-center text-center space-y-4">
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
          <div className="bg-card p-6 rounded-lg border shadow-sm hover:border-amber-500 transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <Clock className="w-10 h-10 text-amber-500 mb-2" />
              <h2 className="text-lg font-bold text-amber-500">በሂደት ላይ ያሉ (In Progress)</h2>
              <p className="text-muted-foreground text-sm mt-1">አድሚን ጋር በመሰራት ላይ ያሉ ስራዎች እና የቀን ገደብ ቆጣሪ ማሳያ።</p>
            </div>
            <Link href="/am/shop/in-progress" className="w-full">
              <Button variant="outline" className="w-full text-amber-500 border-amber-500 hover:bg-amber-500 hover:text-white">
                በሂደት ያሉትን እይ
              </Button>
            </Link>
          </div>
          
          {/* 3. Ready for Print */}
          <div className="bg-card p-6 rounded-lg border shadow-sm hover:border-indigo-500 transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <Printer className="w-10 h-10 text-indigo-500 mb-2" />
              <h2 className="text-lg font-bold text-indigo-500">ለህትመት የደረሱ (Print Queue)</h2>
              <p className="text-muted-foreground text-sm mt-1">አድሚኑ ሰርቶ የጨረሳቸውን ፋይሎች አውርደው ፕሪንት አድርገው የሚያጸድቁበት።</p>
            </div>
            <Link href="/am/shop/print-queue" className="w-full">
              <Button variant="outline" className="w-full text-indigo-500 border-indigo-500 hover:bg-indigo-500 hover:text-white">
                ፕሪንት የሚደረጉትን እይ
              </Button>
            </Link>
          </div>

          {/* 4. Financials & Settlements */}
          <div className="bg-card p-6 rounded-lg border shadow-sm hover:border-emerald-500 transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <DollarSign className="w-10 h-10 text-emerald-500 mb-2" />
              <h2 className="text-lg font-bold text-emerald-500">የክፍያ ሁኔታዎች (Settlements)</h2>
              <p className="text-muted-foreground text-sm mt-1">የሳምንቱ የተጣራ ክፍያ፣ የ SMS/ሰርቨር ተቀናሾች እና የባንክ ደረሰኝ ማረጋገጫ።</p>
            </div>
            <Link href="/am/shop/settlements" className="w-full">
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
                የገንዘብ ክፍፍል ይመልከቱ
              </Button>
            </Link>
          </div>

          {/* 5. Refund Requests */}
          <div className="bg-card p-6 rounded-lg border shadow-sm hover:border-destructive transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <Undo2 className="w-10 h-10 text-destructive mb-2" />
              <h2 className="text-lg font-bold text-destructive">የሪፈንድ ጥያቄዎች (Refunds)</h2>
              <p className="text-muted-foreground text-sm mt-1">ጊዜ ስላለፈባቸው ስራዎች ገንዘብ እንዲመለስ መጠየቂያ እና የተመለሰ ታሪክ።</p>
            </div>
            <Link href="/am/shop/refunds" className="w-full">
              <Button variant="destructive" className="w-full">
                ሪፈንድ ጠይቅ / እይ
              </Button>
            </Link>
          </div>

          {/* 6. History / Old Completed */}
          <div className="bg-card p-6 rounded-lg border shadow-sm hover:border-primary transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div className="flex flex-col items-center">
              <History className="w-10 h-10 text-muted-foreground mb-2" />
              <h2 className="text-lg font-bold">የተጠናቀቁ ታሪክ (History)</h2>
              <p className="text-muted-foreground text-sm mt-1">እስካሁን የተሰሩ እና የተጠናቀቁ ያለፉ ስራዎች ጠቅላላ ማህደር።</p>
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
