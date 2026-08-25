"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname(); // e.g., "/am/shop" or "/en/login"

  const switchLanguage = (newLocale: string) => {
    if (!pathname) return;
    
    // Split the pathname by '/' and replace the locale part
    const pathParts = pathname.split("/");
    if (pathParts.length > 1 && (pathParts[1] === "en" || pathParts[1] === "am")) {
      pathParts[1] = newLocale;
    } else {
      pathParts.splice(1, 0, newLocale);
    }
    
    const newPath = pathParts.join("/");
    router.push(newPath);
  };

  const currentLocale = pathname?.split("/")[1] || "en";

  return (
    <div className="flex gap-2">
      <Button 
        variant={currentLocale === "am" ? "default" : "outline"} 
        size="sm"
        onClick={() => switchLanguage("am")}
      >
        አማ
      </Button>
      <Button 
        variant={currentLocale === "en" ? "default" : "outline"} 
        size="sm"
        onClick={() => switchLanguage("en")}
      >
        EN
      </Button>
    </div>
  );
}
