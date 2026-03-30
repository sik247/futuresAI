"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Dictionary } from "@/i18n";
import type { CoinPrice } from "@/lib/services/portfolio/portfolio-prices";
import LinkExchangeForm from "./link-exchange-form";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarSquareIcon,
  WalletIcon,
  PresentationChartLineIcon,
  NewspaperIcon,
  BeakerIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

type Holding = {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
};

type RecentAnalysis = {
  id: string;
  pair: string | null;
  trend: string;
  confidence: number;
  createdAt: string;
};

type PaybackAccount = {
  id: string;
  uid: string;
  status: string;
  exchangeName: string;
  exchangeImage: string;
  paybackRate: number;
  totalEarned: number;
  unpaid: number;
  tradeCount: number;
};

type Props = {
  lang: string;
  translations: Dictionary;
  user: { name: string; email: string; role: string; credits: number };
  portfolio: { id: string; holdings: Holding[] };
  prices: Record<string, CoinPrice>;
  recentAnalyses: RecentAnalysis[];
  paybackAccounts?: PaybackAccount[];
  exchanges?: { id: string; name: string; imageUrl: string }[];
};

const QUICK_LINKS = [
  { path: "portfolio", icon: WalletIcon, label: "Portfolio", labelKo: "포트폴리오", desc: "Track holdings & P&L", descKo: "보유 자산 & 손익 추적" },
  { path: "quant", icon: BeakerIcon, label: "AI Quant", labelKo: "AI 퀀트", desc: "Signals & chart analysis", descKo: "시그널 & 차트 분석" },
  { path: "charts", icon: PresentationChartLineIcon, label: "Charts", labelKo: "차트", desc: "Live market charts", descKo: "실시간 시장 차트" },
  { path: "news", icon: NewspaperIcon, label: "News", labelKo: "뉴스", desc: "Market intelligence", descKo: "시장 인텔리전스" },
];

const trendColors: Record<string, string> = {
  BULLISH: "text-emerald-400",
  BEARISH: "text-red-400",
  NEUTRAL: "text-yellow-400",
  CONSOLIDATING: "text-blue-400",
};

