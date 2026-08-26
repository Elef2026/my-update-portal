"use client";

import { useState } from "react";
import { 
  X, Download, Eye, Edit3, Save, XCircle, CheckCircle, Clock, 
  User, Store, FileText, Phone, AlertCircle, RefreshCw, Paperclip
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateOrderDetails, startProcessingTask } from "@/app/actions/admin-tasks";
import { rejectTaskWithReason } from "@/app/actions/settlement";

export interface OrderDetailsModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated?: () => void;
}

const SERVICE_LABELS: Record<string, string> = {
  NAME_CHANGE: "የስም መለወጥ (Name Change)",
  NATIONALITY: "ዜግነት (Nationality)",
  GENDER: "ጾታ (Gender)",
  DOB: "የትውልድ ዘመን (Date of Birth)",
  ADDRESS: "አድራሻ (Address)",
  PHONE: "ስልክ (Phone)",
  EMAIL: "ኢሜይል (Email)",
  PO_BOX: "ፖስታ ሣጥን (P.O. Box)",
  PHOTO: "ፎቶ (Photo)",
  FIN_FAN: "FIN / FAN",
  FAIDA_PRINT_ONLY: "ፋይዳ ፕሪንት ብቻ (Faida Print Only)",
  COURT_ORDER: "የፍርድ ቤት ውሳኔ (Court Order)",
};

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  PENDING_PAYMENT: { label: "ክፍያ ይጠበቃል", bg: "bg-yellow-500/20", text: "text-yellow-600" },
  PAID: { label: "ተከፍሏል", bg: "bg-blue-500/20", text: "text-blue-600" },
  ADMIN_PROCESSING: { label: "በሂደት ላይ", bg: "bg-amber-500/20", text: "text-amber-600" },
  READY_FOR_PRINT_SHOP: { label: "ለህትመት የተላከ", bg: "bg-purple-500/20", text: "text-purple-600" },
  PRINTED_AWAITING_SETTLEMENT: { label: "የታተመ (ሂሳብ ያልወረደ)", bg: "bg-indigo-500/20", text: "text-indigo-600" },
  SETTLED_ARCHIVED: { label: "የተጠናቀቀ (Archived)", bg: "bg-emerald-500/20", text: "text-emerald-600" },
  REJECTED: { label: "ውድቅ የተደረገ", bg: "bg-red-500/20", text: "text-red-600" },
  REFUNDED: { label: "ተመላሽ የተደረገ", bg: "bg-gray-500/20", text: "text-gray-600" },
};

