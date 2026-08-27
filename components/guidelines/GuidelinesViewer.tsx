"use client";

import React, { useState, useMemo } from "react";
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Printer, 
  Scale, 
  User, 
  Calendar, 
  MapPin, 
  Globe, 
  PhoneCall, 
  ShieldCheck, 
  Sparkles,
  Bookmark,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GuidelineItem, SystemGuidelineData } from "@/lib/defaultGuidelines";

interface GuidelinesViewerProps {
  data: SystemGuidelineData;
  isAdmin?: boolean;
}

export default function GuidelinesViewer({ data, isAdmin = false }: GuidelinesViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Filter items based on search and selected service filter
  const filteredItems = useMemo(() => {
    return (data.items || []).filter((item) => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.requiredDocs.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.badge && item.badge.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedFilter === "ALL") return true;
      if (selectedFilter === "NAME") return item.serviceKey === "NAME_CHANGE" || item.title.includes("ስም");
      if (selectedFilter === "DOB") return item.serviceKey === "DOB" || item.title.includes("ትውልድ");
      if (selectedFilter === "ADDRESS") return item.serviceKey === "ADDRESS" || item.title.includes("አድራሻ");
      if (selectedFilter === "NATIONALITY") return item.serviceKey === "NATIONALITY" || item.title.includes("ዜግነት");
      if (selectedFilter === "PHONE") return item.serviceKey === "PHONE" || item.title.includes("ስልክ") || item.title.includes("ኢሜይል");

      return true;
    });
  }, [data.items, searchTerm, selectedFilter]);

  const handleCopyItem = (item: GuidelineItem) => {
    const textToCopy = `📌 ${item.title}:\n📄 የሚያስፈልጉ ሰነዶች፦ ${item.requiredDocs}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyAll = () => {
    let fullText = `${data.headerNotice}\n\n`;
    data.items.forEach((item, index) => {
      fullText += `${index + 1}. ${item.title}፦ ${item.requiredDocs}\n`;
    });
    fullText += `\n${data.footerNoticeTitle}\n`;
    data.footerRules.forEach((rule) => {
      fullText += `• ${rule}\n`;
    });

    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const getItemIcon = (title: string, serviceKey?: string) => {
    if (title.includes("ፍርድ ቤት") || title.includes("ውሳኔ")) {
      return <Scale className="w-5 h-5 text-amber-500" />;
    }
    if (serviceKey === "NAME_CHANGE" || title.includes("ስም")) {
      return <User className="w-5 h-5 text-blue-500" />;
    }
    if (serviceKey === "DOB" || title.includes("ትውልድ")) {
      return <Calendar className="w-5 h-5 text-emerald-500" />;
    }
    if (serviceKey === "ADDRESS" || title.includes("አድራሻ")) {
      return <MapPin className="w-5 h-5 text-purple-500" />;
    }
    if (serviceKey === "NATIONALITY" || title.includes("ዜግነት")) {
      return <Globe className="w-5 h-5 text-indigo-500" />;
    }
    if (serviceKey === "PHONE" || title.includes("ስልክ") || title.includes("ኢሜይል")) {
      return <PhoneCall className="w-5 h-5 text-teal-500" />;
    }
    return <FileText className="w-5 h-5 text-primary" />;
  };

  return (
    <div className="space-y-8 print:space-y-4 print:p-0">
      {/* Top Banner / Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/15 via-primary/10 to-indigo-600/15 border border-primary/20 p-6 md:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>የማደሻ ሰነዶች መመሪያ እና መስፈርቶች</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {data.title}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed pt-1">
              {data.headerNotice}
            </p>
          </div>

          {/* Action Buttons (Copy all, Print) */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              className="flex-1 md:flex-none items-center gap-1.5 font-medium border-primary/30 hover:bg-primary/10"
            >
              {copiedAll ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 font-semibold">ተገልብጧል (Copied!)</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-primary" />
                  <span>ሙሉውን ኮፒ አድርግ (Copy All)</span>
                </>
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="flex-1 md:flex-none items-center gap-1.5 font-medium bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>ፕሪንት አድርግ (Print)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center print:hidden">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="አገልግሎት ወይም ሰነድ ፈልግ (ምሳሌ፦ ስም፣ ፓስፖርት፣ ልደት...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-card border-border/80 focus:border-primary"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground bg-muted px-1.5 py-0.5 rounded"
            >
              አጥፋ
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { key: "ALL", label: "ሁሉም (All)" },
            { key: "NAME", label: "የስም ለውጥ" },
            { key: "DOB", label: "የትውልድ ቀን" },
            { key: "ADDRESS", label: "አድራሻ" },
            { key: "NATIONALITY", label: "ዜግነት" },
            { key: "PHONE", label: "ስልክ / ኢሜይል" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedFilter === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Guidelines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item, index) => (
          <div
            key={item.id || index}
            className="group relative rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all hover:border-primary/40 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    {getItemIcon(item.title, item.serviceKey)}
                  </div>
                  <h3 className="font-bold text-base text-foreground leading-snug">
                    {item.title}
                  </h3>
                </div>

                {item.badge && (
                  <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border">
                    {item.badge}
                  </span>
                )}
              </div>

              <div className="bg-muted/40 rounded-lg p-3 border border-border/50 text-sm text-foreground/90 font-medium leading-relaxed">
                <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                  የሚያስፈልገው ሰነድ፦
                </span>
                {item.requiredDocs}
              </div>
            </div>

            {/* Item Footer - Quick Copy Button */}
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground print:hidden">
              <span className="flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5 text-primary/70" />
                የማደሻ መመሪያ #{index + 1}
              </span>
              <button
                onClick={() => handleCopyItem(item)}
                className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-semibold p-1 hover:bg-primary/10 rounded transition-colors"
                title="ይህንን መስፈርት ለደንበኛ ለመላክ ኮፒ ያድርጉ"
              >
                {copiedId === item.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600">ኮፒ ተደርጓል!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>ኮፒ (Copy)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border border-dashed p-8">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold">ምንም የተገኘ መረጃ የለም</h3>
          <p className="text-sm text-muted-foreground mt-1">
            ያስገቡትን የፍለጋ ቃል አረጋግጠው በድጋሚ ይሞክሩ።
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setSelectedFilter("ALL");
            }}
            className="mt-4"
          >
            ሁሉንም አሳይ
          </Button>
        </div>
      )}

      {/* Critical Reminders / Footer Notice */}
      <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <h2 className="text-lg md:text-xl font-bold">
            {data.footerNoticeTitle || "ወደ ባለሙያው ሲሄዱ እንዳይረሱ፦"}
          </h2>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {data.footerRules.map((rule, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-sm md:text-base text-foreground/90 font-medium bg-background/80 p-3.5 rounded-xl border border-amber-500/20 shadow-xs"
            >
              <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <span className="leading-snug">{rule}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
