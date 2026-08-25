import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ShopDashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center bg-card p-6 rounded-lg border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold">እንኳን ደህና መጡ! (Welcome to your Shop)</h1>
            <p className="text-muted-foreground mt-1">የዕለታዊ ስራዎን እዚህ ይቆጣጠሩ (Manage your daily operations here)</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">የዛሬ ገቢ (Today's Earnings)</p>
            <p className="text-3xl font-bold text-emerald-500">0.00 ETB</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          
          <div className="bg-card p-8 rounded-lg border shadow-sm hover:border-primary transition-colors flex flex-col justify-center items-center text-center space-y-4">
            <h2 className="text-xl font-bold">አዲስ ማደሻ ጥያቄ (New Request)</h2>
            <p className="text-muted-foreground text-sm">ለደንበኛዎ አዲስ የሰነድ ማደሻ ጥያቄ ለመሙላት እና ለመላክ ይህንን ይጫኑ።</p>
            <Link href="/am/shop/new-order" className="mt-4 w-full">
              <Button className="w-full h-12 text-md">አዲስ ጥያቄ ጀምር (Start New Request)</Button>
            </Link>
          </div>
          
          <div className="bg-card p-8 rounded-lg border shadow-sm hover:border-indigo-500 transition-colors flex flex-col justify-center items-center text-center space-y-4">
            <h2 className="text-xl font-bold text-indigo-500">ለህትመት የተላኩ (Print Queue)</h2>
            <p className="text-muted-foreground text-sm">አድሚኑ አብዴት አድርጎ የላከውን እና ለደንበኛው ፕሪንት መደረግ ያለባቸውን ለማየት።</p>
            <Link href="/am/shop/print-queue" className="mt-4 w-full">
              <Button variant="outline" className="w-full h-12 text-md text-indigo-500 border-indigo-500 hover:bg-indigo-500 hover:text-white">ፕሪንት የሚደረጉትን እይ</Button>
            </Link>
          </div>

          <div className="bg-card p-8 rounded-lg border shadow-sm hover:border-emerald-500 transition-colors flex flex-col justify-center items-center text-center space-y-4">
            <h2 className="text-xl font-bold text-emerald-500">የገንዘብ ክፍፍል እና ገቢ (Settlements)</h2>
            <p className="text-muted-foreground text-sm">የየሳምንቱ ገቢዎን እና አድሚኑ የላከውን ክፍያ ለማረጋገጥ ይህንን ይጫኑ።</p>
            <Link href="/am/shop/settlements" className="mt-4 w-full">
              <Button className="w-full h-12 text-md bg-emerald-500 hover:bg-emerald-600">የገንዘብ ክፍፍል ይመልከቱ</Button>
            </Link>
          </div>

          <div className="bg-card p-8 rounded-lg border shadow-sm hover:border-primary transition-colors flex flex-col justify-center items-center text-center space-y-4">
            <h2 className="text-xl font-bold">የታሪክ ማህደር (History)</h2>
            <p className="text-muted-foreground text-sm">ያለፉትን ጥያቄዎች እና የደንበኞችን ሰነድ የት ደረጃ ላይ እንዳለ ለመከታተል ይህንን ይጫኑ።</p>
            <Link href="/am/shop/history" className="mt-4 w-full">
              <Button variant="outline" className="w-full h-12 text-md">ታሪክ ይመልከቱ (View History)</Button>
            </Link>
          </div>
          
        </div>

      </div>
    </div>
  );
}
