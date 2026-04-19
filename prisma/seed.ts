import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed preset stores
  const stores = await Promise.all(
    [
      { name: "Walmart", address: "Main St 100", isPreset: true },
      { name: "Costco", address: "Warehouse Ave 50", isPreset: true },
      { name: "Whole Foods", address: "Organic Blvd 25", isPreset: true },
      { name: "Trader Joe's", address: "Quirky Ln 12", isPreset: true },
      { name: "Aldi", address: "Budget Rd 5", isPreset: true },
    ].map((s) => prisma.store.create({ data: s }))
  );

  // Seed sample products
  const products = await Promise.all(
    [
      { name: "Whole Milk 1L", category: "Dairy", unit: "unit" },
      { name: "White Bread Loaf", category: "Bakery", unit: "unit" },
      { name: "Bananas", category: "Fruits", unit: "kg" },
      { name: "Chicken Breast", category: "Meat", unit: "kg" },
      { name: "Eggs (12 pack)", category: "Dairy", unit: "unit" },
      { name: "White Rice 1kg", category: "Grains", unit: "unit" },
      { name: "Olive Oil 500ml", category: "Oils", unit: "unit" },
      { name: "Tomatoes", category: "Vegetables", unit: "kg" },
      { name: "Cheddar Cheese 200g", category: "Dairy", unit: "unit" },
      { name: "Orange Juice 1L", category: "Beverages", unit: "unit" },
      { name: "Pasta 500g", category: "Grains", unit: "unit" },
      { name: "Ground Coffee 250g", category: "Beverages", unit: "unit" },
      { name: "Butter 200g", category: "Dairy", unit: "unit" },
      { name: "Onions", category: "Vegetables", unit: "kg" },
      { name: "Potatoes", category: "Vegetables", unit: "kg" },
    ].map((p) => prisma.product.create({ data: p }))
  );

  console.log(`Seeded ${stores.length} stores and ${products.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
