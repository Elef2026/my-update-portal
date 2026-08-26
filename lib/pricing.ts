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
  freeThreshold: string;
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
  let freeThreshold = "AFTER_3";
  let fullServicePrice = 350;
  let fullServiceAdminCut = 150;

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
      freeThreshold = config.freeThreshold || "AFTER_3";
      fullServicePrice = Number(config.fullServicePrice || 350);
      fullServiceAdminCut = Number(config.fullServiceAdminCut || 150);

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

  // Determine paid threshold count for update services
  let maxPaidItems = 999;
  if (isFourthFreeDiscount) {
    if (freeThreshold === "AFTER_1") maxPaidItems = 1;
    else if (freeThreshold === "AFTER_2") maxPaidItems = 2;
    else if (freeThreshold === "AFTER_3") maxPaidItems = 3;
    else if (freeThreshold === "AFTER_4") maxPaidItems = 4;
  }

  let calculatedTotal = 0;
  let calculatedAdminCut = 0;
  let calculatedShopCut = 0;
  let discountAmount = 0;
  let freeServicesCount = 0;
  const breakdownList: PricingBreakdown["breakdownList"] = [];

  // If FULL_SERVICE, include Base Print Fee
  if (orderType === "FULL_SERVICE") {
    const fullServiceShopCut = Math.max(0, fullServicePrice - fullServiceAdminCut);
    calculatedTotal += fullServicePrice;
    calculatedAdminCut += fullServiceAdminCut;
    calculatedShopCut += fullServiceShopCut;

    breakdownList.push({
      serviceType: "FAIDA_PRINT_SERVICE",
      price: fullServicePrice,
      adminCut: fullServiceAdminCut,
      shopCut: fullServiceShopCut,
      isFree: false,
    });
  }

  // Filter out FAIDA_PRINT_ONLY from update services if it's already full service to avoid duplicate print charge
  const updateServices = (orderType === "FULL_SERVICE")
    ? selectedServices.filter((s) => s !== "FAIDA_PRINT_ONLY")
    : selectedServices;

  // Build update service list with prices
  const items = updateServices.map((srv) => {
    const p = pricingsMap.get(srv) || DEFAULT_SERVICE_PRICES[srv] || { price: 150, adminCut: 75, shopCut: 55 };
    return {
      serviceType: srv,
      price: p.price,
      adminCut: p.adminCut,
      shopCut: p.shopCut,
    };
  });

  // Sort update services by price descending so customer pays for the top X most expensive, remaining are FREE!
  items.sort((a, b) => b.price - a.price);

  items.forEach((item, idx) => {
    const isFree = idx >= maxPaidItems;
    if (isFree) {
      freeServicesCount += 1;
      discountAmount += item.price;
      breakdownList.push({ ...item, isFree: true });
    } else {
      calculatedTotal += item.price;
      calculatedAdminCut += item.adminCut;
      calculatedShopCut += item.shopCut;
      breakdownList.push({ ...item, isFree: false });
    }
  });

  // Include extra expenses
  calculatedAdminCut += adminExtraExpense;
  calculatedShopCut += shopExtraExpense;

  const finalTotalPaid = providedTotalPaid && providedTotalPaid > 0 ? providedTotalPaid : calculatedTotal;

  // Final distribution: Shop earnings = Total - Admin Commission - Server Fee - SMS Fee
  let adminCommission = calculatedAdminCut;
  let shopEarnings = Math.max(0, finalTotalPaid - adminCommission - serverFee - smsFee);

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
    freeThreshold,
    breakdownList,
  };
}
