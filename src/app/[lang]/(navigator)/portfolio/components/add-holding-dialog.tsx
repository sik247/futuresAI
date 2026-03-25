"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import {
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import { addHolding, parseCSV, parseScreenshot, searchCoins } from "../actions";
import { FileUploadModule } from "@/lib/modules/file-upload";

type CoinResult = { id: string; symbol: string; name: string };
type ParsedRow = {
  coinId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const TABS = ["Manual", "CSV", "Screenshot"] as const;
type Tab = (typeof TABS)[number];

export default function AddHoldingDialog({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [tab, setTab] = useState<Tab>("Manual");
  const [loading, setLoading] = useState(false);

  // Manual
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CoinResult[]>([]);
  const [selected, setSelected] = useState<CoinResult | null>(null);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");

  // CSV
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);

  // Screenshot
  const [uploading, setUploading] = useState(false);
  const [ocrRows, setOcrRows] = useState<ParsedRow[]>([]);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 1) {
      setResults([]);
      return;
    }
    const coins = await searchCoins(q);
    setResults(coins);
  }, []);

  const handleManualAdd = async () => {
    if (!selected || !qty) return;
    setLoading(true);
    try {
      await addHolding({
        coinId: selected.id,
        symbol: selected.symbol,
        name: selected.name,
        quantity: parseFloat(qty),
        avgBuyPrice: price ? parseFloat(price) : 0,
      });
      toast({ title: `Added ${selected.symbol}` });
      setSelected(null);
      setQuery("");
      setQty("");
      setPrice("");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast({ variant: "destructive", title: "Failed to add holding" });
    } finally {
      setLoading(false);
    }
  };

  const handleCSVParse = async () => {
    if (!csvText.trim()) return;
    setLoading(true);
    try {
      const rows = await parseCSV(csvText);
      setParsedRows(rows);
      if (rows.length === 0) {
        toast({
          variant: "destructive",
          title: "No valid rows found",
          description: "Format: SYMBOL, QUANTITY, BUY_PRICE",
        });
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to parse CSV" });
    } finally {
      setLoading(false);
    }
  };

  const handleCSVConfirm = async () => {
    setLoading(true);
    try {
      for (const row of parsedRows) {
        await addHolding(row);
      }
      toast({ title: `Added ${parsedRows.length} holdings` });
      setCsvText("");
      setParsedRows([]);
      onOpenChange(false);
      onSuccess();
    } catch {
      toast({ variant: "destructive", title: "Failed to add holdings" });
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshot = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    setOcrRows([]);
    try {
      const fileUploader = new FileUploadModule();
      const data = await fileUploader.upload(file);
      const url =
        "https://nkkuehjtdudabogzwibw.supabase.co/storage/v1/object/public/CryptoX/" +
        data.path;
      toast({
        title: "Analyzing screenshot...",
        description: "AI is reading your portfolio",
      });
      const rows = await parseScreenshot(url);
      setOcrRows(rows);
      if (rows.length === 0) {
        toast({
          variant: "destructive",
          title: "No holdings detected",
          description: "Try a clearer screenshot",
        });
      }
    } catch {
      toast({ variant: "destructive", title: "Screenshot analysis failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleOCRConfirm = async () => {
    setLoading(true);
    try {
      for (const row of ocrRows) {
        await addHolding(row);
      }
      toast({ title: `Added ${ocrRows.length} holdings from screenshot` });
      setOcrRows([]);
      onOpenChange(false);
      onSuccess();
    } catch {
      toast({ variant: "destructive", title: "Failed to add holdings" });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-white/[0.08] shadow-2xl">
        <div className="p-6">
          <h2 className="text-lg font-bold text-white mb-1">Add Holdings</h2>
          <p className="text-sm text-zinc-500 mb-5">
            Add coins manually, via CSV, or screenshot your exchange
          </p>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {t === "Manual" && (
                  <MagnifyingGlassIcon className="w-4 h-4 inline mr-1.5" />
                )}
                {t === "CSV" && (
                  <DocumentTextIcon className="w-4 h-4 inline mr-1.5" />
                )}
                {t === "Screenshot" && (
                  <CameraIcon className="w-4 h-4 inline mr-1.5" />
                )}
                {t}
              </button>
            ))}
          </div>

          {/* Manual Tab */}
          {tab === "Manual" && (
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search coin (BTC, Ethereum...)"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50"
                />
                {results.length > 0 && !selected && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-zinc-800 border border-white/[0.08] shadow-xl z-10 max-h-48 overflow-y-auto">
                    {results.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelected(c);
                          setQuery(c.symbol);
                          setResults([]);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.05] text-left transition-colors"
                      >
                        <span className="text-sm font-semibold text-white">
                          {c.symbol}
                        </span>
                        <span className="text-xs text-zinc-500">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selected && (
                <Card className="p-3 bg-blue-500/5 border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white">
                        {selected.symbol}
                      </span>
                      <span className="text-xs text-zinc-500 ml-2">
                        {selected.name}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelected(null);
                        setQuery("");
                      }}
                      className="text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      Change
                    </button>
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1 block">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white font-mono placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1 block">
                    Avg Buy Price ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white font-mono placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <Button
                onClick={handleManualAdd}
                disabled={!selected || !qty || loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3"
              >
                {loading ? "Adding..." : "Add Holding"}
              </Button>
            </div>
          )}

          {/* CSV Tab */}
          {tab === "CSV" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-2 block">
                  Paste CSV (symbol, quantity, buy_price)
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`BTC, 0.5, 42000\nETH, 10, 2200\nSOL, 100, 25`}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white font-mono text-sm placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 resize-none"
                />
              </div>

              {parsedRows.length > 0 && (
                <Card className="p-4 bg-white/[0.03] border-white/[0.06]">
                  <p className="text-xs text-zinc-500 font-mono mb-3">
                    {parsedRows.length} holdings found:
                  </p>
                  <div className="space-y-2">
                    {parsedRows.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-white font-medium">
                          {r.symbol}
                        </span>
                        <span className="text-zinc-400 font-mono">
                          {r.quantity} @ ${r.avgBuyPrice}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {parsedRows.length === 0 ? (
                <Button
                  onClick={handleCSVParse}
                  disabled={!csvText.trim() || loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3"
                >
                  {loading ? "Parsing..." : "Parse CSV"}
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setParsedRows([])}
                    className="flex-1 border-white/[0.08] text-zinc-300"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleCSVConfirm}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    {loading
                      ? "Adding..."
                      : `Add ${parsedRows.length} Holdings`}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Screenshot Tab */}
          {tab === "Screenshot" && (
            <div className="space-y-4">
              <label
                htmlFor="portfolio-screenshot"
                className="flex flex-col items-center justify-center gap-3 p-10 rounded-xl border-2 border-dashed border-white/[0.08] hover:border-blue-500/30 cursor-pointer transition-colors"
              >
                <input
                  type="file"
                  id="portfolio-screenshot"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScreenshot(file);
                  }}
                />
                <CloudArrowUpIcon className="w-10 h-10 text-zinc-600" />
                <span className="text-sm text-zinc-400">
                  {uploading
                    ? "Analyzing screenshot..."
                    : "Upload exchange screenshot"}
                </span>
                <span className="text-xs text-zinc-600">
                  Supports Binance, Bybit, OKX, Bitget
                </span>
              </label>

              {uploading && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <div className="h-5 w-5 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                  <span className="text-sm text-zinc-400">
                    AI is reading your portfolio...
                  </span>
                </div>
              )}

              {ocrRows.length > 0 && (
                <>
                  <Card className="p-4 bg-white/[0.03] border-white/[0.06]">
                    <p className="text-xs text-zinc-500 font-mono mb-3">
                      {ocrRows.length} holdings detected:
                    </p>
                    <div className="space-y-2">
                      {ocrRows.map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-white font-medium">
                            {r.symbol}
                          </span>
                          <span className="text-zinc-400 font-mono">
                            {r.quantity}
                            {r.avgBuyPrice > 0 ? ` @ $${r.avgBuyPrice}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setOcrRows([])}
                      className="flex-1 border-white/[0.08] text-zinc-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleOCRConfirm}
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      {loading
                        ? "Adding..."
                        : `Confirm ${ocrRows.length} Holdings`}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Close */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
