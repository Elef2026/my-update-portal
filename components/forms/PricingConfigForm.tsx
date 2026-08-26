"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DollarSign, MessageSquare, Server, Tag, Gift, PlusCircle, Save, CheckCircle2 } from "lucide-react";

const SERVICE_NAMES: Record<string, string> = {
  NAME_CHANGE: "የስም ማስተካከያ (Name Change)",
  NATIONALITY: "ዜግነት (Nationality)",
  GENDER: "ፆታ (Gender)",
  DOB: "የትውልድ ዘመን (DOB)",
  ADDRESS: "አድራሻ (Address)",
  PHONE: "ስልክ ቁጥር (Phone)",
  EMAIL: "ኢሜል (Email)",
  PO_BOX: "ፖስታ ሳጥን ቁጥር (PO Box)",
  PHOTO: "ፎቶ ማስተካከል (Photo)",
  FIN_FAN: "ፊን እና ፋን (FIN/FAN)",
  FAIDA_PRINT_ONLY: "ፋይዳ ፕሪንት ብቻ (Faida Print Only)",
  COURT_ORDER: "የፍርድ ቤት ውሳኔ (Court Order)",
};

export default function PricingConfigForm() {
  const [serverFee, setServerFee] = useState(10);
  const [smsFee, setSmsFee] = useState(10);
  const [shopExtraExpense, setShopExtraExpense] = useState(0);
  const [adminExtraExpense, setAdminExtraExpense] = useState(0);
  const [isFourthFreeDiscount, setIsFourthFreeDiscount] = useState(true);

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pricing");
      if (res.ok) {
        const data = await res.json();
        setServerFee(Number(data.serverFee || 10));
        setSmsFee(Number(data.smsFee || 10));
        setShopExtraExpense(Number(data.shopExtraExpense || 0));
        setAdminExtraExpense(Number(data.adminExtraExpense || 0));
        setIsFourthFreeDiscount(data.isFourthFreeDiscount ?? true);
        if (Array.isArray(data.services)) {
          setServices(data.services);
        }
      }
    } catch (e) {
      console.error("Failed to load config:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = (serviceType: string, field: string, value: any) => {
    setServices((prev) =>
      prev.map((s) =>
        s.serviceType === serviceType ? { ...s, [field]: value } : s
      )
    );
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      const payload = {
        serverFee,
        smsFee,
        shopExtraExpense,
        adminExtraExpense,
        isFourthFreeDiscount,
        services,
      };

      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("የዋጋ እና የታሪፍ ማስተካከያው በስኬት ተቀምጧል! (Pricing & rules saved successfully)");
      } else {
        const errData = await res.json();
        alert("ስህተት ተፈጥሯል (Error saving): " + (errData.error || ""));
      }
    } catch (error) {
      console.error(error);
      alert("ስህተት ተፈጥሯል (Network error)");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground font-medium">ታሪፍ እየጫነ ነው (Loading pricing config)...</div>;
  }

  return (
    <div className="space-y-8">
      
      {/* System Fees & Extra Expenses Configuration Card */}
      <div className="bg-card p-6 rounded-xl border shadow-sm space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-3 text-slate-800 dark:text-slate-100">
          <DollarSign className="w-6 h-6 text-primary" />
          1. ቋሚ ክፍያዎች እና ተጨማሪ ወጪዎች (Global System Fees & Extra Costs)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2 bg-muted/30 p-4 rounded-lg border">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-500" /> የ SMS አገልግሎት ክፍያ (SMS Fee)
            </label>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                value={smsFee} 
                onChange={(e) => setSmsFee(Number(e.target.value))}
                className="font-bold text-lg"
              />
              <span className="text-xs font-semibold">ETB</span>
            </div>
            <p className="text-[11px] text-muted-foreground">ለእያንዳንዱ ደንበኛ መልዕክት የሚቆረጥ</p>
          </div>

          <div className="space-y-2 bg-muted/30 p-4 rounded-lg border">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-500" /> የሰርቨር አገልግሎት ክፍያ (Server Fee)
            </label>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                value={serverFee} 
                onChange={(e) => setServerFee(Number(e.target.value))}
                className="font-bold text-lg"
              />
              <span className="text-xs font-semibold">ETB</span>
            </div>
            <p className="text-[11px] text-muted-foreground">የሲስተም ጥገና እና ሰርቨር ክፍያ</p>
          </div>

          <div className="space-y-2 bg-muted/30 p-4 rounded-lg border">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-indigo-500" /> የህትመት ቤት ተጨማሪ ወጪ (Shop Extra Expense)
            </label>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                value={shopExtraExpense} 
                onChange={(e) => setShopExtraExpense(Number(e.target.value))}
                className="font-bold text-lg text-indigo-600"
              />
              <span className="text-xs font-semibold">ETB</span>
            </div>
            <p className="text-[11px] text-muted-foreground">የወረቀት/ኮፒ ተጨማሪ ወጪዎች</p>
          </div>

          <div className="space-y-2 bg-muted/30 p-4 rounded-lg border">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-amber-500" /> የአድሚን ተጨማሪ ወጪ (Admin Extra Cost)
            </label>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                value={adminExtraExpense} 
                onChange={(e) => setAdminExtraExpense(Number(e.target.value))}
                className="font-bold text-lg text-amber-600"
              />
              <span className="text-xs font-semibold">ETB</span>
            </div>
            <p className="text-[11px] text-muted-foreground">ለልዩ አድሚን ስራዎች የሚታሰብ ወጪ</p>
          </div>
        </div>
      </div>

      {/* Multi-Service Discount Rule Card */}
      <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
            <Gift className="w-5 h-5" />
            የ 4ኛ እና ከዛ በላይ አገልግሎቶች በነፃ ቅናሽ ህግ (Multi-Service Discount Rule)
          </h3>
          <p className="text-xs text-muted-foreground max-w-2xl">
            አንድ ደንበኛ ከ 3 በላይ ማስተካከያዎች ሲመርጥ (ለምሳሌ፡ ስም + ፎቶ + የትውልድ ዘመን + ፆታ...)፣ የመጀመሪያዎቹ 3 በጣም ውድ አገልግሎቶች ብቻ ያስከፍላሉ። <strong>4ኛው እና ከዛ በላይ ያሉ አገልግሎቶች 100% በነፃ (0 ETB) እንዲሰጡ ይደረጋል።</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 bg-background p-4 rounded-lg border shrink-0">
          <Switch checked={isFourthFreeDiscount} onCheckedChange={setIsFourthFreeDiscount} />
          <span className="text-xs font-bold">{isFourthFreeDiscount ? "ህጉ በርቷል (DISCOUNT ACTIVE)" : "ህጉ ጠፍቷል (OFF)"}</span>
        </div>
      </div>

      {/* Per-Service Pricing Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden space-y-4">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold">2. የእያንዳንዱ አገልግሎት ታሪፍ እና የኮሚሽን ተመን (Per-Service Prices & Commissions)</h3>
          <p className="text-xs text-muted-foreground mt-1">ደንበኛው የሚከፍለውን ዋጋ፣ የአድሚን ድርሻ እና የህትመት ቤቱን ድርሻ እዚህ ማስተካከል ይችላሉ።</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">የአገልግሎት አይነት (Service)</th>
                <th className="px-6 py-4 font-medium">የደንበኛ ዋጋ (Customer Price ETB)</th>
                <th className="px-6 py-4 font-medium">የአድሚን ድርሻ (Admin Cut ETB)</th>
                <th className="px-6 py-4 font-medium">የህትመት ቤት ድርሻ (Shop Cut ETB)</th>
                <th className="px-6 py-4 font-medium">ሁኔታ (Status)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map((service) => (
                <tr key={service.serviceType} className={`hover:bg-muted/50 transition-colors ${!service.isActive ? 'opacity-50 bg-muted/20' : ''}`}>
                  <td className="px-6 py-4 font-semibold text-foreground">
                    {SERVICE_NAMES[service.serviceType] || service.serviceType}
                  </td>
                  <td className="px-6 py-4">
                    <Input 
                      type="number" 
                      value={service.price} 
                      onChange={(e) => handleServiceChange(service.serviceType, 'price', Number(e.target.value))}
                      className="w-32 font-bold text-emerald-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input 
                      type="number" 
                      value={service.adminCommission} 
                      onChange={(e) => handleServiceChange(service.serviceType, 'adminCommission', Number(e.target.value))}
                      className="w-32 font-semibold text-blue-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input 
                      type="number" 
                      value={service.shopCut || 50} 
                      onChange={(e) => handleServiceChange(service.serviceType, 'shopCut', Number(e.target.value))}
                      className="w-32 font-semibold text-indigo-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={service.isActive} 
                        onCheckedChange={(c) => handleServiceChange(service.serviceType, 'isActive', c)} 
                      />
                      <span className="text-xs font-medium">{service.isActive ? "ክፍት (ON)" : "ዝግ (OFF)"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveChanges} disabled={isSaving} size="lg" className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
          <Save className="w-5 h-5 mr-2" />
          {isSaving ? "በማስቀመጥ ላይ..." : "ታሪፍ እና ወጪዎችን አስቀምጥ (Save Pricing & Rules)"}
        </Button>
      </div>

    </div>
  );
}
