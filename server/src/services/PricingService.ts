import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";

const REPORTS_TO_CLOSE = 5;

export class PricingService {
  /**
   * Report a price for a product at a store.
   * Manages voting rounds: opens new ones as needed, closes them at 5 reports.
   */
  static async reportPrice(
    userId: string,
    productId: string,
    storeId: string,
    price: number
  ) {
    return await prisma.$transaction(async (tx) => {
      // Find or create an open round
      let round = await tx.votingRound.findFirst({
        where: { productId, storeId, status: "OPEN" },
      });

      if (!round) {
        round = await tx.votingRound.create({
          data: { productId, storeId, status: "OPEN" },
        });
      }

      // Create the price report
      const report = await tx.priceReport.create({
        data: {
          productId,
          storeId,
          userId,
          price: new Prisma.Decimal(price),
          votingRoundId: round.id,
        },
      });

      // Increment report count
      const updatedRound = await tx.votingRound.update({
        where: { id: round.id },
        data: { reportCount: { increment: 1 } },
      });

      // Close the round if we have enough reports
      if (updatedRound.reportCount >= REPORTS_TO_CLOSE) {
        await PricingService.closeRound(tx, round.id, productId, storeId);
      }

      return report;
    });
  }

  /**
   * Close a voting round: determine winner, apply reputation changes, handle recovery.
   */
  private static async closeRound(
    tx: Prisma.TransactionClient,
    roundId: string,
    productId: string,
    storeId: string
  ) {
    // Get all reports in this round
    const reports = await tx.priceReport.findMany({
      where: { votingRoundId: roundId },
      include: { user: { select: { id: true, reputation: true } } },
    });

    // Group by price (using string representation for exact decimal comparison)
    const priceGroups = new Map<string, typeof reports>();
    for (const report of reports) {
      const key = report.price.toString();
      if (!priceGroups.has(key)) priceGroups.set(key, []);
      priceGroups.get(key)!.push(report);
    }

    // Find winner: price with most votes; tie-break by sum of reputation
    let winnerPrice = "";
    let winnerCount = 0;
    let winnerRepSum = -Infinity;

    for (const [price, group] of priceGroups) {
      const count = group.length;
      const repSum = group.reduce((sum, r) => sum + r.user.reputation, 0);
      if (
        count > winnerCount ||
        (count === winnerCount && repSum > winnerRepSum)
      ) {
        winnerPrice = price;
        winnerCount = count;
        winnerRepSum = repSum;
      }
    }

    // Close the round
    await tx.votingRound.update({
      where: { id: roundId },
      data: {
        status: "CLOSED",
        winningPrice: new Prisma.Decimal(winnerPrice),
        closedAt: new Date(),
      },
    });

    // Apply reputation changes
    const winnerUserIds = new Set(
      priceGroups.get(winnerPrice)!.map((r) => r.userId)
    );

    for (const report of reports) {
      const isWinner = winnerUserIds.has(report.userId);
      const delta = isWinner ? 1 : -1;
      const reason = isWinner ? "VOTE_WIN" : "VOTE_LOSS";

      await tx.reputationChange.create({
        data: {
          userId: report.userId,
          delta,
          reason: reason as "VOTE_WIN" | "VOTE_LOSS",
          votingRoundId: roundId,
        },
      });

      await tx.user.update({
        where: { id: report.userId },
        data: { reputation: { increment: delta } },
      });
    }

    // Recovery check: look at the previous round for this product/store
    await PricingService.checkRecovery(tx, roundId, productId, storeId, winnerPrice);

    // Open a new round
    await tx.votingRound.create({
      data: { productId, storeId, status: "OPEN" },
    });
  }

  /**
   * Recovery: if losers of the previous round reported the same price that just won,
   * they were "early reporters" and deserve reputation restoration.
   */
  private static async checkRecovery(
    tx: Prisma.TransactionClient,
    currentRoundId: string,
    productId: string,
    storeId: string,
    winnerPrice: string
  ) {
    // Find the previous closed round (the one closed before the current one)
    const previousRounds = await tx.votingRound.findMany({
      where: {
        productId,
        storeId,
        status: "CLOSED",
        id: { not: currentRoundId },
      },
      orderBy: { closedAt: "desc" },
      take: 1,
    });

    if (previousRounds.length === 0) return;

    const prevRound = previousRounds[0];

    // Find losers from the previous round who reported the current winning price
    const prevLosers = await tx.reputationChange.findMany({
      where: {
        votingRoundId: prevRound.id,
        reason: "VOTE_LOSS",
      },
      include: { user: true },
    });

    for (const loserChange of prevLosers) {
      // Check if this loser reported a price matching the new winner
      const loserReport = await tx.priceReport.findFirst({
        where: {
          votingRoundId: prevRound.id,
          userId: loserChange.userId,
        },
      });

      if (loserReport && loserReport.price.toString() === winnerPrice) {
        // Recovery: +2 (undo the -1 loss + 1 reward for being early)
        await tx.reputationChange.create({
          data: {
            userId: loserChange.userId,
            delta: 2,
            reason: "EARLY_REPORTER_RECOVERY",
            votingRoundId: currentRoundId,
          },
        });

        await tx.user.update({
          where: { id: loserChange.userId },
          data: { reputation: { increment: 2 } },
        });
      }
    }
  }

  /**
   * Get the current consensus price for a product at a store.
   */
  static async getCurrentPrice(
    productId: string,
    storeId: string
  ): Promise<{ price: number; provisional: boolean } | null> {
    // Check latest closed round
    const closedRound = await prisma.votingRound.findFirst({
      where: { productId, storeId, status: "CLOSED" },
      orderBy: { closedAt: "desc" },
    });

    if (closedRound?.winningPrice) {
      return { price: Number(closedRound.winningPrice), provisional: false };
    }

    // Check open round — use highest rep reporter as provisional
    const openRound = await prisma.votingRound.findFirst({
      where: { productId, storeId, status: "OPEN" },
      include: {
        priceReports: {
          include: { user: { select: { reputation: true } } },
          orderBy: { reportedAt: "desc" },
        },
      },
    });

    if (openRound && openRound.priceReports.length > 0) {
      const best = openRound.priceReports.reduce((a, b) =>
        a.user.reputation >= b.user.reputation ? a : b
      );
      return { price: Number(best.price), provisional: true };
    }

    return null;
  }
}
