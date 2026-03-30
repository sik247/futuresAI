"use client";

import React, { useState, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
type Direction = "LONG" | "SHORT";

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */
function SectionTitle({
  children,
  accentColor = "bg-blue-500/70",
}: {
  children: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-1 h-5 rounded-full ${accentColor}`} />
      <h2 className="text-base font-semibold text-zinc-200">{children}</h2>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "number",
  min,
  max,
  step,
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-zinc-500 font-mono uppercase tracking-[0.15em]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-900/50 border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm font-mono text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-colors"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass = "text-white",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
      <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-[0.12em] mb-1">
        {label}
      </p>
      <p className={`text-lg font-mono font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function fmt(n: number, decimals = 2): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/* ------------------------------------------------------------------ */
/*  Calculator 1: Position Size Calculator                             */
/* ------------------------------------------------------------------ */
function PositionSizeCalc({ lang }: { lang: string }) {
  const ko = lang === "ko";

  const [accountSize, setAccountSize] = useState("10000");
  const [riskPct, setRiskPct] = useState("2");
  const [entry, setEntry] = useState("");
  const [stopLoss, setStopLoss] = useState("");

  const results = useMemo(() => {
    const acc = parseFloat(accountSize);
    const risk = parseFloat(riskPct);
    const ent = parseFloat(entry);
    const sl = parseFloat(stopLoss);

    if (!isFinite(acc) || !isFinite(risk) || !isFinite(ent) || !isFinite(sl)) {
      return null;
    }

    const riskAmount = (acc * risk) / 100;
    const priceDistance = Math.abs(ent - sl);
    if (priceDistance === 0) return null;

    const positionSize = riskAmount / priceDistance;
    const positionValue = positionSize * ent;
    const rawLeverage = positionValue / acc;
    const suggestedLeverage = Math.min(Math.ceil(rawLeverage), 20);

    return { riskAmount, priceDistance, positionSize, positionValue, suggestedLeverage };
  }, [accountSize, riskPct, entry, stopLoss]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
      <SectionTitle accentColor="bg-blue-500/70">
        {ko ? "포지션 크기 계산기" : "Position Size Calculator"}
      </SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <InputField
          label={ko ? "계정 크기 ($)" : "Account Size ($)"}
          value={accountSize}
          onChange={setAccountSize}
          min={0}
          step={100}
        />
        <InputField
          label={ko ? `리스크 (%) — 0.5~10` : "Risk (%) — 0.5–10"}
          value={riskPct}
          onChange={setRiskPct}
          min={0.5}
          max={10}
          step={0.5}
        />
        <InputField
          label={ko ? "진입 가격 ($)" : "Entry Price ($)"}
          value={entry}
          onChange={setEntry}
          min={0}
          step={0.01}
          placeholder="0.00"
        />
        <InputField
          label={ko ? "손절 가격 ($)" : "Stop Loss Price ($)"}
          value={stopLoss}
          onChange={setStopLoss}
          min={0}
          step={0.01}
          placeholder="0.00"
        />
      </div>

      {results ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            label={ko ? "리스크 금액" : "Risk Amount"}
            value={`$${fmt(results.riskAmount)}`}
            valueClass="text-red-400"
          />
          <StatCard
            label={ko ? "거리" : "Price Distance"}
            value={`$${fmt(results.priceDistance)}`}
          />
          <StatCard
            label={ko ? "포지션 크기" : "Position Size (units)"}
            value={fmt(results.positionSize, 4)}
            valueClass="text-blue-400"
          />
          <StatCard
            label={ko ? "포지션 가치" : "Position Value"}
            value={`$${fmt(results.positionValue)}`}
          />
          <StatCard
            label={ko ? "레버리지 (추천)" : "Suggested Leverage"}
            value={`${results.suggestedLeverage}x`}
            valueClass={results.suggestedLeverage >= 10 ? "text-amber-400" : "text-emerald-400"}
          />
        </div>
      ) : (
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 text-center">
          <p className="text-xs text-zinc-600 font-mono">
            {ko ? "위 항목을 모두 입력하면 결과가 표시됩니다." : "Fill in all fields above to see results."}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Calculator 2: Risk/Reward Calculator                               */
/* ------------------------------------------------------------------ */
function RiskRewardCalc({ lang }: { lang: string }) {
  const ko = lang === "ko";

  const [entry, setEntry] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");

  const results = useMemo(() => {
    const ent = parseFloat(entry);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);

    if (!isFinite(ent) || !isFinite(sl) || !isFinite(tp) || ent === 0) {
      return null;
    }

    const risk = Math.abs(ent - sl);
    const reward = Math.abs(tp - ent);
    if (risk === 0) return null;

    const rrRatio = reward / risk;
    const riskPct = (risk / ent) * 100;
    const requiredWinRate = (1 / (1 + rrRatio)) * 100;

    return { risk, reward, rrRatio, riskPct, requiredWinRate };
  }, [entry, stopLoss, takeProfit]);

  const riskWidth = results
    ? Math.round((results.risk / (results.risk + results.reward)) * 100)
    : 50;
  const rewardWidth = 100 - riskWidth;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
      <SectionTitle accentColor="bg-purple-500/70">
        {ko ? "리스크/리워드 계산기" : "Risk/Reward Calculator"}
      </SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <InputField
          label={ko ? "진입 가격 ($)" : "Entry Price ($)"}
          value={entry}
          onChange={setEntry}
          min={0}
          step={0.01}
          placeholder="0.00"
        />
        <InputField
          label={ko ? "손절 가격 ($)" : "Stop Loss ($)"}
          value={stopLoss}
          onChange={setStopLoss}
          min={0}
          step={0.01}
          placeholder="0.00"
        />
        <InputField
          label={ko ? "목표가 ($)" : "Take Profit ($)"}
          value={takeProfit}
          onChange={setTakeProfit}
          min={0}
          step={0.01}
          placeholder="0.00"
        />
      </div>

      {results ? (
        <>
          {/* Visual R:R bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-[0.1em]">
                {ko ? "리스크" : "Risk"} {riskWidth}%
              </span>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-[0.1em]">
                {ko ? "리워드" : "Reward"} {rewardWidth}%
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden flex bg-white/[0.04]">
              <div
                className="bg-red-500/70 transition-all duration-500"
                style={{ width: `${riskWidth}%` }}
              />
              <div
                className="bg-emerald-500/70 transition-all duration-500 flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard
              label={ko ? "리스크" : "Risk"}
              value={`$${fmt(results.risk)}`}
              valueClass="text-red-400"
            />
            <StatCard
              label={ko ? "리워드" : "Reward"}
              value={`$${fmt(results.reward)}`}
              valueClass="text-emerald-400"
            />
            <StatCard
              label="R:R Ratio"
              value={`1:${fmt(results.rrRatio, 2)}`}
              valueClass={results.rrRatio >= 2 ? "text-emerald-400" : results.rrRatio >= 1 ? "text-amber-400" : "text-red-400"}
            />
            <StatCard
              label={ko ? "리스크 %" : "Risk %"}
              value={`${fmt(results.riskPct, 2)}%`}
              valueClass="text-zinc-300"
            />
            <StatCard
              label={ko ? "필요 승률" : "Required Win Rate"}
              value={`${fmt(results.requiredWinRate, 1)}%`}
              valueClass="text-blue-400"
            />
          </div>
        </>
      ) : (
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 text-center">
          <p className="text-xs text-zinc-600 font-mono">
            {ko ? "위 항목을 모두 입력하면 결과가 표시됩니다." : "Fill in all fields above to see results."}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Calculator 3: Liquidation Price Calculator                         */
/* ------------------------------------------------------------------ */
function LiquidationCalc({ lang }: { lang: string }) {
  const ko = lang === "ko";

  const [entry, setEntry] = useState("");
  const [leverage, setLeverage] = useState("10");
  const [direction, setDirection] = useState<Direction>("LONG");
  const [positionSize, setPositionSize] = useState("1000");

  const results = useMemo(() => {
    const ent = parseFloat(entry);
    const lev = parseFloat(leverage);
    const pos = parseFloat(positionSize);

    if (!isFinite(ent) || !isFinite(lev) || lev <= 0 || !isFinite(pos)) {
      return null;
    }

    const liquidation =
      direction === "LONG"
        ? ent * (1 - 1 / lev)
        : ent * (1 + 1 / lev);

    const distance = (Math.abs(liquidation - ent) / ent) * 100;
    const marginRequired = pos / lev;

    return { liquidation, distance, marginRequired };
  }, [entry, leverage, direction, positionSize]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
      <SectionTitle accentColor="bg-amber-500/70">
        {ko ? "청산 가격 계산기" : "Liquidation Price Calculator"}
      </SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <InputField
          label={ko ? "진입 가격 ($)" : "Entry Price ($)"}
          value={entry}
          onChange={setEntry}
          min={0}
          step={0.01}
          placeholder="0.00"
        />
        <InputField
          label={ko ? "레버리지 (1~125x)" : "Leverage (1–125x)"}
          value={leverage}
          onChange={setLeverage}
          min={1}
          max={125}
          step={1}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-zinc-500 font-mono uppercase tracking-[0.15em]">
            {ko ? "방향" : "Direction"}
          </label>
          <div className="flex gap-2">
            {(["LONG", "SHORT"] as Direction[]).map((d) => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-mono font-semibold border transition-all duration-200 ${
                  direction === d
                    ? d === "LONG"
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                      : "bg-red-500/20 border-red-500/40 text-red-400"
                    : "bg-zinc-900/50 border-white/[0.08] text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <InputField
          label={ko ? "포지션 크기 ($)" : "Position Size ($)"}
          value={positionSize}
          onChange={setPositionSize}
          min={0}
          step={100}
        />
      </div>

      {results ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            label={ko ? "청산 가격" : "Liquidation Price"}
            value={`$${fmt(results.liquidation)}`}
            valueClass={direction === "LONG" ? "text-red-400" : "text-red-400"}
          />
          <StatCard
            label={ko ? "거리" : "Distance"}
            value={`${fmt(results.distance, 2)}%`}
            valueClass="text-amber-400"
          />
          <StatCard
            label={ko ? "필요 증거금" : "Margin Required"}
            value={`$${fmt(results.marginRequired)}`}
            valueClass="text-blue-400"
          />
        </div>
      ) : (
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 text-center">
          <p className="text-xs text-zinc-600 font-mono">
            {ko ? "위 항목을 모두 입력하면 결과가 표시됩니다." : "Fill in all fields above to see results."}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                         */
/* ------------------------------------------------------------------ */
export default function QuantTools({ lang }: { lang: string }) {
  return (
    <div className="flex flex-col gap-6">
      <PositionSizeCalc lang={lang} />
      <RiskRewardCalc lang={lang} />
      <LiquidationCalc lang={lang} />
    </div>
  );
}
