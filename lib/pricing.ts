import prisma from "@/lib/prisma";

export interface PricingBreakdown {
  totalPaid: number;
  adminCommission: number;
  shopEarnings: number;
  serverFee: number;
  smsFee: number;
  shopExtraExpense: number;
  adminExtraExpense: number;
  freeServicesCount: number;
  discountAmount: number;
  breakdownList: {
    serviceType: string;
    price: number;
    adminCut: number;
    shopCut: number;
    isFree: boolean;
  }[];
}

const DEFAULT_SERVICE_PRICES: Record<string, { price: number; adminCut: number; shopCut: number }> = {
  NAME_CHANGE: { price: 200, adminCut: 100, shopCut: 80 },
  NATIONALITY: { price: 150, adminCut: 75, shopCut: 55 },
  GENDER: { price: 150, adminCut: 75, shopCut: 55 },
  DOB: { price: 200, adminCut: 100, shopCut: 80 },
  ADDRESS: { price: 150, adminCut: 75, shopCut: 55 },
  PHONE: { price: 100, adminCut: 50, shopCut: 30 },
  EMAIL: { price: 100, adminCut: 50, shopCut: 30 },
  PO_BOX: { price: 100, adminCut: 50, shopCut: 30 },
  PHOTO: { price: 250, adminCut: 100, shopCut: 130 },
  FIN_FAN: { price: 150, adminCut: 75, shopCut: 55 },
  FAIDA_PRINT_ONLY: { price: 150, adminCut: 50, shopCut: 80 },
  COURT_ORDER: { price: 300, adminCut: 150, shopCut: 130 },
};

export async function calculateOrderFinances(
  selectedServices: string[],
  orderType: "UPDATE_ONLY" | "FULL_SERVICE" = "FULL_SERVICE",
  providedTotalPaid?: number
): Promise<PricingBreakdown> {

  let serverFee = 10;
  let smsFee = 10;
  let shopExtraExpense = 0;
  let adminExtraExpense = 0;
  let isFourthFreeDiscount = true;

  const pricingsMap = new Map<string, { price: number; adminCut: number; shopCut: number }>();

  try {
    const config = await prisma.serviceConfig.findFirst({
      include: { services: true }
    });

    if (config) {
      serverFee = Number(config.serverFee || 10);
      smsFee = Number(config.smsFee || 10);
      shopExtraExpense = Number(config.shopExtraExpense || 0);
      adminExtraExpense = Number(config.adminExtraExpense || 0);
      isFourthFreeDiscount = config.isFourthFreeDiscount ?? true;

      config.services.forEach((s) => {
        if (s.isActive) {
          pricingsMap.set(s.serviceType, {
            price: Number(s.price),
            adminCut: Number(s.adminCommission),
            shopCut: Number(s.shopCut || 50),
          });
        }
      });
    }
  } catch (e) {
    console.error("Failed to load pricing config, using defaults:", e);
  }

  // Build service list with prices
  const items = selectedServices.map((srv) => {
    const p = pricingsMap.get(srv) || DEFAULT_SERVICE_PRICES[srv] || { price: 150, adminCut: 75, shopCut: 55 };
    return {
      serviceType: srv,
      price: p.price,
      adminCut: p.adminCut,
      shopCut: p.shopCut,
    };
  });

  // Sort by price descending so customer pays for the top 3 most expensive, 4th+ are 100% FREE!
  items.sort((a, b) => b.price - a.price);

  let calculatedTotal = 0;
  let calculatedAdminCut = 0;
  let calculatedShopCut = 0;
  let discountAmount = 0;
  let freeServicesCount = 0;

  const breakdownList = items.map((item, idx) => {
    // If 4th+ service rule is active and index >= 3, this service is FREE!
    const isFree = isFourthFreeDiscount && idx >= 3;
    if (isFree) {
      freeServicesCount += 1;
      discountAmount += item.price;
      return { ...item, isFree: true };
    } else {
      calculatedTotal += item.price;
      calculatedAdminCut += item.adminCut;
      calculatedShopCut += item.shopCut;
      return { ...item, isFree: false };
    }
  });

  // Include extra expenses
  calculatedAdminCut += adminExtraExpense;
  calculatedShopCut += shopExtraExpense;

  const finalTotalPaid = providedTotalPaid && providedTotalPaid > 0 ? providedTotalPaid : calculatedTotal;

  // Final distribution
  let adminCommission = calculatedAdminCut;
  let shopEarnings = 0;

  if (orderType === "FULL_SERVICE") {
    shopEarnings = Math.max(0, finalTotalPaid - adminCommission - serverFee - smsFee);
  } else {
    // UPDATE_ONLY: Admin cut + shop cut
    shopEarnings = Math.max(0, finalTotalPaid - adminCommission - serverFee - smsFee);
  }

  return {
    totalPaid: Number(finalTotalPaid.toFixed(2)),
    adminCommission: Number(adminCommission.toFixed(2)),
    shopEarnings: Number(shopEarnings.toFixed(2)),
    serverFee: Number(serverFee.toFixed(2)),
    smsFee: Number(smsFee.toFixed(2)),
    shopExtraExpense: Number(shopExtraExpense.toFixed(2)),
    adminExtraExpense: Number(adminExtraExpense.toFixed(2)),
    freeServicesCount,
    discountAmount: Number(discountAmount.toFixed(2)),
    breakdownList,
  };
}
