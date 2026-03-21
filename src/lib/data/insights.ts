export interface TradingInsight {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: { name: string; role: string; avatar: string };
  publishedAt: string;
  readingTime: number;
  tags: string[];
  category:
    | "technical-analysis"
    | "quant"
    | "risk-management"
    | "market-structure"
    | "funding-rates";
  metrics?: { label: string; value: string; change?: string }[];
}

export const CATEGORY_COLORS: Record<TradingInsight["category"], string> = {
  "technical-analysis": "blue",
  quant: "purple",
  "risk-management": "red",
  "market-structure": "green",
  "funding-rates": "yellow",
};

export const CATEGORY_LABELS: Record<TradingInsight["category"], string> = {
  "technical-analysis": "Technical Analysis",
  quant: "Quant",
  "risk-management": "Risk Management",
  "market-structure": "Market Structure",
  "funding-rates": "Funding Rates",
};

export const tradingInsights: TradingInsight[] = [
  {
    id: "btc-funding-rate-analysis",
    title: "BTC Funding Rate Analysis: What Negative Rates Signal",
    summary:
      "An in-depth look at Bitcoin perpetual swap funding rates across major exchanges and what sustained negative rates historically indicate for price action.",
    content: `
      <h2>Understanding Funding Rates</h2>
      <p>Funding rates are periodic payments between long and short traders on perpetual swap contracts. When the rate is positive, longs pay shorts; when negative, shorts pay longs. This mechanism keeps the perpetual price anchored to the spot price.</p>

      <h2>Cross-Exchange Funding Rate Snapshot</h2>
      <table>
        <thead><tr><th>Exchange</th><th>BTC Funding (8h)</th><th>Annualized</th><th>Open Interest</th></tr></thead>
        <tbody>
          <tr><td>Binance</td><td>-0.0120%</td><td>-15.77%</td><td>$4.2B</td></tr>
          <tr><td>Bybit</td><td>-0.0095%</td><td>-12.48%</td><td>$2.8B</td></tr>
          <tr><td>OKX</td><td>-0.0105%</td><td>-13.80%</td><td>$1.9B</td></tr>
          <tr><td>Bitget</td><td>-0.0088%</td><td>-11.56%</td><td>$1.1B</td></tr>
          <tr><td>dYdX</td><td>-0.0132%</td><td>-17.35%</td><td>$420M</td></tr>
        </tbody>
      </table>

      <h2>Historical Signal Analysis</h2>
      <p>We analyzed 847 instances where the 7-day average funding rate dropped below -0.01% across all major exchanges simultaneously. Key findings:</p>
      <ul>
        <li><strong>30-day forward return:</strong> +12.4% median (vs. +2.1% unconditional)</li>
        <li><strong>Win rate:</strong> 68.7% of instances saw positive 30-day returns</li>
        <li><strong>Max drawdown before recovery:</strong> -8.2% median</li>
        <li><strong>Signal frequency:</strong> ~3.2 occurrences per year</li>
      </ul>

      <h2>Current Assessment</h2>
      <p>The current negative funding regime has persisted for 11 consecutive days, placing it in the 89th percentile for duration. Historically, extended negative funding periods (>10 days) have preceded meaningful rallies in 74% of cases, with a median 30-day forward return of +18.6%.</p>

      <h2>Risk Considerations</h2>
      <p>While negative funding rates are historically bullish, they can persist during structural bear markets. Always combine this signal with broader market context, on-chain metrics, and macro conditions before sizing positions.</p>
    `,
    author: {
      name: "Alex Chen",
      role: "Quantitative Researcher",
      avatar: "/images/avatars/alex.png",
    },
    publishedAt: "2026-03-08",
    readingTime: 7,
    tags: ["funding-rates", "perpetual-swaps", "BTC", "derivatives"],
    category: "funding-rates",
    metrics: [
      { label: "Avg Funding (7d)", value: "-0.0108%", change: "-34%" },
      { label: "OI Change (7d)", value: "-$1.2B", change: "-11%" },
      { label: "30d Fwd Return (hist.)", value: "+12.4%", change: "+12.4%" },
      { label: "Signal Win Rate", value: "68.7%", change: "+68.7%" },
    ],
  },
  {
    id: "rsi-divergence-backtest",
    title: "RSI Divergence Strategy Backtest: 2024 Results",
    summary:
      "A rigorous backtesting analysis of bullish and bearish RSI divergence strategies on BTC and ETH with detailed performance metrics.",
    content: `
      <h2>Strategy Definition</h2>
      <p>We tested classic RSI(14) divergence signals on 4-hour BTC/USDT and ETH/USDT charts. A bullish divergence occurs when price makes a lower low while RSI makes a higher low. Bearish divergence is the inverse.</p>

      <h2>Backtest Parameters</h2>
      <table>
        <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td>Period</td><td>Jan 2024 - Dec 2024</td></tr>
          <tr><td>Timeframe</td><td>4H candles</td></tr>
          <tr><td>RSI Period</td><td>14</td></tr>
          <tr><td>Entry</td><td>Next candle open after divergence confirmation</td></tr>
          <tr><td>Stop Loss</td><td>2x ATR(14) from entry</td></tr>
          <tr><td>Take Profit</td><td>3x ATR(14) from entry (1.5 R:R)</td></tr>
          <tr><td>Position Size</td><td>2% risk per trade</td></tr>
        </tbody>
      </table>

      <h2>Results Summary</h2>
      <table>
        <thead><tr><th>Metric</th><th>BTC</th><th>ETH</th><th>Combined</th></tr></thead>
        <tbody>
          <tr><td>Total Trades</td><td>127</td><td>143</td><td>270</td></tr>
          <tr><td>Win Rate</td><td>54.3%</td><td>51.0%</td><td>52.6%</td></tr>
          <tr><td>Avg Win</td><td>+3.8%</td><td>+4.2%</td><td>+4.0%</td></tr>
          <tr><td>Avg Loss</td><td>-2.1%</td><td>-2.4%</td><td>-2.25%</td></tr>
          <tr><td>Profit Factor</td><td>1.38</td><td>1.22</td><td>1.30</td></tr>
          <tr><td>Max Drawdown</td><td>-14.2%</td><td>-18.7%</td><td>-16.1%</td></tr>
          <tr><td>Sharpe Ratio</td><td>1.12</td><td>0.87</td><td>0.98</td></tr>
          <tr><td>Annual Return</td><td>+38.4%</td><td>+24.1%</td><td>+31.2%</td></tr>
        </tbody>
      </table>

      <h2>Key Takeaways</h2>
      <ul>
        <li>Bullish divergences outperformed bearish divergences by 1.4x in profit factor</li>
        <li>Filtering for divergences near key support/resistance levels improved win rate by 8%</li>
        <li>Adding volume confirmation (divergence + declining volume) improved Sharpe by 0.3</li>
        <li>BTC showed more reliable signals than ETH across all metrics</li>
      </ul>
    `,
    author: {
      name: "Sarah Kim",
      role: "Strategy Developer",
      avatar: "/images/avatars/sarah.png",
    },
    publishedAt: "2026-03-05",
    readingTime: 9,
    tags: ["RSI", "divergence", "backtest", "BTC", "ETH"],
    category: "technical-analysis",
    metrics: [
      { label: "Win Rate", value: "52.6%", change: "+52.6%" },
      { label: "Profit Factor", value: "1.30" },
      { label: "Sharpe Ratio", value: "0.98" },
      { label: "Annual Return", value: "+31.2%", change: "+31.2%" },
    ],
  },
  {
    id: "liquidation-heatmap-analysis",
    title: "Exchange Liquidation Heatmap: Key Levels to Watch",
    summary:
      "Mapping concentrated liquidation clusters across exchanges to identify potential magnets for price action and volatility zones.",
    content: `
      <h2>Liquidation Clustering Methodology</h2>
      <p>We aggregate liquidation data from Binance, Bybit, OKX, and Bitget to map where leveraged positions are concentrated. High-density liquidation zones act as price magnets due to the cascading effect of forced closures.</p>

      <h2>Current BTC Liquidation Map</h2>
      <table>
        <thead><tr><th>Price Level</th><th>Long Liq. ($M)</th><th>Short Liq. ($M)</th><th>Net Exposure</th></tr></thead>
        <tbody>
          <tr><td>$58,000</td><td>$842M</td><td>-</td><td>Long heavy</td></tr>
          <tr><td>$60,500</td><td>$1,240M</td><td>-</td><td>Long heavy</td></tr>
          <tr><td>$63,000</td><td>$620M</td><td>$180M</td><td>Long heavy</td></tr>
          <tr><td>$67,500</td><td>$290M</td><td>$950M</td><td>Short heavy</td></tr>
          <tr><td>$70,000</td><td>-</td><td>$1,580M</td><td>Short heavy</td></tr>
          <tr><td>$72,500</td><td>-</td><td>$2,100M</td><td>Short heavy</td></tr>
        </tbody>
      </table>

      <h2>Analysis</h2>
      <p>The current price ($64,200) sits between two major liquidation clusters. Below, $60,500 holds $1.24B in long liquidations - a move to this level would trigger cascading long closures. Above, $70,000 holds $1.58B in short liquidations, creating a powerful magnet for short squeezes.</p>

      <h2>Historical Liquidation Cascade Patterns</h2>
      <ul>
        <li><strong>Cascade threshold:</strong> When >$500M liquidates in 1 hour, price continues in the cascade direction 78% of the time</li>
        <li><strong>Mean cascade move:</strong> 4.2% from trigger to exhaustion</li>
        <li><strong>Recovery time:</strong> 67% of cascades see a 50% retracement within 48 hours</li>
      </ul>

      <h2>Actionable Levels</h2>
      <p>Watch $60,500 and $70,000 as key trigger zones. Position sizing should account for potential cascading volatility near these levels. Reduce leverage when price approaches either cluster.</p>
    `,
    author: {
      name: "Marcus Lee",
      role: "Derivatives Analyst",
      avatar: "/images/avatars/marcus.png",
    },
    publishedAt: "2026-03-03",
    readingTime: 6,
    tags: ["liquidations", "heatmap", "BTC", "leverage", "derivatives"],
    category: "market-structure",
    metrics: [
      { label: "Long Liq. Below", value: "$2.7B" },
      { label: "Short Liq. Above", value: "$4.6B" },
      { label: "Cascade Threshold", value: "$500M/hr" },
      { label: "Cascade Win Rate", value: "78%" },
    ],
  },
  {
    id: "optimal-leverage-kelly-criterion",
    title: "Optimal Leverage: A Quantitative Approach to Position Sizing",
    summary:
      "Applying the Kelly Criterion and its fractional variants to crypto trading for mathematically optimal position sizing under uncertainty.",
    content: `
      <h2>The Kelly Criterion</h2>
      <p>The Kelly Criterion, developed by John Kelly at Bell Labs in 1956, determines the optimal fraction of capital to risk on a bet. The formula is: <strong>f* = (bp - q) / b</strong>, where b = odds, p = win probability, q = loss probability.</p>

      <h2>Adapted for Crypto Trading</h2>
      <p>For trading with asymmetric payoffs: <strong>f* = (W/L * p - q) / (W/L)</strong> where W = average win, L = average loss, p = win rate, q = 1-p.</p>

      <h2>Example Calculations</h2>
      <table>
        <thead><tr><th>Strategy</th><th>Win Rate</th><th>Avg W/L</th><th>Full Kelly</th><th>Half Kelly</th><th>Quarter Kelly</th></tr></thead>
        <tbody>
          <tr><td>Trend Following</td><td>42%</td><td>2.8</td><td>21.3%</td><td>10.6%</td><td>5.3%</td></tr>
          <tr><td>Mean Reversion</td><td>63%</td><td>1.2</td><td>31.7%</td><td>15.8%</td><td>7.9%</td></tr>
          <tr><td>Breakout</td><td>35%</td><td>3.5</td><td>16.4%</td><td>8.2%</td><td>4.1%</td></tr>
          <tr><td>RSI Divergence</td><td>53%</td><td>1.8</td><td>26.7%</td><td>13.3%</td><td>6.7%</td></tr>
        </tbody>
      </table>

      <h2>Why Fractional Kelly?</h2>
      <ul>
        <li><strong>Estimation error:</strong> Our win rate and W/L estimates have uncertainty. Full Kelly assumes perfect knowledge.</li>
        <li><strong>Non-normal distributions:</strong> Crypto returns have fat tails. Kelly assumes normal distributions.</li>
        <li><strong>Drawdown tolerance:</strong> Full Kelly can produce 50%+ drawdowns. Half Kelly reduces max drawdown by ~40% with only ~25% reduction in long-run growth.</li>
        <li><strong>Psychological comfort:</strong> Most traders cannot stomach Full Kelly volatility.</li>
      </ul>

      <h2>Practical Recommendation</h2>
      <p>Use Quarter Kelly for crypto trading. This provides roughly 50% of the theoretical growth rate with dramatically reduced drawdowns. For a strategy with a 53% win rate and 1.8 W/L ratio, this means risking approximately 6.7% of capital per trade, or roughly 3x leverage on a 2% stop loss.</p>
    `,
    author: {
      name: "Dr. James Park",
      role: "Head of Quant Research",
      avatar: "/images/avatars/james.png",
    },
    publishedAt: "2026-02-28",
    readingTime: 10,
    tags: ["Kelly-criterion", "position-sizing", "leverage", "risk"],
    category: "risk-management",
    metrics: [
      { label: "Recommended", value: "Quarter Kelly" },
      { label: "Growth vs Full Kelly", value: "~50%" },
      { label: "DD Reduction", value: "-60%" },
      { label: "Typical Risk/Trade", value: "5-7%" },
    ],
  },
  {
    id: "cross-exchange-arbitrage",
    title: "Cross-Exchange Arbitrage Opportunities in 2024",
    summary:
      "Analyzing spread patterns and arbitrage windows between centralized exchanges with execution timing, profitability data, and infrastructure requirements.",
    content: `
      <h2>Arbitrage Landscape Overview</h2>
      <p>Cross-exchange arbitrage exploits price discrepancies for the same asset across venues. Despite increasing market efficiency, opportunities persist due to latency differences, liquidity fragmentation, and regional premium variations.</p>

      <h2>Spread Analysis: BTC/USDT</h2>
      <table>
        <thead><tr><th>Exchange Pair</th><th>Mean Spread</th><th>Median Duration</th><th>Daily Opportunities</th><th>Net After Fees</th></tr></thead>
        <tbody>
          <tr><td>Binance-Bybit</td><td>0.018%</td><td>1.2s</td><td>342</td><td>0.003%</td></tr>
          <tr><td>Binance-OKX</td><td>0.022%</td><td>1.8s</td><td>287</td><td>0.007%</td></tr>
          <tr><td>Bybit-Bitget</td><td>0.031%</td><td>2.4s</td><td>198</td><td>0.011%</td></tr>
          <tr><td>OKX-Bitget</td><td>0.028%</td><td>2.1s</td><td>223</td><td>0.008%</td></tr>
          <tr><td>Binance-dYdX</td><td>0.045%</td><td>8.3s</td><td>156</td><td>0.005%</td></tr>
        </tbody>
      </table>

      <h2>Infrastructure Requirements</h2>
      <ul>
        <li><strong>Latency:</strong> Co-located servers within 5ms of exchange matching engines</li>
        <li><strong>Capital:</strong> Pre-funded accounts on all target exchanges ($50K+ per venue)</li>
        <li><strong>Software:</strong> Custom order execution with sub-100ms round trip</li>
        <li><strong>Monitoring:</strong> Real-time spread tracking across 10+ pairs</li>
      </ul>

      <h2>Profitability Trends</h2>
      <p>Average net spread after fees has compressed from 0.015% in Q1 2024 to 0.008% in Q4 2024. While individual trade profits are shrinking, higher frequency and improved execution have maintained annualized returns in the 15-25% range for well-capitalized operations.</p>

      <h2>Risks</h2>
      <ul>
        <li><strong>Execution risk:</strong> One leg fills, the other does not (leg risk)</li>
        <li><strong>Transfer risk:</strong> Network congestion delays cross-exchange settlement</li>
        <li><strong>Exchange risk:</strong> Withdrawal freezes or API downtime</li>
        <li><strong>Regulatory risk:</strong> Changing cross-border transfer regulations</li>
      </ul>
    `,
    author: {
      name: "Alex Chen",
      role: "Quantitative Researcher",
      avatar: "/images/avatars/alex.png",
    },
    publishedAt: "2026-02-24",
    readingTime: 8,
    tags: ["arbitrage", "spreads", "execution", "infrastructure"],
    category: "quant",
    metrics: [
      { label: "Mean Spread (Bn-By)", value: "0.018%" },
      { label: "Daily Opps (avg)", value: "241" },
      { label: "Ann. Return (est.)", value: "15-25%" },
      { label: "Min Capital", value: "$250K+" },
    ],
  },
  {
    id: "macd-volume-profile-strategy",
    title: "MACD + Volume Profile: A Combined Signal Approach",
    summary:
      "Combining MACD crossover signals with Volume Profile analysis to filter high-probability trade setups and reduce false signals.",
    content: `
      <h2>The Problem with Standalone MACD</h2>
      <p>MACD alone generates too many false signals in ranging markets. By overlaying Volume Profile data, we can identify whether a MACD crossover occurs at a price level with genuine institutional interest or in a low-volume void.</p>

      <h2>Combined Signal Rules</h2>
      <ul>
        <li><strong>Long entry:</strong> MACD bullish crossover + price at or near a Volume Profile Point of Control (POC) or High Volume Node (HVN)</li>
        <li><strong>Short entry:</strong> MACD bearish crossover + price at or above a Low Volume Node (LVN) acting as resistance</li>
        <li><strong>Confirmation:</strong> MACD histogram must show increasing momentum for 2+ bars after crossover</li>
        <li><strong>Invalidation:</strong> If price moves 1.5 ATR against the position before momentum confirms</li>
      </ul>

      <h2>Comparative Backtest: BTC 1H (2024)</h2>
      <table>
        <thead><tr><th>Metric</th><th>MACD Only</th><th>MACD + VP</th><th>Improvement</th></tr></thead>
        <tbody>
          <tr><td>Total Signals</td><td>624</td><td>218</td><td>-65% (filtered)</td></tr>
          <tr><td>Win Rate</td><td>41.2%</td><td>58.7%</td><td>+17.5pp</td></tr>
          <tr><td>Profit Factor</td><td>0.94</td><td>1.67</td><td>+0.73</td></tr>
          <tr><td>Sharpe Ratio</td><td>0.31</td><td>1.42</td><td>+1.11</td></tr>
          <tr><td>Max Drawdown</td><td>-28.4%</td><td>-11.8%</td><td>+16.6pp</td></tr>
          <tr><td>Annual Return</td><td>-3.2%</td><td>+42.8%</td><td>+46.0pp</td></tr>
        </tbody>
      </table>

      <h2>Volume Profile Settings</h2>
      <p>We use a 30-day fixed-range Volume Profile with POC recalculated weekly. HVN is defined as any node within 15% of POC volume. LVN is defined as any node below 30% of POC volume.</p>

      <h2>Conclusion</h2>
      <p>The Volume Profile filter dramatically improves MACD signal quality by reducing trades by 65% while increasing the win rate from 41% to 59%. The combined approach turns a losing strategy into a profitable one with a 1.42 Sharpe ratio.</p>
    `,
    author: {
      name: "Sarah Kim",
      role: "Strategy Developer",
      avatar: "/images/avatars/sarah.png",
    },
    publishedAt: "2026-02-20",
    readingTime: 8,
    tags: ["MACD", "volume-profile", "technical-analysis", "backtest"],
    category: "technical-analysis",
    metrics: [
      { label: "Win Rate (Combined)", value: "58.7%", change: "+17.5pp" },
      { label: "Profit Factor", value: "1.67" },
      { label: "Sharpe Ratio", value: "1.42" },
      { label: "Signals Filtered", value: "65%" },
    ],
  },
  {
    id: "sharpe-ratios-crypto-assets",
    title: "Risk-Adjusted Returns: Sharpe Ratios Across Crypto Assets",
    summary:
      "Comparing risk-adjusted performance metrics across major crypto assets, DeFi tokens, and traditional assets over multiple timeframes.",
    content: `
      <h2>Methodology</h2>
      <p>We calculate annualized Sharpe ratios using daily returns with a risk-free rate of 4.5% (US 1Y Treasury yield). Sortino ratios use only downside deviation. All data sourced from daily closing prices.</p>

      <h2>12-Month Risk-Adjusted Performance</h2>
      <table>
        <thead><tr><th>Asset</th><th>Return</th><th>Volatility</th><th>Sharpe</th><th>Sortino</th><th>Max DD</th></tr></thead>
        <tbody>
          <tr><td>BTC</td><td>+62.4%</td><td>48.2%</td><td>1.20</td><td>1.78</td><td>-22.1%</td></tr>
          <tr><td>ETH</td><td>+41.8%</td><td>56.7%</td><td>0.66</td><td>0.94</td><td>-31.4%</td></tr>
          <tr><td>SOL</td><td>+124.5%</td><td>82.3%</td><td>1.46</td><td>2.01</td><td>-38.7%</td></tr>
          <tr><td>AVAX</td><td>+28.3%</td><td>71.4%</td><td>0.33</td><td>0.48</td><td>-42.8%</td></tr>
          <tr><td>LINK</td><td>+55.2%</td><td>63.1%</td><td>0.80</td><td>1.12</td><td>-35.2%</td></tr>
          <tr><td>S&P 500</td><td>+18.7%</td><td>14.2%</td><td>1.00</td><td>1.45</td><td>-8.3%</td></tr>
          <tr><td>Gold</td><td>+12.1%</td><td>13.8%</td><td>0.55</td><td>0.82</td><td>-6.1%</td></tr>
        </tbody>
      </table>

      <h2>Key Observations</h2>
      <ul>
        <li><strong>SOL leads Sharpe rankings</strong> at 1.46, outperforming both BTC and traditional assets on a risk-adjusted basis</li>
        <li><strong>BTC vs S&P 500:</strong> BTC's higher Sharpe (1.20 vs 1.00) came with 3.4x the volatility and 2.7x the drawdown</li>
        <li><strong>Sortino advantage:</strong> Crypto assets show higher Sortino-to-Sharpe ratios, indicating more upside skew than traditional assets</li>
        <li><strong>AVAX underperforms</strong> on risk-adjusted basis despite positive absolute returns</li>
      </ul>

      <h2>Portfolio Implications</h2>
      <p>A risk-parity allocation targeting 15% annualized volatility would suggest a 6-8% allocation to BTC, 3-4% to SOL, and the remainder in traditional assets. This blend historically achieves a portfolio Sharpe of 1.15-1.25 while limiting crypto-driven drawdowns to under 5% at the portfolio level.</p>
    `,
    author: {
      name: "Dr. James Park",
      role: "Head of Quant Research",
      avatar: "/images/avatars/james.png",
    },
    publishedAt: "2026-02-15",
    readingTime: 7,
    tags: ["Sharpe-ratio", "risk-adjusted", "portfolio", "volatility"],
    category: "risk-management",
    metrics: [
      { label: "BTC Sharpe (12M)", value: "1.20" },
      { label: "Top Sharpe (SOL)", value: "1.46" },
      { label: "S&P 500 Sharpe", value: "1.00" },
      { label: "Optimal BTC Alloc.", value: "6-8%" },
    ],
  },
  {
    id: "order-flow-analysis-crypto",
    title: "Order Flow Analysis: Reading the Tape in Crypto Markets",
    summary:
      "Practical techniques for interpreting order book dynamics, delta divergence, and absorption patterns in cryptocurrency markets.",
    content: `
      <h2>What is Order Flow?</h2>
      <p>Order flow analysis examines the actual transactions occurring in the market - who is buying, who is selling, and at what prices. Unlike traditional technical analysis that uses price and volume after the fact, order flow reads the real-time battle between buyers and sellers.</p>

      <h2>Key Order Flow Concepts</h2>
      <table>
        <thead><tr><th>Concept</th><th>Definition</th><th>Bullish Signal</th><th>Bearish Signal</th></tr></thead>
        <tbody>
          <tr><td>Delta</td><td>Buy volume - Sell volume</td><td>Positive divergence at lows</td><td>Negative divergence at highs</td></tr>
          <tr><td>Absorption</td><td>Large limit orders absorbing market orders</td><td>Bid absorption at support</td><td>Ask absorption at resistance</td></tr>
          <tr><td>Imbalance</td><td>Ratio of bid vs ask volume at price</td><td>>3:1 bid imbalance stacking</td><td>>3:1 ask imbalance stacking</td></tr>
          <tr><td>Exhaustion</td><td>High volume with no price movement</td><td>Selling exhaustion at lows</td><td>Buying exhaustion at highs</td></tr>
        </tbody>
      </table>

      <h2>Practical Example: BTC Absorption at $62,000</h2>
      <p>On Feb 8th, BTC approached $62,000 with heavy sell-side pressure. The order book showed:</p>
      <ul>
        <li><strong>Bid wall:</strong> 480 BTC stacked between $61,800-$62,000</li>
        <li><strong>Market sells absorbed:</strong> 1,200 BTC of market sells absorbed over 45 minutes</li>
        <li><strong>Delta divergence:</strong> Despite price decline, cumulative delta turned positive</li>
        <li><strong>Result:</strong> Price bounced 4.8% over the next 12 hours</li>
      </ul>

      <h2>Tools for Crypto Order Flow</h2>
      <ul>
        <li><strong>Bookmap:</strong> Heatmap visualization of order book depth over time</li>
        <li><strong>Coinalyze:</strong> Aggregated open interest and liquidation data</li>
        <li><strong>Hyblock Capital:</strong> Liquidation levels and whale position tracking</li>
        <li><strong>Custom solutions:</strong> WebSocket feeds from exchange APIs for raw L2 data</li>
      </ul>

      <h2>Limitations</h2>
      <p>Crypto order books are thinner than traditional markets, making spoofing more prevalent. Always confirm order flow signals with volume and price action. Iceberg orders (hidden liquidity) can distort visible order book data significantly.</p>
    `,
    author: {
      name: "Marcus Lee",
      role: "Derivatives Analyst",
      avatar: "/images/avatars/marcus.png",
    },
    publishedAt: "2026-02-10",
    readingTime: 9,
    tags: ["order-flow", "tape-reading", "order-book", "delta"],
    category: "market-structure",
    metrics: [
      { label: "Absorption Accuracy", value: "72%" },
      { label: "Delta Div. Win Rate", value: "65%" },
      { label: "Avg Bounce (absorption)", value: "+3.8%" },
      { label: "Spoof Rate (est.)", value: "~15%" },
    ],
  },
];

export function getInsightById(id: string): TradingInsight | undefined {
  return tradingInsights.find((insight) => insight.id === id);
}

export function getInsightsByCategory(
  category: TradingInsight["category"]
): TradingInsight[] {
  return tradingInsights.filter((insight) => insight.category === category);
}

export function getRelatedInsights(
  currentId: string,
  limit = 3
): TradingInsight[] {
  const current = getInsightById(currentId);
  if (!current) return tradingInsights.slice(0, limit);

  return tradingInsights
    .filter((i) => i.id !== currentId)
    .sort((a, b) => {
      const aScore =
        (a.category === current.category ? 2 : 0) +
        a.tags.filter((t) => current.tags.includes(t)).length;
      const bScore =
        (b.category === current.category ? 2 : 0) +
        b.tags.filter((t) => current.tags.includes(t)).length;
      return bScore - aScore;
    })
    .slice(0, limit);
}
