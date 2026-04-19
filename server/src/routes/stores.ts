import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const storesRouter = Router();

// List all stores
storesRouter.get("/", async (_req, res, next) => {
  try {
    const stores = await prisma.store.findMany({
      orderBy: [{ isPreset: "desc" }, { name: "asc" }],
    });
    res.json(stores);
  } catch (err) {
    next(err);
  }
});

// Get store detail
storesRouter.get("/:id", async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: req.params.id },
    });
    if (!store) {
      res.status(404).json({ error: "Store not found" });
      return;
    }
    res.json(store);
  } catch (err) {
    next(err);
  }
});

const createStoreSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
});

// Suggest a new store
storesRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = createStoreSchema.parse(req.body);
    const store = await prisma.store.create({
      data: {
        name: body.name,
        address: body.address,
        isPreset: false,
        suggestedById: req.userId,
      },
    });
    res.status(201).json(store);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    next(err);
  }
});
