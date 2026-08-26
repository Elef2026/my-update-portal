"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrintButton() {
  return (
    <Button 
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-md hover:bg-primary/90 transition-all hover:scale-105"
    >
      <Printer className="w-4 h-4" />
      <span>ደረሰኝ አትም (Print / Save PDF)</span>
    </Button>
  );
}
