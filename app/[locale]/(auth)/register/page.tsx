"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations("Index");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // In a real app, this would call an API route to hash the password and create the user in Prisma
    setTimeout(() => {
      alert("ማተሚያ ቤቱ በተሳካ ሁኔታ ተመዝግቧል! (Shop registered successfully)");
      router.push(`/${locale}/login`);
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-lg border">
        <h1 className="text-2xl font-bold text-center mb-6">{t("register")}</h1>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">የማተሚያ ቤቱ ስም (Shop Name)</label>
            <Input required placeholder="ለምሳሌ፡ አዲስ ህትመት" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">የኢሜይል አድራሻ (Email)</label>
            <Input required type="email" placeholder="shop@example.com" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">ስልክ ቁጥር (Phone)</label>
            <Input required placeholder="0911..." />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">የይለፍ ቃል (Password)</label>
            <Input required type="password" placeholder="••••••••" minLength={6} />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full mt-6">
            {isSubmitting ? "በመመዝገብ ላይ..." : "ይመዝገቡ (Register)"}
          </Button>
        </form>
      </div>
    </div>
  );
}
