import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendGroupMessage } from "./telegram.service";

const COINS = [
  { pair: "BTCUSDT", symbol: "BTC", name: "비트코인" },
  { pair: "ETHUSDT", symbol: "ETH", name: "이더리움" },
  { pair: "SOLUSDT", symbol: "SOL", name: "솔라나" },
];

const LEVERAGE_LEVELS = [100, 50, 25, 10];

const BINANCE_ENDPOINTS = [
  "https://fapi.binance.com",
  "https://fapi1.binance.com",
];

async function fetchBinanceFutures(path: string): Promise<any> {
  for (const base of BINANCE_ENDPOINTS) {
    try {
      const res = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return res.json();
    } catch { continue; }
  }
  return null;
}

type CoinData = {
  symbol: string;
  name: string;
  price: number;
  openInterest: number;
  longShortRatio: number;
  topTraderLongPct: number;
};

async function fetchCoinData(coin: typeof COINS[number]): Promise<CoinData | null> {
  try {
    const [priceData, oiData, lsData, topData] = await Promise.all([
      fetchBinanceFutures(`/fapi/v1/ticker/price?symbol=${coin.pair}`),
      fetchBinanceFutures(`/fapi/v1/openInterest?symbol=${coin.pair}`),
      fetchBinanceFutures(`/futures/data/globalLongShortAccountRatio?symbol=${coin.pair}&period=4h&limit=1`),
      fetchBinanceFutures(`/futures/data/topLongShortPositionRatio?symbol=${coin.pair}&period=4h&limit=1`),
    ]);

    if (!priceData || !oiData) return null;

    const price = parseFloat(priceData.price);
    const openInterest = parseFloat(oiData.openInterest) * price;

    const longShortRatio = lsData?.[0]
      ? parseFloat(lsData[0].longShortRatio)
      : 1.0;

    const topTraderLongPct = topData?.[0]
      ? parseFloat(topData[0].longAccount) * 100
      : 50;

    return { symbol: coin.symbol, name: coin.name, price, openInterest, longShortRatio, topTraderLongPct };
  } catch {
    return null;
  }
}

function calcLiqPrice(price: number, leverage: number, isLong: boolean): number {
  const margin = 1 / leverage;
  if (isLong) {
    return price * (1 - margin + 0.004);
  } else {
    return price * (1 + margin - 0.004);
  }
}

// Telegram-safe bar using simple characters that render well on all clients
function buildBar(density: number, maxWidth: number = 12): string {
  const filled = Math.max(1, Math.min(maxWidth, Math.round(density * maxWidth)));
  const empty = maxWidth - filled;
  return "▓".repeat(filled) + "░".repeat(empty);
}

// Danger level indicator based on proximity and density
function dangerEmoji(pctAway: number): string {
  const abs = Math.abs(pctAway);
  if (abs <= 1) return "🔴";
  if (abs <= 3) return "🟠";
  if (abs <= 5) return "🟡";
  return "⚪";
}

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
}

function formatOI(oi: number): string {
  if (oi >= 1e9) return `$${(oi / 1e9).toFixed(1)}B`;
  return `$${(oi / 1e6).toFixed(0)}M`;
}

