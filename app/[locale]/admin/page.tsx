import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center bg-card p-6 rounded-lg border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold">አድሚን ዳሽቦርድ (Admin Dashboard)</h1>
            <p className="text-muted-foreground mt-1">የጠቅላላ ሲስተሙን እና የማተሚያ ቤቶችን ስራ ይቆጣጠሩ (Manage all operations)</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">ጠቅላላ ኮሚሽን (Total Commission)</p>
            <p className="text-3xl font-bold text-emerald-500">0.00 ETB</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-card p-6 rounded-lg border shadow-sm hover:border-primary transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div>
              <h2 className="text-lg font-bold">አዳዲስ ጥያቄዎች (New Tasks)</h2>
              <p className="text-muted-foreground text-sm mt-2">ከማተሚያ ቤቶች የተላኩ አዳዲስ የሰነድ ማደሻ ጥያቄዎችን ለማየት እና ለማጽደቅ።</p>
            </div>
            <Link href="/am/admin/tasks" className="w-full">
              <Button className="w-full">ጥያቄዎችን ይመልከቱ (Review Tasks)</Button>
            </Link>
          </div>

          <div className="bg-card p-6 rounded-lg border shadow-sm hover:border-primary transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div>
              <h2 className="text-lg font-bold text-amber-500">በሂደት ላይ ያሉ (In Progress)</h2>
              <p className="text-muted-foreground text-sm mt-2">የቀን ገደብ (Deadline) ተሰጥቷቸው እየተሰሩ ያሉ ስራዎች።</p>
            </div>
            <Link href="/am/admin/in-progress" className="w-full">
              <Button variant="outline" className="w-full text-amber-500 border-amber-500 hover:bg-amber-500 hover:text-white">በሂደት ላይ ያሉትን እይ</Button>
            </Link>
          </div>

          <div className="bg-card p-6 rounded-lg border shadow-sm hover:border-primary transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div>
              <h2 className="text-lg font-bold text-indigo-500">ለህትመት የተላኩ (For Print)</h2>
              <p className="text-muted-foreground text-sm mt-2">አብዴት ተደርገው፣ ህትመት ቤቱ ፕሪንት እስኪያደርጋቸው የሚጠበቁ።</p>
            </div>
            <Link href="/am/admin/ready-for-print" className="w-full">
              <Button variant="outline" className="w-full text-indigo-500 border-indigo-500 hover:bg-indigo-500 hover:text-white">ለህትመት የተላኩትን እይ</Button>
            </Link>
          </div>

          <div className="bg-card p-6 rounded-lg border shadow-sm hover:border-destructive transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div>
              <h2 className="text-lg font-bold text-destructive">ሪፈንድ ጥያቄዎች (Refunds)</h2>
              <p className="text-muted-foreground text-sm mt-2">ቀን ያለፈባቸው ወይም የተከለከሉ እና ብር እንዲመለስ የተጠየቀባቸው።</p>
            </div>
            <Link href="/am/admin/refunds" className="w-full">
              <Button variant="destructive" className="w-full">ሪፈንድ ጥያቄዎችን እይ</Button>
            </Link>
          </div>

          <div className="bg-card p-6 rounded-lg border shadow-sm hover:border-emerald-500 transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div>
              <h2 className="text-lg font-bold text-emerald-500">የገንዘብ ክፍፍል (Settlements)</h2>
              <p className="text-muted-foreground text-sm mt-2">የየሳምንቱ የህትመት ቤቶች እዳ እና ለአድሚኑ የሚተላለፍ ክፍያ መቆጣጠሪያ።</p>
            </div>
            <Link href="/am/admin/settlements" className="w-full">
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600">ወደ ፋይናንስ ሂድ</Button>
            </Link>
          </div>
          
          <div className="bg-card p-6 rounded-lg border shadow-sm hover:border-primary transition-colors flex flex-col justify-between items-center text-center space-y-4">
            <div>
              <h2 className="text-lg font-bold">የዋጋ ማስተካከያ (Pricing & Config)</h2>
              <p className="text-muted-foreground text-sm mt-2">አገልግሎቶች፣ ቋሚ ክፍያዎች (SMS/Server) እና የኮሚሽን መጠን ማስተካከያ።</p>
            </div>
            <Link href="/am/admin/pricing" className="w-full">
              <Button variant="secondary" className="w-full">ዋጋ አስተካክል</Button>
            </Link>
          </div>
          
        </div>

      </div>
    </div>
  );
}
