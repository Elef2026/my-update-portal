"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  DollarSign, 
  MessageSquare, 
  Server, 
  Tag, 
  Gift, 
  Plus, 
  Minus, 
  Save, 
  Calculator, 
  CheckCircle2, 
  PlusCircle, 
  Sliders,
  Layers
} from "lucide-react";

const SERVICE_LABELS: Record<string, { amharic: string; english: string }> = {
  NAME_CHANGE: { amharic: "የስም ማስተካከያ", english: "Name Change" },
  NATIONALITY: { amharic: "ዜግነት", english: "Nationality" },
  GENDER: { amharic: "ፆታ", english: "Gender" },
  DOB: { amharic: "የትውልድ ዘመን (እድሜ)", english: "DOB" },
  ADDRESS: { amharic: "አድራሻ (ክልል/ዞን/ወረዳ)", english: "Address" },
  PHONE: { amharic: "ስልክ ቁጥር", english: "Phone Number" },
  EMAIL: { amharic: "ኢሜል (Email)", english: "Email" },
  PO_BOX: { amharic: "ፖስታ ሳጥን ቁጥር", english: "PO Box" },
  PHOTO: { amharic: "ፎቶ ማስተካከል", english: "Photo Update" },
  FIN_FAN: { amharic: "ፊን እና ፋን ማስተካከያ", english: "FIN/FAN" },
  FAIDA_PRINT_ONLY: { amharic: "ፋይዳ ፕሪንት ብቻ", english: "Faida Print Only" },
  COURT_ORDER: { amharic: "የፍርድ ቤት ውሳኔ", english: "Court Order" },
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

  // Live Simulator State
  const [simulatedServices, setSimulatedServices] = useState<string[]>(["NAME_CHANGE", "DOB", "PHOTO", "GENDER"]);

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

  // Helper to adjust numbers (increase/decrease)
  const adjustValue = (
    setter: (val: number | ((prev: number) => number)) => void,
    currentVal: number,
    delta: number,
    min: number = 0
  ) => {
    setter(Math.max(min, Number((currentVal + delta).toFixed(2))));
  };

  const handleServiceFieldAdjust = (
    serviceType: string,
    field: string,
    delta: number,
    min: number = 0
  ) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.serviceType === serviceType) {
          const oldVal = Number(s[field] || 0);
          const newVal = Math.max(min, Number((oldVal + delta).toFixed(2)));
          return { ...s, [field]: newVal };
        }
        return s;
      })
    );
  };

  const handleServiceFieldSet = (serviceType: string, field: string, val: number) => {
    setServices((prev) =>
      prev.map((s) => (s.serviceType === serviceType ? { ...s, [field]: val } : s))
    );
  };

  const toggleSimulatedService = (sType: string) => {
    setSimulatedServices((prev) =>
      prev.includes(sType) ? prev.filter((s) => s !== sType) : [...prev, sType]
    );
  };

  // Calculate live simulation results
  const simResults = (() => {
    const activeItems = simulatedServices.map((sType) => {
      const srv = services.find((s) => s.serviceType === sType);
      return {
        serviceType: sType,
        price: Number(srv?.price || 150),
        adminCut: Number(srv?.adminCommission || 75),
        shopCut: Number(srv?.shopCut || 50),
      };
    });

    // Sort descending by price
    activeItems.sort((a, b) => b.price - a.price);

    let customerTotal = 0;
    let adminCutTotal = 0;
    let shopCutTotal = 0;
    let freeCount = 0;
    let discountTotal = 0;

    activeItems.forEach((item, idx) => {
      if (isFourthFreeDiscount && idx >= 3) {
        freeCount += 1;
        discountTotal += item.price;
      } else {
        customerTotal += item.price;
        adminCutTotal += item.adminCut;
        shopCutTotal += item.shopCut;
      }
    });

    adminCutTotal += adminExtraExpense;
    shopCutTotal += shopExtraExpense;

    return {
      customerTotal,
      adminCutTotal,
      shopCutTotal,
      freeCount,
      discountTotal,
      serverFee,
      smsFee,
      items: activeItems,
    };
  })();

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
    return <div className="p-12 text-center text-muted-foreground font-medium">ታሪፍ እና የገንዘብ መቆጣጠሪያ እየጫነ ነው...</div>;
  }

  return (
    <div className="space-y-10">
      
      {/* 1. Global System Fees & Expenses Manager */}
      <div className="bg-card p-6 rounded-xl border shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Sliders className="w-6 h-6 text-primary" />
              1. ቋሚ ክፍያዎች እና ተጨማሪ ወጪዎች መጨመሪያ/መቀነሻ (Global Fees & Expenses)
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              የ 10 ETB SMS/Server ክፍያዎችን እና ተጨማሪ የህትመት/አድሚን ወጪዎችን የመጨመሪያ (+) እና መቀነሻ (-) ቁልፎችን በመጠቀም ማስተካከል ይችላሉ።
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* SMS Fee */}
          <div className="bg-muted/40 p-4 rounded-xl border space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-500" /> የ SMS አገልግሎት ክፍያ
              </label>
              <span className="text-xs font-mono bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded font-semibold">10 ETB Default</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => adjustValue(setSmsFee, smsFee, -5)}>
                <Minus className="w-4 h-4 text-destructive" />
              </Button>
              <Input 
                type="number" 
                value={smsFee} 
                onChange={(e) => setSmsFee(Number(e.target.value))}
                className="text-center font-bold text-lg h-9"
              />
              <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => adjustValue(setSmsFee, smsFee, 5)}>
                <Plus className="w-4 h-4 text-emerald-600" />
              </Button>
            </div>
            
            <div className="flex gap-1 text-[11px]">
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => setSmsFee(10)}>10 (መደበኛ)</Button>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => adjustValue(setSmsFee, smsFee, 10)}>+10</Button>
            </div>
          </div>

          {/* Server Fee */}
          <div className="bg-muted/40 p-4 rounded-xl border space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Server className="w-4 h-4 text-emerald-500" /> የሰርቨር አገልግሎት ክፍያ
              </label>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-semibold">10 ETB Default</span>
            </div>

            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => adjustValue(setServerFee, serverFee, -5)}>
                <Minus className="w-4 h-4 text-destructive" />
              </Button>
              <Input 
                type="number" 
                value={serverFee} 
                onChange={(e) => setServerFee(Number(e.target.value))}
                className="text-center font-bold text-lg h-9"
              />
              <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => adjustValue(setServerFee, serverFee, 5)}>
                <Plus className="w-4 h-4 text-emerald-600" />
              </Button>
            </div>

            <div className="flex gap-1 text-[11px]">
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => setServerFee(10)}>10 (መደበኛ)</Button>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => adjustValue(setServerFee, serverFee, 10)}>+10</Button>
            </div>
          </div>

          {/* Shop Extra Expense */}
          <div className="bg-muted/40 p-4 rounded-xl border space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-indigo-500" /> የህትመት ቤት ተጨማሪ ወጪ
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => adjustValue(setShopExtraExpense, shopExtraExpense, -10)}>
                <Minus className="w-4 h-4 text-destructive" />
              </Button>
              <Input 
                type="number" 
                value={shopExtraExpense} 
                onChange={(e) => setShopExtraExpense(Number(e.target.value))}
                className="text-center font-bold text-lg h-9 text-indigo-600"
              />
              <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => adjustValue(setShopExtraExpense, shopExtraExpense, 10)}>
                <Plus className="w-4 h-4 text-emerald-600" />
              </Button>
            </div>

            <div className="flex gap-1 text-[11px]">
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => setShopExtraExpense(0)}>0 (ፅዳት)</Button>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => adjustValue(setShopExtraExpense, shopExtraExpense, 20)}>+20</Button>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => adjustValue(setShopExtraExpense, shopExtraExpense, 50)}>+50</Button>
            </div>
          </div>

          {/* Admin Extra Expense */}
          <div className="bg-muted/40 p-4 rounded-xl border space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-amber-500" /> የአድሚን ተጨማሪ ወጪ
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => adjustValue(setAdminExtraExpense, adminExtraExpense, -10)}>
                <Minus className="w-4 h-4 text-destructive" />
              </Button>
              <Input 
                type="number" 
                value={adminExtraExpense} 
                onChange={(e) => setAdminExtraExpense(Number(e.target.value))}
                className="text-center font-bold text-lg h-9 text-amber-600"
              />
              <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => adjustValue(setAdminExtraExpense, adminExtraExpense, 10)}>
                <Plus className="w-4 h-4 text-emerald-600" />
              </Button>
            </div>

            <div className="flex gap-1 text-[11px]">
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => setAdminExtraExpense(0)}>0 (ፅዳት)</Button>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => adjustValue(setAdminExtraExpense, adminExtraExpense, 25)}>+25</Button>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => adjustValue(setAdminExtraExpense, adminExtraExpense, 50)}>+50</Button>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Multi-Service Free Discount Rule Toggle */}
      <div className="bg-gradient-to-r from-primary/10 via-emerald-500/10 to-primary/5 p-6 rounded-xl border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
            <Gift className="w-5 h-5 text-emerald-600" />
            የ 4ኛ እና ከዛ በላይ አገልግሎቶች በነፃ ቅናሽ ህግ (4th+ Service Free Rule)
          </h3>
          <p className="text-xs text-muted-foreground max-w-2xl">
            ደንበኞች ከ 3 በላይ አገልግሎት ሲመርጡ፣ 4ኛው እና ከዛ በላይ ያሉ አገልግሎቶች 100% በነፃ (0 ETB) እንዲሆኑ ያደርጋል።
          </p>
        </div>

        <div className="flex items-center gap-3 bg-background p-4 rounded-xl border shrink-0 shadow-sm">
          <Switch checked={isFourthFreeDiscount} onCheckedChange={setIsFourthFreeDiscount} />
          <span className="text-xs font-bold">{isFourthFreeDiscount ? "ህጉ በርቷል (ACTIVE)" : "ህጉ ጠፍቷል (OFF)"}</span>
        </div>
      </div>

      {/* 3. Live Pricing Interactive Controls Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden space-y-4">
        <div className="p-6 border-b bg-muted/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              2. የእያንዳንዱ አገልግሎት ዋጋ መጨመሪያ እና መቀነሻ ሰንጠረዥ (Per-Service Controls)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              በእያንዳንዱ አገልግሎት ላይ <strong>+10, +50, -10, -50</strong> በመጫን ዋጋውን፣ የአድሚን እና የህትመት ቤት ኮሚሽን ማስተካከል ይችላሉ።
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">የአገልግሎት አይነት</th>
                <th className="px-4 py-3 font-medium text-center">የደንበኛ ዋጋ (Price ETB)</th>
                <th className="px-4 py-3 font-medium text-center">የአድሚን ድርሻ (Admin Cut)</th>
                <th className="px-4 py-3 font-medium text-center">የህትመት ቤት ድርሻ (Shop Cut)</th>
                <th className="px-4 py-3 font-medium text-center">ሁኔታ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map((service) => {
                const sType = service.serviceType;
                const label = SERVICE_LABELS[sType] || { amharic: sType, english: sType };

                return (
                  <tr key={sType} className={`hover:bg-muted/40 transition-colors ${!service.isActive ? 'opacity-40 bg-muted/20' : ''}`}>
                    
                    {/* Service Name */}
                    <td className="px-4 py-4 font-semibold">
                      <span>{label.amharic}</span> <br />
                      <span className="text-[11px] text-muted-foreground font-mono">{label.english}</span>
                    </td>

                    {/* Customer Price Controls */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleServiceFieldAdjust(sType, 'price', -10)}>
                            <Minus className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                          <Input 
                            type="number" 
                            value={service.price} 
                            onChange={(e) => handleServiceFieldSet(sType, 'price', Number(e.target.value))}
                            className="w-24 text-center font-bold text-emerald-600 h-8 text-sm"
                          />
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleServiceFieldAdjust(sType, 'price', 10)}>
                            <Plus className="w-3.5 h-3.5 text-emerald-600" />
                          </Button>
                        </div>
                        <div className="flex gap-1">
                          <button className="text-[10px] bg-muted px-1.5 py-0.5 rounded hover:bg-muted/80 font-semibold" onClick={() => handleServiceFieldAdjust(sType, 'price', 50)}>+50</button>
                          <button className="text-[10px] bg-muted px-1.5 py-0.5 rounded hover:bg-muted/80 font-semibold text-destructive" onClick={() => handleServiceFieldAdjust(sType, 'price', -50)}>-50</button>
                        </div>
                      </div>
                    </td>

                    {/* Admin Cut Controls */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleServiceFieldAdjust(sType, 'adminCommission', -10)}>
                            <Minus className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                          <Input 
                            type="number" 
                            value={service.adminCommission} 
                            onChange={(e) => handleServiceFieldSet(sType, 'adminCommission', Number(e.target.value))}
                            className="w-24 text-center font-semibold text-blue-600 h-8 text-sm"
                          />
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleServiceFieldAdjust(sType, 'adminCommission', 10)}>
                            <Plus className="w-3.5 h-3.5 text-emerald-600" />
                          </Button>
                        </div>
                        <div className="flex gap-1">
                          <button className="text-[10px] bg-muted px-1.5 py-0.5 rounded hover:bg-muted/80 font-semibold" onClick={() => handleServiceFieldAdjust(sType, 'adminCommission', 25)}>+25</button>
                          <button className="text-[10px] bg-muted px-1.5 py-0.5 rounded hover:bg-muted/80 font-semibold text-destructive" onClick={() => handleServiceFieldAdjust(sType, 'adminCommission', -25)}>-25</button>
                        </div>
                      </div>
                    </td>

                    {/* Shop Cut Controls */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleServiceFieldAdjust(sType, 'shopCut', -10)}>
                            <Minus className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                          <Input 
                            type="number" 
                            value={service.shopCut || 50} 
                            onChange={(e) => handleServiceFieldSet(sType, 'shopCut', Number(e.target.value))}
                            className="w-24 text-center font-semibold text-indigo-600 h-8 text-sm"
                          />
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleServiceFieldAdjust(sType, 'shopCut', 10)}>
                            <Plus className="w-3.5 h-3.5 text-emerald-600" />
                          </Button>
                        </div>
                        <div className="flex gap-1">
                          <button className="text-[10px] bg-muted px-1.5 py-0.5 rounded hover:bg-muted/80 font-semibold" onClick={() => handleServiceFieldAdjust(sType, 'shopCut', 20)}>+20</button>
                          <button className="text-[10px] bg-muted px-1.5 py-0.5 rounded hover:bg-muted/80 font-semibold text-destructive" onClick={() => handleServiceFieldAdjust(sType, 'shopCut', -20)}>-20</button>
                        </div>
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Switch 
                          checked={service.isActive} 
                          onCheckedChange={(c) => handleServiceFieldSet(sType, 'isActive', c as any)} 
                        />
                        <span className="text-[11px] font-bold">{service.isActive ? "ክፍት" : "ዝግ"}</span>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Interactive Live Calculator Preview */}
      <div className="bg-card p-6 rounded-xl border shadow-sm space-y-6">
        <div className="border-b pb-3">
          <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
            <Calculator className="w-5 h-5" />
            3. የዋጋ ናሙና ማስያ እና መፈተሻ (Live Pricing Calculator & Preview)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            ከዚህ በታች አገልግሎቶችን በመምረጥ ህጉ እንዴት እንደሚሰላ በቅጽበት መመልከት ይችላሉ።
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(SERVICE_LABELS).map(([sType, label]) => {
            const isSel = simulatedServices.includes(sType);
            return (
              <Button
                key={sType}
                size="sm"
                variant={isSel ? "default" : "outline"}
                className={`text-xs ${isSel ? 'bg-primary text-primary-foreground font-bold' : ''}`}
                onClick={() => toggleSimulatedService(sType)}
              >
                {isSel && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                {label.amharic}
              </Button>
            );
          })}
        </div>

        <div className="bg-muted/30 p-5 rounded-xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground font-semibold">የተመረጡ አገልግሎቶች ({simulatedServices.length}):</span>
            <p className="font-bold text-sm mt-1">{simulatedServices.length > 0 ? simulatedServices.map(s => SERVICE_LABELS[s]?.amharic || s).join(", ") : "ምንም አልተመረጠም"}</p>
          </div>

          <div>
            <span className="text-muted-foreground font-semibold">ጠቅላላ የደንበኛ ክፍያ:</span>
            <p className="font-bold text-lg text-emerald-600 mt-1">{simResults.customerTotal.toFixed(2)} ETB</p>
            {simResults.freeCount > 0 && (
              <span className="text-[11px] text-emerald-600 font-bold">({simResults.freeCount} አገልግሎቶች በነፃ ተቀናሽ አግኝተዋል!)</span>
            )}
          </div>

          <div>
            <span className="text-muted-foreground font-semibold">የአድሚን ድርሻ (+ወጪ):</span>
            <p className="font-bold text-lg text-blue-600 mt-1">{simResults.adminCutTotal.toFixed(2)} ETB</p>
          </div>

          <div>
            <span className="text-muted-foreground font-semibold">የማተሚያ ቤት ገቢ (+ወጪ):</span>
            <p className="font-bold text-lg text-indigo-600 mt-1">{simResults.shopCutTotal.toFixed(2)} ETB</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={saveChanges} disabled={isSaving} size="lg" className="px-10 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg">
          <Save className="w-6 h-6 mr-2" />
          {isSaving ? "በማስቀመጥ ላይ..." : "ታሪፍ እና ወጪዎችን አስቀምጥ (Save Pricing & Rules)"}
        </Button>
      </div>

    </div>
  );
}
