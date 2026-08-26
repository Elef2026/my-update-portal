"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, CheckCircle, Upload, FileText, AlertCircle } from "lucide-react";

const AVAILABLE_SERVICES = [
  { id: "NAME_CHANGE", label: "የስም ማስተካከያ (Name Change)", price: 200 },
  { id: "NATIONALITY", label: "ዜግነት (Nationality)", price: 150 },
  { id: "GENDER", label: "ፆታ (Gender)", price: 150 },
  { id: "DOB", label: "የትውልድ ዘመን (DOB)", price: 200 },
  { id: "ADDRESS", label: "አድራሻ (Address)", price: 150 },
  { id: "PHONE", label: "ስልክ ቁጥር (Phone)", price: 100 },
  { id: "EMAIL", label: "ኢሜል (Email)", price: 100 },
  { id: "PO_BOX", label: "ፖስታ ሳጥን ቁጥር (PO Box)", price: 100 },
  { id: "PHOTO", label: "ፎቶ ማስተካከል (Photo)", price: 250 },
  { id: "FIN_FAN", label: "ፊን እና ፋን (FIN/FAN)", price: 150 },
];

const IS_UNIFIED_PRICING = false;
const UNIFIED_PRICE = 300;

export default function SplitUpdateForm() {
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

  const toggleService = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const { totalPrice, freeCount } = useMemo(() => {
    if (selectedServices.length === 0) return { totalPrice: 0, freeCount: 0 };

    const selectedList = selectedServices.map((id) => {
      const srv = AVAILABLE_SERVICES.find((s) => s.id === id);
      return { id, price: srv?.price || 150 };
    });

    // Sort descending by price so top 3 highest price items are paid, 4th+ are FREE!
    selectedList.sort((a, b) => b.price - a.price);

    let sum = 0;
    let free = 0;
    selectedList.forEach((item, idx) => {
      if (idx < 3) {
        sum += item.price;
      } else {
        free += 1;
      }
    });

    return { totalPrice: sum, freeCount: free };
  }, [selectedServices]);

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
    if (selectedServices.length === 0) {
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
        totalPaid: totalPrice,
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
              <label className="text-sm font-medium mb-1 block">የስራ አይነት (Order Type)</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50">
                  <input type="radio" name="orderType" checked={orderType === "FULL_SERVICE"} onChange={() => setOrderType("FULL_SERVICE")} className="h-4 w-4 text-primary" />
                  <span>አብዴት እና ፕሪንት (Full Service - Update & Print)</span>
                </label>
                <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50">
                  <input type="radio" name="orderType" checked={orderType === "UPDATE_ONLY"} onChange={() => setOrderType("UPDATE_ONLY")} className="h-4 w-4 text-primary" />
                  <span>አብዴት ብቻ (Update Only)</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium mb-1 block">የክፍያ መንገድ (Payment Method)</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50">
                  <input type="radio" name="paymentMethod" checked={paymentMethod === "CHAPA"} onChange={() => setPaymentMethod("CHAPA")} className="h-4 w-4 text-primary" />
                  <span>በቻፓ ይከፍላል (Pay via Chapa Online)</span>
                </label>
                <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50">
                  <input type="radio" name="paymentMethod" checked={paymentMethod === "CASH_TO_SHOP"} onChange={() => setPaymentMethod("CASH_TO_SHOP")} className="h-4 w-4 text-primary" />
                  <span>በጥሬ ገንዘብ ለህትመት ቤት (Pay Cash to Shop)</span>
                </label>
              </div>
            </div>

          </div>
        </div>

        {/* Section 3: Service Selection */}
        <div>
          <h2 className="text-xl font-bold mb-4 border-b pb-2">3. ምን ማስተካከል ይፈልጋሉ? (Select Services)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AVAILABLE_SERVICES.map(srv => (
              <label key={srv.id} className="flex items-center space-x-3 p-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={selectedServices.includes(srv.id)}
                  onChange={() => toggleService(srv.id)}
                  className="h-4 w-4 text-primary rounded border-gray-300"
                />
                <span className="text-sm font-medium">{srv.label}</span>
              </label>
            ))}
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
        {selectedServices.length > 0 && (
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
        )}

        {/* Total & Submit */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-primary/5 p-6 rounded-lg border">
          <div>
            <p className="text-sm font-medium text-muted-foreground">ጠቅላላ ክፍያ (Total Price)</p>
            <p className="text-3xl font-bold text-primary">{totalPrice} ETB</p>
            {freeCount > 0 && (
              <span className="inline-block mt-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-600 rounded-md text-xs font-bold border border-emerald-500/30">
                🎉 ከ 3 በላይ የተመረጡ {freeCount} አገልግሎቶች በነፃ (100% Free Discount)!
              </span>
            )}
            {IS_UNIFIED_PRICING && <p className="text-xs text-primary font-bold">(አንድ ወጥ ዋጋ/Unified Price Active)</p>}
          </div>
          <Button type="submit" disabled={isSubmitting || selectedServices.length === 0} size="lg" className="mt-4 md:mt-0 px-8 h-12 text-lg">
            {isSubmitting ? "በመላክ ላይ..." : "መረጃውን ለአድሚን ላክ (Submit to Admin)"}
          </Button>
        </div>

      </form>
    </div>
  );
}
