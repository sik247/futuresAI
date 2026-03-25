"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { findCoinBySymbol, COIN_LIST } from "@/lib/services/portfolio/coins";
import { parsePortfolioScreenshot } from "@/lib/services/portfolio/portfolio-ocr.service";

async function getUser() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) throw new Error("User not found");
  return user;
}

async function getOrCreatePortfolio(userId: string) {
  let portfolio = await prisma.portfolio.findFirst({
    where: { userId },
    include: { holdings: true },
  });
  if (!portfolio) {
    portfolio = await prisma.portfolio.create({
      data: { userId, name: "My Portfolio" },
      include: { holdings: true },
    });
  }
  return portfolio;
}

export async function getPortfolioData() {
  const user = await getUser();
  const portfolio = await getOrCreatePortfolio(user.id);
  const snapshots = await prisma.portfolioSnapshot.findMany({
    where: { portfolioId: portfolio.id },
    orderBy: { snapshotAt: "desc" },
    take: 30,
  });
  return { portfolio, snapshots };
}

export async function addHolding(data: {
  coinId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
}) {
  const user = await getUser();
  const portfolio = await getOrCreatePortfolio(user.id);

  const existing = await prisma.holding.findUnique({
    where: {
      portfolioId_coinId: {
        portfolioId: portfolio.id,
        coinId: data.coinId,
      },
    },
  });

  if (existing) {
    // Weighted average price
    const totalQty = existing.quantity + data.quantity;
    const weightedAvg =
      (existing.quantity * existing.avgBuyPrice +
        data.quantity * data.avgBuyPrice) /
      totalQty;

    return prisma.holding.update({
      where: { id: existing.id },
      data: {
        quantity: totalQty,
        avgBuyPrice: weightedAvg,
      },
    });
  }

  return prisma.holding.create({
    data: {
      coinId: data.coinId,
      symbol: data.symbol,
      name: data.name,
      quantity: data.quantity,
      avgBuyPrice: data.avgBuyPrice,
      portfolioId: portfolio.id,
    },
  });
}

export async function updateHolding(
  holdingId: string,
  data: { quantity: number; avgBuyPrice: number }
) {
  const user = await getUser();
  const holding = await prisma.holding.findUnique({
    where: { id: holdingId },
    include: { portfolio: true },
  });
  if (!holding || holding.portfolio.userId !== user.id)
    throw new Error("Not found");

  return prisma.holding.update({
    where: { id: holdingId },
    data: { quantity: data.quantity, avgBuyPrice: data.avgBuyPrice },
  });
}

export async function deleteHolding(holdingId: string) {
  const user = await getUser();
  const holding = await prisma.holding.findUnique({
    where: { id: holdingId },
    include: { portfolio: true },
  });
  if (!holding || holding.portfolio.userId !== user.id)
    throw new Error("Not found");

  return prisma.holding.delete({ where: { id: holdingId } });
}

export async function parseCSV(csvText: string) {
  const lines = csvText
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Skip header if present
  const startIdx =
    lines[0]?.toLowerCase().includes("symbol") ||
    lines[0]?.toLowerCase().includes("coin")
      ? 1
      : 0;

  const results: {
    coinId: string;
    symbol: string;
    name: string;
    quantity: number;
    avgBuyPrice: number;
  }[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].split(/[,\t]/).map((p) => p.trim());
    if (parts.length < 2) continue;

    const symbol = parts[0].toUpperCase().replace(/USDT$/, "");
    const quantity = parseFloat(parts[1]);
    const avgBuyPrice = parts[2] ? parseFloat(parts[2]) : 0;

    if (isNaN(quantity) || quantity <= 0) continue;

    const coin = findCoinBySymbol(symbol);
    if (coin) {
      results.push({
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        quantity,
        avgBuyPrice: isNaN(avgBuyPrice) ? 0 : avgBuyPrice,
      });
    }
  }

  return results;
}

export async function parseScreenshot(imageUrl: string) {
  const ocrResults = await parsePortfolioScreenshot(imageUrl);

  return ocrResults
    .map((h) => {
      const coin = findCoinBySymbol(h.symbol);
      if (!coin) return null;
      return {
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        quantity: h.quantity,
        avgBuyPrice: h.avgBuyPrice,
      };
    })
    .filter(Boolean) as {
    coinId: string;
    symbol: string;
    name: string;
    quantity: number;
    avgBuyPrice: number;
  }[];
}

export async function searchCoins(query: string) {
  const q = query.toUpperCase();
  return COIN_LIST.filter(
    (c) =>
      c.symbol.includes(q) || c.name.toUpperCase().includes(q) || c.id.includes(query.toLowerCase())
  ).slice(0, 10);
}

export async function getPortfolioNews(symbols: string[]) {
  // Fetch recent news and filter by user's holdings
  const news = await prisma.managedContent.findMany({
    where: {
      type: { in: ["news", "tweet"] },
      status: { in: ["published", "translated"] },
    },
    orderBy: { publishedAt: "desc" },
    take: 100,
  });

  const syms = symbols.map((s) => s.toUpperCase());

  return news
    .filter((n) => {
      const text = `${n.title} ${n.description}`.toUpperCase();
      return syms.some(
        (s) => text.includes(s) || text.includes(s.replace(/USDT$/, ""))
      );
    })
    .slice(0, 10)
    .map((n) => ({
      id: n.id,
      title: n.title,
      titleKo: n.titleKo,
      description: n.description.slice(0, 200),
      descriptionKo: n.descriptionKo.slice(0, 200),
      sourceName: n.sourceName,
      publishedAt: n.publishedAt.toISOString(),
      sourceUrl: n.sourceUrl,
    }));
}
