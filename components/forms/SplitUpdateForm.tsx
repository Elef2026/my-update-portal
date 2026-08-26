"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, CheckCircle, Upload, FileText, AlertCircle, Sparkles, Printer, RefreshCw, Check } from "lucide-react";

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
  const [fileList, setFileList] = useState<{ fileUrl: string; fileType: string }[]>([]);
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

  // Convert selected files to Data URLs for instant database upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setFileList((prev) => [
            ...prev,
            { fileUrl: result, fileType: file.type.includes("pdf") ? "PDF_DOCUMENT" : "IMAGE" }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0 && orderType === "UPDATE_ONLY") {
      alert("እባክዎ ቢያንስ አንድ ማስተካከያ ይምረጡ! (Please select at least one service)");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Build oldData JSON
      const oldDataObj: Record<string, string> = {};
      if (selectedServices.includes("NAME_CHANGE")) {
        if (oldNameAmharic) oldDataObj["ስም (አማርኛ)"] = oldNameAmharic;
        if (oldNameEnglish) oldDataObj["Name (English)"] = oldNameEnglish;
      }
      if (selectedServices.includes("PHONE") && oldPhone) oldDataObj["ስልክ"] = oldPhone;
      if (selectedServices.includes("DOB") && oldDob) oldDataObj["የትውልድ ዘመን"] = oldDob;
      if (oldGeneral) oldDataObj["ተጨማሪ መረጃ"] = oldGeneral;

      // Build newData JSON
      const newDataObj: Record<string, string> = {};
      if (selectedServices.includes("NAME_CHANGE")) {
        if (newNameAmharic) newDataObj["ስም (አማርኛ)"] = newNameAmharic;
        if (newNameEnglish) newDataObj["Name (English)"] = newNameEnglish;
      }
      if (selectedServices.includes("PHONE") && newPhone) newDataObj["ስልክ"] = newPhone;
      if (selectedServices.includes("DOB") && newDob) newDataObj["የትውልድ ዘመን"] = newDob;
      if (newGeneral) newDataObj["ተጨማሪ መረጃ"] = newGeneral;

      // Prepare files array
      const filesPayload = [...fileList];
      if (manualAttachmentUrl.trim()) {
        filesPayload.unshift({ fileUrl: manualAttachmentUrl.trim(), fileType: "PRIMARY_DOCUMENT" });
      }

      const payload = {
        customerName,
        customerPhone,
        selectedServices,
        orderType,
        paymentMethod,
        totalPaid: pricingSummary.totalPrice,
        oldData: oldDataObj,
        newData: newDataObj,
        customerAttachmentUrl: manualAttachmentUrl.trim() || (filesPayload.length > 0 ? filesPayload[0].fileUrl : null),
        files: filesPayload,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert("ጥያቄው በስኬት ተልኳል! ወደ አድሚኑ ደርሷል። (Order submitted successfully to Admin)");
        window.location.href = "/am/shop/in-progress";
      } else {
        const errData = await res.json();
        alert("ስህተት ተፈጥሯል (Error submitting order): " + (errData.error || ""));
      }
    } catch (err) {
      console.error(err);
      alert("ስህተት ተፈጥሯል (Network error)");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card p-8 rounded-lg shadow-sm border mt-6">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Customer Details */}
        <div>
          <h2 className="text-xl font-bold mb-4 border-b pb-2">1. የደንበኛ መረጃ (Customer Details)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">የደንበኛ ሙሉ ስም</label>
              <Input required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="አበበ ከበደ" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ስልክ ቁጥር (Payment & SMS)</label>
              <Input required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="0911..." />
            </div>
          </div>
        </div>

        {/* Section 2: Order & Payment Type */}
        <div>
          <h2 className="text-xl font-bold mb-4 border-b pb-2">2. የስራ እና የክፍያ አይነት (Order & Payment Type)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium mb-1 block font-semibold">የስራ አይነት (Order Type)</label>
              <div className="flex flex-col gap-2">
                <label className={`flex items-start space-x-3 border-2 p-3.5 rounded-xl cursor-pointer transition-all ${orderType === "FULL_SERVICE" ? "border-primary bg-primary/5 font-semibold" : "border-border hover:bg-muted/50"}`}>
                  <input type="radio" name="orderType" checked={orderType === "FULL_SERVICE"} onChange={() => setOrderType("FULL_SERVICE")} className="mt-1 h-4 w-4 text-primary" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Printer className="w-4 h-4 text-primary" />
                      <span>አብዴት እና ፕሪንት (Full Service - Update & Print)</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-normal">
                      የህትመት መነሻ ዋጋ ({fullServicePrice} ETB) + የተመረጡ ማስተካከያዎች ክፍያ
                    </p>
                  </div>
                </label>
                
                <label className={`flex items-start space-x-3 border-2 p-3.5 rounded-xl cursor-pointer transition-all ${orderType === "UPDATE_ONLY" ? "border-primary bg-primary/5 font-semibold" : "border-border hover:bg-muted/50"}`}>
                  <input type="radio" name="orderType" checked={orderType === "UPDATE_ONLY"} onChange={() => setOrderType("UPDATE_ONLY")} className="mt-1 h-4 w-4 text-primary" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-primary" />
                      <span>አብዴት ብቻ (Update Only)</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-normal">
                      የማስተካከያዎች ዋጋ ብቻ (የህትመት ክፍያ አይታሰብም)
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium mb-1 block font-semibold">የክፍያ መንገድ (Payment Method)</label>
              <div className="flex flex-col gap-2">
                <label className={`flex items-center space-x-3 border-2 p-3.5 rounded-xl cursor-pointer transition-all ${paymentMethod === "CHAPA" ? "border-emerald-500 bg-emerald-500/5 font-semibold" : "border-border hover:bg-muted/50"}`}>
                  <input type="radio" name="paymentMethod" checked={paymentMethod === "CHAPA"} onChange={() => setPaymentMethod("CHAPA")} className="h-4 w-4 text-emerald-600" />
                  <span>በቻፓ ይከፍላል (Pay via Chapa Online)</span>
                </label>
                <label className={`flex items-center space-x-3 border-2 p-3.5 rounded-xl cursor-pointer transition-all ${paymentMethod === "CASH_TO_SHOP" ? "border-amber-500 bg-amber-500/5 font-semibold" : "border-border hover:bg-muted/50"}`}>
                  <input type="radio" name="paymentMethod" checked={paymentMethod === "CASH_TO_SHOP"} onChange={() => setPaymentMethod("CASH_TO_SHOP")} className="h-4 w-4 text-amber-600" />
                  <span>በጥሬ ገንዘብ ለህትመት ቤት (Pay Cash to Shop)</span>
                </label>
              </div>
            </div>

          </div>
        </div>

        {/* Section 3: Service Selection */}
        <div>
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-xl font-bold">3. ምን ማስተካከል ይፈልጋሉ? (Select Services)</h2>
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

        {/* Section 4: Dynamic Inputs based on Selection */}
        {selectedServices.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">4. የሚስተካከሉ መረጃዎች (Corrections)</h2>
            <div className="space-y-6">
              
              {selectedServices.includes("NAME_CHANGE") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-md border">
                  <div>
                    <h3 className="font-bold text-destructive mb-2">የተሳሳተው ስም (Old Name)</h3>
                    <div className="space-y-3">
                      <Input placeholder="የተሳሳተ ስም በአማርኛ" value={oldNameAmharic} onChange={e => setOldNameAmharic(e.target.value)} />
                      <Input placeholder="Wrong Name in English" value={oldNameEnglish} onChange={e => setOldNameEnglish(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-500 mb-2">ትክክለኛው ስም (New Name)</h3>
                    <div className="space-y-3">
                      <Input placeholder="ትክክለኛ ስም በአማርኛ" value={newNameAmharic} onChange={e => setNewNameAmharic(e.target.value)} />
                      <Input placeholder="Correct Name in English" value={newNameEnglish} onChange={e => setNewNameEnglish(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {selectedServices.includes("PHONE") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-md border">
                  <div>
                    <h3 className="font-bold text-destructive mb-2">የተሳሳተ ስልክ (Old Phone)</h3>
                    <Input placeholder="0911..." value={oldPhone} onChange={e => setOldPhone(e.target.value)} />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-500 mb-2">ትክክለኛ ስልክ (New Phone)</h3>
                    <Input placeholder="0922..." value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                  </div>
                </div>
              )}

              {selectedServices.includes("DOB") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-md border">
                  <div>
                    <h3 className="font-bold text-destructive mb-2">የተሳሳተ የትውልድ ዘመን (Old DOB)</h3>
                    <Input placeholder="1990-01-01" value={oldDob} onChange={e => setOldDob(e.target.value)} />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-500 mb-2">ትክክለኛ የትውልድ ዘመን (New DOB)</h3>
                    <Input placeholder="1995-05-05" value={newDob} onChange={e => setNewDob(e.target.value)} />
                  </div>
                </div>
              )}

              {/* General text for other selected services */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-md border">
                <div>
                  <h3 className="font-bold text-destructive mb-2">የተሳሳተ መረጃ / ቀድሞ የነበረ (Old Data Summary)</h3>
                  <textarea 
                    className="w-full min-h-[100px] p-3 text-xs border rounded-md bg-background" 
                    placeholder="ቀድሞ የነበረውን የተሳሳተ መረጃ አጠቃልለው እዚህ ይፃፉ..."
                    value={oldGeneral}
                    onChange={e => setOldGeneral(e.target.value)}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-500 mb-2">ትክክለኛ መረጃ / አዲስ የሚቀየር (New Data Summary)</h3>
                  <textarea 
                    className="w-full min-h-[100px] p-3 text-xs border rounded-md bg-background" 
                    placeholder="አዲስ የሚስተካከለውን ትክክለኛ መረጃ አጠቃልለው እዚህ ይፃፉ..."
                    value={newGeneral}
                    onChange={e => setNewGeneral(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 5: File Attachments */}
        <div>
          <h2 className="text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-primary" />
            5. ፋይል ማያያዣ (Attachments & Documents)
          </h2>

          <div className="space-y-4 bg-muted/20 p-6 rounded-md border">
            <div>
              <label className="text-xs font-semibold mb-1 block">የደንበኛ ማስረጃ ፋይሎችን ይምረጡ (Select Image / PDF files)</label>
              <Input type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} className="bg-background" />
            </div>

            {fileList.length > 0 && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
                <p className="text-xs font-semibold text-emerald-600 mb-2">የተመረጡ ፋይሎች ({fileList.length}):</p>
                <ul className="text-xs space-y-1">
                  {fileList.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 text-muted-foreground font-mono">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>ፋይል #{idx + 1} ({f.fileType})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 border-t">
              <label className="text-xs font-semibold mb-1 block text-muted-foreground">ወይም የፋይል/ሰነድ ሊንክ በቀጥታ ያስገቡ (Optional Document Link/URL)</label>
              <Input 
                placeholder="https://..." 
                value={manualAttachmentUrl} 
                onChange={e => setManualAttachmentUrl(e.target.value)}
                className="text-xs font-mono bg-background" 
              />
            </div>
          </div>
        </div>

        {/* Section 6: Comprehensive Pricing Breakdown & Submit */}
        <div className="bg-primary/5 p-6 rounded-2xl border-2 border-primary/20 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-base flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              የክፍያ ዝርዝር መግለጫ (Transparent Pricing Breakdown)
            </h3>
            <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-md">
              {orderType === "FULL_SERVICE" ? "አብዴት + ህትመት" : "አብዴት ብቻ"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {orderType === "FULL_SERVICE" && (
              <div className="bg-card p-3 rounded-xl border">
                <p className="text-muted-foreground">የፋይዳ ህትመት (Print Base Fee):</p>
                <p className="text-lg font-bold text-foreground mt-0.5">{pricingSummary.basePrintFee} ETB</p>
              </div>
            )}

            <div className="bg-card p-3 rounded-xl border">
              <p className="text-muted-foreground">የተመረጡ ማስተካከያዎች ({pricingSummary.selectedCount}):</p>
              <p className="text-lg font-bold text-foreground mt-0.5">{pricingSummary.updatesSubtotal} ETB</p>
            </div>

            {pricingSummary.discountAmount > 0 && (
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                <p className="text-emerald-700 dark:text-emerald-300 font-semibold">ቅናሽ ({pricingSummary.freeCount} በነፃ):</p>
                <p className="text-lg font-bold text-emerald-600 mt-0.5">-{pricingSummary.discountAmount} ETB</p>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-2 border-t">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">ጠቅላላ የሚከፈል የደንበኛ ዋጋ (Total Customer Price)</p>
              <p className="text-3xl font-black text-primary">{pricingSummary.totalPrice} ETB</p>
              {pricingSummary.freeCount > 0 && (
                <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-600 rounded text-xs font-bold border border-emerald-500/30">
                  🎉 ከ 3 በላይ የተመረጡ {pricingSummary.freeCount} አገልግሎቶች በነፃ (100% Free Discount)!
                </span>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting || (selectedServices.length === 0 && orderType === "UPDATE_ONLY")} 
              size="lg" 
              className="mt-4 md:mt-0 px-8 h-12 text-base font-bold shadow-md"
            >
              {isSubmitting ? "በመላክ ላይ..." : "መረጃውን ለአድሚን ላክ (Submit to Admin)"}
            </Button>
          </div>
        </div>

      </form>
    </div>
  );
}
