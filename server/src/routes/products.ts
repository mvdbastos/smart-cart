import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const productsRouter = Router();

// Search products
productsRouter.get("/", async (req, res, next) => {
  try {
    const q = (req.query.q as string) || "";
    const products = await prisma.product.findMany({
      where: q
        ? { name: { contains: q, mode: "insensitive" } }
        : undefined,
      orderBy: { name: "asc" },
      take: 50,
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// Get product by id
productsRouter.get("/:id", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// Get current prices for a product across all stores
productsRouter.get("/:id/prices", async (req, res, next) => {
  try {
    const productId = req.params.id;

    // Get latest closed rounds for this product (one per store)
    const closedRounds = await prisma.votingRound.findMany({
      where: { productId, status: "CLOSED" },
      orderBy: { closedAt: "desc" },
      include: { store: true },
    });

    // Deduplicate: keep latest closed round per store
    const priceMap = new Map<string, { store: { id: string; name: string }; price: string; provisional: boolean }>();
    for (const round of closedRounds) {
      if (!priceMap.has(round.storeId) && round.winningPrice) {
        priceMap.set(round.storeId, {
          store: { id: round.store.id, name: round.store.name },
          price: round.winningPrice.toString(),
          provisional: false,
        });
      }
    }

    // For stores without a closed round, check open rounds for provisional prices
    const openRounds = await prisma.votingRound.findMany({
      where: { productId, status: "OPEN" },
      include: {
        store: true,
        priceReports: {
          include: { user: { select: { reputation: true } } },
          orderBy: { reportedAt: "desc" },
        },
      },
    });

    for (const round of openRounds) {
      if (!priceMap.has(round.storeId) && round.priceReports.length > 0) {
        // Use price from highest reputation reporter
        const best = round.priceReports.reduce((a, b) =>
          a.user.reputation >= b.user.reputation ? a : b
        );
        priceMap.set(round.storeId, {
          store: { id: round.store.id, name: round.store.name },
          price: best.price.toString(),
          provisional: true,
        });
      }
    }

    res.json(Array.from(priceMap.values()));
  } catch (err) {
    next(err);
  }
});

const createProductSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  unit: z.string().optional(),
  barcode: z.string().optional(),
});

// Create product
productsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = createProductSchema.parse(req.body);
    const product = await prisma.product.create({ data: body });
    res.status(201).json(product);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    next(err);
  }
});
