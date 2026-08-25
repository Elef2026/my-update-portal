import PricingConfigForm from "@/components/forms/PricingConfigForm";

export default function AdminPricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">የዋጋ እና የአገልግሎት ማስተካከያ (Pricing & Services Configuration)</h1>
          <p className="text-muted-foreground mt-2">
            ከዚህ በታች ያለውን ሰንጠረዥ በመጠቀም የአገልግሎቶችን ዋጋ፣ የአድሚን ኮሚሽን እና የአገልግሎቱን ሁኔታ (ክፍት/ዝግ) ማስተካከል ይችላሉ።
          </p>
        </div>
        
        {/* Render the core pricing config form */}
        <PricingConfigForm />
      </div>
    </div>
  );
}
