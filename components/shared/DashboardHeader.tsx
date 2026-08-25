"use client";

import { signOut } from "next-auth/react";
import { LogOut, UserCircle, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
    shopName?: string | null;
  };
  locale: string;
}

export default function DashboardHeader({ user, locale }: DashboardHeaderProps) {
  const pathname = usePathname();
  
  // Basic check to see if we are in admin or shop route for the logo link
  const dashboardLink = user.role === "ADMIN" ? `/${locale}/admin` : `/${locale}/shop`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        
        {/* Left side - Logo & Branding */}
        <div className="flex items-center gap-6">
          <Link href={dashboardLink} className="flex items-center space-x-2 transition-transform hover:scale-105">
            <div className="bg-primary/10 p-2 rounded-xl">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <span className="hidden font-bold sm:inline-block text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              Update Portal
            </span>
          </Link>
        </div>

        {/* Right side - User Info & Actions */}
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="hidden md:flex items-center gap-3 mr-4 border-r pr-4 border-border/50">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold leading-none text-foreground">
                {user.shopName || user.name || "User"}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {user.role === "ADMIN" ? "Administrator" : "Print Shop"}
              </span>
            </div>
            <div className="bg-secondary/50 p-2 rounded-full border border-border/50">
              <UserCircle className="h-5 w-5 text-secondary-foreground" />
            </div>
          </div>
          
          <Button 
            variant="destructive" 
            size="sm" 
            className="flex items-center gap-2 shadow-sm transition-all hover:shadow-md hover:bg-destructive/90"
            onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline-block">ሎጋውት (Logout)</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
