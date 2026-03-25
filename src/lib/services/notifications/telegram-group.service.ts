import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchCryptoNews } from "@/lib/services/news/crypto-news.service";
import { translateBatch } from "@/lib/services/social/korean-translator.service";
import { sendGroupMessage } from "./telegram.service";

/**
 * Generate a short Korean market briefing from news headlines using Gemini AI.
 */
async function generateAIBriefing(headlines: string[]): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a Korean crypto market analyst. Based on these headlines, write a 2-3 sentence market briefing in Korean. Be concise, insightful, and mention the most important trend. Headlines:\n${headlines.join("\n")}`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return "";
  }
}

/**
 * Format a Korean news digest from the latest crypto news.
 */
async function formatNewsDigest(): Promise<string> {
  const news = await fetchCryptoNews();
  const top8 = news.slice(0, 8);

  if (top8.length === 0) {
    return "<b>📰 크립토 뉴스 브리핑</b>\n\n현재 뉴스를 가져올 수 없습니다.";
  }

  const titles = top8.map((item) => item.title);
  const [translated, aiBriefing] = await Promise.all([
    translateBatch(titles),
    generateAIBriefing(titles),
  ]);

  let msg = "";

  if (aiBriefing) {
    msg += `<b>🤖 AI 마켓 브리핑</b>\n${aiBriefing}\n\n`;
  }

  msg += "<b>📰 크립토 뉴스</b>\n";

  top8.forEach((item, i) => {
    const koreanTitle = translated[i]?.translated || item.title;
    msg += `\n${i + 1}. <b>${koreanTitle}</b>\n`;
    msg += `   <i>${item.source}</i> · <a href="${item.url}">기사 보기</a>\n`;
  });

  return msg;
}

/**
 * Format TradingView chart links for major crypto pairs.
 */
function formatChartLinks(): string {
  return (
    `<b>📊 실시간 차트</b>\n\n` +
    `📈 <a href="https://www.tradingview.com/chart/?symbol=BINANCE:BTCUSDT">BTC/USDT 실시간 차트</a>\n` +
    `📈 <a href="https://www.tradingview.com/chart/?symbol=BINANCE:ETHUSDT">ETH/USDT 실시간 차트</a>\n` +
    `📈 <a href="https://www.tradingview.com/chart/?symbol=BINANCE:SOLUSDT">SOL/USDT 실시간 차트</a>`
  );
}

/**
 * Send a combined news digest + chart links to the Telegram group.
 * @param period - 'morning' or 'evening' to determine the greeting
 */
export async function sendGroupDigest(
  period: "morning" | "evening"
): Promise<boolean> {
  try {
    const greeting =
      period === "morning"
        ? "좋은 아침입니다! 오늘의 크립토 브리핑입니다."
        : "저녁 크립토 업데이트입니다.";

    const newsDigest = await formatNewsDigest();
    const chartLinks = formatChartLinks();

    const message =
      `${greeting}\n\n` +
      `${newsDigest}\n\n` +
      `${chartLinks}` +
      `\n\n<i>— AlphAi Bot 🤖</i>`;

    return await sendGroupMessage(message);
  } catch (error) {
    console.error("[telegram-group] Failed to send group digest:", error);
    return false;
  }
}
