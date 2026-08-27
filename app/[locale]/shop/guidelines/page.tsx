import { getSystemGuidelines } from "@/lib/defaultGuidelines";
import GuidelinesViewer from "@/components/guidelines/GuidelinesViewer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ShopGuidelinesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const data = await getSystemGuidelines();

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 print:hidden">
          <Link href={`/${locale}/shop`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              <span>ወደ ዳሽቦርድ ተመለስ</span>
            </Button>
          </Link>

          <Link href={`/${locale}/shop/new-order`}>
            <Button size="sm" className="gap-1.5 font-bold shadow-sm">
              <PlusCircle className="w-4 h-4" />
              <span>አዲስ ስራ መሙያ (New Order)</span>
            </Button>
          </Link>
        </div>

        {/* Guidelines Viewer Component */}
        <GuidelinesViewer data={data} isAdmin={false} />
      </div>
    </div>
  );
}
