import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database test data...");

  // Delete dependent records first to satisfy foreign key constraints
  const deletedFiles = await prisma.orderFile.deleteMany({});
  console.log(`Deleted ${deletedFiles.count} order files.`);

  const deletedTx = await prisma.transaction.deleteMany({});
  console.log(`Deleted ${deletedTx.count} transactions.`);

  const deletedRefunds = await prisma.refundRequest.deleteMany({});
  console.log(`Deleted ${deletedRefunds.count} refund requests.`);

  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`Deleted ${deletedOrders.count} orders.`);

  const deletedSettlements = await prisma.weeklySettlement.deleteMany({});
  console.log(`Deleted ${deletedSettlements.count} weekly settlements.`);

  const updatedUsers = await prisma.user.updateMany({
    data: {
      walletBalance: 0.00,
    },
  });
  console.log(`Reset wallet balance to 0.00 for ${updatedUsers.count} users.`);

  const uploadDir = path.join(__dirname, "..", "public", "uploads");
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    for (const file of files) {
      fs.unlinkSync(path.join(uploadDir, file));
    }
    console.log(`Cleared ${files.length} physical files from public/uploads.`);
  }

  console.log("Database test data clean up completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error cleaning database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