export default function UserDashboard({
  lang,
  translations,
  user,
  portfolio,
  prices,
  recentAnalyses,
  paybackAccounts = [],
  exchanges = [],
}: Props) {
  const totalValue = portfolio.holdings.reduce((sum, h) => {
    return sum + h.quantity * (prices[h.coinId]?.usd ?? 0);
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
    return sum + h.quantity * price * (change / 100);
  }, 0);

  const topHoldings = [...portfolio.holdings]
    .map((h) => ({
      ...h,
      value: h.quantity * (prices[h.coinId]?.usd ?? 0),
      change: prices[h.coinId]?.usd_24h_change ?? 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const formatUSD = (v: number) =>
    `$${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const ko = lang === "ko";

  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div>
          <p className="text-sm text-zinc-500 font-mono mb-1">
            {ko ? "돌아오셨군요," : "Welcome back,"}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            {user.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {user.role === "ADMIN" && (
            <Link
              href={`/${lang}/dashboard/admin`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors"
            >
              <ShieldCheckIcon className="w-4 h-4" />
              {ko ? "관리자" : "Admin Panel"}
            </Link>
          )}
        </div>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 bg-white/[0.03] border-white/[0.06] backdrop-blur-xl shadow-lg shadow-black/30 hover:border-white/[0.12] hover:scale-[1.01] transition-all">
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-2">
            {ko ? "포트폴리오 가치" : "Portfolio Value"}
          </p>
          <p className="text-2xl font-mono font-bold text-white">
            {formatUSD(totalValue)}
          </p>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            {portfolio.holdings.length} {ko ? "자산" : "assets"}
          </p>
        </Card>

        <Card className="p-5 bg-white/[0.03] border-white/[0.06] backdrop-blur-xl shadow-lg shadow-black/30 hover:border-white/[0.12] hover:scale-[1.01] transition-all">
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-2">
            {ko ? "총 손익" : "Total P&L"}
          </p>
          <div className="flex items-end gap-2">
            <p className={`text-2xl font-mono font-bold ${totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {totalPnL >= 0 ? "+" : "-"}{formatUSD(totalPnL)}
            </p>
            <span className={`text-xs font-mono mb-0.5 px-2 py-0.5 rounded-md ${totalPnL >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>
              {totalPnLPct >= 0 ? "+" : ""}{totalPnLPct.toFixed(2)}%
            </span>
          </div>
        </Card>

        <Card className="p-5 bg-white/[0.03] border-white/[0.06] backdrop-blur-xl shadow-lg shadow-black/30 hover:border-white/[0.12] hover:scale-[1.01] transition-all">
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-2">
            {ko ? "24시간 변동" : "24h Change"}
          </p>
          <div className="flex items-center gap-2">
            {change24h >= 0 ? (
              <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-400" />
            ) : (
              <ArrowTrendingDownIcon className="w-5 h-5 text-red-400" />
            )}
            <p className={`text-2xl font-mono font-bold ${change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {change24h >= 0 ? "+" : "-"}{formatUSD(change24h)}
            </p>
          </div>
        </Card>

        <Card className="p-5 bg-white/[0.03] border-white/[0.06] backdrop-blur-xl shadow-lg shadow-black/30 hover:border-white/[0.12] hover:scale-[1.01] transition-all">
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-2">
            {ko ? "크레딧" : "Credits"}
          </p>
          <p className="text-2xl font-mono font-bold text-white">
            {user.credits.toFixed(2)}
          </p>
          <p className="text-xs text-zinc-500 font-mono mt-1">USDT</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Holdings */}
        <Card className="lg:col-span-2 p-0 bg-white/[0.03] border-white/[0.06] backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <h3 className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">
              {ko ? "상위 보유 자산" : "Top Holdings"}
            </h3>
            <Link
              href={`/${lang}/portfolio`}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {ko ? "전체 보기" : "View All"}
            </Link>
          </div>
          {topHoldings.length === 0 ? (
            <div className="p-10 text-center">
              <WalletIcon className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500 mb-3">{ko ? "보유 자산이 없습니다" : "No holdings yet"}</p>
              <Link
                href={`/${lang}/portfolio`}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium"
              >
                {ko ? "첫 자산 추가하기" : "Add your first holding"}
              </Link>
            </div>
          ) : (
            <div>
              {topHoldings.map((h, i) => (
                <div
                  key={h.id}
                  className={`flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.02] transition-colors ${
                    i < topHoldings.length - 1 ? "border-b border-white/[0.03]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-zinc-600 w-4">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{h.symbol}</p>
                      <p className="text-[11px] text-zinc-500">{h.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-medium text-white">
                      ${h.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <p className={`text-[11px] font-mono ${h.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {h.change >= 0 ? "+" : ""}{h.change.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent AI Analyses */}
        <Card className="p-0 bg-white/[0.03] border-white/[0.06] backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <h3 className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">
              {ko ? "최근 분석" : "Recent Analyses"}
            </h3>
            <Link
              href={`/${lang}/chart-ideas/analyze`}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {ko ? "새 분석" : "New Analysis"}
            </Link>
          </div>
          {recentAnalyses.length === 0 ? (
            <div className="p-10 text-center">
              <ChartBarSquareIcon className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500 mb-3">{ko ? "분석 내역이 없습니다" : "No analyses yet"}</p>
              <Link
                href={`/${lang}/chart-ideas/analyze`}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium"
              >
                {ko ? "첫 AI 분석 실행하기" : "Run your first AI analysis"}
              </Link>
            </div>
          ) : (
            <div>
              {recentAnalyses.map((a, i) => (
                <div
                  key={a.id}
                  className={`flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.02] transition-colors ${
                    i < recentAnalyses.length - 1 ? "border-b border-white/[0.03]" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {a.pair?.replace("USDT", "/USDT") || "Unknown"}
                    </p>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${trendColors[a.trend] || "text-zinc-400"}`}>
                      {a.trend}
                    </p>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      {a.confidence}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Payback Accounts */}
      <Card className="p-0 bg-white/[0.03] border-white/[0.06] backdrop-blur-xl overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <h3 className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">
              {ko ? "거래소 페이백" : "Exchange Payback"}
            </h3>
            {paybackAccounts.length > 0 && (
              <span className="text-xs font-mono font-bold text-emerald-400">
                ${paybackAccounts.reduce((s, a) => s + a.totalEarned, 0).toFixed(2)} {ko ? "적립" : "earned"}
              </span>
            )}
          </div>
          <Link
            href={`/${lang}/payback`}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {ko ? "페이백 상세 보기" : "View Payback Details"}
          </Link>
        </div>

        {paybackAccounts.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-zinc-500 mb-1">
              {ko ? "연결된 거래소 계정이 없습니다." : "No exchange accounts linked yet."}
            </p>
            <p className="text-[11px] text-zinc-600 font-mono mb-4">
              {ko
                ? "거래소 계정을 연결하면 페이백 수익을 추적할 수 있습니다."
                : "Link your exchange account to start tracking payback rewards."}
            </p>
          </div>
        ) : (
          <>
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-0 px-6 py-3 border-b border-white/[0.04] bg-white/[0.01]">
              <div>
                <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider">{ko ? "총 적립" : "Total Earned"}</p>
                <p className="text-sm font-mono font-bold text-white">${paybackAccounts.reduce((s, a) => s + a.totalEarned, 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider">{ko ? "미지급" : "Unpaid"}</p>
                <p className="text-sm font-mono font-bold text-emerald-400">${paybackAccounts.reduce((s, a) => s + a.unpaid, 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider">{ko ? "연결 거래소" : "Exchanges"}</p>
                <p className="text-sm font-mono font-bold text-white">{paybackAccounts.length}</p>
              </div>
            </div>

            {/* Exchange rows */}
            {paybackAccounts.map((acc, i) => (
              <div
                key={acc.id}
                className={`flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.02] transition-colors ${
                  i < paybackAccounts.length - 1 ? "border-b border-white/[0.03]" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-xs font-bold text-blue-400">
                    {acc.exchangeName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{acc.exchangeName}</p>
                      {acc.status === "PENDING" && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          {ko ? "검증 대기중" : "Pending Verification"}
                        </span>
                      )}
                      {acc.status === "ACTIVE" && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          {ko ? "활성" : "Active"}
                        </span>
                      )}
                      {acc.status === "INACTIVE" && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400">
                          {ko ? "비활성" : "Rejected"}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      UID: {acc.uid} · {acc.tradeCount} {ko ? "건" : "trades"} · {(acc.paybackRate * 100).toFixed(0)}% rate
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-white">${acc.totalEarned.toFixed(2)}</p>
                  {acc.unpaid > 0 && (
                    <p className="text-[10px] font-mono text-emerald-400">${acc.unpaid.toFixed(2)} {ko ? "미지급" : "unpaid"}</p>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Link Exchange Form */}
        <LinkExchangeForm exchanges={exchanges} lang={lang} />
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {QUICK_LINKS.map((link) => (
          <Link key={link.path} href={`/${lang}/${link.path}`}>
            <Card className="p-5 bg-white/[0.03] border-white/[0.06] backdrop-blur-xl hover:border-blue-500/20 hover:bg-white/[0.05] transition-all group cursor-pointer">
              <link.icon className="w-6 h-6 text-zinc-500 group-hover:text-blue-400 transition-colors mb-3" />
              <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                {ko ? link.labelKo : link.label}
              </p>
              <p className="text-xs text-zinc-500 mt-1">{ko ? link.descKo : link.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
