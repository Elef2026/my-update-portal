"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

// Unified pricing mock setting from Admin
const IS_UNIFIED_PRICING = false;
const UNIFIED_PRICE = 300;

export default function SplitUpdateForm() {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  
  // New State variables
  const [orderType, setOrderType] = useState<"UPDATE_ONLY" | "FULL_SERVICE">("FULL_SERVICE");
  const [paymentMethod, setPaymentMethod] = useState<"CHAPA" | "CASH_TO_SHOP">("CHAPA");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleService = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const totalPrice = useMemo(() => {
    if (selectedServices.length === 0) return 0;
    if (IS_UNIFIED_PRICING) return UNIFIED_PRICE;
    
    return selectedServices.reduce((total, sId) => {
      const srv = AVAILABLE_SERVICES.find(s => s.id === sId);
      return total + (srv?.price || 0);
    }, 0);
  }, [selectedServices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      alert("እባክዎ ቢያንስ አንድ ማስተካከያ ይምረጡ! (Please select at least one service)");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = {
        customerName,
        customerPhone,
        selectedServices,
        orderType,
        paymentMethod,
        totalPaid: totalPrice
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert(`ጥያቄው ተልኳል! (Order submitted successfully)`);
        window.location.href = "/am/shop/history"; // Make sure shop/history exists, or we will redirect to /am/shop/in-progress
      } else {
        alert("ስህተት ተፈጥሯል (Error submitting)");
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

        {/* Section 1.5: Service Type & Payment Method */}
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
                  <span>በቻፓ አሁን ይከፍላል (Pay via Chapa now)</span>
                </label>
                <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50">
                  <input type="radio" name="paymentMethod" checked={paymentMethod === "CASH_TO_SHOP"} onChange={() => setPaymentMethod("CASH_TO_SHOP")} className="h-4 w-4 text-primary" />
                  <span>በጥሬ ገንዘብ ለህትመት ቤት (Pay Cash to Shop)</span>
                </label>
              </div>
            </div>

          </div>
        </div>

        {/* Section 2: Service Selection */}
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

        {/* Section 3: Dynamic Inputs based on Selection */}
        {selectedServices.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">4. ማስተካከያ (Corrections)</h2>
            <div className="space-y-6">
              
              {selectedServices.includes("NAME_CHANGE") && (
                <div className="grid grid-cols-2 gap-6 bg-muted/20 p-4 rounded-md border">
                  <div>
                    <h3 className="font-bold text-destructive mb-2">የተሳሳተው ስም (Old Data)</h3>
                    <div className="space-y-3">
                      <Input placeholder="የተሳሳተ ስም በአማርኛ" />
                      <Input placeholder="Wrong Name in English" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-500 mb-2">ትክክለኛው ስም (New Data)</h3>
                    <div className="space-y-3">
                      <Input placeholder="ትክክለኛ ስም በአማርኛ" />
                      <Input placeholder="Correct Name in English" />
                    </div>
                  </div>
                </div>
              )}

              {selectedServices.includes("PHONE") && (
                <div className="grid grid-cols-2 gap-6 bg-muted/20 p-4 rounded-md border">
                  <div>
                    <h3 className="font-bold text-destructive mb-2">የተሳሳተ ስልክ (Old Phone)</h3>
                    <Input placeholder="09-12-12-12-12" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-500 mb-2">ትክክለኛ ስልክ (New Phone)</h3>
                    <Input placeholder="0933445566" />
                  </div>
                </div>
              )}

              {selectedServices.includes("DOB") && (
                <div className="grid grid-cols-2 gap-6 bg-muted/20 p-4 rounded-md border">
                  <div>
                    <h3 className="font-bold text-destructive mb-2">የተሳሳተ የትውልድ ዘመን (Old DOB)</h3>
                    <Input placeholder="1990-01-01" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-500 mb-2">ትክክለኛ የትውልድ ዘመን (New DOB)</h3>
                    <Input placeholder="1995-05-05" />
                  </div>
                </div>
              )}

              {/* Add other specific inputs similarly based on selectedServices... */}
              {selectedServices.some(s => !["NAME_CHANGE", "PHONE", "DOB"].includes(s)) && (
                <div className="grid grid-cols-2 gap-6 bg-muted/20 p-4 rounded-md border">
                  <div>
                    <h3 className="font-bold text-destructive mb-2">የተሳሳተ መረጃ (Old Data)</h3>
                    <textarea className="w-full min-h-[100px] p-3 border rounded-md" placeholder="እዚህ ጋ የተሳሳተውን መረጃ ይጻፉ..."></textarea>
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-500 mb-2">ትክክለኛ መረጃ (New Data)</h3>
                    <textarea className="w-full min-h-[100px] p-3 border rounded-md" placeholder="እዚህ ጋ ትክክለኛውን መረጃ ይጻፉ..."></textarea>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 4: File Attachments */}
        {selectedServices.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">5. ፋይል ማያያዣ (Attachments)</h2>
            <div className="border-2 border-dashed border-input rounded-md p-8 text-center bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer">
              <p className="text-sm font-medium">የደንበኛውን ማስረጃዎች እዚህ ያስገቡ</p>
              <p className="text-xs text-muted-foreground mb-4">ፈለጉትን ያህል ፋይሎች መምረጥ ይችላሉ (Multiple files allowed)</p>
              <Input type="file" multiple className="max-w-sm mx-auto" />
            </div>
          </div>
        )}

        {/* Total & Submit */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-primary/5 p-6 rounded-lg border">
          <div>
            <p className="text-sm font-medium text-muted-foreground">ጠቅላላ ክፍያ (Total Price)</p>
            <p className="text-3xl font-bold text-primary">{totalPrice} ETB</p>
            {IS_UNIFIED_PRICING && <p className="text-xs text-primary font-bold">(አንድ ወጥ ዋጋ/Unified Price Active)</p>}
          </div>
          <Button type="submit" disabled={isSubmitting || selectedServices.length === 0} size="lg" className="mt-4 md:mt-0 px-8 h-12 text-lg">
            {isSubmitting ? "በመላክ ላይ..." : paymentMethod === "CHAPA" ? "ወደ ቻፓ ሂድ (Proceed to Chapa)" : "መረጃውን ላክ (Submit Order)"}
          </Button>
        </div>

      </form>
    </div>
  );
}