export default function OrderDetailsModal({ order, isOpen, onClose, onOrderUpdated }: OrderDetailsModalProps) {
  if (!isOpen || !order) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Edit state
  const [customerName, setCustomerName] = useState(order.customerName || "");
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone || "");
  const [customerAttachmentUrl, setCustomerAttachmentUrl] = useState(order.customerAttachmentUrl || "");
  
  // Format oldData and newData JSONs
  const [oldDataText, setOldDataText] = useState(
    order.oldData ? JSON.stringify(order.oldData, null, 2) : "{}"
  );
  const [newDataText, setNewDataText] = useState(
    order.newData ? JSON.stringify(order.newData, null, 2) : "{}"
  );

  const statusBadge = STATUS_BADGES[order.status] || { label: order.status, bg: "bg-gray-200", text: "text-gray-800" };

  // Handle Save Edit
  const handleSaveEdit = async () => {
    setIsSubmitting(true);
    try {
      let parsedOldData = order.oldData;
      let parsedNewData = order.newData;
      try { parsedOldData = JSON.parse(oldDataText); } catch (e) { alert("ቀድሞ የነበረ መረጃ JSON ቅርጸት ተሳስቷል!"); setIsSubmitting(false); return; }
      try { parsedNewData = JSON.parse(newDataText); } catch (e) { alert("አዲስ የሚቀየር መረጃ JSON ቅርጸት ተሳስቷል!"); setIsSubmitting(false); return; }

      const res = await updateOrderDetails(order.id, {
        customerName,
        customerPhone,
        customerAttachmentUrl,
        oldData: parsedOldData,
        newData: parsedNewData,
      });

      if (res.success) {
        alert("የደንበኛው መረጃ በሚገባ ተስተካክሏል! (Order details updated successfully)");
        setIsEditing(false);
        if (onOrderUpdated) onOrderUpdated();
      } else {
        alert(res.error || "ስህተት ተፈጥሯል");
      }
    } catch (err) {
      console.error(err);
      alert("መረጃውን ማስተካከል አልተቻለም");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reject
  const handleRejectOrder = async () => {
    if (!rejectionReason.trim()) {
      alert("እባክዎ የውድቅ ማድረጊያ ምክንያት ያስገቡ (Rejection reason is required)");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await rejectTaskWithReason(order.id, rejectionReason);
      if (res.success) {
        alert("ትዕዛዙ ውድቅ ተደርጓል (Order rejected)");
        setIsRejecting(false);
        onClose();
        if (onOrderUpdated) onOrderUpdated();
      } else {
        alert(res.error || "ስህተት ተፈጥሯል");
      }
    } catch (err) {
      console.error(err);
      alert("ውድቅ ማድረግ አልተቻለም");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [adminAttachmentUrl, setAdminAttachmentUrl] = useState(order.adminAttachmentUrl || "");

  // Handle Finish / Send to Print
  const handleFinishTask = async () => {
    const isUpdateOnly = order.orderType === "UPDATE_ONLY";
    const promptMsg = isUpdateOnly 
      ? "የአብዴት ስራውን አጠናቀው ወደ ተጠናቀቁ ማህደር ለማዛወር እርግጠኛ ነዎት?" 
      : "ስራውን አጠናቀው ለማተሚያ ቤት ፕሪንት ማድረጊያ ለመላክ እርግጠኛ ነዎት?";
      
    if (!confirm(promptMsg)) return;
    setIsSubmitting(true);
    try {
      const { finishTask } = await import("@/app/actions/admin-tasks");
      const res = await finishTask(order.id, adminAttachmentUrl);
      if (res.success) {
        alert(res.message || "ስራው በስኬት ተጠናቋል!");
        onClose();
        if (onOrderUpdated) onOrderUpdated();
      } else {
        alert(res.error || "ስህተት ተፈጥሯል");
      }
    } catch (err) {
      console.error(err);
      alert("ስራውን ማጠናቀቅ አልተቻለም");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Start Processing
  const handleStartProcessing = async () => {
    if (!confirm("ይህንን ስራ መጀመርዎን እርግጠኛ ነዎት?")) return;
    setIsSubmitting(true);
    try {
      const res = await startProcessingTask(order.id);
      if (res.success) {
        alert("ስራው ተጀምሯል (Processing started)");
        onClose();
        if (onOrderUpdated) onOrderUpdated();
      } else {
        alert(res.error || "ስህተት ተፈጥሯል");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to render JSON objects neatly
  const renderDataView = (dataObj: any) => {
    if (!dataObj || typeof dataObj !== "object" || Object.keys(dataObj).length === 0) {
      return <p className="text-xs text-muted-foreground italic">ምንም መረጃ የለም (No data)</p>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {Object.entries(dataObj).map(([key, val]) => (
          <div key={key} className="bg-background/80 p-2 rounded border">
            <span className="font-semibold text-foreground uppercase block text-[10px] text-muted-foreground">{key}</span>
            <span className="font-mono text-sm break-all">{String(val || "-")}</span>
          </div>
        ))}
      </div>
    );
  };

  // Files list
  const allFiles: { url: string; label: string; type?: string }[] = [];
  if (order.customerAttachmentUrl) {
    allFiles.push({ url: order.customerAttachmentUrl, label: "የደንበኛ ሰነድ (Primary Attachment)" });
  }
  if (order.adminAttachmentUrl) {
    allFiles.push({ url: order.adminAttachmentUrl, label: "የአድሚን የተጠናቀቀ ሰነድ (Admin Uploaded PDF)" });
  }
  if (Array.isArray(order.files)) {
    order.files.forEach((f: any, idx: number) => {
      allFiles.push({ url: f.fileUrl, label: `ፋይል ${idx + 1}: ${f.fileType || "የተያያዘ ሰነድ"}`, type: f.fileType });
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card text-card-foreground border rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                የስራ ዝርዝር መረጃ (Order Details)
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                  {statusBadge.label}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">ID: {order.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/40 p-4 rounded-lg border">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <User className="w-3.5 h-3.5" /> ደንበኛ (Customer)
              </span>
              {isEditing ? (
                <Input 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                  className="h-8 text-xs font-semibold"
                />
              ) : (
                <p className="font-semibold text-base">{order.customerName}</p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Phone className="w-3.5 h-3.5" /> ስልክ (Phone)
              </span>
              {isEditing ? (
                <Input 
                  value={customerPhone} 
                  onChange={(e) => setCustomerPhone(e.target.value)} 
                  className="h-8 text-xs font-mono"
                />
              ) : (
                <p className="font-mono text-sm">{order.customerPhone}</p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Store className="w-3.5 h-3.5" /> ማተሚያ ቤት (Shop)
              </span>
              <p className="font-medium text-sm">{order.shop?.shopName || order.assignedShop?.shopName || "አልተጠቀሰም (N/A)"}</p>
              {(order.shop?.phone || order.assignedShop?.phone) && (
                <p className="text-xs text-muted-foreground font-mono">{order.shop?.phone || order.assignedShop?.phone}</p>
              )}
            </div>
          </div>

          {/* Service & Payment Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card p-4 rounded-lg border space-y-2">
              <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">የተመረጡ አገልግሎቶች (Services)</h3>
              <div className="flex flex-wrap gap-1.5">
                {order.selectedServices && order.selectedServices.length > 0 ? (
                  order.selectedServices.map((srv: string) => (
                    <span key={srv} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md border border-primary/20">
                      {SERVICE_LABELS[srv] || srv}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">አልተገለጸም</span>
                )}
              </div>
            </div>

            <div className="bg-card p-4 rounded-lg border space-y-2">
              <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">የክፍያ እና የገንዘብ ክፍፍል (Financial Breakdown)</h3>
              <div className="text-xs space-y-1.5">
                <p><span className="text-muted-foreground">የስራ አይነት:</span> <strong className="font-semibold">{order.orderType === "UPDATE_ONLY" ? "አብዴት ብቻ" : "አብዴት እና ፕሪንት"}</strong></p>
                <p><span className="text-muted-foreground">የክፍያ መንገድ:</span> <strong className="font-semibold">{order.paymentMethod === "CHAPA" ? "በቻፓ (Online Chapa)" : "ጥሬ ገንዘብ (Cash to Shop)"}</strong></p>
                <div className="pt-1.5 border-t space-y-1">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">ጠቅላላ የደንበኛ ክፍያ:</span> 
                    <strong className="text-emerald-600 font-bold">{Number(order.totalPaid || 0).toFixed(2)} ETB</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">የአድሚን ድርሻ (Admin Cut):</span> 
                    <strong className="text-blue-600 font-semibold">{Number(order.adminCommission || 0).toFixed(2)} ETB</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">የማተሚያ ቤት ድርሻ (Shop Earnings):</span> 
                    <strong className="text-indigo-600 font-semibold">{Number(order.shopEarnings || 0).toFixed(2)} ETB</strong>
                  </p>
                  <p className="flex justify-between text-[11px] text-muted-foreground">
                    <span>የሲስተም እና SMS አገልግሎት ክፍያ:</span> 
                    <span>{(Number(order.serverFee || 10) + Number(order.smsFee || 10)).toFixed(2)} ETB</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rejection Reason if already rejected */}
          {order.rejectionReason && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> የውድቅ ማድረጊያ ምክንያት (Rejection Reason):
              </p>
              <p className="text-red-700 dark:text-red-400 pl-5 font-medium">{order.rejectionReason}</p>
            </div>
          )}

          {/* Data Comparison: Old vs New */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Old Data */}
            <div className="bg-muted/30 p-4 rounded-lg border space-y-2">
              <h3 className="font-semibold text-amber-600 flex items-center justify-between text-xs">
                <span>ቀድሞ የነበረ መረጃ (Old Data)</span>
              </h3>
              {isEditing ? (
                <textarea 
                  value={oldDataText} 
                  onChange={(e) => setOldDataText(e.target.value)}
                  className="w-full h-32 p-2 text-xs font-mono bg-background rounded border"
                  placeholder='{"name": "..."}'
                />
              ) : (
                renderDataView(order.oldData)
              )}
            </div>

            {/* New Data */}
            <div className="bg-muted/30 p-4 rounded-lg border space-y-2">
              <h3 className="font-semibold text-emerald-600 flex items-center justify-between text-xs">
                <span>አዲስ የሚቀየር መረጃ (New Data)</span>
              </h3>
              {isEditing ? (
                <textarea 
                  value={newDataText} 
                  onChange={(e) => setNewDataText(e.target.value)}
                  className="w-full h-32 p-2 text-xs font-mono bg-background rounded border"
                  placeholder='{"name": "..."}'
                />
              ) : (
                renderDataView(order.newData)
              )}
            </div>
          </div>

          {/* Attachments Section (የተያያዙ ሰነዶች እና ማውረጃዎች) */}
          <div className="bg-card p-4 rounded-lg border space-y-3">
            <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-primary" /> 
              የተያያዙ ፋይሎች እና ሰነዶች (Submitted Attachments & Documents)
            </h3>

            {isEditing && (
              <div className="space-y-1 bg-muted/50 p-3 rounded border mb-3">
                <label className="text-xs font-medium text-foreground">የደንበኛ ሰነድ ሊንክ/URL ማስተካከያ (Customer Attachment URL)</label>
                <Input 
                  value={customerAttachmentUrl} 
                  onChange={(e) => setCustomerAttachmentUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-8 text-xs font-mono"
                />
              </div>
            )}

            {allFiles.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-3 bg-muted/20 rounded text-center">
                ምንም የተያያዘ ፋይል የለም (No file attachments uploaded)
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allFiles.map((file, idx) => {
                  const isImage = file.url.match(/\.(jpeg|jpg|png|gif|webp)$/i);
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/40 border rounded-lg hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="p-2 bg-background rounded border shrink-0">
                          {isImage ? <Eye className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-amber-500" />}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold truncate">{file.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate font-mono">{file.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-2.5 py-1.5 rounded font-medium transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>አውርድ/ማየት</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rejection Form Input if user clicked Reject */}
          {isRejecting && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg space-y-3 animate-in fade-in">
              <h3 className="font-semibold text-destructive text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> 
                ትዕዛዝ ውድቅ ማድረጊያ (Order Rejection Form)
              </h3>
              <Input 
                placeholder="ውድቅ የተደረገበትን ምክንያት እዚህ ይጻፉ (ለምሳሌ: የተያያዘው ፋይል አይነበብም)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="text-xs bg-background"
              />
              <div className="flex justify-end gap-2">
                <Button 
                  size="sm" 
                  variant="destructive"
                  disabled={isSubmitting}
                  onClick={handleRejectOrder}
                >
                  {isSubmitting ? "በማስመዝገብ ላይ..." : "ውድቅ ማድረጉን አረጋግጥ (Confirm Reject)"}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsRejecting(false)}
                >
                  ተመለስ (Cancel)
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer / Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t bg-muted/20">
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button 
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs"
                  disabled={isSubmitting}
                  onClick={handleSaveEdit}
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? "በማስቀመጥ ላይ..." : "መረጃ አፕዴት አድርግ (Save Update)"}</span>
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  ሰርዝ (Cancel)
                </Button>
              </>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                className="flex items-center gap-1.5 text-xs"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-4 h-4 text-blue-500" />
                <span>መረጃ አሻሽል/አስተካክል (Edit Info)</span>
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {(order.status === "PAID" || order.status === "PENDING_PAYMENT") && (
              <Button 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 text-xs"
                disabled={isSubmitting}
                onClick={handleStartProcessing}
              >
                <CheckCircle className="w-4 h-4" />
                <span>ስራ ጀምር (Start Working)</span>
              </Button>
            )}

            {order.status === "ADMIN_PROCESSING" && (
              <Button 
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs font-semibold"
                disabled={isSubmitting}
                onClick={handleFinishTask}
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {order.orderType === "UPDATE_ONLY" 
                    ? "ስራውን አጠናቅቅ (Complete Update Only)" 
                    : "ለማተሚያ ቤት ላክ (Send to Print Shop)"}
                </span>
              </Button>
            )}

            {!isRejecting && order.status !== "REJECTED" && order.status !== "SETTLED_ARCHIVED" && (
              <Button 
                size="sm" 
                variant="destructive"
                className="flex items-center gap-1 text-xs"
                onClick={() => setIsRejecting(true)}
              >
                <XCircle className="w-4 h-4" />
                <span>ውድቅ አድርግ (Reject)</span>
              </Button>
            )}

            <Button size="sm" variant="ghost" onClick={onClose}>
              ዝጋ (Close)
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
