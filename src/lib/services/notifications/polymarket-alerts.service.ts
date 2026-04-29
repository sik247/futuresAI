import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendGroupMessage } from "./telegram.service";
import { translateBatch } from "@/lib/services/social/korean-translator.service";
import { getSnapshotForText } from "./agents/price-snapshot.agent";

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

    // Pull live prices for any tickers referenced across the headlines so
    // commentary doesn't invent levels.
    const priceBlock = await getSnapshotForText(
      `${selected.map((m) => `${m.eventTitle} ${m.question}`).join(" ")}`
    );

    // Generate one-line AI commentary with market impact
    const commentary = await generatePolymarketCommentary(selected, priceBlock);

    let msg = `📊 <b>예측 시장 동향</b>\n\n`;

    for (let i = 0; i < selected.length; i++) {
      const m = selected[i];
      const koTitle = translated[i]?.translated || m.eventTitle;
      const changeStr = m.change24h !== 0
        ? ` (${m.change24h > 0 ? "+" : ""}${(m.change24h * 100).toFixed(1)}%)`
        : "";
      msg += `• <b>${koTitle}</b> — ${m.outcomes[0]} <b>${m.yesPct}%</b>${changeStr}\n`;
    }
    msg += `\n`;

    if (commentary) {
      msg += `${commentary}\n\n`;
    }

    msg += `<a href="https://futuresai.io/ko/markets">FuturesAI</a> · 다들 어떻게 보세요? 💬`;

    return await sendGroupMessage(msg);
  } catch (error) {
    console.error("[polymarket-alert]", error);
    return false;
  }
}

async function generatePolymarketCommentary(
  markets: { eventTitle: string; question: string; yesPct: string; change24h: number }[],
  priceBlock: string
): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const list = markets
      .map((m) => `"${m.eventTitle}" — ${m.question}: Yes ${m.yesPct}% (24h change: ${(m.change24h * 100).toFixed(1)}%)`)
      .join("\n");

    const priceLine = priceBlock
      ? `현재가 (이 가격만 인용. 다른 가격 만들어내지 말 것):\n${priceBlock}`
      : "가격 데이터 없음 — 구체적 달러 수치 인용 금지.";

    const prompt = `한국 크립토 트레이더가 텔레그램 단톡방에 던지는 1-2줄 채팅. AI 보고서 말투 절대 금지.

${priceLine}

예측 시장 이벤트:
${list}

정확히 2줄로 (HTML 태그 유지, 빈 줄 없음):
💬 [한 문장, 최대 80자. 가장 영향 큰 이벤트 1개 + 위 가격 1개 인용. 끝에 📈/📉/⚖️ 중 1개]
🎯 [롱/숏/관망] [⏸/🟢/🔴 1개]

규칙:
- 위에 안 적힌 가격은 절대 만들어내지 말 것.
- 금지 표현: "이것은 ~의미합니다", "~시사합니다", "투자자들이", "긍정적 반응", "추가적인 강세", "범위로 설정"
- 사용 어투: "~네", "~인 듯", "~할 듯", "~봐야할 듯", "~뚫으면", "~찍으면"
- 한 문장만, 풀어쓰지 말 것.
- 허용 이모지: 💬🎯📈📉⚖️⏸🟢🔴 만.

좋은 예:
💬 BTC 10만 돌파 확률 68% — 95K 매물 다 소화하면 단번에 갈 듯 📈
🎯 롱 🟢

💬 Fed 금리 인하 확률 떨어졌네, ETH 3,521 박스권 하단 깨질 위험 📉
🎯 관망 ⏸`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return "";
  }
}
