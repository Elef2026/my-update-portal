"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSendToShopPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      alert("ስራው ለህትመት ቤት በተሳካ ሁኔታ ተልኳል! (Task sent to Shop)");
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background p-8 flex justify-center items-start">
      <div className="w-full max-w-2xl bg-card p-8 rounded-lg shadow-sm border space-y-6">
        
        <div>
          <h1 className="text-2xl font-bold">ወደ ማተሚያ ቤት ላክ (Send to Shop)</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            ፕሪንት ማድረግ የሚፈልጉ ደንበኞች እርስዎ ጋር በቀጥታ ሲመጡ፣ መረጃቸውን እና ፋይላቸውን አስገብተው ወደ መረጡት ማተሚያ ቤት የሚልኩበት ቅጽ ነው።
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">የደንበኛ ሙሉ ስም</label>
              <Input required placeholder="አበበ ከበደ" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ስልክ ቁጥር</label>
              <Input required placeholder="0911..." />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">የሚላክለት ማተሚያ ቤት (Select Print Shop)</label>
            <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">-- ማተሚያ ቤት ምረጥ --</option>
              <option value="shop-1">አዲስ ህትመት (Addis Print)</option>
              <option value="shop-2">ፍጥነት ማተሚያ (Fitnet Print)</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              ይህን ስራ ለተመረጠው ማተሚያ ቤት ሲልኩለት፣ ፕሪንት አድርጎ ሲያወጣ 150 ብር ያህል ኮሚሽን የርስዎ ሂሳብ ላይ ይቆጠራል።
            </p>
          </div>

          <div className="border-2 border-dashed border-input rounded-md p-8 text-center bg-muted/20">
            <p className="text-sm font-medium">የደንበኛውን የተስተካከለ ፋይል እዚህ ያስገቡ</p>
            <p className="text-xs text-muted-foreground mb-4">(Drag & drop files here, or click to select)</p>
            <Input type="file" multiple className="max-w-xs mx-auto" />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
            {isSubmitting ? "በመላክ ላይ..." : "ወደ ማተሚያ ቤት ላክ (Send to Shop)"}
          </Button>
        </form>

      </div>
    </div>
  );
}
