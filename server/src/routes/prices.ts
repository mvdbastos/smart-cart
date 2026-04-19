import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { PricingService } from "../services/PricingService.js";

export const pricesRouter = Router();

const reportPriceSchema = z.object({
  productId: z.string().uuid(),
  storeId: z.string().uuid(),
  price: z.number().positive(),
});

// Report a price
pricesRouter.post("/report", requireAuth, async (req, res, next) => {
  try {
    const body = reportPriceSchema.parse(req.body);
    const report = await PricingService.reportPrice(
      req.userId!,
      body.productId,
      body.storeId,
      body.price
    );
    res.status(201).json(report);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    next(err);
  }
});

// Price history for a product at a store
pricesRouter.get("/history/:productId/:storeId", async (req, res, next) => {
  try {
    const { productId, storeId } = req.params;
    const rounds = await prisma.votingRound.findMany({
      where: { productId, storeId, status: "CLOSED" },
      orderBy: { closedAt: "desc" },
      take: 20,
      select: {
        id: true,
        winningPrice: true,
        reportCount: true,
        openedAt: true,
        closedAt: true,
      },
    });
    res.json(rounds);
  } catch (err) {
    next(err);
  }
});

// Get current price for a product at a store
pricesRouter.get("/current/:productId/:storeId", async (req, res, next) => {
  try {
    const { productId, storeId } = req.params;
    const result = await PricingService.getCurrentPrice(productId, storeId);
    if (!result) {
      res.json({ price: null, provisional: false });
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});
