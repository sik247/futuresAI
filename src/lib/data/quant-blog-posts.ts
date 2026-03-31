export interface QuantBlogPost {
  id: string;
  slug: string;
  title: string;
  titleKo: string;
  excerpt: string;
  excerptKo: string;
  content: string;
  coin: string;
  symbol: string;
  direction: "LONG" | "SHORT" | "NEUTRAL";
  chartImage: string;
  price: number;
  change24h: number;
  rsi: number;
  publishedAt: string;
  author: string;
}

export const QUANT_BLOG_POSTS: QuantBlogPost[] = [
  {
    id: "btc-4h-analysis-20260331",
    slug: "bitcoin-tests-critical-68k-resistance-4h-analysis",
    title: "Bitcoin Tests Critical $68K Resistance: 4H Analysis",
    titleKo: "비트코인, 핵심 $68K 저항선 테스트: 4시간봉 분석",
    excerpt:
      "BTC printed a higher low at $65,200 on the 4H chart before reclaiming $67,700. The recovery is constructive, but sustained acceptance above $68,500 is required to invalidate the bearish structure from the $73K all-time high.",
    excerptKo:
      "4시간봉 기준 $65,200에서 고점 저점을 형성한 후 $67,700을 회복했습니다. 회복세는 긍정적이나, $73K 고점 이후 약세 구조를 완전히 무효화하려면 $68,500 위에서 지속적인 안착이 필요합니다.",
    content: `## Structure

The 4H chart shows BTC grinding inside a 10-day compression range between $63,800 and $68,500. The current candle at $67,721 sits at the upper boundary of this range. A prior failed breakout attempt topped at $68,420 before reversing sharply — that wick is now the critical short-term resistance.

## Key Levels

**Resistance:** $68,500 (range top / failed breakout wick), $70,200 (December consolidation base), $73,000 (all-time high)

**Support:** $66,800 (4H 50 EMA), $65,200 (recent swing low / demand zone), $63,800 (range bottom)

## RSI / MACD

RSI at 52 is mid-range and neutral. The prior oversold read at 31 (when BTC dipped to $63,800) has fully unwound, suggesting the mean-reversion leg is near its limit. MACD histogram is slightly positive at +48 but the signal-line crossover occurred on low volume — not a strong conviction signal.

The weekly RSI at 48 has crossed below 50 for the first time since January 2023, which historically marked intermediate-term distribution phases. That context argues against chasing a long here.

## Volume Profile

On-chain volume at the $65,000–$67,000 range is the thickest cluster in the last 30 days (high-volume node). BTC is trading above this cluster, which is supportive. However, spot exchange outflows have normalized — no meaningful accumulation signal from large wallets.

## Macro Context

1W change: -4.49%. 3M change: -23.47%. The medium-term trend is clearly bearish. The current +1.38% daily move is a dead-cat bounce candidate until bulls can hold $68,500 on a closing basis.

## Risk / Reward

**Bull case:** Break and close above $68,500 targets $70,200 then $73,000. Stop below $66,800. R/R ~2.4:1 if entered at $67,721.

**Bear case:** Rejection at $68,500 confirms the range ceiling and opens a re-test of $65,200 and potentially $63,800.

## Verdict

**NEUTRAL.** Technicals are balanced at a decision point. The recovery is not yet confirmed as trend reversal. Waiting for a decisive 4H close above $68,500 before considering a long. Shorts are equally premature without a clear rejection candle.`,
    coin: "Bitcoin",
    symbol: "BTC",
    direction: "NEUTRAL",
    chartImage: "/images/blog/btc-4h-chart.png",
    price: 67721,
    change24h: 1.38,
    rsi: 52,
    publishedAt: "2026-03-31T00:00:00.000Z",
    author: "FuturesAI Quant Desk",
  },
  {
    id: "eth-4h-analysis-20260331",
    slug: "ethereum-whale-exodus-is-2000-the-floor",
    title: "Ethereum's Whale Exodus: Is $2,000 the Floor?",
    titleKo: "이더리움 고래 이탈: $2,000이 바닥인가?",
    excerpt:
      "ETH has shed 30.52% over the last quarter as institutional outflows hit $222M. The $2,000 psychological level is now the last major demand zone before the 2024 breakout base at $1,780. RSI divergence offers a tentative contrarian signal, but the weight of evidence remains bearish.",
    excerptKo:
      "ETH는 지난 분기 30.52% 하락했으며 기관 유출액이 $222M에 달했습니다. $2,000 심리적 지지선은 2024년 돌파 기반인 $1,780 이전의 마지막 핵심 수요 구간입니다. RSI 다이버전스가 반등 가능성을 시사하나, 전체적 증거는 여전히 약세를 지목합니다.",
    content: `## Structure

ETH has been in a sustained downtrend since the $4,100 rejection in December 2025. On the 4H chart the sequence of lower highs and lower lows remains intact. The current price of $2,066 represents a modest +1.98% bounce after tagging $1,997 two sessions ago — barely holding the $2,000 round number.

## Key Levels

**Resistance:** $2,150 (4H 50 EMA, descending trendline), $2,380 (4H 200 EMA), $2,550 (prior consolidation base)

**Support:** $2,000 (psychological / prior weekly close), $1,900 (2024 breakout retest zone), $1,780 (2024 breakout base — invalidation level for the bull cycle)

## RSI / MACD

RSI at 44 is approaching oversold territory but has not yet reached the 30-level that historically precedes ETH mean-reversion bounces. Critically, RSI printed a bullish divergence on the last two lows ($2,040 → $1,997 while RSI made a higher low at 38 → 44). This divergence is the only technical argument for longs currently.

MACD histogram turned positive at +12 but from deeply negative territory. The zero-line cross — if it materializes — would be the first in 8 weeks and merits attention.

## On-Chain / Flow Data

$222M in spot ETF net outflows over the past 30 days indicate institutional investors are reducing exposure, not accumulating. Exchange inflows from whale wallets have elevated over the past 14 days, consistent with distribution. Supply on exchanges rose 3.2% month-over-month.

Staking deposits are stable (unchanged), suggesting long-term holders are not panicking, but new demand is absent.

## Macro Context

1W: -3.99%. 1M: +5.17% (bounced from the $1,997 low). 3M: -30.52%. The short-term monthly recovery is happening against a deeply damaged medium-term chart. ETH has underperformed BTC by 26 percentage points year-to-date.

## Risk / Reward

**Bull case:** RSI divergence plays out, close above $2,150 triggers short-cover squeeze toward $2,380. Entry $2,066, target $2,380, stop $1,970. R/R ~3.0:1.

**Bear case:** $2,000 breaks on volume. Next meaningful support is $1,900 then $1,780. The $1,780 level breaking would constitute full cycle invalidation and likely trigger accelerated selling.

## Verdict

**SHORT bias.** The structural trend, whale flows, and ETF outflows all point lower. The RSI divergence is a caution flag against aggressive shorts near $2,000, but it is not a buy signal in isolation. Tight-stop long attempts around $2,000 are a specialist trade; broad trend following still favors the downside. Position sizing should be reduced given the proximity to a major psychological level.`,
    coin: "Ethereum",
    symbol: "ETH",
    direction: "SHORT",
    chartImage: "/images/blog/eth-4h-chart.png",
    price: 2066,
    change24h: 1.98,
    rsi: 44,
    publishedAt: "2026-03-31T00:00:00.000Z",
    author: "FuturesAI Quant Desk",
  },
  {
    id: "sol-4h-analysis-20260331",
    slug: "solana-revenue-surge-vs-price-decline-divergence-trade",
    title: "Solana Revenue Surge vs Price Decline: A Divergence Trade",
    titleKo: "솔라나 매출 급등 vs 가격 하락: 디버전스 트레이딩 기회",
    excerpt:
      "Solana Co reported a Q4 revenue surge driven by DEX volume and fee growth, yet SOL has declined 33.07% over three months. This price-fundamental divergence — negative price momentum against improving on-chain economics — historically sets up asymmetric mean-reversion trades at key support.",
    excerptKo:
      "솔라나는 DEX 거래량과 수수료 증가로 4분기 매출 급증을 기록했지만, SOL 가격은 3개월간 33.07% 하락했습니다. 이 같은 가격-펀더멘탈 디버전스는 역사적으로 핵심 지지선에서 비대칭적 평균회귀 트레이딩 기회를 형성합니다.",
    content: `## The Divergence Setup

SOL is trading at $83.64, down 33.07% in three months. Meanwhile, Solana's on-chain revenue — a direct measure of network utility — surged in Q4 2025 driven by DEX volume (Raydium, Jupiter), memecoin launchpad fees, and institutional DeFi activity. This creates a classic price-fundamental divergence: the network is generating more economic activity than ever, but the token price is near multi-quarter lows.

This type of divergence is not uncommon in crypto bear legs, but it does compress the risk profile for long positions at structural support.

## Structure

On the 4H chart, SOL is consolidating between $80.00 and $87.50 after a sharp decline from the $120 range. The current $83.64 print is within a 7-day horizontal base — the first sustained pause in a trending move lower. This could be an accumulation range or a dead-cat consolidation before continuation lower.

## Key Levels

**Resistance:** $87.50 (4H range top / horizontal chop zone), $93.00 (4H 50 EMA), $100.00 (psychological + prior support-turned-resistance)

**Support:** $80.00 (range bottom, clean round number), $75.40 (August 2024 low), $68.00 (2024 breakout base — full invalidation)

## RSI / MACD

RSI at 41 is below neutral but has not reached the historical oversold extreme for SOL (typically 28–32 during cycle corrections). There is a subtle RSI divergence: price made a lower low at $78.50 two weeks ago, RSI did not confirm, creating a bullish divergence on the 4H. This divergence held and price recovered to $83.64.

MACD is flat at -0.3 histogram, indicating the selling momentum has stalled but has not reversed. A histogram cross above zero would be the first confirmation signal.

## Fundamental Catalyst

The Solana Q4 revenue data is not yet reflected in price. Catalysts that could unlock price discovery: (1) Solana ETF approval speculation re-igniting, (2) DEX volume data published in aggregators influencing narratives, (3) institutional reports citing the revenue-to-price ratio. None of these are certain — they are optionality embedded in the position at current prices.

## Risk / Reward

**Bull case:** Hold $80.00 support, RSI divergence confirms, close above $87.50 targets $93.00 then $100.00. Entry $83.64, target $100.00, stop $78.90. R/R ~3.8:1.

**Bear case:** $80.00 breaks on volume, targeting $75.40 and potentially $68.00. The fundamental divergence story collapses if network revenue reverses.

## Verdict

**NEUTRAL with long bias on dips.** The fundamental-price divergence is a medium-term bullish input, but not a near-term trigger. The chart requires confirmation: a close above $87.50 with volume expansion would be the entry signal for a momentum long. Aggressive entries at $80.00 on a test are viable with tight stops. Avoid chasing the current price; the setup requires patience for the setup to complete.`,
    coin: "Solana",
    symbol: "SOL",
    direction: "NEUTRAL",
    chartImage: "/images/blog/sol-4h-chart.png",
    price: 83.64,
    change24h: 1.33,
    rsi: 41,
    publishedAt: "2026-03-31T00:00:00.000Z",
    author: "FuturesAI Quant Desk",
  },
];
