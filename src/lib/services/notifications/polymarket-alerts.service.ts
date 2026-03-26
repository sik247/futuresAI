import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendGroupMessage } from "./telegram.service";

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

/**
 * Fetch crypto polymarket events, find the most interesting/funny ones,
 * and send a Korean alert with AI commentary.
 */
export async function sendPolymarketAlert(): Promise<boolean> {
  try {
    // Fetch crypto prediction markets
    const res = await fetch(
      "https://gamma-api.polymarket.com/events?closed=false&tag=crypto&limit=20",
      { cache: "no-store" }
    );
    if (!res.ok) return false;
    const events: PolymarketEvent[] = await res.json();

    if (events.length === 0) return false;

    // Parse and find interesting markets
    const parsed = events.map((e) => {
      const markets = (e.markets || []).map((m: any) => {
        const prices = m.outcomePrices ? JSON.parse(m.outcomePrices) : [];
        const outcomes = m.outcomes ? JSON.parse(m.outcomes) : ["Yes", "No"];
        const yesPct = prices[0] ? (parseFloat(prices[0]) * 100).toFixed(0) : "50";
        const change = m.oneDayPriceChange ? parseFloat(m.oneDayPriceChange) : 0;
        return {
          question: m.question,
          yesPct,
          noPct: prices[1] ? (parseFloat(prices[1]) * 100).toFixed(0) : "50",
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

    // Pick top 3 most interesting: biggest 24h changes + highest volume
    const allMarkets = parsed.flatMap((e) =>
      e.markets.map((m) => ({
        eventTitle: e.title,
        eventId: e.id,
        ...m,
      }))
    );

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

    // Generate AI Korean commentary
    const commentary = await generatePolymarketCommentary(selected);

    const now = new Date().toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let msg = `<b>예측 시장 동향</b> · ${now}\n\n`;

    for (const m of selected) {
      const changeStr = m.change24h !== 0
        ? ` (${m.change24h > 0 ? "+" : ""}${(m.change24h * 100).toFixed(1)}%)`
        : "";
      const volStr = m.volume >= 1e6
        ? `$${(m.volume / 1e6).toFixed(1)}M`
        : m.volume >= 1e3
        ? `$${(m.volume / 1e3).toFixed(0)}K`
        : `$${m.volume.toFixed(0)}`;

      msg += `<b>${m.eventTitle}</b>\n`;
      if (m.question !== m.eventTitle) {
        msg += `${m.question}\n`;
      }
      msg += `${m.outcomes[0]}: <b>${m.yesPct}%</b>${changeStr} | ${m.outcomes[1]}: ${m.noPct}%\n`;
      msg += `거래량: ${volStr}\n\n`;
    }

    if (commentary) {
      msg += `<b>AI 코멘트</b>\n${commentary}\n\n`;
    }

    msg += `<a href="https://polymarket.com">Polymarket에서 더보기</a>\n`;
    msg += `<i>— FuturesAI</i>`;

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const list = markets
      .map((m) => `"${m.eventTitle}" — ${m.question}: Yes ${m.yesPct}% (24h 변동: ${(m.change24h * 100).toFixed(1)}%)`)
      .join("\n");

    const prompt = `당신은 크립토 예측 시장 전문 해설자입니다. Polymarket의 최신 예측 시장 데이터를 재미있고 통찰력 있게 한국어로 해설하세요.

현재 주목할 만한 마켓:
${list}

2-3문장으로 작성하세요:
- 가장 흥미로운 확률 변동과 그 의미
- 시장 참여자들이 무엇에 베팅하고 있는지
- 재미있거나 의외인 포인트가 있으면 언급
- 자연스럽고 캐주얼한 톤 (딱딱하지 않게)
이모지 사용 금지.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return "";
  }
}
