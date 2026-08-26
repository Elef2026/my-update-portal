"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Store, Mail, Phone, Lock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

export default function RegisterPage({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setError("የይለፍ ቃሎች አይመሳሰሉም! (Passwords do not match)");
      return;
    }

    if (password.length < 6) {
      setError("የይለፍ ቃል ቢያንስ 6 ፊደላት ወይም ቁጥሮች መሆን አለበት (Password must be at least 6 characters)");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName,
          email,
          phone,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg("ማተሚያ ቤቱ በተሳካ ሁኔታ ተመዝግቧል! አሁን ወደ መግቢያ ገጽ እየተዛወሩ ነው...");
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 1500);
      } else {
        setError(data.error || "የምዝገባ ስህተት ተፈጥሯል (Registration failed)");
      }
    } catch (err) {
      console.error(err);
      setError("የኔትወርክ ስህተት ተፈጥሯል (Network error)");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-lg bg-card p-8 sm:p-10 rounded-2xl shadow-xl border space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary mb-1">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            የማተሚያ ቤት ምዝገባ (Shop Registration)
          </h1>
          <p className="text-sm text-muted-foreground">
            አዲስ ማተሚያ ቤትዎን ይመዝግቡና ከሲስተሙ ጋር ስራ ይጀምሩ
          </p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="bg-destructive/15 text-destructive p-4 rounded-xl text-sm flex items-start gap-2.5 border border-destructive/20 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/15 text-emerald-600 p-4 rounded-xl text-sm flex items-start gap-2.5 border border-emerald-500/20 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Store className="w-4 h-4 text-primary" /> የማተሚያ ቤቱ ስም (Print Shop Name) *
            </label>
            <Input 
              required 
              value={shopName} 
              onChange={e => setShopName(e.target.value)} 
              placeholder="ምሳሌ፡ አዲስ ህትመት ቤት (Addis Print)" 
              className="h-11 rounded-xl" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-blue-500" /> የኢሜይል አድራሻ (Email) *
              </label>
              <Input 
                required 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="shop@example.com" 
                className="h-11 rounded-xl font-mono text-xs" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-500" /> ስልክ ቁጥር (Phone Number) *
              </label>
              <Input 
                required 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="0911223344" 
                className="h-11 rounded-xl font-mono text-xs" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-500" /> የይለፍ ቃል (Password) *
              </label>
              <Input 
                required 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" 
                minLength={6} 
                className="h-11 rounded-xl" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-500" /> ድገሙት (Confirm Password) *
              </label>
              <Input 
                required 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="••••••••" 
                minLength={6} 
                className="h-11 rounded-xl" 
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full h-12 mt-6 rounded-xl font-bold text-base bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-lg shadow-primary/20"
          >
            {isSubmitting ? "በመመዝገብ ላይ..." : "ማተሚያ ቤቱን መዝግብ (Register Print Shop)"}
          </Button>

        </form>

        {/* Footer Links */}
        <div className="pt-4 border-t text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            አስቀድመው ተመዝግበዋል?{" "}
            <Link 
              href={`/${locale}/login`} 
              className="text-primary font-bold hover:underline inline-flex items-center gap-1"
            >
              ይግቡ (Login) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
