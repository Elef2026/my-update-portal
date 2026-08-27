const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("=========================================");
  console.log("  STARTING DATABASE & DATA FULL RESET   ");
  console.log("=========================================\n");

  try {
    // 1. Delete dependent order files
    const deletedFiles = await prisma.orderFile.deleteMany({});
    console.log(`[✓] Deleted ${deletedFiles.count} Order Files.`);

    // 2. Delete transactions
    const deletedTx = await prisma.transaction.deleteMany({});
    console.log(`[✓] Deleted ${deletedTx.count} Transactions.`);

    // 3. Delete refund requests
    const deletedRefunds = await prisma.refundRequest.deleteMany({});
    console.log(`[✓] Deleted ${deletedRefunds.count} Refund Requests.`);

    // 4. Delete orders
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`[✓] Deleted ${deletedOrders.count} Orders.`);

    // 5. Delete weekly settlements
    const deletedSettlements = await prisma.weeklySettlement.deleteMany({});
    console.log(`[✓] Deleted ${deletedSettlements.count} Weekly Settlements.`);

    // 6. Reset all user wallet balances to 0.00
    const updatedUsers = await prisma.user.updateMany({
      data: {
        walletBalance: 0.00,
      },
    });
    console.log(`[✓] Reset wallet balance to 0.00 for ${updatedUsers.count} Users.`);

    // 7. Clean up local uploaded files if any exist
    const uploadDir = path.join(__dirname, "..", "public", "uploads");
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      for (const file of files) {
        fs.unlinkSync(path.join(uploadDir, file));
      }
      console.log(`[✓] Cleared ${files.length} physical files from public/uploads.`);
    } else {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("[✓] Initialized fresh public/uploads folder.");
    }

    console.log("\n=========================================");
    console.log("  ALL DATA HAS BEEN SUCCESSFULLY RESET!  ");
    console.log("  READY FOR PRODUCTION WORK.            ");
    console.log("=========================================");
  } catch (error) {
    console.error("Error during reset:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
