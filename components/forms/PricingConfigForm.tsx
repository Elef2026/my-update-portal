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
  Layers,
  Trash2,
  AlertCircle
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
  const [freeThreshold, setFreeThreshold] = useState("AFTER_3");

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // New custom service state (Create)
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState(150);
  const [newServiceAdminCut, setNewServiceAdminCut] = useState(75);
  const [newServiceShopCut, setNewServiceShopCut] = useState(55);
  const [showAddForm, setShowAddForm] = useState(false);

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
        setFreeThreshold(data.freeThreshold || "AFTER_3");
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

  // CREATE: Add new service
  const handleAddNewService = () => {
    if (!newServiceName.trim()) {
      alert("እባክዎን የአገልግሎቱን ስም ያስገቡ (Please enter service name)");
      return;
    }

    const sType = newServiceName.trim().toUpperCase().replace(/\s+/g, "_");
    
    // Check if duplicate
    if (services.some((s) => s.serviceType === sType)) {
      alert("ይህ አገልግሎት አስቀድሞ አለ (Service already exists)");
      return;
    }

    const newObj = {
      serviceType: sType,
      titleAmharic: newServiceName.trim(),
      titleEnglish: newServiceName.trim(),
      price: newServicePrice,
      adminCommission: newServiceAdminCut,
      shopCut: newServiceShopCut,
      isActive: true,
    };

    setServices((prev) => [...prev, newObj]);
    setNewServiceName("");
    setShowAddForm(false);
    alert(`አዲስ አገልግሎት "${newServiceName}" ተጨምሯል! ለማረጋገጥ አስቀምጥ የሚለውን ይጫኑ።`);
  };

  // DELETE: Remove service
  const handleDeleteService = async (serviceType: string) => {
    if (!confirm(`እርግጠኛ ነዎት "${serviceType}" የአገልግሎት ተመን ይወገድ?`)) return;

    try {
      const res = await fetch(`/api/admin/pricing?serviceType=${serviceType}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.serviceType !== serviceType));
        alert("አገልግሎቱ ተወግዷል (Service deleted)");
      } else {
        alert("መሰረዝ አልተካሄደም");
      }
    } catch (e) {
      console.error(e);
      alert("ስህተት ተፈጥሯል");
    }
  };

  const toggleSimulatedService = (sType: string) => {
    setSimulatedServices((prev) =>
      prev.includes(sType) ? prev.filter((s) => s !== sType) : [...prev, sType]
    );
  };

  // Dynamic Free Threshold Evaluator
  const simResults = (() => {
    let maxPaidItems = 999;
    if (isFourthFreeDiscount) {
      if (freeThreshold === "AFTER_1") maxPaidItems = 1;
      else if (freeThreshold === "AFTER_2") maxPaidItems = 2;
      else if (freeThreshold === "AFTER_3") maxPaidItems = 3;
      else if (freeThreshold === "AFTER_4") maxPaidItems = 4;
    }

    const activeItems = simulatedServices.map((sType) => {
      const srv = services.find((s) => s.serviceType === sType);
      return {
        serviceType: sType,
        price: Number(srv?.price || 150),
        adminCut: Number(srv?.adminCommission || 75),
        shopCut: Number(srv?.shopCut || 50),
      };
    });

    activeItems.sort((a, b) => b.price - a.price);

    let customerTotal = 0;
    let adminCutTotal = 0;
    let shopCutTotal = 0;
    let freeCount = 0;

    activeItems.forEach((item, idx) => {
      if (idx >= maxPaidItems) {
        freeCount += 1;
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
        freeThreshold,
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
            </div>
          </div>

        </div>
      </div>

      {/* 2. Dynamic Free Threshold Selector ("ከ 1 በላይ ነፃ ይሁን፣ ከ 2 በላይ ነፃ ይሁን፣ ከ 3 በላይ ነፃ ይሁን...") */}
      <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
              <Gift className="w-5 h-5 text-emerald-600" />
              2. የነፃ አገልግሎቶች መወሰኛ ህግ (Multi-Service Free Threshold Settings)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              አንድ ደንበኛ ከአንድ በላይ ማስተካከያዎች ሲመርጥ ከስንት በላይ የሆኑት አገልግሎቶች በነፃ (0 ETB) እንዲሆኑ ይፈልጋሉ?
            </p>
          </div>

          <div className="flex items-center gap-3 bg-muted p-2 rounded-lg border">
            <span className="text-xs font-bold">የቅናሽ ህግ ማብሪያ:</span>
            <Switch checked={isFourthFreeDiscount} onCheckedChange={setIsFourthFreeDiscount} />
          </div>
        </div>

        {isFourthFreeDiscount && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            
            <Button
              variant={freeThreshold === "AFTER_1" ? "default" : "outline"}
              onClick={() => setFreeThreshold("AFTER_1")}
              className="flex flex-col items-center p-4 h-auto text-left justify-center gap-1"
            >
              <span className="font-bold text-sm">ከ 1 በላይ የሆኑት በነፃ (2nd+ Free)</span>
              <span className="text-[11px] opacity-80">ደንበኛው ለ 1 አገልግሎት ብቻ ይከፍላል</span>
            </Button>

            <Button
              variant={freeThreshold === "AFTER_2" ? "default" : "outline"}
              onClick={() => setFreeThreshold("AFTER_2")}
              className="flex flex-col items-center p-4 h-auto text-left justify-center gap-1"
            >
              <span className="font-bold text-sm">ከ 2 በላይ የሆኑት በነፃ (3rd+ Free)</span>
              <span className="text-[11px] opacity-80">ደንበኛው ለ 2 አገልግሎቶች ብቻ ይከፍላል</span>
            </Button>

            <Button
              variant={freeThreshold === "AFTER_3" ? "default" : "outline"}
              onClick={() => setFreeThreshold("AFTER_3")}
              className="flex flex-col items-center p-4 h-auto text-left justify-center gap-1"
            >
              <span className="font-bold text-sm">ከ 3 በላይ የሆኑት በነፃ (4th+ Free)</span>
              <span className="text-[11px] opacity-80">ደንበኛው ለ 3 አገልግሎቶች ብቻ ይከፍላል</span>
            </Button>

            <Button
              variant={freeThreshold === "AFTER_4" ? "default" : "outline"}
              onClick={() => setFreeThreshold("AFTER_4")}
              className="flex flex-col items-center p-4 h-auto text-left justify-center gap-1"
            >
              <span className="font-bold text-sm">ከ 4 በላይ የሆኑት በነፃ (5th+ Free)</span>
              <span className="text-[11px] opacity-80">ደንበኛው ለ 4 አገልግሎቶች ብቻ ይከፍላል</span>
            </Button>

          </div>
        )}
      </div>

      {/* 3. CRUD: Services Table & New Service Modal */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden space-y-4">
        <div className="p-6 border-b bg-muted/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              3. የአገልግሎቶች ዝርዝር እና ዋጋ መቆጣጠሪያ (CRUD Services & Pricing)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              አዳዲስ አገልግሎቶችን መጨመር (Create)፣ ማስተካከል (Update) ወይም ማስወገድ (Delete) ይችላሉ።
            </p>
          </div>

          <Button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className="bg-primary text-primary-foreground font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>አዲስ አገልግሎት ጨምር (Add New Service)</span>
          </Button>
        </div>

        {/* Add New Service Form Dropdown */}
        {showAddForm && (
          <div className="p-6 bg-primary/5 border-b space-y-4 animate-in fade-in duration-200">
            <h4 className="font-bold text-sm text-primary flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> አዲስ የአገልግሎት አይነት መፍጠሪያ (Create Custom Service)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1">የአገልግሎቱ ስም (Name)</label>
                <Input 
                  placeholder="ምሳሌ: የትምህርት ደረጃ..." 
                  value={newServiceName} 
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">የደንበኛ ዋጋ (Customer Price ETB)</label>
                <Input 
                  type="number"
                  value={newServicePrice} 
                  onChange={(e) => setNewServicePrice(Number(e.target.value))}
                  className="h-9 text-xs font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">የአድሚን ድርሻ (Admin Cut ETB)</label>
                <Input 
                  type="number"
                  value={newServiceAdminCut} 
                  onChange={(e) => setNewServiceAdminCut(Number(e.target.value))}
                  className="h-9 text-xs font-bold text-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">የህትመት ቤት ድርሻ (Shop Cut ETB)</label>
                <Input 
                  type="number"
                  value={newServiceShopCut} 
                  onChange={(e) => setNewServiceShopCut(Number(e.target.value))}
                  className="h-9 text-xs font-bold text-indigo-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>ሰርዝ (Cancel)</Button>
              <Button size="sm" onClick={handleAddNewService} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                አገልግሎቱን ፍጠር (Create Service)
              </Button>
            </div>
          </div>
        )}

        {/* Services Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">የአገልግሎት አይነት</th>
                <th className="px-4 py-3 font-medium text-center">የደንበኛ ዋጋ (Price ETB)</th>
                <th className="px-4 py-3 font-medium text-center">የአድሚን ድርሻ (Admin Cut)</th>
                <th className="px-4 py-3 font-medium text-center">የህትመት ቤት ድርሻ (Shop Cut)</th>
                <th className="px-4 py-3 font-medium text-center">ሁኔታ</th>
                <th className="px-4 py-3 font-medium text-center">እርምጃ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map((service) => {
                const sType = service.serviceType;
                const label = SERVICE_LABELS[sType] || { amharic: service.titleAmharic || sType, english: service.titleEnglish || sType };

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

                    {/* Delete Button */}
                    <td className="px-4 py-4 text-center">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteService(sType)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
            4. የዋጋ ናሙና ማስያ እና መፈተሻ (Live Pricing Calculator & Preview)
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {services.map((srv) => {
            const sType = srv.serviceType;
            const isSel = simulatedServices.includes(sType);
            const label = SERVICE_LABELS[sType]?.amharic || srv.titleAmharic || sType;
            return (
              <Button
                key={sType}
                size="sm"
                variant={isSel ? "default" : "outline"}
                className={`text-xs ${isSel ? 'bg-primary text-primary-foreground font-bold' : ''}`}
                onClick={() => toggleSimulatedService(sType)}
              >
                {isSel && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                {label}
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
