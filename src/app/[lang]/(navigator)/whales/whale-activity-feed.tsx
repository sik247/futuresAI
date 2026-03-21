"use client";

import { useEffect, useState, useCallback } from "react";

type TokenTx = {
  hash: string;
  from: string;
  to: string;
  tokenName: string;
  tokenSymbol: string;
  value: string;
  tokenDecimal: string;
  timeStamp: string;
  contractAddress?: string;
};

type WalletData = {
  name: string;
  address: string;
  entity: string;
  type: string;
  balance: number;
  balanceUsd: number;
  recentTxs: {
    hash: string;
    from: string;
    to: string;
    value: string;
    timeStamp: string;
  }[];
  recentTokenTxs: TokenTx[];
};

type ActivityItem = {
  hash: string;
  entityName: string;
  walletAddress: string;
  direction: "IN" | "OUT";
  amount: string;
  token: string;
  counterparty: string;
  timeStamp: string;
};

function truncateAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(timestamp: string) {
  const seconds = Math.floor(Date.now() / 1000 - Number(timestamp));
  if (seconds < 0) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatAmount(value: string) {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  if (num >= 1) return num.toFixed(2);
  return num.toFixed(4);
}

export default function WhaleActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/whales");
      const data = await res.json();
      const items: ActivityItem[] = [];

      (data.wallets as WalletData[]).forEach((wallet) => {
        // ETH transactions
        wallet.recentTxs.forEach((tx) => {
          const direction =
            tx.from.toLowerCase() === wallet.address.toLowerCase()
              ? "OUT"
              : "IN";
          items.push({
            hash: tx.hash,
            entityName: wallet.name,
            walletAddress: wallet.address,
            direction,
            amount: formatAmount(tx.value),
            token: "ETH",
            counterparty:
              direction === "OUT"
                ? truncateAddr(tx.to)
                : truncateAddr(tx.from),
            timeStamp: tx.timeStamp,
          });
        });

        // Token transactions
        wallet.recentTokenTxs.forEach((tx) => {
          const direction =
            tx.from.toLowerCase() === wallet.address.toLowerCase()
              ? "OUT"
              : "IN";
          items.push({
            hash: tx.hash,
            entityName: wallet.name,
            walletAddress: wallet.address,
            direction,
            amount: formatAmount(tx.value),
            token: tx.tokenSymbol,
            counterparty:
              direction === "OUT"
                ? truncateAddr(tx.to)
                : truncateAddr(tx.from),
            timeStamp: tx.timeStamp,
          });
        });
      });

      items.sort((a, b) => Number(b.timeStamp) - Number(a.timeStamp));
      setActivities(items.slice(0, 20));
      setLastUpdated(data.updatedAt || new Date().toISOString());
    } catch (err) {
      console.error("Failed to fetch whale activity:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div
      data-activity-feed
      className="rounded-2xl backdrop-blur-md bg-white/[0.02] border border-white/[0.06] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              data-live-pulse
              className="relative flex h-2 w-2"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400">
              Live
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white">
            Transaction Feed
          </h3>
        </div>
        {lastUpdated && (
          <span className="text-[10px] font-mono text-zinc-600">
            Updated {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[80px_1fr_60px_100px_70px_1fr] md:grid-cols-[90px_140px_60px_110px_80px_1fr] gap-2 px-6 py-2 border-b border-white/[0.04] text-[9px] font-mono uppercase tracking-[0.15em] text-zinc-600">
        <span>Time</span>
        <span>Entity</span>
        <span>Dir</span>
        <span>Amount</span>
        <span>Token</span>
        <span>Counterparty</span>
      </div>

      {/* Rows */}
      <div className="max-h-[480px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-sm text-zinc-600 font-mono">
            No recent activity
          </div>
        ) : (
          activities.map((item, i) => (
            <a
              key={`${item.hash}-${i}`}
              href={`https://etherscan.io/tx/${item.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="grid grid-cols-[80px_1fr_60px_100px_70px_1fr] md:grid-cols-[90px_140px_60px_110px_80px_1fr] gap-2 px-6 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors group"
            >
              <span className="text-xs font-mono text-zinc-600">
                {timeAgo(item.timeStamp)}
              </span>
              <span className="text-xs font-medium text-zinc-300 truncate group-hover:text-white transition-colors">
                {item.entityName}
              </span>
              <span
                className={`text-[10px] font-mono font-bold ${
                  item.direction === "IN"
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {item.direction}
              </span>
              <span className="text-xs font-mono text-zinc-300">
                {item.amount}
              </span>
              <span className="text-xs font-mono text-zinc-500 font-medium">
                {item.token}
              </span>
              <span className="text-xs font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors truncate">
                {item.counterparty}
              </span>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
