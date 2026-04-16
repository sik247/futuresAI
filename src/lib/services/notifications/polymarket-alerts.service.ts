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
  // Crypto
  "bitcoin", "btc", "ethereum", "eth", "solana", "sol", "crypto",
  "sec", "etf", "stablecoin", "defi", "binance", "coinbase",
  // Macro/rates
  "fed", "federal reserve", "interest rate", "rate cut", "rate hike",
  "inflation", "cpi", "ppi", "recession", "gdp", "employment", "jobs",
  // Commodities & geopolitical risk
  "oil", "crude", "hormuz", "opec", "gold", "commodity",
  "tariff", "trade war", "sanctions", "supply chain",
  // Geopolitics with market impact
  "trump", "china", "war", "conflict",
  // Financial markets
  "s&p", "nasdaq", "treasury", "bond", "yield", "dollar", "dxy",
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
    const [cryptoRes, economyRes] = await Promise.all([
      fetch("https://gamma-api.polymarket.com/events?closed=false&tag=crypto&limit=20", { cache: "no-store" }),
      fetch("https://gamma-api.polymarket.com/events?closed=false&tag=economics&limit=20", { cache: "no-store" }),
    ]);

    const allEvents: PolymarketEvent[] = [];
    if (cryptoRes.ok) allEvents.push(...(await cryptoRes.json()));
    if (economyRes.ok) allEvents.push(...(await economyRes.json()));

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

    let msg = `<b>📊 예측 시장 동향</b> · ${now} KST\n\n`;

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
      msg += `${m.outcomes[0]}: <b>${m.yesPct}%</b>${changeStr} | ${m.outcomes[1]}: ${m.noPct}%\n`;
      msg += `거래량: ${volStr}\n\n`;
    }

    if (commentary) {
      msg += `${commentary}\n\n`;
    }

    msg += `⚠️ 본 분석은 투자 조언이 아닙니다.\n`;
    msg += `<a href="https://futuresai.io/ko/markets">FuturesAI 예측 시장</a>\n`;
    msg += `<i>— FuturesAI드림</i>`;

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

    const prompt = `예측 시장 이벤트를 크립토 트레이딩 텔레그램 그룹을 위해 분석하세요.

이벤트:
${list}

정확히 이 형식으로 작성 (HTML 태그 유지):

<b>💡 시장 영향 분석</b>

3-4문장으로 작성:
- 각 이벤트가 크립토/주식 시장에 미치는 구체적 영향을 설명
- "X 확률이 Y%라는 건 → BTC/ETH에 [구체적 영향]을 의미합니다" 형식
- 매수/매도/관망 의견을 명확히 제시
- 마지막에 구체적 가격 레벨과 함께 대담한 예측 하나

🎯 추천: [매수/매도/관망] — [구체적 근거]

규칙: 모든 문장은 구체적 주장. "이것은 X를 의미합니다" 형식. 모호한 표현 금지. 강한 의견. 이모지는 💡🎯만 사용. 최대 500자.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return "";
  }
}
