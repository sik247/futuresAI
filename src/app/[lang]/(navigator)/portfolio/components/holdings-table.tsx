"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import { deleteHolding, updateHolding } from "../actions";
import type { CoinPrice } from "@/lib/services/portfolio/portfolio-prices";

type Holding = {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
};

type Props = {
  holdings: Holding[];
  prices: Record<string, CoinPrice>;
  onDelete: () => void;
  onEdit: () => void;
};

export default function HoldingsTable({
  holdings,
  prices,
  onDelete,
  onEdit,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setLoading(id);
    try {
      await deleteHolding(id);
      toast({ title: "Holding removed" });
      onDelete();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleEdit = async (id: string) => {
    const qty = parseFloat(editQty);
    const price = parseFloat(editPrice);
    if (isNaN(qty) || qty <= 0) return;
    setLoading(id);
    try {
      await updateHolding(id, {
        quantity: qty,
        avgBuyPrice: isNaN(price) ? 0 : price,
      });
      setEditingId(null);
      toast({ title: "Holding updated" });
      onEdit();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update",
      });
    } finally {
      setLoading(null);
    }
  };

  const sorted = [...holdings]
    .map((h) => ({
      ...h,
      currentPrice: prices[h.coinId]?.usd ?? 0,
      change24h: prices[h.coinId]?.usd_24h_change ?? 0,
      value: h.quantity * (prices[h.coinId]?.usd ?? 0),
      pnl:
        h.quantity *
        ((prices[h.coinId]?.usd ?? 0) - h.avgBuyPrice),
      pnlPct:
        h.avgBuyPrice > 0
          ? (((prices[h.coinId]?.usd ?? 0) - h.avgBuyPrice) /
              h.avgBuyPrice) *
            100
          : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <Card className="p-0 bg-white/[0.03] border-white/[0.06] backdrop-blur-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <h3 className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">
          Holdings
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="text-left text-[10px] text-zinc-600 font-mono uppercase tracking-wider px-6 py-3">
                Asset
              </th>
              <th className="text-right text-[10px] text-zinc-600 font-mono uppercase tracking-wider px-4 py-3">
                Price
              </th>
              <th className="text-right text-[10px] text-zinc-600 font-mono uppercase tracking-wider px-4 py-3">
                24h
              </th>
              <th className="text-right text-[10px] text-zinc-600 font-mono uppercase tracking-wider px-4 py-3">
                Qty
              </th>
              <th className="text-right text-[10px] text-zinc-600 font-mono uppercase tracking-wider px-4 py-3">
                Value
              </th>
              <th className="text-right text-[10px] text-zinc-600 font-mono uppercase tracking-wider px-4 py-3">
                P&L
              </th>
              <th className="text-right text-[10px] text-zinc-600 font-mono uppercase tracking-wider px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((h) => (
              <tr
                key={h.id}
                className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {h.symbol}
                    </p>
                    <p className="text-xs text-zinc-500">{h.name}</p>
                  </div>
                </td>
                <td className="text-right px-4 py-4">
                  <p className="text-sm font-mono text-zinc-300">
                    ${h.currentPrice.toLocaleString(undefined, { maximumFractionDigits: h.currentPrice > 100 ? 2 : 4 })}
                  </p>
                </td>
                <td className="text-right px-4 py-4">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded ${h.change24h >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}
                  >
                    {h.change24h >= 0 ? "+" : ""}
                    {h.change24h.toFixed(2)}%
                  </span>
                </td>
                <td className="text-right px-4 py-4">
                  {editingId === h.id ? (
                    <input
                      type="number"
                      value={editQty}
                      onChange={(e) => setEditQty(e.target.value)}
                      className="w-20 text-right text-sm font-mono bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white"
                    />
                  ) : (
                    <p className="text-sm font-mono text-zinc-300">
                      {h.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </p>
                  )}
                </td>
                <td className="text-right px-4 py-4">
                  <p className="text-sm font-mono font-medium text-white">
                    $
                    {h.value.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  {editingId === h.id && (
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="Avg price"
                      className="w-24 text-right text-xs font-mono bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white mt-1"
                    />
                  )}
                </td>
                <td className="text-right px-4 py-4">
                  <p
                    className={`text-sm font-mono font-medium ${h.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {h.pnl >= 0 ? "+" : ""}$
                    {h.pnl.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  {h.avgBuyPrice > 0 && (
                    <p
                      className={`text-xs font-mono ${h.pnlPct >= 0 ? "text-emerald-400/60" : "text-red-400/60"}`}
                    >
                      {h.pnlPct >= 0 ? "+" : ""}
                      {h.pnlPct.toFixed(2)}%
                    </p>
                  )}
                </td>
                <td className="text-right px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    {editingId === h.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(h.id)}
                          disabled={loading === h.id}
                          className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 h-7 px-2"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                          className="text-xs border-zinc-700 text-zinc-400 h-7 px-2"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(h.id);
                            setEditQty(String(h.quantity));
                            setEditPrice(String(h.avgBuyPrice));
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/[0.05] text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(h.id)}
                          disabled={loading === h.id}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
