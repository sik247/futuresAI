import { GoogleGenerativeAI } from "@google/generative-ai";
import { runPriceAgent } from "@/lib/services/chart-analysis/agents/price.agent";
import { sendGroupMessage } from "./telegram.service";
import { cachedAI } from "@/lib/services/ai-cache";

const PAIRS = [
  { pair: "BTCUSDT", symbol: "BTC", name: "비트코인" },
  { pair: "ETHUSDT", symbol: "ETH", name: "이더리움" },
  { pair: "SOLUSDT", symbol: "SOL", name: "솔라나" },
];

const BINANCE_FUTURES = "https://fapi.binance.com";

function kstNow(): string {
  return new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function geminiKorean(prompt: string): Promise<string> {
  const cacheKey = `gemini-ko:${prompt.slice(0, 80)}`;
  return cachedAI(cacheKey, async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }, 30 * 60 * 1000);
}

/* ================================================================== */
/*  1. PRICE MOVEMENT ALERT (>3% in 4H)                               */
/* ================================================================== */
export async function checkPriceMovementAlert(): Promise<number> {
  let sent = 0;
  for (const p of PAIRS) {
    try {
      const data = await runPriceAgent(p.pair);
      const candles = data.recentCandles;
      if (candles.length < 2) continue;

      const prev = candles[candles.length - 2];
      const curr = candles[candles.length - 1];
      const pctChange = ((curr.close - prev.close) / prev.close) * 100;

      if (Math.abs(pctChange) < 3) continue;

      const direction = pctChange > 0 ? "급등" : "급락";
      const analysis = await geminiKorean(
        `${p.name}(${p.symbol})이 4시간 동안 ${pctChange.toFixed(1)}% ${direction}했습니다. 현재가 $${curr.close.toLocaleString()}. 이 움직임의 원인과 향후 전망을 한국어 2문장으로 분석하세요. 이모지 사용 금지.`
      );

      let msg = `<b>가격 ${direction} 알림</b> · ${kstNow()}\n\n`;
      msg += `<b>${p.symbol}/USDT</b>  $${prev.close.toLocaleString()} → $${curr.close.toLocaleString()}\n`;
      msg += `4시간 변동: <b>${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(2)}%</b>\n\n`;
      if (analysis) msg += `${analysis}\n\n`;
      msg += `<i>— FuturesAI</i>`;

      await sendGroupMessage(msg);
      sent++;
    } catch { /* skip pair */ }
  }
  return sent;
}

/* ================================================================== */
/*  2. FUNDING RATE MONITOR                                            */
/* ================================================================== */
export async function checkFundingRateAlert(): Promise<boolean> {
  try {
    const rates: { symbol: string; name: string; rate: number; extreme: boolean }[] = [];

    for (const p of PAIRS) {
      try {
        const res = await fetch(`${BINANCE_FUTURES}/fapi/v1/premiumIndex?symbol=${p.pair}`);
        if (!res.ok) continue;
        const data = await res.json();
        const rate = parseFloat(data.lastFundingRate) * 100; // Convert to percentage
        const extreme = Math.abs(rate) > 0.05;
        rates.push({ symbol: p.symbol, name: p.name, rate, extreme });
      } catch { /* skip */ }
    }

    const extremeRates = rates.filter((r) => r.extreme);
    if (extremeRates.length === 0) return false;

    let msg = `<b>펀딩비 경고</b> · ${kstNow()}\n\n`;

    for (const r of rates) {
      const emoji = r.extreme ? (r.rate > 0 ? "🔴" : "🟢") : "⚪";
      const label = r.rate > 0
        ? "롱이 숏에 지불 중"
        : "숏이 롱에 지불 중";
      const warning = r.extreme
        ? r.rate > 0 ? " (롱 과열 주의)" : " (숏 과열 주의)"
        : "";

      msg += `${emoji} <b>${r.symbol}</b> 펀딩비: ${r.rate >= 0 ? "+" : ""}${r.rate.toFixed(4)}%\n`;
      msg += `   ${label}${warning}\n\n`;
    }

    msg += `펀딩비가 극단적 수준입니다. 포지션 청산 위험에 유의하세요.\n\n`;
    msg += `<i>— FuturesAI</i>`;

    return await sendGroupMessage(msg);
  } catch (error) {
    console.error("[funding-rate]", error);
    return false;
  }
}

