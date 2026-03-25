import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchCryptoNews } from "@/lib/services/news/crypto-news.service";
import { fetchMarketSignals } from "@/lib/services/signals/signals.service";
import { translateBatch } from "@/lib/services/social/korean-translator.service";
import { sendGroupMessage, sendGroupPhoto } from "./telegram.service";

/* ------------------------------------------------------------------ */
/*  TradingView Mini Chart Image URLs (public widget snapshot)          */
/* ------------------------------------------------------------------ */
const CHART_PAIRS = [
  { symbol: "BINANCE:BTCUSDT", label: "BTC/USDT", emoji: "₿" },
  { symbol: "BINANCE:ETHUSDT", label: "ETH/USDT", emoji: "Ξ" },
  { symbol: "BINANCE:SOLUSDT", label: "SOL/USDT", emoji: "◎" },
];

function getTradingViewChartUrl(symbol: string): string {
  // TradingView mini chart widget image (public, no auth needed)
  return `https://s3.tradingview.com/widgetembed/?hideideas=1&overrides=&enabled_features=&disabled_features=&locale=kr&utm_source=&utm_medium=widget&utm_campaign=chart&symbol=${encodeURIComponent(symbol)}&interval=240&timezone=Asia/Seoul&theme=dark&style=1&withdateranges=1&hide_side_toolbar=0&allow_symbol_change=0&save_image=0&details=1&calendar=0`;
}

/* ------------------------------------------------------------------ */
/*  Korean signal labels                                                */
/* ------------------------------------------------------------------ */
const SIGNAL_KO: Record<string, string> = {
  "Strong Buy": "강력 매수",
  Buy: "매수",
  Neutral: "중립",
  Sell: "매도",
  "Strong Sell": "강력 매도",
};

const SIGNAL_EMOJI: Record<string, string> = {
  "Strong Buy": "🟢🟢",
  Buy: "🟢",
  Neutral: "⚪",
  Sell: "🔴",
  "Strong Sell": "🔴🔴",
};

/* ------------------------------------------------------------------ */
/*  AI 마켓 브리핑 (Korean market briefing via Gemini)                  */
/* ------------------------------------------------------------------ */
async function generateKoreanBriefing(
  headlines: string[],
  signals: { symbol: string; price: number; change24h: number; signal: string }[],
  fearGreed: { value: number; classification: string },
  btcTrend: string
): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const signalSummary = signals
      .map((s) => `${s.symbol}: $${s.price.toLocaleString()} (${s.change24h > 0 ? "+" : ""}${s.change24h.toFixed(2)}%) - ${s.signal}`)
      .join("\n");

    const prompt = `당신은 한국어로 작성하는 전문 크립토 시장 분석가입니다.

현재 시장 데이터:
${signalSummary}

공포탐욕지수: ${fearGreed.value}/100 (${fearGreed.classification})
BTC 트렌드: ${btcTrend === "above_sma" ? "7일 SMA 상향 돌파" : "7일 SMA 하향 이탈"}

최근 뉴스 헤드라인:
${headlines.slice(0, 5).join("\n")}

위 데이터를 바탕으로 3-4문장의 한국어 시장 분석을 작성하세요.
- 현재 시장 상황과 주요 코인 동향
- 주의해야 할 포인트
- 전문적이지만 이해하기 쉬운 한국어로 작성
- 이모지 사용 금지`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return "";
  }
}

/* ------------------------------------------------------------------ */
/*  퀀트 분석 포맷 (Korean quant analysis message)                     */
/* ------------------------------------------------------------------ */
function formatQuantAnalysis(
  signals: { symbol: string; price: number; change24h: number; volume24h: number; signal: string; confidence: number }[],
  fearGreed: { value: number; classification: string },
  btcTrend: string
): string {
  let msg = "<b>AI 퀀트 시그널</b>\n\n";

  for (const s of signals) {
    const sigKo = SIGNAL_KO[s.signal] || s.signal;
    const emoji = SIGNAL_EMOJI[s.signal] || "";
    const changeStr = `${s.change24h >= 0 ? "+" : ""}${s.change24h.toFixed(2)}%`;
    const volStr = s.volume24h >= 1e9
      ? `$${(s.volume24h / 1e9).toFixed(1)}B`
      : `$${(s.volume24h / 1e6).toFixed(0)}M`;

    msg += `${emoji} <b>${s.symbol}</b>  $${s.price.toLocaleString(undefined, { maximumFractionDigits: s.price > 100 ? 0 : 2 })}\n`;
    msg += `   ${changeStr} | 거래량 ${volStr} | 신뢰도 ${s.confidence}%\n`;
    msg += `   시그널: <b>${sigKo}</b>\n\n`;
  }

  // Fear & Greed
  const fgBar =
    fearGreed.value <= 25 ? "극도의 공포" :
    fearGreed.value <= 45 ? "공포" :
    fearGreed.value <= 55 ? "중립" :
    fearGreed.value <= 75 ? "탐욕" : "극도의 탐욕";

  msg += `<b>공포탐욕지수:</b> ${fearGreed.value}/100 (${fgBar})\n`;
  msg += `<b>BTC 추세:</b> ${btcTrend === "above_sma" ? "7일 SMA 상향 (강세)" : "7일 SMA 하향 (약세)"}\n`;

  return msg;
}

