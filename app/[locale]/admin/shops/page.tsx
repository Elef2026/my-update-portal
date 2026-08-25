"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminShopsPage() {
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName, email, phone, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Shop created successfully!" });
        setShopName("");
        setEmail("");
        setPhone("");
        setPassword("");
      } else {
        setMessage({ type: "error", text: data.error || "Failed to create shop" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">አዲስ ህትመት ቤት መመዝገቢያ (Register Print Shop)</h1>

      <div className="max-w-md bg-card border rounded-lg p-6 shadow-sm">
        {message && (
          <div className={`p-3 mb-4 rounded-md text-sm ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-destructive/15 text-destructive"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleCreateShop} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">የህትመት ቤቱ ስም (Shop Name)</label>
            <Input 
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="አዲስ ህትመት"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ኢሜል (Email)</label>
            <Input 
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="shop@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ስልክ ቁጥር (Phone)</label>
            <Input 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0911223344"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">የይለፍ ቃል (Password)</label>
            <Input 
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "በመመዝገብ ላይ..." : "ህትመት ቤት መዝግብ (Register Shop)"}
          </Button>
        </form>
      </div>
    </div>
  );
}