/* ================================================================== */
/*  3. LIQUIDATION ALERT                                               */
/* ================================================================== */
export async function checkLiquidationAlert(): Promise<boolean> {
  try {
    const liquidations: {
      symbol: string;
      longTotal: number;
      shortTotal: number;
    }[] = [];

    for (const p of PAIRS.slice(0, 2)) { // BTC, ETH only
      try {
        const res = await fetch(
          `${BINANCE_FUTURES}/fapi/v1/allForceOrders?symbol=${p.pair}&limit=100`
        );
        if (!res.ok) continue;
        const orders: any[] = await res.json();

        const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
        const recent = orders.filter((o) => o.time >= fourHoursAgo);

        let longTotal = 0;
        let shortTotal = 0;

        for (const o of recent) {
          const value = parseFloat(o.price) * parseFloat(o.origQty);
          if (o.side === "SELL") longTotal += value; // Liquidated long = forced sell
          else shortTotal += value; // Liquidated short = forced buy
        }

        if (longTotal + shortTotal > 0) {
          liquidations.push({ symbol: p.symbol, longTotal, shortTotal });
        }
      } catch { /* skip */ }
    }

    const totalLiq = liquidations.reduce(
      (sum, l) => sum + l.longTotal + l.shortTotal, 0
    );

    if (totalLiq < 10_000_000) return false; // Only alert if >$10M

    let msg = `<b>대규모 청산 알림</b> · ${kstNow()}\n\n`;
    msg += `최근 4시간 주요 청산 현황:\n\n`;

    for (const l of liquidations) {
      const longStr = `$${(l.longTotal / 1e6).toFixed(1)}M`;
      const shortStr = `$${(l.shortTotal / 1e6).toFixed(1)}M`;
      const bias = l.longTotal > l.shortTotal * 2
        ? "롱 집중 청산 (하락 압력)"
        : l.shortTotal > l.longTotal * 2
        ? "숏 집중 청산 (상승 압력)"
        : "양방향 청산";

      msg += `<b>${l.symbol}USDT</b>\n`;
      msg += `   롱 청산: ${longStr} | 숏 청산: ${shortStr}\n`;
      msg += `   → ${bias}\n\n`;
    }

    msg += `총 청산 규모: <b>$${(totalLiq / 1e6).toFixed(1)}M</b>\n\n`;
    msg += `<i>— FuturesAI</i>`;

    return await sendGroupMessage(msg);
  } catch (error) {
    console.error("[liquidation]", error);
    return false;
  }
}

/* ================================================================== */
/*  4. VOLUME SPIKE DETECTION (>2x average)                            */
/* ================================================================== */
export async function checkVolumeSpikeAlert(): Promise<number> {
  let sent = 0;
  for (const p of PAIRS) {
    try {
      const data = await runPriceAgent(p.pair);
      const candles = data.recentCandles;
      if (candles.length < 21) continue;

      const avg20 = candles.slice(-21, -1).reduce((sum, c) => sum + c.volume, 0) / 20;
      const latest = candles[candles.length - 1].volume;
      const ratio = latest / avg20;

      if (ratio < 2.0) continue;

      let msg = `<b>거래량 급증 알림</b> · ${kstNow()}\n\n`;
      msg += `<b>${p.symbol}/USDT</b>\n`;
      msg += `현재 4H 거래량: ${formatVol(latest)} (평균 대비 <b>${ratio.toFixed(1)}배</b>)\n`;
      msg += `20기간 평균: ${formatVol(avg20)}\n\n`;
      msg += `이례적인 거래량 급증은 큰 방향성 움직임의 전조일 수 있습니다.\n\n`;
      msg += `<i>— FuturesAI</i>`;

      await sendGroupMessage(msg);
      sent++;
    } catch { /* skip */ }
  }
  return sent;
}

