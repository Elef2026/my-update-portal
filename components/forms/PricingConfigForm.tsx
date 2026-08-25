"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

// Mock data matching the new UpdateType enum
const mockServices = [
  { id: "NAME_CHANGE", name: "የስም ማስተካከያ", price: 200, adminCut: 50, copyExpense: 0, isActive: true },
  { id: "NATIONALITY", name: "ዜግነት", price: 150, adminCut: 50, copyExpense: 0, isActive: true },
  { id: "GENDER", name: "ፆታ", price: 150, adminCut: 50, copyExpense: 0, isActive: true },
  { id: "DOB", name: "የትውልድ ዘመን (እድሜ)", price: 200, adminCut: 50, copyExpense: 0, isActive: true },
  { id: "ADDRESS", name: "አድራሻ (ክልል/ዞን/ወረዳ)", price: 150, adminCut: 50, copyExpense: 0, isActive: true },
  { id: "PHONE", name: "ስልክ ቁጥር", price: 100, adminCut: 30, copyExpense: 0, isActive: true },
  { id: "EMAIL", name: "ኢሜል (Emails)", price: 100, adminCut: 30, copyExpense: 0, isActive: true },
  { id: "PO_BOX", name: "ፖስታ ሳጥን ቁጥር", price: 100, adminCut: 30, copyExpense: 0, isActive: true },
  { id: "PHOTO", name: "ፎቶ ማስተካከል", price: 250, adminCut: 80, copyExpense: 0, isActive: true },
  { id: "FIN_FAN", name: "ፊን እና ፋን ማስተካከያ", price: 150, adminCut: 50, copyExpense: 0, isActive: true },
  { id: "FAIDA_PRINT_ONLY", name: "ፋይዳ ፕሪንት ብቻ", price: 50, adminCut: 10, copyExpense: 0, isActive: true },
  { id: "COURT_ORDER", name: "ፍርድ ቤት የሚያስኬድ", price: 500, adminCut: 150, copyExpense: 100, isActive: true },
];

export default function PricingConfigForm() {
  const [isUnified, setIsUnified] = useState(false);
  const [unifiedPrice, setUnifiedPrice] = useState(300);
  const [services, setServices] = useState(mockServices);
  const [isSaving, setIsSaving] = useState(false);

  const handlePriceChange = (id: string, field: 'price' | 'adminCut' | 'copyExpense', value: string) => {
    setServices(services.map(s => 
      s.id === id ? { ...s, [field]: Number(value) } : s
    ));
  };

  const toggleService = (id: string, checked: boolean) => {
    setServices(services.map(s => 
      s.id === id ? { ...s, isActive: checked } : s
    ));
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      // Simulate API call to save to database
      console.log("Saving new pricing to database:", { isUnified, unifiedPrice, services });
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("የዋጋ ማስተካከያው በተሳካ ሁኔታ ተቀምጧል! (Pricing saved successfully)");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Unified Pricing Toggle */}
      <div className="bg-primary/5 p-6 rounded-lg border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">የጋራ ዋጋ ተመን (Unified Pricing)</h3>
          <p className="text-sm text-muted-foreground mt-1">
            ይህ በርቶ ከሆነ ደንበኞች ምንም ያህል ማስተካከያ ቢመርጡ የሚከፍሉት ይህንን አንድ ወጥ ዋጋ ብቻ ይሆናል። ጠፍቶ ከሆነ ግን ለየብቻው ይታሰባል።
          </p>
        </div>
        <div className="flex items-center gap-4 bg-background p-4 rounded-md border">
          <Switch checked={isUnified} onCheckedChange={setIsUnified} />
          {isUnified && (
            <div className="flex items-center gap-2">
              <span className="font-medium">ዋጋ (ETB):</span>
              <Input 
                type="number" 
                value={unifiedPrice} 
                onChange={(e) => setUnifiedPrice(Number(e.target.value))}
                className="w-24 font-bold text-lg"
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">የአገልግሎት አይነት (Service)</th>
              <th className="px-6 py-4 font-medium">የደንበኛ ዋጋ (Customer Price ETB)</th>
              <th className="px-6 py-4 font-medium">የአድሚን ኮሚሽን (Admin Cut ETB)</th>
              <th className="px-6 py-4 font-medium">ኮፒ ወጪ (Copy Expense)</th>
              <th className="px-6 py-4 font-medium">ሁኔታ (Status)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {services.map((service) => (
              <tr key={service.id} className={`hover:bg-muted/50 transition-colors ${!service.isActive ? 'opacity-60 bg-muted/20' : ''}`}>
                <td className="px-6 py-4 font-medium">{service.name}</td>
                <td className="px-6 py-4">
                  <Input 
                    type="number" 
                    value={service.price} 
                    onChange={(e) => handlePriceChange(service.id, 'price', e.target.value)}
                    className="w-28"
                    disabled={isUnified && service.id !== "FAIDA_PRINT_ONLY" && service.id !== "COURT_ORDER"}
                  />
                </td>
                <td className="px-6 py-4">
                  <Input 
                    type="number" 
                    value={service.adminCut} 
                    onChange={(e) => handlePriceChange(service.id, 'adminCut', e.target.value)}
                    className="w-28"
                  />
                </td>
                <td className="px-6 py-4">
                  <Input 
                    type="number" 
                    value={service.copyExpense} 
                    onChange={(e) => handlePriceChange(service.id, 'copyExpense', e.target.value)}
                    className="w-28"
                    disabled={service.id !== "COURT_ORDER"}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={service.isActive} 
                      onCheckedChange={(c) => toggleService(service.id, c)} 
                    />
                    <span className="text-xs">{service.isActive ? "ክፍት (ON)" : "ዝግ (OFF)"}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveChanges} disabled={isSaving} size="lg">
          {isSaving ? "በማስቀመጥ ላይ..." : "ለውጦችን አስቀምጥ (Save Changes)"}
        </Button>
      </div>
    </div>
  );
}