function buildCoinSection(data: CoinData): string {
  const shortDensityBase = 1 / (1 + data.longShortRatio);
  const longDensityBase = data.longShortRatio / (1 + data.longShortRatio);

  // Determine overall bias
  const biasEmoji = data.longShortRatio > 1.2 ? "🔴 롱 과밀" :
    data.longShortRatio < 0.8 ? "🟢 숏 과밀" : "⚖️ 균형";

  let section = `\n<b>┌─ ${data.symbol}/USDT ─ ${formatPrice(data.price)} ─ ${biasEmoji}</b>\n`;
  section += `│\n`;

  // Short liquidation zones (price goes UP)
  section += `│ <b>⬆️ 숏 청산 (가격↑)</b>\n`;
  for (const lev of LEVERAGE_LEVELS) {
    const liqPrice = calcLiqPrice(data.price, lev, false);
    const pct = ((liqPrice - data.price) / data.price * 100);
    const density = shortDensityBase * (lev / 100) * 0.9 + 0.1;
    const bar = buildBar(density);
    const danger = dangerEmoji(pct);
    section += `│ ${danger} ${formatPrice(liqPrice)} <b>+${pct.toFixed(1)}%</b> ${lev}x ${bar}\n`;
  }

  section += `│\n`;

  // Long liquidation zones (price goes DOWN)
  section += `│ <b>⬇️ 롱 청산 (가격↓)</b>\n`;
  for (const lev of LEVERAGE_LEVELS) {
    const liqPrice = calcLiqPrice(data.price, lev, true);
    const pct = ((liqPrice - data.price) / data.price * 100);
    const density = longDensityBase * (lev / 100) * 0.9 + 0.1;
    const bar = buildBar(density);
    const danger = dangerEmoji(pct);
    section += `│ ${danger} ${formatPrice(liqPrice)} <b>${pct.toFixed(1)}%</b> ${lev}x ${bar}\n`;
  }

  section += `│\n`;
  section += `│ 미결제약정 ${formatOI(data.openInterest)} · 롱/숏 ${data.longShortRatio.toFixed(2)} · 탑 트레이더 롱 ${data.topTraderLongPct.toFixed(0)}%\n`;
  section += `└──────────────────\n`;

  return section;
}

async function generateAIAnalysis(coins: CoinData[]): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const summary = coins.map(c => {
      const shortLiq100x = calcLiqPrice(c.price, 100, false);
      const longLiq100x = calcLiqPrice(c.price, 100, true);
      return `${c.symbol}: 현재가 ${formatPrice(c.price)}, OI ${formatOI(c.openInterest)}, 롱/숏 ${c.longShortRatio.toFixed(2)}, 탑트레이더 롱 ${c.topTraderLongPct.toFixed(0)}%, 100x 숏청산 ${formatPrice(shortLiq100x)}, 100x 롱청산 ${formatPrice(longLiq100x)}`;
    }).join("\n");

    const result = await model.generateContent(`당신은 파생상품 전문 퀀트 애널리스트입니다.

현재 청산 히트맵 데이터:
${summary}

3-4문장으로 분석하세요:
1. 어느 방향(롱/숏)에 청산 캐스케이드 위험이 더 큰지
2. 주시해야 할 핵심 가격 레벨과 그 이유
3. 구체적인 매수/매도/관망 추천 (가격 레벨 포함)

전문적이고 단정적인 톤. 최대 400자. 마크다운, 해시태그 금지. 이모지 금지.`);

    return result.response.text().trim();
  } catch {
    return "";
  }
}

export async function generateLiquidationHeatmap(): Promise<boolean> {
  try {
    const results = await Promise.all(COINS.map(fetchCoinData));
    const validCoins = results.filter((r): r is CoinData => r !== null);

    if (validCoins.length === 0) {
      console.error("[liquidation-heatmap] No coin data available");
      return false;
    }

    const now = new Date().toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // AI analysis
    const analysis = await generateAIAnalysis(validCoins);

    // Always split per-coin for clean readable messages
    for (let i = 0; i < validCoins.length; i++) {
      const coin = validCoins[i];
      let msg = "";

      if (i === 0) {
        msg += `🔥 <b>청산 히트맵 리포트</b> · ${now} KST\n`;
        msg += `<i>레버리지별 예상 청산 가격 · 🔴근접 🟠주의 🟡관찰 ⚪안전</i>\n`;
      }

      msg += buildCoinSection(coin);

      // Add AI analysis and footer to last coin
      if (i === validCoins.length - 1) {
        if (analysis) {
          msg += `\n💡 <b>AI 분석</b>\n${analysis}\n`;
        }
        msg += `\n여러분은 어떤 포지션을 잡고 계신가요? 💬\n\n`;
        msg += `⚠️ 본 분석은 투자 조언이 아닙니다.\n`;
        msg += `<a href="https://futuresai.io/ko/home">FuturesAI 실시간 분석</a>\n`;
        msg += `<i>— FuturesAI드림</i>`;
      }

      await sendGroupMessage(msg);

      if (i < validCoins.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    return true;
  } catch (error) {
    console.error("[liquidation-heatmap] Failed:", error);
    return false;
  }
}
