"use client";

import React, { useState } from "react";
import { 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Eye, 
  Edit3, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Layers,
  FileText,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GuidelineItem, SystemGuidelineData, DEFAULT_GUIDELINE_DATA } from "@/lib/defaultGuidelines";
import GuidelinesViewer from "./GuidelinesViewer";

interface AdminGuidelinesEditorProps {
  initialData: SystemGuidelineData;
}

export default function AdminGuidelinesEditor({ initialData }: AdminGuidelinesEditorProps) {
  const [data, setData] = useState<SystemGuidelineData>(initialData);
  const [activeTab, setActiveTab] = useState<"EDIT" | "PREVIEW">("EDIT");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Handle header / title change
  const handleTitleChange = (val: string) => {
    setData((prev) => ({ ...prev, title: val }));
  };

  const handleHeaderNoticeChange = (val: string) => {
    setData((prev) => ({ ...prev, headerNotice: val }));
  };

  const handleFooterTitleChange = (val: string) => {
    setData((prev) => ({ ...prev, footerNoticeTitle: val }));
  };

  // Items manipulation
  const handleItemChange = (index: number, field: keyof GuidelineItem, value: string) => {
    setData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleAddItem = () => {
    const newItem: GuidelineItem = {
      id: `item_${Date.now()}`,
      serviceKey: "NAME_CHANGE",
      title: "አዲስ የአገልግሎት መስፈርት",
      requiredDocs: "የሚያስፈልጉ ሰነዶች ዝርዝር እዚህ ይፃፉ...",
      badge: "አስፈላጊ ሰነድ",
    };
    setData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleDeleteItem = (index: number) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  // Footer rules manipulation
  const handleRuleChange = (index: number, value: string) => {
    setData((prev) => {
      const newRules = [...prev.footerRules];
      newRules[index] = value;
      return { ...prev, footerRules: newRules };
    });
  };

  const handleAddRule = () => {
    setData((prev) => ({
      ...prev,
      footerRules: [...prev.footerRules, "አዲስ ማሳሰቢያ ወይም መመሪያ ደንብ እዚህ ይፃፉ..."],
    }));
  };

  const handleDeleteRule = (index: number) => {
    setData((prev) => ({
      ...prev,
      footerRules: prev.footerRules.filter((_, idx) => idx !== index),
    }));
  };

  // Reset to default
  const handleResetDefault = () => {
    if (confirm("እርግጠኛ ነዎት መመሪያዎችን ወደ ነባሪ (Default) መረጃዎች መመለስ ይፈልጋሉ?")) {
      setData(DEFAULT_GUIDELINE_DATA);
    }
  };

  // Save to backend API
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    setErrorMessage("");

    try {
      const res = await fetch("/api/guidelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3500);
      } else {
        setSaveStatus("error");
        setErrorMessage(json.error || "ማስቀመጥ አልተቻለም");
      }
    } catch (err: any) {
      console.error(err);
      setSaveStatus("error");
      setErrorMessage(err.message || "የኔትወርክ ስህተት ተፈጥሯል");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            የአገልግሎት እና የሰነዶች መመሪያ ማስተካከያ (Manage Guidelines)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            ህትመት ቤቶች የሚያዩትን የሰነድ ዝርዝር፣ ህጎች እና ማሳሰቢያዎች እዚህ ያስተካክሉ ወይም አዲስ ይጨምሩ።
          </p>
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="inline-flex p-1 bg-muted rounded-xl border border-border">
            <button
              onClick={() => setActiveTab("EDIT")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "EDIT" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              ማስተካከያ (Editor)
            </button>
            <button
              onClick={() => setActiveTab("PREVIEW")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "PREVIEW" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              ቅድመ-ዕይታ (Live Preview)
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDefault}
            className="text-muted-foreground hover:text-destructive hover:border-destructive/50"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            ወደ ነባሪ መልስ (Reset)
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
          >
            {isSaving ? (
              <span className="flex items-center gap-1.5">በማስቀመጥ ላይ...</span>
            ) : saveStatus === "success" ? (
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" /> ተቀምጧል! (Saved)
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Save className="w-4 h-4" /> ለውጦችን አስቀምጥ (Save)
              </span>
            )}
          </Button>
        </div>
      </div>

      {saveStatus === "success" && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 flex items-center gap-2 text-sm font-semibold">
          <Check className="w-5 h-5" />
          የመመሪያ መረጃው በተሳካ ሁኔታ ተቀምጧል! ሁሉም ህትመት ቤቶች አዲሱን መረጃ ማየት ይችላሉ።
        </div>
      )}

      {saveStatus === "error" && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-2 text-sm font-semibold">
          <AlertCircle className="w-5 h-5" />
          ስህተት ተፈጥሯል፦ {errorMessage}
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === "PREVIEW" ? (
        <div className="bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
          <GuidelinesViewer data={data} isAdmin={true} />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Header / Title */}
          <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground border-b pb-3">
              <FileText className="w-5 h-5 text-primary" />
              1. የዋናው ርዕስ እና መግቢያ ማስታወሻ (Header Information)
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                  የገጹ ዋና ርዕስ (Main Page Title)
                </label>
                <Input
                  value={data.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="font-semibold text-base"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                  የመግቢያ ማሳሰቢያ ጽሑፍ (Introduction Notice)
                </label>
                <textarea
                  value={data.headerNotice}
                  onChange={(e) => handleHeaderNoticeChange(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Items List */}
          <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Sparkles className="w-5 h-5 text-primary" />
                2. የአገልግሎት አይነቶች እና የሚያስፈልጉ ሰነዶች ዝርዝር ({data.items.length} Items)
              </h2>
              <Button
                onClick={handleAddItem}
                size="sm"
                variant="outline"
                className="border-primary/40 text-primary hover:bg-primary/10 font-semibold"
              >
                <Plus className="w-4 h-4 mr-1" />
                አዲስ አገልግሎት ጨምር (Add Item)
              </Button>
            </div>

            <div className="space-y-4 pt-2">
              {data.items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="p-4 rounded-xl border bg-muted/20 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-primary/10 text-primary">
                      ተራ ቁጥር #{index + 1}
                    </span>

                    <button
                      onClick={() => handleDeleteItem(index)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                      title="ይህንን ሰርዝ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Item Title */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        የአገልግሎት ስም / ርዕስ (ምሳሌ፦ ለዋናው ስም ለውጥ)
                      </label>
                      <Input
                        value={item.title}
                        onChange={(e) => handleItemChange(index, "title", e.target.value)}
                        placeholder="የአገልግሎቱ ርዕስ..."
                        className="font-medium"
                      />
                    </div>

                    {/* Badge */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        የአጭር ባጅ ስም (Badge Tag)
                      </label>
                      <Input
                        value={item.badge || ""}
                        onChange={(e) => handleItemChange(index, "badge", e.target.value)}
                        placeholder="ምሳሌ፦ የፍርድ ቤት ውሳኔ"
                      />
                    </div>
                  </div>

                  {/* Required Documents Textarea */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      የሚያስፈልጉ ሰነዶች ዝርዝር (Required Documents)
                    </label>
                    <textarea
                      value={item.requiredDocs}
                      onChange={(e) => handleItemChange(index, "requiredDocs", e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="ደንበኛው ይዞት መቅረብ ያለበት ሰነዶች..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Critical Reminders & Warnings */}
          <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                  3. ጠቃሚ ማሳሰቢያዎች እና የጥንቃቄ ህጎች (Important Rules & Reminders)
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  በገጹ ግርጌ ላይ የሚታዩ የማስጠንቀቂያ እና የጥንቃቄ ደንቦች
                </p>
              </div>
              <Button
                onClick={handleAddRule}
                size="sm"
                variant="outline"
                className="border-amber-500/40 text-amber-600 hover:bg-amber-500/10 font-semibold"
              >
                <Plus className="w-4 h-4 mr-1" />
                አዲስ ማሳሰቢያ ጨምር
              </Button>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                  የማሳሰቢያው ንዑስ ርዕስ (Notice Title)
                </label>
                <Input
                  value={data.footerNoticeTitle}
                  onChange={(e) => handleFooterTitleChange(e.target.value)}
                  className="font-semibold text-amber-600 dark:text-amber-400"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-muted-foreground uppercase block">
                  የህጎች / የደንቦች ዝርዝር (Bullet Points)
                </label>

                {data.footerRules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-500 w-5 text-right">
                      {idx + 1}.
                    </span>
                    <Input
                      value={rule}
                      onChange={(e) => handleRuleChange(idx, e.target.value)}
                      className="flex-1 text-sm font-medium"
                    />
                    <button
                      onClick={() => handleDeleteRule(idx)}
                      className="text-muted-foreground hover:text-destructive p-1.5 rounded transition-colors"
                      title="ይህንን ደንብ ሰርዝ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="sticky bottom-4 z-20 flex justify-end bg-card/90 backdrop-blur border p-4 rounded-xl shadow-lg">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 shadow-md"
            >
              {isSaving ? "በማስቀመጥ ላይ..." : "ሁሉንም ለውጦች አስቀምጥ (Save All Changes)"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
