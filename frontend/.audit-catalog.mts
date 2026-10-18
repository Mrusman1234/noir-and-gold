import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function safe(label: string, fn: () => Promise<unknown>) {
  try { console.log(label, JSON.stringify(await fn())); }
  catch (e) { console.log(label, "UNAVAILABLE:", (e as Error).message.split("\n").pop()); }
}
async function main() {
  await safe("COUNTS", async () => ({
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    images: await prisma.productImage.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    inventoryAudit: await prisma.inventoryAuditLog.count(),
    shippingZones: await prisma.shippingZone.count(),
    paymentAttempts: await prisma.paymentAttempt.count().catch(() => "MISSING"),
    refunds: await prisma.refund.count().catch(() => "MISSING"),
    reservations: await prisma.inventoryReservation.count().catch(() => "MISSING"),
  }));
  const products = await prisma.product.findMany({
    include: { category: true, images: { orderBy: { displayOrder: "asc" } }, variants: { orderBy: { sku: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  for (const p of products) {
    console.log("PRODUCT", p.slug, "| id:", p.id, "| status:", p.status, "| audience:", p.audience, "| cat:", p.category.name, "| price:", p.pricePkr, "| sale:", p.salePricePkr, "| new:", p.isNew, "| ltd:", p.isLimited, "| feat:", p.isFeatured, "| imgs:", p.images.length, "| variants:", p.variants.length, "| stock:", p.variants.reduce((a,v)=>a+v.stockQuantity,0));
  }
  console.log("FIRST_VARIANT", JSON.stringify({ ...products[0].variants[0], createdAt: String(products[0].variants[0].createdAt), updatedAt: String(products[0].variants[0].updatedAt) }));
  console.log("FIRST_IMAGE", JSON.stringify(products[0].images[0]));
  console.log("FIRST_DESC_LEN", products[0].description.length, "| fabric:", products[0].fabricDetails, "| care:", products[0].careInstructions);
  await safe("ORDER_STATUSES", () => prisma.order.groupBy({ by: ["orderStatus"], _count: { _all: true } }));
}
main().catch((e) => { console.error("ERR", e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
