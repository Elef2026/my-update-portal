import { getSystemGuidelines } from "@/lib/defaultGuidelines";
import AdminGuidelinesEditor from "@/components/guidelines/AdminGuidelinesEditor";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminGuidelinesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const data = await getSystemGuidelines();

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <Link href={`/${locale}/admin`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              <span>ወደ አድሚን ዳሽቦርድ ተመለስ</span>
            </Button>
          </Link>
        </div>

        {/* Admin Editor Component */}
        <AdminGuidelinesEditor initialData={data} />
      </div>
    </div>
  );
}
