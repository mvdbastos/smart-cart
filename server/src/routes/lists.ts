import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { PricingService } from "../services/PricingService.js";

export const listsRouter = Router();
listsRouter.use(requireAuth);

// Get all lists for current user
listsRouter.get("/", async (req, res, next) => {
  try {
    const lists = await prisma.shoppingList.findMany({
      where: { userId: req.userId },
      include: { _count: { select: { items: true } }, selectedStore: true },
      orderBy: { updatedAt: "desc" },
    });
    res.json(lists);
  } catch (err) {
    next(err);
  }
});

const createListSchema = z.object({
  name: z.string().min(1),
});

// Create a shopping list
listsRouter.post("/", async (req, res, next) => {
  try {
    const body = createListSchema.parse(req.body);
    const list = await prisma.shoppingList.create({
      data: { name: body.name, userId: req.userId! },
    });
    res.status(201).json(list);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    next(err);
  }
});

// Get list with items + prices
listsRouter.get("/:id", async (req, res, next) => {
  try {
    const list = await prisma.shoppingList.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        items: {
          include: { product: true },
          orderBy: { createdAt: "asc" },
        },
        selectedStore: true,
      },
    });
    if (!list) {
      res.status(404).json({ error: "List not found" });
      return;
    }
    res.json(list);
  } catch (err) {
    next(err);
  }
});

const updateListSchema = z.object({
  name: z.string().min(1).optional(),
  mode: z.enum(["PLANNING", "BUYING"]).optional(),
  selectedStoreId: z.string().uuid().optional().nullable(),
});

// Update list (name, mode switch)
listsRouter.patch("/:id", async (req, res, next) => {
  try {
    const body = updateListSchema.parse(req.body);
    const list = await prisma.shoppingList.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!list) {
      res.status(404).json({ error: "List not found" });
      return;
    }
    const updated = await prisma.shoppingList.update({
      where: { id: req.params.id },
      data: body,
      include: { selectedStore: true },
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    next(err);
  }
});

// Delete list
listsRouter.delete("/:id", async (req, res, next) => {
  try {
    const list = await prisma.shoppingList.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!list) {
      res.status(404).json({ error: "List not found" });
      return;
    }
    await prisma.shoppingList.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const addItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});

// Add item to list
listsRouter.post("/:id/items", async (req, res, next) => {
  try {
    const body = addItemSchema.parse(req.body);
    const list = await prisma.shoppingList.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!list) {
      res.status(404).json({ error: "List not found" });
      return;
    }
    const item = await prisma.shoppingListItem.create({
      data: {
        shoppingListId: req.params.id,
        productId: body.productId,
        quantity: body.quantity,
      },
      include: { product: true },
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

const updateItemSchema = z.object({
  quantity: z.number().int().positive().optional(),
  isChecked: z.boolean().optional(),
  actualPrice: z.number().positive().optional().nullable(),
});

// Update item (check off, set actual price, change quantity)
listsRouter.patch("/:id/items/:itemId", async (req, res, next) => {
  try {
    const body = updateItemSchema.parse(req.body);
    const list = await prisma.shoppingList.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { items: { where: { id: req.params.itemId } } },
    });
    if (!list || list.items.length === 0) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.isChecked !== undefined) {
      updateData.isChecked = body.isChecked;
      updateData.checkedAt = body.isChecked ? new Date() : null;
    }
    if (body.actualPrice !== undefined) {
      updateData.actualPrice = body.actualPrice;
    }

    const item = await prisma.shoppingListItem.update({
      where: { id: req.params.itemId },
      data: updateData,
      include: { product: true },
    });

    // Auto-report price if user checked an item with an actual price in buying mode
    if (body.isChecked && body.actualPrice && list.mode === "BUYING" && list.selectedStoreId) {
      try {
        await PricingService.reportPrice(
          req.userId!,
          item.productId,
          list.selectedStoreId,
          body.actualPrice
        );
      } catch (err) {
        console.error("Auto-report price failed:", err);
        // Don't fail the check-off if price reporting fails
      }
    }

    res.json(item);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    next(err);
  }
});

// Remove item from list
listsRouter.delete("/:id/items/:itemId", async (req, res, next) => {
  try {
    const list = await prisma.shoppingList.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { items: { where: { id: req.params.itemId } } },
    });
    if (!list || list.items.length === 0) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    await prisma.shoppingListItem.delete({ where: { id: req.params.itemId } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Compare store prices for all items in list
listsRouter.get("/:id/compare", async (req, res, next) => {
  try {
    const list = await prisma.shoppingList.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        items: { include: { product: true } },
      },
    });
    if (!list) {
      res.status(404).json({ error: "List not found" });
      return;
    }

    const stores = await prisma.store.findMany({ orderBy: { name: "asc" } });
    const productIds = list.items.map((i) => i.productId);

    // Get latest closed round per (product, store)
    const closedRounds = await prisma.votingRound.findMany({
      where: {
        productId: { in: productIds },
        status: "CLOSED",
        winningPrice: { not: null },
      },
      orderBy: { closedAt: "desc" },
    });

    // Build price lookup: productId -> storeId -> price
    const priceLookup = new Map<string, Map<string, number>>();
    for (const round of closedRounds) {
      if (!priceLookup.has(round.productId)) {
        priceLookup.set(round.productId, new Map());
      }
      const storeMap = priceLookup.get(round.productId)!;
      if (!storeMap.has(round.storeId) && round.winningPrice) {
        storeMap.set(round.storeId, Number(round.winningPrice));
      }
    }

    // Also check open rounds for provisional prices
    const openRounds = await prisma.votingRound.findMany({
      where: {
        productId: { in: productIds },
        status: "OPEN",
      },
      include: {
        priceReports: {
          include: { user: { select: { reputation: true } } },
        },
      },
    });

    for (const round of openRounds) {
      if (!priceLookup.has(round.productId)) {
        priceLookup.set(round.productId, new Map());
      }
      const storeMap = priceLookup.get(round.productId)!;
      if (!storeMap.has(round.storeId) && round.priceReports.length > 0) {
        const best = round.priceReports.reduce((a, b) =>
          a.user.reputation >= b.user.reputation ? a : b
        );
        storeMap.set(round.storeId, Number(best.price));
      }
    }

    // Build comparison table
    const comparison = stores.map((store) => {
      const items = list.items.map((item) => {
        const storeMap = priceLookup.get(item.productId);
        const price = storeMap?.get(store.id) ?? null;
        return {
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: price,
          subtotal: price ? price * item.quantity : null,
        };
      });
      const total = items.reduce((sum, i) => sum + (i.subtotal ?? 0), 0);
      const hasAllPrices = items.every((i) => i.unitPrice !== null);
      return {
        store: { id: store.id, name: store.name },
        items,
        total,
        hasAllPrices,
      };
    });

    res.json(comparison);
  } catch (err) {
    next(err);
  }
});
