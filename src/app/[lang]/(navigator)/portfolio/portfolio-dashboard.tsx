"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import type { Dictionary } from "@/i18n";
import type { CoinPrice } from "@/lib/services/portfolio/portfolio-prices";
import AddHoldingDialog from "./components/add-holding-dialog";
import HoldingsTable from "./components/holdings-table";
import PortfolioNews from "./components/portfolio-news";
import {
  PlusIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

type Holding = {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
};

type Portfolio = {
  id: string;
  name: string;
  holdings: Holding[];
};

type Snapshot = {
  totalValue: number;
  totalCost: number;
  snapshotAt: string;
};

type NewsItem = {
  id: string;
  title: string;
  titleKo: string;
  description: string;
  descriptionKo: string;
  sourceName: string;
  publishedAt: string;
  sourceUrl: string;
};

type Props = {
  lang: string;
  translations: Dictionary;
  portfolio: Portfolio;
  snapshots: Snapshot[];
  initialPrices: Record<string, CoinPrice>;
  initialNews: NewsItem[];
};

export default function PortfolioDashboard({
  lang,
  translations,
  portfolio: initialPortfolio,
  snapshots,
  initialPrices,
  initialNews,
}: Props) {
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [prices, setPrices] = useState(initialPrices);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate portfolio metrics
  const totalValue = portfolio.holdings.reduce((sum, h) => {
    const price = prices[h.coinId]?.usd ?? 0;
    return sum + h.quantity * price;
  }, 0);

  const totalCost = portfolio.holdings.reduce(
    (sum, h) => sum + h.quantity * h.avgBuyPrice,
    0
  );

  const totalPnL = totalValue - totalCost;
  const totalPnLPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  const change24h = portfolio.holdings.reduce((sum, h) => {
    const price = prices[h.coinId]?.usd ?? 0;
    const change = prices[h.coinId]?.usd_24h_change ?? 0;
    const holdingValue = h.quantity * price;
    return sum + holdingValue * (change / 100);
  }, 0);

  const change24hPct =
    totalValue > 0 ? (change24h / (totalValue - change24h)) * 100 : 0;

  // Find best performer
  const bestPerformer = portfolio.holdings.reduce(
    (best, h) => {
      const change = prices[h.coinId]?.usd_24h_change ?? 0;
      return change > (best?.change ?? -Infinity)
        ? { symbol: h.symbol, change }
        : best;
    },
    null as { symbol: string; change: number } | null
  );

  // Refresh prices
  const refreshPrices = useCallback(async () => {
    const coinIds = portfolio.holdings.map((h) => h.coinId);
    if (coinIds.length === 0) return;
    setRefreshing(true);
    try {
      const res = await fetch(
        `/api/portfolio/prices?coins=${coinIds.join(",")}`
      );
      if (res.ok) {
        const data = await res.json();
        setPrices(data);
      }
    } finally {
      setRefreshing(false);
    }
  }, [portfolio.holdings]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(refreshPrices, 60000);
    return () => clearInterval(interval);
  }, [refreshPrices]);

  // Reload portfolio data after changes
  const reloadPortfolio = async () => {
    try {
      const res = await fetch(`/${lang}/portfolio`, { cache: "no-store" });
      // Just do a simple page reload for now
      window.location.reload();
    } catch {
      // fallback
    }
  };

  const formatUSD = (v: number) =>
    `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Portfolio
          </h1>
          <p className="text-zinc-500 text-sm mt-1 font-mono">
            Live tracking with real-time prices
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshPrices}
            disabled={refreshing}
            className="border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]"
          >
            <ArrowPathIcon
              className={`w-4 h-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setAddDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            <PlusIcon className="w-4 h-4 mr-1.5" />
            Add Holdings
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Value */}
        <Card className="p-5 bg-white/[0.03] border-white/[0.06] backdrop-blur-xl">
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-2">
            Total Value
          </p>
          <p className="text-2xl font-mono font-bold text-white">
            {formatUSD(totalValue)}
          </p>
        </Card>

        {/* Total P&L */}
        <Card className="p-5 bg-white/[0.03] border-white/[0.06] backdrop-blur-xl">
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-2">
            Total P&L
          </p>
          <div className="flex items-end gap-2">
            <p
              className={`text-2xl font-mono font-bold ${totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {totalPnL >= 0 ? "+" : ""}
              {formatUSD(totalPnL)}
            </p>
            <span
              className={`text-sm font-mono mb-0.5 px-2 py-0.5 rounded-md ${totalPnL >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}
            >
              {totalPnLPct >= 0 ? "+" : ""}
              {totalPnLPct.toFixed(2)}%
            </span>
          </div>
        </Card>

        {/* 24h Change */}
        <Card className="p-5 bg-white/[0.03] border-white/[0.06] backdrop-blur-xl">
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-2">
            24h Change
          </p>
          <div className="flex items-center gap-2">
            {change24h >= 0 ? (
              <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-400" />
            ) : (
              <ArrowTrendingDownIcon className="w-5 h-5 text-red-400" />
            )}
            <p
              className={`text-2xl font-mono font-bold ${change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {change24h >= 0 ? "+" : ""}
              {formatUSD(change24h)}
            </p>
          </div>
          <p
            className={`text-xs font-mono mt-1 ${change24hPct >= 0 ? "text-emerald-400/60" : "text-red-400/60"}`}
          >
            {change24hPct >= 0 ? "+" : ""}
            {change24hPct.toFixed(2)}%
          </p>
        </Card>

        {/* Best Performer */}
        <Card className="p-5 bg-white/[0.03] border-white/[0.06] backdrop-blur-xl">
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-2">
            Best Performer
          </p>
          {bestPerformer ? (
            <div>
              <p className="text-2xl font-mono font-bold text-white">
                {bestPerformer.symbol}
              </p>
              <p
                className={`text-sm font-mono ${bestPerformer.change >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {bestPerformer.change >= 0 ? "+" : ""}
                {bestPerformer.change.toFixed(2)}% today
              </p>
            </div>
          ) : (
            <p className="text-zinc-600 text-sm">No holdings yet</p>
          )}
        </Card>
      </div>

      {/* Allocation + Holdings */}
      {portfolio.holdings.length === 0 ? (
        <Card className="p-16 bg-white/[0.02] border-white/[0.06] text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
            <PlusIcon className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">
            No holdings yet
          </h3>
          <p className="text-zinc-500 text-sm mb-6 max-w-md mx-auto">
            Add your crypto holdings manually, upload a CSV, or take a
            screenshot of your exchange portfolio to get started.
          </p>
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            <PlusIcon className="w-4 h-4 mr-1.5" />
            Add Your First Holding
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Allocation Donut */}
          <Card className="p-6 bg-white/[0.03] border-white/[0.06] backdrop-blur-xl">
            <h3 className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-4">
              Allocation
            </h3>
            <div className="space-y-3">
              {portfolio.holdings
                .map((h) => ({
                  ...h,
                  value: h.quantity * (prices[h.coinId]?.usd ?? 0),
                }))
                .sort((a, b) => b.value - a.value)
                .map((h) => {
                  const pct =
                    totalValue > 0 ? (h.value / totalValue) * 100 : 0;
                  return (
                    <div key={h.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-zinc-300">
                            {h.symbol}
                          </span>
                          <span className="text-xs font-mono text-zinc-500">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>

          {/* Holdings Table */}
          <div className="lg:col-span-2">
            <HoldingsTable
              holdings={portfolio.holdings}
              prices={prices}
              onDelete={reloadPortfolio}
              onEdit={reloadPortfolio}
            />
          </div>

          {/* Portfolio News */}
          {initialNews.length > 0 && (
            <div className="lg:col-span-3">
              <PortfolioNews news={initialNews} lang={lang} />
            </div>
          )}
        </div>
      )}

      {/* Add Holding Dialog */}
      <AddHoldingDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={reloadPortfolio}
      />
    </div>
  );
}
