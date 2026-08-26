import { PrismaClient } from "@prisma/client";

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

  // Disconnect orders from settlements before deleting settlements if needed, or delete orders
  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`Deleted ${deletedOrders.count} orders.`);

  const deletedSettlements = await prisma.weeklySettlement.deleteMany({});
  console.log(`Deleted ${deletedSettlements.count} weekly settlements.`);

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
