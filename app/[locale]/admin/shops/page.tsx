"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Plus, X, Store, Mail, Phone, Clock } from "lucide-react";

interface Shop {
  id: string;
  shopName: string;
  email: string;
  phone: string;
  createdAt: string;
}

export default function AdminShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  
  // Form State
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shops");
      if (res.ok) {
        const data = await res.json();
        setShops(data);
      }
    } catch (error) {
      console.error("Failed to fetch shops", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const openModal = (shop: Shop | null = null) => {
    setMessage(null);
    if (shop) {
      setEditingShop(shop);
      setShopName(shop.shopName);
      setEmail(shop.email);
      setPhone(shop.phone);
      setPassword(""); // Don't populate password
    } else {
      setEditingShop(null);
      setShopName("");
      setEmail("");
      setPhone("");
      setPassword("");
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingShop(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);

    const url = editingShop ? `/api/admin/shops/${editingShop.id}` : "/api/admin/shops";
    const method = editingShop ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName, email, phone, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: editingShop ? "Shop updated successfully!" : "Shop created successfully!" });
        fetchShops(); // Refresh list
        setTimeout(() => closeModal(), 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save shop" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shop? This cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/admin/shops/${id}`, { method: "DELETE" });
      if (res.ok) {
        setShops(shops.filter(s => s.id !== id));
      } else {
        alert("Failed to delete shop.");
      }
    } catch (error) {
      alert("Error deleting shop.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">
            ህትመት ቤቶች (Print Shops)
          </h1>
          <p className="text-muted-foreground mt-1">የህትመት ቤቶችን አካውንት ይክፈቱ፣ ያስተካክሉ ወይም ያጥፉ።</p>
        </div>
        <Button onClick={() => openModal(null)} className="flex items-center gap-2 rounded-full px-6 shadow-md hover:shadow-lg transition-all">
          <Plus className="w-5 h-5" />
          <span>አዲስ ህትመት ቤት (Add Shop)</span>
        </Button>
      </div>

      {/* Shops Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
          <Store className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">ምንም ህትመት ቤት አልተመዘገበም</h3>
          <p className="text-sm text-muted-foreground/70">የ 'አዲስ ህትመት ቤት' ቁልፍን በመጫን ይመዝገቡ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <div key={shop.id} className="group bg-card rounded-2xl border p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:border-primary/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="bg-primary/10 p-3 rounded-xl text-primary">
                  <Store className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(shop)} className="p-2 bg-secondary rounded-lg text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(shop.id)} className="p-2 bg-destructive/10 rounded-lg text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-4">{shop.shopName}</h3>
              
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-primary/70" />
                  <span>{shop.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-primary/70" />
                  <span dir="ltr">{shop.phone || "N/A"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-primary/70" />
                  <span>{new Date(shop.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Glassmorphism Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b bg-muted/30">
              <h2 className="text-xl font-bold">
                {editingShop ? "ህትመት ቤትን አስተካክል (Edit Shop)" : "አዲስ ህትመት ቤት (New Shop)"}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="p-6">
              {message && (
                <div className={`p-4 mb-6 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">የህትመት ቤቱ ስም (Shop Name)</label>
                  <Input required value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="አዲስ ህትመት" className="rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">ኢሜል (Email)</label>
                  <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="shop@example.com" className="rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">ስልክ ቁጥር (Phone)</label>
                  <Input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0911223344" className="rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">
                    የይለፍ ቃል (Password) {editingShop && <span className="text-xs font-normal text-muted-foreground">(ለመቀየር ብቻ ያስገቡ)</span>}
                  </label>
                  <Input 
                    required={!editingShop}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="rounded-xl"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="outline" onClick={closeModal} className="w-full rounded-xl">
                    ሰርዝ (Cancel)
                  </Button>
                  <Button type="submit" className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md" disabled={actionLoading}>
                    {actionLoading ? "በመመዝገብ ላይ..." : "አስቀምጥ (Save)"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
