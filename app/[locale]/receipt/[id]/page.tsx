import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CheckCircle, Printer, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import PrintButton from "./PrintButton";

interface ReceiptPageProps {
  params: {
    locale: string;
    id: string;
  };
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { id } = params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      shop: { select: { shopName: true, phone: true, email: true } },
    },
  });

  if (!order) {
    notFound();
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString("am-ET", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 flex flex-col items-center justify-center font-sans print:p-0 print:bg-white print:text-black">
      
      {/* Top Action Bar (Hidden when printing) */}
      <div className="max-w-md w-full mb-4 flex items-center justify-between print:hidden">
        <Link 
          href="/am/shop/new-order" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground bg-card px-3 py-2 rounded-xl border shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ወደ አዲስ ስራ መመዝገቢያ (New Order)</span>
        </Link>

        <PrintButton />
      </div>

      {/* Official Receipt Card */}
      <div className="bg-card text-card-foreground border-2 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 relative overflow-hidden print:border-none print:shadow-none print:p-4 print:max-w-full">
        
        {/* Header Ribbon / Seal */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <span className="text-[10px] font-black tracking-widest text-primary uppercase block">የፋይዳ ዲጂታል ማደሻ ፖርታል</span>
            <h1 className="text-xl font-black text-foreground">ኦፊሴላዊ የክፍያ ደረሰኝ</h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">ORDER #{order.id.substring(0, 8).toUpperCase()}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle className="w-7 h-7 text-emerald-500" />
          </div>
        </div>

        {/* Verification Status */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">ክፍያው በቻፓ ተረጋግጧል (Paid & Verified)</p>
            <p className="text-[10px] text-emerald-600/80 font-mono">ስርዓት፡ {order.paymentMethod === "CHAPA" ? "Chapa Online Gateway" : "Cash / Direct"}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-1.5 border-b border-dashed">
            <span className="text-muted-foreground">የደንበኛ ስም (Customer):</span>
            <span className="font-bold text-foreground">{order.customerName}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-dashed">
            <span className="text-muted-foreground">ስልክ ቁጥር (Phone):</span>
            <span className="font-mono font-bold text-foreground">{order.customerPhone}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-dashed">
            <span className="text-muted-foreground">ቀን እና ሰዓት (Date):</span>
            <span className="font-mono text-muted-foreground">{formattedDate}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-dashed">
            <span className="text-muted-foreground">የስራ አይነት (Service Type):</span>
            <span className="font-semibold">{order.orderType === "FULL_SERVICE" ? "አብዴት + ፕሪንት (Full Service)" : "አብዴት ብቻ (Update Only)"}</span>
          </div>
          {order.shop && (
            <div className="flex justify-between py-1.5 border-b border-dashed">
              <span className="text-muted-foreground">ያስተናገደው ህትመት ቤት (Shop):</span>
              <span className="font-semibold text-foreground">{order.shop.shopName || "Print Shop"}</span>
            </div>
          )}
        </div>

        {/* Itemized Services Breakdown */}
        <div className="bg-muted/40 p-4 rounded-2xl border space-y-2 text-xs">
          <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-2">የተሰሩ አገልግሎቶች ዝርዝር</p>
          {Array.isArray(order.selectedServices) && order.selectedServices.length > 0 ? (
            <ul className="space-y-1 text-muted-foreground font-mono">
              {order.selectedServices.map((srv: string, idx: number) => (
                <li key={idx} className="flex justify-between">
                  <span>• {srv}</span>
                  <span className="text-emerald-600 font-bold">ተካቷል</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground italic text-[11px]">መደበኛ የሰነድ ማደስ</p>
          )}
        </div>

        {/* Total Price Section */}
        <div className="p-4 bg-primary/10 border-2 border-primary/30 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-primary tracking-wider block">ጠቅላላ የተከፈለ ዋጋ</span>
            <span className="text-xs text-muted-foreground">Total Paid Amount</span>
          </div>
          <p className="text-2xl font-black text-primary font-mono">{Number(order.totalPaid).toFixed(2)} ETB</p>
        </div>

        {/* Footer Guarantee */}
        <div className="text-center pt-2 border-t text-[10px] text-muted-foreground space-y-1">
          <p className="font-bold text-foreground">ስለተጠቀሙ እናመሰግናለን!</p>
          <p>ይህ ደረሰኝ በሲስተሙ በራስ-ሰር የተፈጠረ ህጋዊ የክፍያ ማረጋገጫ ነው።</p>
        </div>

      </div>
    </div>
  );
}
