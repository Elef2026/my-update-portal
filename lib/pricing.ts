import prisma from "@/lib/prisma";

export interface PricingBreakdown {
  totalPaid: number;
  adminCommission: number;
  shopEarnings: number;
  serverFee: number;
  smsFee: number;
}

// Default prices per service if DB configuration is not present
const DEFAULT_SERVICE_PRICES: Record<string, { price: number; adminCut: number }> = {
  NAME_CHANGE: { price: 200, adminCut: 100 },
  NATIONALITY: { price: 150, adminCut: 75 },
  GENDER: { price: 150, adminCut: 75 },
  DOB: { price: 200, adminCut: 100 },
  ADDRESS: { price: 150, adminCut: 75 },
  PHONE: { price: 100, adminCut: 50 },
  EMAIL: { price: 100, adminCut: 50 },
  PO_BOX: { price: 100, adminCut: 50 },
  PHOTO: { price: 250, adminCut: 100 },
  FIN_FAN: { price: 150, adminCut: 75 },
  FAIDA_PRINT_ONLY: { price: 150, adminCut: 50 },
  COURT_ORDER: { price: 300, adminCut: 150 },
};

export async function calculateOrderFinances(
  selectedServices: string[],
  orderType: "UPDATE_ONLY" | "FULL_SERVICE" = "FULL_SERVICE",
  providedTotalPaid?: number
): Promise<PricingBreakdown> {
  const serverFee = 10;
  const smsFee = 10;

  // Try to load admin service config if available
  let calculatedTotal = 0;
  let calculatedAdminCut = 0;

  try {
    const dbPricings = await prisma.servicePricing.findMany({
      where: { isActive: true },
    });

    if (dbPricings.length > 0) {
      const priceMap = new Map(dbPricings.map((p) => [p.serviceType as string, p]));

      for (const srv of selectedServices) {
        const p = priceMap.get(srv);
        if (p) {
          calculatedTotal += Number(p.price);
          calculatedAdminCut += Number(p.adminCommission);
        } else {
          const fallback = DEFAULT_SERVICE_PRICES[srv] || { price: 150, adminCut: 75 };
          calculatedTotal += fallback.price;
          calculatedAdminCut += fallback.adminCut;
        }
      }
    } else {
      // Use default pricing table
      for (const srv of selectedServices) {
        const fallback = DEFAULT_SERVICE_PRICES[srv] || { price: 150, adminCut: 75 };
        calculatedTotal += fallback.price;
        calculatedAdminCut += fallback.adminCut;
      }
    }
  } catch (error) {
    console.error("Error fetching service pricings, using fallback:", error);
    for (const srv of selectedServices) {
      const fallback = DEFAULT_SERVICE_PRICES[srv] || { price: 150, adminCut: 75 };
      calculatedTotal += fallback.price;
      calculatedAdminCut += fallback.adminCut;
    }
  }

  // If user provided a explicit total (e.g. from shop form), use provided total if greater than 0
  const finalTotalPaid = providedTotalPaid && providedTotalPaid > 0 ? providedTotalPaid : calculatedTotal;

  // Adjust admin commission & shop earnings according to orderType
  let adminCommission = calculatedAdminCut;
  if (adminCommission > finalTotalPaid) {
    adminCommission = Math.round(finalTotalPaid * 0.5);
  }

  // If UPDATE_ONLY, admin does the full work; shop earnings are 0 or nominal if shop submitted
  let shopEarnings = 0;
  if (orderType === "FULL_SERVICE") {
    // Print shop gets remaining earnings after admin cut and fees
    shopEarnings = finalTotalPaid - adminCommission - serverFee - smsFee;
    if (shopEarnings < 0) shopEarnings = Math.max(0, finalTotalPaid - adminCommission);
  } else {
    // UPDATE_ONLY: Admin performs update. If shop submitted, give shop a 20% submission fee or balance
    shopEarnings = Math.max(0, finalTotalPaid - adminCommission - serverFee - smsFee);
  }

  return {
    totalPaid: Number(finalTotalPaid.toFixed(2)),
    adminCommission: Number(adminCommission.toFixed(2)),
    shopEarnings: Number(shopEarnings.toFixed(2)),
    serverFee: Number(serverFee.toFixed(2)),
    smsFee: Number(smsFee.toFixed(2)),
  };
}