/* ------------------------------------------------------------------ */
/*  뉴스 다이제스트 (Korean news digest)                                */
/* ------------------------------------------------------------------ */
async function formatKoreanNewsDigest(): Promise<string> {
  const news = await fetchCryptoNews();
  const top6 = news.slice(0, 6);

  if (top6.length === 0) {
    return "<b>주요 뉴스</b>\n\n현재 뉴스를 가져올 수 없습니다.";
  }

  const titles = top6.map((item) => item.title);
  const translated = await translateBatch(titles);

  let msg = "<b>주요 크립토 뉴스</b>\n\n";

  top6.forEach((item, i) => {
    const koTitle = translated[i]?.translated || item.title;
    msg += `${i + 1}. <b>${koTitle}</b>\n`;
    msg += `   <i>${item.source}</i> · <a href="${item.url}">원문</a>\n\n`;
  });

  return msg;
}

/* ------------------------------------------------------------------ */
/*  차트 링크 (TradingView chart links)                                */
/* ------------------------------------------------------------------ */
function formatChartSection(): string {
  let msg = "<b>실시간 차트 (TradingView)</b>\n\n";
  for (const p of CHART_PAIRS) {
    msg += `${p.emoji} <a href="https://www.tradingview.com/chart/?symbol=${p.symbol}&interval=240">${p.label} 4시간봉</a>\n`;
  }
  return msg;
}

/* ------------------------------------------------------------------ */
/*  시간대별 인사말                                                     */
/* ------------------------------------------------------------------ */
function getKoreanGreeting(): { greeting: string; timeLabel: string } {
  const kstHour = (new Date().getUTCHours() + 9) % 24;

  if (kstHour >= 6 && kstHour < 10)
    return { greeting: "좋은 아침입니다!", timeLabel: "모닝 브리핑" };
  if (kstHour >= 10 && kstHour < 14)
    return { greeting: "점심 시간 업데이트입니다.", timeLabel: "오전 브리핑" };
  if (kstHour >= 14 && kstHour < 18)
    return { greeting: "오후 마켓 체크입니다.", timeLabel: "오후 브리핑" };
  if (kstHour >= 18 && kstHour < 22)
    return { greeting: "저녁 마켓 업데이트입니다.", timeLabel: "저녁 브리핑" };
  return { greeting: "심야 마켓 브리핑입니다.", timeLabel: "심야 브리핑" };
}

/* ------------------------------------------------------------------ */
/*  메인: 그룹 다이제스트 전송                                           */
/* ------------------------------------------------------------------ */
export async function sendGroupDigest(): Promise<boolean> {
  try {
    const { greeting, timeLabel } = getKoreanGreeting();

    // Fetch all data concurrently
    const [signals, newsDigest] = await Promise.all([
      fetchMarketSignals(),
      formatKoreanNewsDigest(),
    ]);

    // Generate AI briefing
    const headlines = (await fetchCryptoNews()).slice(0, 5).map((n) => n.title);
    const aiBriefing = await generateKoreanBriefing(
      headlines,
      signals.signals,
      signals.fearGreed,
      signals.btcTrend
    );

    // Format quant analysis
    const quantMsg = formatQuantAnalysis(
      signals.signals,
      signals.fearGreed,
      signals.btcTrend
    );

    const chartSection = formatChartSection();

    // Build full message
    const now = new Date().toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let message = `<b>${timeLabel}</b> · ${now}\n`;
    message += `${greeting}\n\n`;

    if (aiBriefing) {
      message += `<b>AI 마켓 분석</b>\n${aiBriefing}\n\n`;
    }

    message += `${quantMsg}\n`;
    message += `${newsDigest}\n`;
    message += `${chartSection}\n\n`;
    message += `무료 AI 차트 분석: cryptox.co\n`;
    message += `<i>— AlphAi Bot</i>`;

    // Send main message
    const sent = await sendGroupMessage(message);

    // Send BTC chart image separately (TradingView mini chart)
    try {
      const btcChartUrl = `https://www.tradingview.com/x/snapshot/?symbol=BINANCE:BTCUSDT&interval=240&theme=dark`;
      await sendGroupPhoto(
        btcChartUrl,
        `<b>BTC/USDT 4시간봉</b>\n현재가: $${signals.signals.find(s => s.symbol === "BTC")?.price.toLocaleString() || "N/A"}`,
      );
    } catch {
      // Chart image is optional, don't fail the digest
    }

    return sent;
  } catch (error) {
    console.error("[telegram-group] 그룹 다이제스트 전송 실패:", error);
    return false;
  }
}
