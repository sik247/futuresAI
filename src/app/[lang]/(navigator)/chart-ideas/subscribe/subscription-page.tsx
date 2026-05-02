"use client";

import React from "react";
import { Card } from "@/components/ui/card";

const FEATURES = [
  "AI-powered chart analysis with FuturesAI model 1.0",
  "Live market data from Binance",
  "Real-time news sentiment analysis",
  "Order book depth & pressure detection",
  "Fibonacci, RSI, MACD, Bollinger analysis",
  "Support & resistance with hit probabilities",
  "Trade setup with entry, SL, TP levels",
  "Canvas overlay with drawn key levels",
];

export default function SubscriptionPage({ lang }: { lang: string }) {
  return (
    <div className="max-w-lg mx-auto flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-3">AI Chart Analysis</h1>
        <p className="text-zinc-400 text-lg">
          AI-powered technical analysis with live market data
        </p>
      </div>

      <Card className="p-8 bg-zinc-950/50 backdrop-blur-sm border-emerald-500/20">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-lg font-bold uppercase tracking-wider">Free Access</span>
          </div>
          <p className="text-zinc-500 mt-2 text-sm">
            Chart analysis is currently open for all users
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {FEATURES.map((feature, i) => (
            <div key={i} className="flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-zinc-300 text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <a
          href={`/${lang}/chart-ideas/analyze`}
          className="flex items-center justify-center w-full rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-3 text-base font-semibold text-white transition-colors"
        >
          Start Analyzing
        </a>
      </Card>
    </div>
  );
}
