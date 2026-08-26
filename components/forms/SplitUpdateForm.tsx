"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, CheckCircle, Upload, FileText, AlertCircle, Sparkles, Printer, RefreshCw, Check, Banknote, CreditCard, Calendar, User, Phone } from "lucide-react";

interface ServiceItem {
  id: string;
  label: string;
  price: number;
  isActive: boolean;
}

const DEFAULT_SERVICES: ServiceItem[] = [
  { id: "NAME_CHANGE", label: "የስም ማስተካከያ (Name Change)", price: 200, isActive: true },
  { id: "NATIONALITY", label: "ዜግነት (Nationality)", price: 150, isActive: true },
  { id: "GENDER", label: "ፆታ (Gender)", price: 150, isActive: true },
  { id: "DOB", label: "የትውልድ ዘመን (DOB)", price: 200, isActive: true },
  { id: "ADDRESS", label: "አድራሻ (Address)", price: 150, isActive: true },
  { id: "PHONE", label: "ስልክ ቁጥር (Phone)", price: 100, isActive: true },
  { id: "EMAIL", label: "ኢሜል (Email)", price: 100, isActive: true },
  { id: "PO_BOX", label: "ፖስታ ሳጥን ቁጥር (PO Box)", price: 100, isActive: true },
  { id: "PHOTO", label: "ፎቶ ማስተካከል (Photo)", price: 250, isActive: true },
  { id: "FIN_FAN", label: "ፊን እና ፋን (FIN/FAN)", price: 150, isActive: true },
  { id: "COURT_ORDER", label: "የፍርድ ቤት ውሳኔ (Court Order)", price: 300, isActive: true },
];

