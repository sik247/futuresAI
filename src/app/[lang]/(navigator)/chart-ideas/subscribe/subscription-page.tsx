"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const FEATURES = [
  "AI-powered chart analysis with Gemini 2.5 Pro",
  "Live market data from Binance",
  "Real-time news sentiment analysis",
  "Order book depth & pressure detection",
  "Fibonacci, RSI, MACD, Bollinger analysis",
  "Support & resistance with hit probabilities",
  "Trade setup with entry, SL, TP levels",
  "Canvas overlay with drawn key levels",
];

export default function SubscriptionPage({ lang }: { lang: string }) {
  const [subscribed, setSubscribed] = useState(false);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch("/api/subscription")
      .then((res) => res.json())
      .then((data) => {
        setSubscribed(data.subscribed || false);
        setPeriodEnd(data.periodEnd || null);
        setCredits(data.credits || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/subscription", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: data.error });
        return;
      }
      setSubscribed(true);
      setPeriodEnd(data.periodEnd);
      toast({ title: "Subscribed!", description: "You now have access to Pro chart analysis." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to subscribe." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/subscription", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast({ variant: "destructive", title: "Error", description: data.error });
        return;
      }
      setSubscribed(false);
      toast({ title: "Subscription Canceled", description: "Your access will continue until the end of the current period." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to cancel." });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-3">Pro Chart Analysis</h1>
        <p className="text-zinc-400 text-lg">
          AI-powered technical analysis with live market data
        </p>
      </div>

      <Card className="p-8 bg-zinc-950/50 backdrop-blur-sm border-blue-500/20">
        <div className="text-center mb-8">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-bold text-foreground">$75</span>
            <span className="text-zinc-500 text-lg">/month</span>
          </div>
          <p className="text-zinc-500 mt-2 text-sm">Paid from your USDT credits</p>
        </div>

        <div className="space-y-3 mb-8">
          {FEATURES.map((feature, i) => (
            <div key={i} className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-zinc-300 text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {subscribed ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
              <p className="text-emerald-400 font-semibold">Active Subscription</p>
              {periodEnd && (
                <p className="text-emerald-400/60 text-sm mt-1">
                  Renews {new Date(periodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <a
                href={`/${lang}/chart-ideas/analyze`}
                className="flex-1 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition-colors"
              >
                Go to Analysis
              </a>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={actionLoading}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                {actionLoading ? "..." : "Cancel"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              onClick={handleSubscribe}
              disabled={actionLoading || credits < 75}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 text-base font-semibold"
            >
              {actionLoading ? "Processing..." : "Subscribe — $75/mo"}
            </Button>
            {credits < 75 && (
              <p className="text-center text-amber-400 text-sm">
                Insufficient credits ({credits.toFixed(2)} USDT). Top up to subscribe.
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
