import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { generateToken, requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

// Create anonymous user
authRouter.post("/anonymous", async (_req, res, next) => {
  try {
    const user = await prisma.user.create({
      data: { provider: "ANONYMOUS" },
    });
    res.json({ token: generateToken(user.id), user: { id: user.id, reputation: 0, provider: "ANONYMOUS" } });
  } catch (err) {
    next(err);
  }
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

// Register with email/password
authRouter.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
        provider: "EMAIL",
      },
    });
    res.json({
      token: generateToken(user.id),
      user: { id: user.id, email: user.email, name: user.name, reputation: user.reputation, provider: user.provider },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Login with email/password
authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    res.json({
      token: generateToken(user.id),
      user: { id: user.id, email: user.email, name: user.name, reputation: user.reputation, provider: user.provider },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    next(err);
  }
});

// Get current user
authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, reputation: true, provider: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Upgrade anonymous user to email/password
const upgradeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

authRouter.post("/upgrade", requireAuth, async (req, res, next) => {
  try {
    const body = upgradeSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.provider !== "ANONYMOUS") {
      res.status(400).json({ error: "Only anonymous users can upgrade" });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { email: body.email, name: body.name, passwordHash, provider: "EMAIL" },
    });
    res.json({
      token: generateToken(updated.id),
      user: { id: updated.id, email: updated.email, name: updated.name, reputation: updated.reputation, provider: updated.provider },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    next(err);
  }
});