export default function SplitUpdateForm() {
  const [servicesList, setServicesList] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [fullServicePrice, setFullServicePrice] = useState<number>(350);
  const [isFourthFreeDiscount, setIsFourthFreeDiscount] = useState<boolean>(true);
  const [freeThreshold, setFreeThreshold] = useState<string>("AFTER_3");
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  
  const [orderType, setOrderType] = useState<"UPDATE_ONLY" | "FULL_SERVICE">("FULL_SERVICE");
  const [paymentMethod, setPaymentMethod] = useState<"CHAPA" | "CASH_TO_SHOP">("CHAPA");
  
  // Specific inputs for Old and New Data
  const [oldNameAmharic, setOldNameAmharic] = useState("");
  const [oldNameEnglish, setOldNameEnglish] = useState("");
  const [newNameAmharic, setNewNameAmharic] = useState("");
  const [newNameEnglish, setNewNameEnglish] = useState("");

  const [oldPhone, setOldPhone] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [oldDob, setOldDob] = useState("");
  const [newDob, setNewDob] = useState("");

  const [oldGeneral, setOldGeneral] = useState("");
  const [newGeneral, setNewGeneral] = useState("");

  // Files
  const [fileList, setFileList] = useState<{ fileUrl: string; fileType: string; fileName?: string }[]>([]);
  const [manualAttachmentUrl, setManualAttachmentUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch live pricing from database
  useEffect(() => {
    async function loadPricing() {
      try {
        const res = await fetch("/api/admin/pricing");
        if (res.ok) {
          const data = await res.json();
          if (data.fullServicePrice) setFullServicePrice(Number(data.fullServicePrice));
          if (data.isFourthFreeDiscount !== undefined) setIsFourthFreeDiscount(data.isFourthFreeDiscount);
          if (data.freeThreshold) setFreeThreshold(data.freeThreshold);

          if (Array.isArray(data.services) && data.services.length > 0) {
            const mapped: ServiceItem[] = data.services
              .filter((s: any) => s.isActive)
              .map((s: any) => ({
                id: s.serviceType,
                label: s.titleAmharic ? `${s.titleAmharic} (${s.titleEnglish || s.serviceType})` : s.serviceType,
                price: Number(s.price),
                isActive: s.isActive,
              }));
            setServicesList(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load dynamic pricing:", err);
      } finally {
        setLoadingConfig(false);
      }
    }
    loadPricing();
  }, []);

  const toggleService = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Accurate Combined Pricing Calculations
  const pricingSummary = useMemo(() => {
    const isFullService = orderType === "FULL_SERVICE";
    const basePrintFee = isFullService ? fullServicePrice : 0;

    // Filter update items
    const updateServicesSelected = isFullService 
      ? selectedServices.filter(s => s !== "FAIDA_PRINT_ONLY")
      : selectedServices;

    const selectedList = updateServicesSelected.map((id) => {
      const srv = servicesList.find((s) => s.id === id);
      return { 
        id, 
        label: srv?.label || id, 
        price: srv ? srv.price : 150 
      };
    });

    // Sort descending so the most expensive services are paid, cheaper ones beyond threshold become free
    selectedList.sort((a, b) => b.price - a.price);

    let maxPaidItems = 999;
    if (isFourthFreeDiscount) {
      if (freeThreshold === "AFTER_1") maxPaidItems = 1;
      else if (freeThreshold === "AFTER_2") maxPaidItems = 2;
      else if (freeThreshold === "AFTER_3") maxPaidItems = 3;
      else if (freeThreshold === "AFTER_4") maxPaidItems = 4;
    }

    let updatesSubtotal = 0;
    let discountAmount = 0;
    let freeCount = 0;

    selectedList.forEach((item, idx) => {
      if (idx >= maxPaidItems) {
        freeCount += 1;
        discountAmount += item.price;
      } else {
        updatesSubtotal += item.price;
      }
    });

    const totalPrice = basePrintFee + updatesSubtotal;

    return {
      basePrintFee,
      updatesSubtotal,
      discountAmount,
      freeCount,
      totalPrice,
      selectedCount: updateServicesSelected.length,
      items: selectedList,
    };
  }, [selectedServices, orderType, fullServicePrice, isFourthFreeDiscount, freeThreshold, servicesList]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.files)) {
        setFileList((prev) => [...prev, ...data.files]);
      } else {
        alert("የፋይል ማያያዝ ስህተት (File upload failed): " + (data.error || ""));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("የፋይል ማያያዝ ስህተት (Upload error)");
    }
  };

  const removeFile = (index: number) => {
    setFileList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0 && orderType === "UPDATE_ONLY") {
      alert("እባክዎ ቢያንስ አንድ ማስተካከያ ይምረጡ!");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const oldDataObj: Record<string, string> = {};
      if (selectedServices.includes("NAME_CHANGE")) {
        if (oldNameAmharic) oldDataObj["ስም (አማርኛ)"] = oldNameAmharic;
        if (oldNameEnglish) oldDataObj["Name (English)"] = oldNameEnglish;
      }
      if (selectedServices.includes("PHONE") && oldPhone) oldDataObj["ስልክ"] = oldPhone;
      if (selectedServices.includes("DOB") && oldDob) oldDataObj["የትውልድ ዘመን"] = oldDob;
      if (oldGeneral) oldDataObj["ተጨማሪ መረጃ"] = oldGeneral;

      const newDataObj: Record<string, string> = {};
      if (selectedServices.includes("NAME_CHANGE")) {
        if (newNameAmharic) newDataObj["ስም (አማርኛ)"] = newNameAmharic;
        if (newNameEnglish) newDataObj["Name (English)"] = newNameEnglish;
      }
      if (selectedServices.includes("PHONE") && newPhone) newDataObj["ስልክ"] = newPhone;
      if (selectedServices.includes("DOB") && newDob) newDataObj["የትውልድ ዘመን"] = newDob;
      if (newGeneral) newDataObj["ተጨማሪ መረጃ"] = newGeneral;

      const payload = {
        customerName,
        customerPhone,
        selectedServices,
        orderType,
        paymentMethod,
        totalPaid: pricingSummary.totalPrice,
        oldData: oldDataObj,
        newData: newDataObj,
        files: fileList,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const orderData = await res.json();
        
        if (paymentMethod === "CHAPA" && orderData.checkoutUrl) {
          window.location.href = orderData.checkoutUrl;
          return;
        }

        alert("ጥያቄው በስኬት ተልኳል! ወደ አድሚኑ ደርሷል። (Order submitted successfully to Admin)");
        window.location.href = "/am/shop/in-progress";
      } else {
        const errData = await res.json();
        alert("ስህተት ተፈጥሯል: " + (errData.error || ""));
      }
    } catch (err) {
      console.error(err);
      alert("ስህተት ተፈጥሯል (Network error)");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card p-6 sm:p-8 rounded-2xl shadow-sm border mt-6">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div>
          <h2 className="text-lg sm:text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
            የደንበኛ መረጃ (Customer Details)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold mb-1.5 block text-muted-foreground">የደንበኛ ሙሉ ስም *</label>
              <Input required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="ምሳሌ፡ አበበ ከበደ" className="h-11 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-bold mb-1.5 block text-muted-foreground">ስልክ ቁጥር (10 Digits - Payment & SMS) *</label>
              <Input required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="0911223344" className="h-11 rounded-xl font-mono text-xs" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
            የስራ እና የክፍያ መንገድ (Order & Payment Type)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="text-xs font-bold block text-muted-foreground uppercase tracking-wider">የስራ አይነት (Order Type)</label>
              <div className="flex flex-col gap-3">
                <label className={`flex items-start space-x-3 border-2 p-4 rounded-2xl cursor-pointer transition-all ${orderType === "FULL_SERVICE" ? "border-primary bg-primary/5 shadow-sm font-semibold" : "border-border hover:bg-muted/40"}`}>
                  <input type="radio" name="orderType" checked={orderType === "FULL_SERVICE"} onChange={() => setOrderType("FULL_SERVICE")} className="mt-1 h-4 w-4 text-primary" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Printer className="w-4 h-4 text-primary" />
                      <span className="text-sm">አብዴት እና ፕሪንት (Full Service - Update & Print)</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-normal">
                      የህትመት መነሻ ዋጋ ({fullServicePrice} ETB) + የተመረጡ ማስተካከያዎች ክፍያ
                    </p>
                  </div>
                </label>
                
                <label className={`flex items-start space-x-3 border-2 p-4 rounded-2xl cursor-pointer transition-all ${orderType === "UPDATE_ONLY" ? "border-primary bg-primary/5 shadow-sm font-semibold" : "border-border hover:bg-muted/40"}`}>
                  <input type="radio" name="orderType" checked={orderType === "UPDATE_ONLY"} onChange={() => setOrderType("UPDATE_ONLY")} className="mt-1 h-4 w-4 text-primary" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-primary" />
                      <span className="text-sm">አብዴት ብቻ (Update Only)</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-normal">
                      የማስተካከያዎች ዋጋ ብቻ (የህትመት ክፍያ 0 ETB)
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold block text-muted-foreground uppercase tracking-wider">የክፍያ መንገድ (Payment Method)</label>
              <div className="flex flex-col gap-3">
                <label className={`flex items-start space-x-3 border-2 p-4 rounded-2xl cursor-pointer transition-all ${paymentMethod === "CHAPA" ? "border-emerald-500 bg-emerald-500/10 shadow-sm font-semibold" : "border-border hover:bg-muted/40"}`}>
                  <input type="radio" name="paymentMethod" checked={paymentMethod === "CHAPA"} onChange={() => setPaymentMethod("CHAPA")} className="mt-1 h-4 w-4 text-emerald-600" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-sm font-bold">1. በቻፓ ይከፈል (Pay Online via Chapa)</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-normal">
                      📱 ቴሌብር፣ ሲቢኢ ብር፣ አዋሽ ወይም በባንክ ካርድ በቀጥታ ይከፈላል
                    </p>
                  </div>
                </label>

                <label className={`flex items-start space-x-3 border-2 p-4 rounded-2xl cursor-pointer transition-all ${paymentMethod === "CASH_TO_SHOP" ? "border-amber-500 bg-amber-500/10 shadow-sm font-semibold" : "border-border hover:bg-muted/40"}`}>
                  <input type="radio" name="paymentMethod" checked={paymentMethod === "CASH_TO_SHOP"} onChange={() => setPaymentMethod("CASH_TO_SHOP")} className="mt-1 h-4 w-4 text-amber-600" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <Banknote className="w-4 h-4" />
                      <span className="text-sm font-bold">2. እኔ ተቀብዬዋለሁኝ (Cash to Shop)</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-normal">
                      💵 ደንበኛው ክፍያውን በጥሬ ገንዘብ ወይም በባንክ በቀጥታ ለህትመት ቤቱ ከፍሏል
                    </p>
                  </div>
                </label>
              </div>
            </div>

          </div>
        </div>

        <div>
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
              ምን ማስተካከል ይፈልጋሉ? (Select Services)
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">
              {loadingConfig ? "ዋጋዎችን በማምጣት ላይ..." : `${servicesList.length} አገልግሎቶች ዝግጁ ናቸው`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {servicesList.map(srv => {
              const isChecked = selectedServices.includes(srv.id);
              return (
                <label 
                  key={srv.id} 
                  className={`flex items-center justify-between p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                    isChecked 
                      ? "border-primary bg-primary/5 text-primary font-semibold shadow-xs" 
                      : "border-border hover:bg-muted/50 text-foreground"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => toggleService(srv.id)}
                      className="h-4 w-4 text-primary rounded border-gray-300"
                    />
                    <span className="text-xs font-medium">{srv.label}</span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {srv.price} ETB
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {selectedServices.length > 0 && (
          <div className="space-y-6 bg-muted/20 p-6 rounded-2xl border">
            <h2 className="text-lg sm:text-xl font-bold border-b pb-2 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
              የሚስተካከሉ መረጃዎች ማስገቢያ (Old vs New Data)
            </h2>

            {selectedServices.includes("NAME_CHANGE") && (
              <div className="p-4 bg-background rounded-xl border space-y-4">
                <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                  <User className="w-4 h-4" /> የስም ለውጥ (Name Change)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">የነበረው ስም (Old Name - Amharic)</label>
                    <Input value={oldNameAmharic} onChange={e => setOldNameAmharic(e.target.value)} placeholder="የነበረው ስም በአማርኛ" className="rounded-xl" />
                    <label className="text-xs font-semibold text-muted-foreground mt-2 block">የነበረው ስም (Old Name - English)</label>
                    <Input value={oldNameEnglish} onChange={e => setOldNameEnglish(e.target.value)} placeholder="Old Name in English" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-emerald-600">አዲሱ ስም (New Name - Amharic) *</label>
                    <Input required value={newNameAmharic} onChange={e => setNewNameAmharic(e.target.value)} placeholder="አዲሱ ስም በአማርኛ" className="border-emerald-500/50 rounded-xl" />
                    <label className="text-xs font-semibold text-emerald-600 mt-2 block">አዲሱ ስም (New Name - English) *</label>
                    <Input required value={newNameEnglish} onChange={e => setNewNameEnglish(e.target.value)} placeholder="New Name in English" className="border-emerald-500/50 rounded-xl" />
                  </div>
                </div>
              </div>
            )}

            {selectedServices.includes("PHONE") && (
              <div className="p-4 bg-background rounded-xl border space-y-4">
                <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                  <Phone className="w-4 h-4" /> የስልክ ቁጥር ለውጥ (Phone Number)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">የነበረው ስልክ ቁጥር</label>
                    <Input value={oldPhone} onChange={e => setOldPhone(e.target.value)} placeholder="09..." className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-emerald-600">አዲሱ ስልክ ቁጥር *</label>
                    <Input required value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="09..." className="border-emerald-500/50 rounded-xl" />
                  </div>
                </div>
              </div>
            )}

            {selectedServices.includes("DOB") && (
              <div className="p-4 bg-background rounded-xl border space-y-4">
                <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> የልደት ቀን ለውጥ (Date of Birth)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">የነበረው የልደት ቀን</label>
                    <Input value={oldDob} onChange={e => setOldDob(e.target.value)} placeholder="ቀን/ወር/ዓ.ም" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-emerald-600">አዲሱ የልደት ቀን *</label>
                    <Input required value={newDob} onChange={e => setNewDob(e.target.value)} placeholder="ቀን/ወር/ዓ.ም" className="border-emerald-500/50 rounded-xl" />
                  </div>
                </div>
              </div>
            )}

            {(selectedServices.includes("PHOTO") || selectedServices.includes("GENDER") || selectedServices.includes("OTHER")) && (
              <div className="p-4 bg-background rounded-xl border space-y-4">
                <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                  <FileText className="w-4 h-4" /> ተጨማሪ መረጃ እና ማብራሪያ (Additional Details)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">የነበረው ሁኔታ</label>
                    <Input value={oldGeneral} onChange={e => setOldGeneral(e.target.value)} placeholder="የነበረው..." className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-emerald-600">አዲሱ የሚስተካከለው *</label>
                    <Input required value={newGeneral} onChange={e => setNewGeneral(e.target.value)} placeholder="አዲሱ እንዲሆን የሚፈለገው..." className="border-emerald-500/50 rounded-xl" />
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        <div>
          <h2 className="text-lg sm:text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">5</span>
            <Paperclip className="w-5 h-5 text-primary" />
            ፋይል ማያያዣ (Attachments & Documents)
          </h2>

          <div className="space-y-4 bg-muted/20 p-6 rounded-2xl border">
            <div>
              <label className="text-xs font-bold mb-1.5 block text-muted-foreground">
                የደንበኛ ማስረጃ ፋይሎችን ይምረጡ (Images / PDFs / Documents)
              </label>
              <Input type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} className="bg-background rounded-xl" />
              <p className="text-[11px] text-muted-foreground mt-1">
                የታደሰ ሰነድ፣ ፎቶ፣ የልደት ካርድ ወይም የውክልና ሰነድ እዚህ ጋር ያያይዙ።
              </p>
            </div>

            {fileList.length > 0 && (
              <div className="p-4 bg-card border rounded-xl space-y-2">
                <p className="text-xs font-bold text-emerald-600">የተያያዙ ፋይሎች ({fileList.length}):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fileList.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-xl border text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="truncate font-mono">{f.fileName || `ፋይል #${idx + 1} (${f.fileType})`}</span>
                      </div>
                      <button type="button" onClick={() => removeFile(idx)} className="text-destructive font-bold text-xs px-2 hover:bg-destructive/10 rounded">
                        አጥፋ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t">
              <label className="text-xs font-semibold mb-1 block text-muted-foreground">ወይም የፋይል ሊንክ በቀጥታ ያስገቡ (Optional Document Link/URL)</label>
              <Input 
                placeholder="https://..." 
                value={manualAttachmentUrl} 
                onChange={e => setManualAttachmentUrl(e.target.value)}
                className="text-xs font-mono bg-background rounded-xl" 
              />
            </div>
          </div>
        </div>

        <div className="bg-primary/5 p-6 sm:p-8 rounded-3xl border-2 border-primary/20 space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-lg flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              የክፍያ ዝርዝር ደረሰኝ (Order Pricing & Payment)
            </h3>
            <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
              {orderType === "FULL_SERVICE" ? "አብዴት + ህትመት" : "አብዴት ብቻ"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {orderType === "FULL_SERVICE" && (
              <div className="bg-card p-4 rounded-2xl border shadow-xs">
                <p className="text-muted-foreground">የፋይዳ ህትመት (Print Base Fee):</p>
                <p className="text-xl font-black text-foreground mt-1">{pricingSummary.basePrintFee} ETB</p>
              </div>
            )}

            <div className="bg-card p-4 rounded-2xl border shadow-xs">
              <p className="text-muted-foreground">የተመረጡ ማስተካከያዎች ({pricingSummary.selectedCount}):</p>
              <p className="text-xl font-black text-foreground mt-1">{pricingSummary.updatesSubtotal} ETB</p>
            </div>

            {pricingSummary.discountAmount > 0 && (
              <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30">
                <p className="text-emerald-700 dark:text-emerald-300 font-semibold">ቅናሽ ({pricingSummary.freeCount} በነፃ):</p>
                <p className="text-xl font-black text-emerald-600 mt-1">-{pricingSummary.discountAmount} ETB</p>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-4 border-t gap-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ጠቅላላ የሚከፈል የደንበኛ ዋጋ (Total Customer Price)</p>
              <p className="text-4xl font-black text-primary mt-1">{pricingSummary.totalPrice} ETB</p>
              {pricingSummary.freeCount > 0 && (
                <span className="inline-block mt-1 px-3 py-1 bg-emerald-500/20 text-emerald-600 rounded-full text-xs font-bold border border-emerald-500/30">
                  🎉 ከ 3 በላይ የተመረጡ {pricingSummary.freeCount} አገልግሎቶች በነፃ (100% Free Discount)!
                </span>
              )}
            </div>

            {/* DYNAMIC SUBMIT BUTTON ACCORDING TO PAYMENT METHOD */}
            {paymentMethod === "CHAPA" ? (
              <Button 
                type="submit" 
                disabled={isSubmitting || (selectedServices.length === 0 && orderType === "UPDATE_ONLY")} 
                size="lg" 
                className="w-full md:w-auto h-14 px-8 rounded-2xl text-base font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
              >
                <CreditCard className="w-5 h-5" />
                {isSubmitting ? "ወደ ቻፓ በመገናኘት ላይ..." : `በቻፓ ክፈል (${pricingSummary.totalPrice} ETB Pay Online)`}
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isSubmitting || (selectedServices.length === 0 && orderType === "UPDATE_ONLY")} 
                size="lg" 
                className="w-full md:w-auto h-14 px-8 rounded-2xl text-base font-black bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-xl shadow-amber-600/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
              >
                <Banknote className="w-5 h-5" />
                {isSubmitting ? "በመላክ ላይ..." : "ጥሬ ገንዘብ ተቀብያለሁ - ትዕዛዝ ላክ (Submit to Admin)"}
              </Button>
            )}
          </div>
        </div>

      </form>
    </div>
  );
}