/* ================================================================== */
/*  5. OPEN INTEREST CHANGES                                           */
/* ================================================================== */
export async function checkOpenInterestAlert(): Promise<boolean> {
  try {
    const alerts: {
      symbol: string;
      currentOI: number;
      change4h: number;
      priceChange: number;
      interpretation: string;
    }[] = [];

    for (const p of PAIRS) {
      try {
        const res = await fetch(
          `${BINANCE_FUTURES}/futures/data/openInterestHist?symbol=${p.pair}&period=4h&limit=6`
        );
        if (!res.ok) continue;
        const data: any[] = await res.json();
        if (data.length < 2) continue;

        const latest = parseFloat(data[data.length - 1].sumOpenInterestValue);
        const prev = parseFloat(data[data.length - 2].sumOpenInterestValue);
        const change4h = ((latest - prev) / prev) * 100;

        if (Math.abs(change4h) < 5) continue;

        // Get price for interpretation
        const priceData = await runPriceAgent(p.pair);
        const priceChange = priceData.changePercent24h;

        let interpretation: string;
        if (change4h > 0 && priceChange > 0) interpretation = "신규 롱 포지션 유입 (상승 베팅 증가)";
        else if (change4h > 0 && priceChange < 0) interpretation = "신규 숏 포지션 유입 (하락 베팅 증가)";
        else if (change4h < 0 && priceChange > 0) interpretation = "숏 청산 진행 중 (숏 스퀴즈)";
        else interpretation = "롱 청산 진행 중 (롱 언와인드)";

        alerts.push({
          symbol: p.symbol,
          currentOI: latest,
          change4h,
          priceChange,
          interpretation,
        });
      } catch { /* skip */ }
    }

    if (alerts.length === 0) return false;

    let msg = `<b>미결제약정 변동</b> · ${kstNow()}\n\n`;

    for (const a of alerts) {
      const oiStr = a.currentOI >= 1e9
        ? `$${(a.currentOI / 1e9).toFixed(1)}B`
        : `$${(a.currentOI / 1e6).toFixed(0)}M`;

      msg += `<b>${a.symbol}USDT</b>\n`;
      msg += `   OI: ${oiStr} (${a.change4h >= 0 ? "+" : ""}${a.change4h.toFixed(1)}% / 4H)\n`;
      msg += `   → ${a.interpretation}\n\n`;
    }

    msg += `<i>— FuturesAI</i>`;
    return await sendGroupMessage(msg);
  } catch (error) {
    console.error("[open-interest]", error);
    return false;
  }
}

/* ================================================================== */
/*  6. TAKER BUY/SELL RATIO (Exchange Flow Proxy)                      */
/* ================================================================== */
export async function checkExchangeFlowAlert(): Promise<boolean> {
  try {
    let msg = `<b>거래소 자금 흐름</b> · ${kstNow()}\n\n`;
    let hasData = false;

    for (const p of PAIRS) {
      try {
        const res = await fetch(
          `${BINANCE_FUTURES}/futures/data/takerlongshortRatio?symbol=${p.pair}&period=4h&limit=5`
        );
        if (!res.ok) continue;
        const data: any[] = await res.json();
        if (data.length === 0) continue;

        const latest = parseFloat(data[0].buyVol) / parseFloat(data[0].sellVol);
        const trend = data.slice(0, 3).map(
          (d: any) => parseFloat(d.buyVol) / parseFloat(d.sellVol)
        );
        const trendDir = trend[0] > trend[trend.length - 1] ? "상승 중" : "하락 중";
        const bias = latest > 1.2 ? "매수 우위" : latest < 0.8 ? "매도 우위" : "균형";

        msg += `<b>${p.symbol}</b> Taker 매수/매도 비율: ${latest.toFixed(2)} (${bias})\n`;
        msg += `   추세: ${trendDir}\n\n`;
        hasData = true;
      } catch { /* skip */ }
    }

    if (!hasData) return false;

    msg += `<i>— FuturesAI</i>`;
    return await sendGroupMessage(msg);
  } catch (error) {
    console.error("[exchange-flow]", error);
    return false;
  }
}

/* ================================================================== */
/*  COMBINED: Run all market alert checks (cron handler)               */
/* ================================================================== */
export async function runMarketAlertChecks(): Promise<{
  priceAlerts: number;
  volumeAlerts: number;
  liquidation: boolean;
  openInterest: boolean;
}> {
  // Run checks in sequence to avoid spam — max 3 messages per cycle
  let totalSent = 0;

  const liquidation = totalSent < 3 ? await checkLiquidationAlert() : false;
  if (liquidation) totalSent++;

  const priceAlerts = totalSent < 3 ? await checkPriceMovementAlert() : 0;
  totalSent += priceAlerts;

  const openInterest = totalSent < 3 ? await checkOpenInterestAlert() : false;
  if (openInterest) totalSent++;

  const volumeAlerts = totalSent < 3 ? await checkVolumeSpikeAlert() : 0;

  return { priceAlerts, volumeAlerts, liquidation, openInterest };
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */
function formatVol(vol: number): string {
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(0)}M`;
  return `$${vol.toFixed(0)}`;
}
