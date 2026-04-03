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
/*  Calculator 4: DCA (Dollar Cost Average) Calculator                  */
/* ------------------------------------------------------------------ */
function DcaCalc({ lang }: { lang: string }) {
  const ko = lang === "ko";
  const [investment, setInvestment] = useState("100");
  const [frequency, setFrequency] = useState("weekly");
  const [months, setMonths] = useState("12");
  const [currentPrice, setCurrentPrice] = useState("67000");
  const [expectedChange, setExpectedChange] = useState("50");

  const inv = parseFloat(investment) || 0;
  const m = parseInt(months) || 0;
  const price = parseFloat(currentPrice) || 0;
  const change = parseFloat(expectedChange) || 0;

  const multiplier = frequency === "daily" ? 30 : frequency === "weekly" ? 4.33 : frequency === "biweekly" ? 2.17 : 1;
  const totalBuys = Math.round(m * multiplier);
  const totalInvested = inv * totalBuys;
  const targetPrice = price * (1 + change / 100);
  const avgPrice = price * (1 + change / 200); // simplified avg
  const totalCoins = totalInvested / avgPrice;
  const portfolioValue = totalCoins * targetPrice;
  const profit = portfolioValue - totalInvested;
  const roi = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 shadow-lg shadow-black/20">
      <SectionTitle accentColor="bg-cyan-500/70">
        {ko ? "DCA 계산기" : "DCA Calculator"}
      </SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
        <InputField label={ko ? "투자 금액 ($)" : "Amount per buy ($)"} value={investment} onChange={setInvestment} min={1} step={10} />
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-zinc-500 font-mono uppercase tracking-[0.15em]">{ko ? "주기" : "Frequency"}</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm font-mono text-white focus:border-blue-500/50 outline-none transition-colors">
            <option value="daily">{ko ? "매일" : "Daily"}</option>
            <option value="weekly">{ko ? "매주" : "Weekly"}</option>
            <option value="biweekly">{ko ? "격주" : "Bi-weekly"}</option>
            <option value="monthly">{ko ? "매월" : "Monthly"}</option>
          </select>
        </div>
        <InputField label={ko ? "기간 (개월)" : "Duration (months)"} value={months} onChange={setMonths} min={1} max={120} />
        <InputField label={ko ? "현재 가격 ($)" : "Current Price ($)"} value={currentPrice} onChange={setCurrentPrice} min={0} step={100} />
        <InputField label={ko ? "예상 변동 (%)" : "Expected Change (%)"} value={expectedChange} onChange={setExpectedChange} min={-99} max={1000} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label={ko ? "총 매수 횟수" : "Total Buys"} value={`${totalBuys}`} />
        <StatCard label={ko ? "총 투자금" : "Total Invested"} value={`$${fmt(totalInvested, 0)}`} />
        <StatCard label={ko ? "평균 매입가" : "Avg Buy Price"} value={`$${fmt(avgPrice, 0)}`} />
        <StatCard label={ko ? "포트폴리오 가치" : "Portfolio Value"} value={`$${fmt(portfolioValue, 0)}`} valueClass={profit >= 0 ? "text-emerald-400" : "text-red-400"} />
        <StatCard label={ko ? "수익" : "Profit"} value={`${profit >= 0 ? "+" : ""}$${fmt(profit, 0)}`} valueClass={profit >= 0 ? "text-emerald-400" : "text-red-400"} />
        <StatCard label="ROI" value={`${roi >= 0 ? "+" : ""}${fmt(roi, 1)}%`} valueClass={roi >= 0 ? "text-emerald-400" : "text-red-400"} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Calculator 5: PnL Calculator                                        */
/* ------------------------------------------------------------------ */
function PnlCalc({ lang }: { lang: string }) {
  const ko = lang === "ko";
  const [entryPrice, setEntryPrice] = useState("67000");
  const [exitPrice, setExitPrice] = useState("70000");
  const [positionSize, setPositionSize] = useState("1000");
  const [leverage, setLeverage] = useState("10");
  const [direction, setDirection] = useState<Direction>("LONG");
  const [feeRate, setFeeRate] = useState("0.06");

  const entry = parseFloat(entryPrice) || 0;
  const exit = parseFloat(exitPrice) || 0;
  const size = parseFloat(positionSize) || 0;
  const lev = parseFloat(leverage) || 1;
  const fee = parseFloat(feeRate) || 0;

  const notional = size * lev;
  const priceDiff = direction === "LONG" ? exit - entry : entry - exit;
  const pctChange = entry > 0 ? (priceDiff / entry) * 100 : 0;
  const grossPnl = notional * (pctChange / 100);
  const totalFees = notional * (fee / 100) * 2; // entry + exit
  const netPnl = grossPnl - totalFees;
  const roe = size > 0 ? (netPnl / size) * 100 : 0;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 shadow-lg shadow-black/20">
      <SectionTitle accentColor="bg-emerald-500/70">
        {ko ? "손익 계산기" : "PnL Calculator"}
      </SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-zinc-500 font-mono uppercase tracking-[0.15em]">{ko ? "방향" : "Direction"}</label>
          <div className="flex gap-2">
            <button onClick={() => setDirection("LONG")}
              className={`flex-1 py-2.5 rounded-lg text-xs font-mono font-bold transition-all ${direction === "LONG" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-zinc-900/50 text-zinc-500 border border-white/[0.08]"}`}>LONG</button>
            <button onClick={() => setDirection("SHORT")}
              className={`flex-1 py-2.5 rounded-lg text-xs font-mono font-bold transition-all ${direction === "SHORT" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-zinc-900/50 text-zinc-500 border border-white/[0.08]"}`}>SHORT</button>
          </div>
        </div>
        <InputField label={ko ? "진입가 ($)" : "Entry Price ($)"} value={entryPrice} onChange={setEntryPrice} min={0} />
        <InputField label={ko ? "청산가 ($)" : "Exit Price ($)"} value={exitPrice} onChange={setExitPrice} min={0} />
        <InputField label={ko ? "증거금 ($)" : "Margin ($)"} value={positionSize} onChange={setPositionSize} min={0} />
        <InputField label={ko ? "레버리지" : "Leverage"} value={leverage} onChange={setLeverage} min={1} max={125} />
        <InputField label={ko ? "수수료 (%)" : "Fee Rate (%)"} value={feeRate} onChange={setFeeRate} min={0} max={1} step={0.01} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label={ko ? "포지션 크기" : "Notional"} value={`$${fmt(notional, 0)}`} />
        <StatCard label={ko ? "가격 변동" : "Price Change"} value={`${pctChange >= 0 ? "+" : ""}${fmt(pctChange, 2)}%`} valueClass={pctChange >= 0 ? "text-emerald-400" : "text-red-400"} />
        <StatCard label={ko ? "총 수수료" : "Total Fees"} value={`$${fmt(totalFees, 2)}`} valueClass="text-amber-400" />
        <StatCard label={ko ? "순 손익" : "Net PnL"} value={`${netPnl >= 0 ? "+" : ""}$${fmt(netPnl, 2)}`} valueClass={netPnl >= 0 ? "text-emerald-400" : "text-red-400"} />
        <StatCard label="ROE" value={`${roe >= 0 ? "+" : ""}${fmt(roe, 1)}%`} valueClass={roe >= 0 ? "text-emerald-400" : "text-red-400"} />
        <StatCard label={ko ? "손익비" : "Result"} value={netPnl >= 0 ? (ko ? "수익" : "Profit") : (ko ? "손실" : "Loss")} valueClass={netPnl >= 0 ? "text-emerald-400" : "text-red-400"} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tool 6: Margin & Leverage Quick Reference                           */
/* ------------------------------------------------------------------ */
function MarginReference({ lang }: { lang: string }) {
  const ko = lang === "ko";
  const leverages = [1, 2, 3, 5, 10, 20, 25, 50, 75, 100, 125];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 shadow-lg shadow-black/20">
      <SectionTitle accentColor="bg-rose-500/70">
        {ko ? "레버리지 & 마진 참고표" : "Leverage & Margin Reference"}
      </SectionTitle>
      <p className="text-xs text-zinc-500 mb-4">
        {ko ? "레버리지별 필요 마진, 1% 가격 변동 시 손익, 청산까지 거리를 한눈에 확인하세요." : "Quick reference for margin requirements, PnL per 1% move, and distance to liquidation."}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="border-b border-white/[0.06] text-zinc-500 uppercase tracking-wider">
              <th className="text-left py-2 pr-4">{ko ? "레버리지" : "Leverage"}</th>
              <th className="text-right py-2 px-3">{ko ? "마진 %" : "Margin %"}</th>
              <th className="text-right py-2 px-3">{ko ? "1% 이동 시 ROE" : "ROE per 1%"}</th>
              <th className="text-right py-2 px-3">{ko ? "청산 거리" : "Liq Distance"}</th>
              <th className="text-right py-2 pl-3">{ko ? "위험도" : "Risk"}</th>
            </tr>
          </thead>
          <tbody>
            {leverages.map((lev) => {
              const margin = 100 / lev;
              const roePer1 = lev;
              const liqDist = (100 / lev) * 0.9; // ~90% of margin
              const risk = lev <= 3 ? "low" : lev <= 10 ? "medium" : lev <= 25 ? "high" : "extreme";
              const riskColor = risk === "low" ? "text-emerald-400" : risk === "medium" ? "text-yellow-400" : risk === "high" ? "text-amber-400" : "text-red-400";
              const riskLabel = ko
                ? (risk === "low" ? "낮음" : risk === "medium" ? "보통" : risk === "high" ? "높음" : "극고")
                : (risk === "low" ? "Low" : risk === "medium" ? "Med" : risk === "high" ? "High" : "Extreme");
              return (
                <tr key={lev} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-2 pr-4 text-white font-bold">{lev}x</td>
                  <td className="py-2 px-3 text-right text-zinc-300">{fmt(margin, 1)}%</td>
                  <td className="py-2 px-3 text-right text-blue-400">{lev}%</td>
                  <td className="py-2 px-3 text-right text-zinc-300">~{fmt(liqDist, 1)}%</td>
                  <td className={`py-2 pl-3 text-right font-semibold ${riskColor}`}>{riskLabel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
      <PnlCalc lang={lang} />
      <LiquidationCalc lang={lang} />
      <DcaCalc lang={lang} />
      <MarginReference lang={lang} />
    </div>
  );
}
