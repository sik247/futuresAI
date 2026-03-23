"use client";

import React, { useState, useMemo, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import { type ExchangeInfo } from "@/lib/data/exchanges";
import { saveCalculation } from "./actions";

function AnimatedNumber({
  value,
  prefix = "$",
  suffix = "",
  decimals = 2,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(value);
  const ref = useRef(value);

  useEffect(() => {
    const start = ref.current;
    const end = value;
    const duration = 400;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
      else ref.current = end;
    }

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span>
      {prefix}
      {display.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

function formatVolume(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

export default function CalculatorClient({
  exchanges,
}: {
  exchanges: ExchangeInfo[];
}) {
  const [selectedExchange, setSelectedExchange] = useState<string>(
    exchanges[0]?.id ?? "bybit"
  );
  const [tradeType, setTradeType] = useState<"spot" | "futures">("futures");
  const [volume, setVolume] = useState(100_000);
  const [leverage, setLeverage] = useState(10);
  const [makerPct, setMakerPct] = useState(30);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const exchange = exchanges.find((e) => e.id === selectedExchange) ?? exchanges[0];

  const results = useMemo(() => {
    if (!exchange) return { monthlyFees: 0, payback: 0, monthlySavings: 0, yearlySavings: 0, savingsPct: 0 };
    const effectiveVolume =
      tradeType === "futures" ? volume * leverage : volume;
    const makerRatio = makerPct / 100;
    const takerRatio = 1 - makerRatio;
    const weightedFee =
      exchange.makerFee * makerRatio + exchange.takerFee * takerRatio;
    const monthlyFees = effectiveVolume * (weightedFee / 100);
    const payback = monthlyFees * exchange.paybackRate;
    const savingsPct = exchange.paybackRate * 100;

    return {
      monthlyFees,
      payback,
      monthlySavings: payback,
      yearlySavings: payback * 12,
      savingsPct,
    };
  }, [selectedExchange, tradeType, volume, leverage, makerPct, exchange]);

  function calcExchangeSavings(ex: ExchangeInfo) {
    const effectiveVolume =
      tradeType === "futures" ? volume * leverage : volume;
    const makerRatio = makerPct / 100;
    const takerRatio = 1 - makerRatio;
    const weightedFee = ex.makerFee * makerRatio + ex.takerFee * takerRatio;
    const monthlyFees = effectiveVolume * (weightedFee / 100);
    return monthlyFees * ex.paybackRate;
  }

  const allSavings = exchanges.map((ex) => ({
    exchange: ex,
    savings: calcExchangeSavings(ex),
  }));
  const bestExchangeId = allSavings.length > 0
    ? allSavings.reduce((best, curr) =>
        curr.savings > best.savings ? curr : best
      ).exchange.id
    : "";

  function handleSave() {
    if (!exchange) return;
    setSaved(false);
    startTransition(async () => {
      const result = await saveCalculation({
        exchangeName: exchange.name,
        tradeType,
        volume,
        leverage: tradeType === "futures" ? leverage : 1,
        makerPct,
        monthlyFees: results.monthlyFees,
        payback: results.payback,
        yearlySavings: results.yearlySavings,
      });
      if (result.success) setSaved(true);
    });
  }

  if (exchanges.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No exchanges available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <section className="pt-16 pb-12 text-center px-4">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-4">
          Stop Losing Money
          <br />
          on Fees
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Calculate your potential payback savings and start keeping more of your
          trading profits.
        </p>
        <div className="inline-flex items-center gap-2 bg-secondary border border-border rounded-full px-5 py-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan-600 dark:bg-cyan-400" />
          <span className="text-cyan-600 dark:text-cyan-400 font-semibold text-sm">
            Over $2.5M paid back to traders
          </span>
        </div>
      </section>

      {/* Calculator */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-3 bg-card border border-border rounded-lg p-6">
            {/* Exchange Selector */}
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Select Exchange
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {exchanges.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExchange(ex.id)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border transition-all duration-200 ${
                    selectedExchange === ex.id
                      ? "bg-accent border-primary"
                      : "bg-card border-border hover:bg-accent"
                  }`}
                >
                  <div className="w-8 h-8 relative">
                    <Image
                      src={ex.logo}
                      alt={ex.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {ex.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(ex.paybackRate * 100).toFixed(0)}% back
                  </span>
                  {selectedExchange === ex.id && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-primary text-primary-foreground font-bold">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Trade Type */}
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Trade Type
            </label>
            <div className="flex bg-secondary rounded-lg p-1 mb-6">
              {(["spot", "futures"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTradeType(type)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                    tradeType === type
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type === "spot" ? "Spot" : "Futures"}
                </button>
              ))}
            </div>

            {/* Volume */}
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Monthly Trading Volume:{" "}
              <span className="text-foreground font-semibold">
                {formatVolume(volume)}
              </span>
            </label>
            <input
              type="range"
              min={1000}
              max={10_000_000}
              step={1000}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full mb-6 accent-primary h-2 bg-secondary rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />

            {/* Leverage (futures only) */}
            {tradeType === "futures" && (
              <>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Average Leverage:{" "}
                  <span className="text-foreground font-semibold">{leverage}x</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={125}
                  step={1}
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="w-full mb-6 accent-primary h-2 bg-secondary rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </>
            )}

            {/* Maker/Taker Mix */}
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Order Mix: Maker{" "}
              <span className="text-foreground font-semibold">{makerPct}%</span> /
              Taker{" "}
              <span className="text-foreground font-semibold">
                {100 - makerPct}%
              </span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={makerPct}
              onChange={(e) => setMakerPct(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-secondary rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>100% Maker</span>
              <span>100% Taker</span>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Your Savings
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              with {exchange?.name} via Futures AI
            </p>

            <div className="space-y-4 flex-1">
              <div className="bg-secondary rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Monthly Trading Fees
                </div>
                <div className="text-2xl font-bold text-foreground">
                  <AnimatedNumber value={results.monthlyFees} />
                </div>
              </div>

              <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4">
                <div className="text-xs text-cyan-600 dark:text-cyan-400 mb-1">
                  Monthly Payback
                </div>
                <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                  <AnimatedNumber value={results.payback} />
                </div>
              </div>

              <div className="bg-secondary rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Yearly Projection
                </div>
                <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  <AnimatedNumber value={results.yearlySavings} />
                </div>
              </div>

              <div className="bg-secondary rounded-lg p-4 text-center">
                <span className="text-muted-foreground text-sm">You save </span>
                <span className="text-cyan-600 dark:text-cyan-400 font-bold text-lg">
                  {results.savingsPct.toFixed(0)}%
                </span>
                <span className="text-muted-foreground text-sm"> on every trade</span>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isPending}
                className="w-full py-3 rounded-lg font-semibold text-sm transition-colors bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isPending ? "Saving..." : saved ? "Saved!" : "Save Calculation"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-5xl mx-auto px-4 mt-16">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground text-center mb-2">
          Exchange Comparison
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          See how each exchange stacks up with your trading profile
        </p>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted-foreground font-medium px-6 py-4">
                    Exchange
                  </th>
                  <th className="text-center text-xs text-muted-foreground font-medium px-4 py-4">
                    Maker Fee
                  </th>
                  <th className="text-center text-xs text-muted-foreground font-medium px-4 py-4">
                    Taker Fee
                  </th>
                  <th className="text-center text-xs text-muted-foreground font-medium px-4 py-4">
                    Payback Rate
                  </th>
                  <th className="text-right text-xs text-muted-foreground font-medium px-6 py-4">
                    Your Monthly Savings
                  </th>
                </tr>
              </thead>
              <tbody>
                {allSavings.map(({ exchange: ex, savings }) => (
                  <tr
                    key={ex.id}
                    className={`border-b border-border transition-colors hover:bg-accent ${
                      ex.id === bestExchangeId ? "bg-cyan-50/50 dark:bg-cyan-950/20" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 relative flex-shrink-0">
                          <Image
                            src={ex.logo}
                            alt={ex.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div>
                          <span className="text-foreground font-medium text-sm">
                            {ex.name}
                          </span>
                          {ex.id === bestExchangeId && (
                            <span className="ml-2 text-[10px] bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded-full font-medium">
                              BEST
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-center text-sm text-muted-foreground px-4 py-4">
                      {ex.makerFee}%
                    </td>
                    <td className="text-center text-sm text-muted-foreground px-4 py-4">
                      {ex.takerFee}%
                    </td>
                    <td className="text-center px-4 py-4">
                      <span className="text-sm font-medium text-foreground">
                        {(ex.paybackRate * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="text-right px-6 py-4">
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                        ${savings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border">
            {allSavings.map(({ exchange: ex, savings }) => (
              <div
                key={ex.id}
                className={`p-4 ${ex.id === bestExchangeId ? "bg-cyan-50/50 dark:bg-cyan-950/20" : ""}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 relative">
                      <Image
                        src={ex.logo}
                        alt={ex.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-foreground font-medium text-sm">
                      {ex.name}
                    </span>
                    {ex.id === bestExchangeId && (
                      <span className="text-[10px] bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded-full font-medium">
                        BEST
                      </span>
                    )}
                  </div>
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm">
                    ${savings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    /mo
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Maker: {ex.makerFee}%</span>
                  <span>Taker: {ex.takerFee}%</span>
                  <span>Payback: {(ex.paybackRate * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-4 mt-16">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground text-center mb-2">
          How It Works
        </h2>
        <p className="text-muted-foreground text-center mb-10">
          Three simple steps to start saving
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              ),
              title: "Sign Up Through Futures AI",
              desc: "Create your exchange account using our referral link. It takes less than 2 minutes.",
            },
            {
              step: "02",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              ),
              title: "Trade Normally",
              desc: "Trade on your exchange as you normally would. Spot, futures, any pair - it all counts.",
            },
            {
              step: "03",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              ),
              title: "Get Automatic Paybacks",
              desc: "Receive fee paybacks directly to your account. No claims, no waiting - fully automatic.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-card border border-border rounded-lg p-6 group hover:bg-accent transition-colors"
            >
              <div className="text-xs text-muted-foreground font-mono mb-4">
                STEP {item.step}
              </div>
              <div className="text-foreground mb-4">{item.icon}</div>
              <h3 className="text-foreground font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 mt-16 text-center">
        <div className="bg-secondary border border-border rounded-lg p-10">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
            Start Saving Today
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join thousands of traders who are getting their fees back through
            Futures AI.
          </p>
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-3.5 rounded-lg transition-colors text-lg">
            Sign Up Now
          </button>
          <div className="flex items-center justify-center gap-6 mt-8">
            {exchanges.map((ex) => (
              <div
                key={ex.id}
                className="w-8 h-8 relative opacity-50 hover:opacity-100 transition-opacity"
              >
                <Image
                  src={ex.logo}
                  alt={ex.name}
                  fill
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
