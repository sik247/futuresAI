import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendGroupMessage } from "./telegram.service";
import { translateBatch } from "@/lib/services/social/korean-translator.service";

type PolymarketEvent = {
  id: string;
  title: string;
  slug: string;
  volume: string;
  endDate: string;
  markets: {
    question: string;
    outcomePrices: string;
    outcomes: string;
    volume: string;
    oneDayPriceChange?: string;
  }[];
};

// Only show markets related to these topics
const RELEVANT_KEYWORDS = [
  "bitcoin", "btc", "ethereum", "eth", "solana", "sol", "crypto",
  "fed", "federal reserve", "interest rate", "inflation", "cpi",
  "recession", "gdp", "s&p", "nasdaq", "stock market", "tariff",
  "sec", "etf", "stablecoin", "defi", "trump", "trade war",
  "china", "war", "oil", "gold", "dollar", "treasury",
];

function isRelevantMarket(title: string, question: string): boolean {
  const text = `${title} ${question}`.toLowerCase();
  return RELEVANT_KEYWORDS.some((kw) => text.includes(kw));
}

/**
 * Fetch polymarket events relevant to crypto/US markets/geopolitics,
 * translate titles, add AI commentary with market impact, and send.
 */
export async function sendPolymarketAlert(): Promise<boolean> {
  try {
    // Fetch multiple categories in parallel
    const [cryptoRes, politicsRes] = await Promise.all([
      fetch("https://gamma-api.polymarket.com/events?closed=false&tag=crypto&limit=20", { cache: "no-store" }),
      fetch("https://gamma-api.polymarket.com/events?closed=false&tag=politics&limit=20", { cache: "no-store" }),
    ]);

    const allEvents: PolymarketEvent[] = [];
    if (cryptoRes.ok) allEvents.push(...(await cryptoRes.json()));
    if (politicsRes.ok) allEvents.push(...(await politicsRes.json()));

    if (allEvents.length === 0) return false;

    // Parse and filter to relevant markets only
    const parsed = allEvents.map((e) => {
      const markets = (e.markets || []).map((m: any) => {
        const prices = m.outcomePrices ? JSON.parse(m.outcomePrices) : [];
        const outcomes = m.outcomes ? JSON.parse(m.outcomes) : ["Yes", "No"];
        const yesPct = prices[0] ? (parseFloat(prices[0]) * 100).toFixed(1) : "50.0";
        const change = m.oneDayPriceChange ? parseFloat(m.oneDayPriceChange) : 0;
        return {
          question: m.question,
          yesPct,
          noPct: prices[1] ? (parseFloat(prices[1]) * 100).toFixed(1) : "50.0",
          outcomes,
          change24h: change,
          volume: parseFloat(m.volume || "0"),
        };
      });

      return {
        id: e.id,
        title: e.title,
        totalVolume: parseFloat(e.volume || "0"),
        endDate: e.endDate,
        markets,
      };
    });

    // Flatten and filter to relevant topics only
    const allMarkets = parsed.flatMap((e) =>
      e.markets
        .filter((m) => isRelevantMarket(e.title, m.question))
        .map((m) => ({
          eventTitle: e.title,
          eventId: e.id,
          ...m,
        }))
    );

    if (allMarkets.length === 0) return false;

    // Sort by absolute 24h change (biggest movers first)
    const bigMovers = allMarkets
      .filter((m) => Math.abs(m.change24h) > 0.01)
      .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
      .slice(0, 3);

    // Sort by volume (hottest markets)
    const hottest = allMarkets
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 3);

    // Combine, deduplicate
    const selected = [...bigMovers, ...hottest]
      .filter((m, i, arr) => arr.findIndex((x) => x.question === m.question) === i)
      .slice(0, 4);

    if (selected.length === 0) return false;

    // Translate event titles to Korean
    const titles = selected.map((m) => m.question);
    const translated = await translateBatch(titles);

    // Generate bilingual AI commentary with market impact
    const commentary = await generatePolymarketCommentary(selected);

    const now = new Date().toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let msg = `<b>예측 시장 동향 | Prediction Markets</b> · ${now} KST\n\n`;

    for (let i = 0; i < selected.length; i++) {
      const m = selected[i];
      const koTitle = translated[i]?.translated || m.eventTitle;
      const changeStr = m.change24h !== 0
        ? ` (${m.change24h > 0 ? "+" : ""}${(m.change24h * 100).toFixed(1)}%)`
        : "";
      const volStr = m.volume >= 1e6
        ? `$${(m.volume / 1e6).toFixed(1)}M`
        : m.volume >= 1e3
        ? `$${(m.volume / 1e3).toFixed(0)}K`
        : `$${m.volume.toFixed(0)}`;

      msg += `<b>${koTitle}</b>\n`;
      if (m.question !== m.eventTitle) {
        msg += `<i>${m.question}</i>\n`;
      } else {
        msg += `<i>${m.eventTitle}</i>\n`;
      }
      msg += `${m.outcomes[0]}: <b>${m.yesPct}%</b>${changeStr} | ${m.outcomes[1]}: ${m.noPct}%\n`;
      msg += `Volume: ${volStr}\n\n`;
    }

    if (commentary) {
      msg += `${commentary}\n\n`;
    }

    msg += `이 예측에 동의하시나요? 의견을 남겨주세요!\nDo you agree with these odds? Share your prediction!\n\n`;
    msg += `<a href="https://futuresai.io/ko/markets">FuturesAI 예측 시장 | Prediction Markets</a>\n`;
    msg += `<i>— FuturesAI Quant Desk</i>`;

    return await sendGroupMessage(msg);
  } catch (error) {
    console.error("[polymarket-alert]", error);
    return false;
  }
}

async function generatePolymarketCommentary(
  markets: { eventTitle: string; question: string; yesPct: string; change24h: number }[]
): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const list = markets
      .map((m) => `"${m.eventTitle}" — ${m.question}: Yes ${m.yesPct}% (24h change: ${(m.change24h * 100).toFixed(1)}%)`)
      .join("\n");

    const prompt = `Analyze these prediction market events for a Korean crypto trading Telegram group.

Events:
${list}

Write EXACTLY in this format (keep the bold HTML tags):

<b>이건 → 이런 의미 | What This Means</b>

[Korean 3-4 sentences]: 각 이벤트가 크립토/주식 시장에 미치는 구체적 영향을 설명. "X 확률이 Y%라는 건 → BTC/ETH에 [구체적 영향]을 의미합니다" 형식. 매수/매도 의견을 명확히. 마지막에 대담한 예측 하나.

---

[English 3-4 sentences]: "X at Y% probability means → [specific impact] for crypto." Connect each prediction to a concrete trading implication. Give a bold opinion on positioning. End with a specific call.

Rules: No emojis. Every sentence = concrete claim. "This means X" format, never vague. Strong opinions.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return "";
  }
}
