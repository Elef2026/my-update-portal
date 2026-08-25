import { Button } from "@/components/ui/button";

export default function AdminAuditPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold">የፋይናንስ ሪፖርት (Audit Dashboard)</h1>
          <p className="text-muted-foreground mt-2">
            በቀን፣ በሳምንት፣ እና በወር የተሰሩ ስራዎችን እና የተገኘውን ጠቅላላ ገቢ (ኮሚሽን) እዚህ ይቆጣጠራሉ።
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg border shadow-sm flex flex-col justify-center items-center text-center space-y-2">
            <h2 className="text-lg font-bold text-muted-foreground">የዛሬ ገቢ (Today)</h2>
            <p className="text-4xl font-bold text-emerald-500">1,200 ETB</p>
            <p className="text-sm">ከ 5 ስራዎች</p>
          </div>
          
          <div className="bg-card p-6 rounded-lg border shadow-sm flex flex-col justify-center items-center text-center space-y-2">
            <h2 className="text-lg font-bold text-muted-foreground">የሳምንቱ ገቢ (This Week)</h2>
            <p className="text-4xl font-bold text-emerald-500">8,450 ETB</p>
            <p className="text-sm">ከ 32 ስራዎች</p>
          </div>

          <div className="bg-card p-6 rounded-lg border shadow-sm flex flex-col justify-center items-center text-center space-y-2">
            <h2 className="text-lg font-bold text-muted-foreground">የወሩ ገቢ (This Month)</h2>
            <p className="text-4xl font-bold text-emerald-500">35,000 ETB</p>
            <p className="text-sm">ከ 140 ስራዎች</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">ቀን (Date)</th>
                <th className="px-6 py-4 font-medium">የተሰሩ ስራዎች ብዛት</th>
                <th className="px-6 py-4 font-medium">ለጠቅላላ ስራ የገባ ብር</th>
                <th className="px-6 py-4 font-medium">የአድሚን ኮሚሽን (Admin Cut)</th>
                <th className="px-6 py-4 font-medium">የማተሚያ ቤቶች ኮሚሽን</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Mock Data */}
              <tr className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 font-medium">ዛሬ (Today)</td>
                <td className="px-6 py-4">5</td>
                <td className="px-6 py-4 font-bold">1,800 ETB</td>
                <td className="px-6 py-4 text-emerald-500 font-bold">1,200 ETB</td>
                <td className="px-6 py-4 text-blue-500">600 ETB</td>
              </tr>
              <tr className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 font-medium">ትናንት (Yesterday)</td>
                <td className="px-6 py-4">8</td>
                <td className="px-6 py-4 font-bold">2,400 ETB</td>
                <td className="px-6 py-4 text-emerald-500 font-bold">1,600 ETB</td>
                <td className="px-6 py-4 text-blue-500">800 ETB</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
