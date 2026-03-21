export type Strategy = {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  timeframe: string;
  description: string;
  steps: string[];
  riskLevel: "Low" | "Medium" | "High";
  bestFor: string;
};

export const strategies: Strategy[] = [
  {
    id: "dca",
    title: "Dollar Cost Averaging (DCA)",
    difficulty: "Beginner",
    timeframe: "Long-term (months to years)",
    description:
      "Invest a fixed amount at regular intervals regardless of price. This strategy reduces the impact of volatility by spreading purchases over time, resulting in an averaged entry price.",
    steps: [
      "Choose a fixed amount you can invest consistently (e.g., $100/week).",
      "Select your target assets and allocation percentages.",
      "Set a recurring schedule (weekly, bi-weekly, or monthly).",
      "Execute purchases on schedule regardless of market conditions.",
      "Review and rebalance your allocation quarterly.",
    ],
    riskLevel: "Low",
    bestFor: "Long-term investors who want to build positions without timing the market.",
  },
  {
    id: "support-resistance",
    title: "Support & Resistance Trading",
    difficulty: "Intermediate",
    timeframe: "Short to medium-term (days to weeks)",
    description:
      "Identify key price levels where buying or selling pressure has historically caused reversals. Trade bounces off support and rejections at resistance to capture range-bound moves.",
    steps: [
      "Identify horizontal levels where price has reversed at least twice.",
      "Mark support zones (price floors) and resistance zones (price ceilings) on your chart.",
      "Wait for price to approach a key level with decreasing momentum.",
      "Enter long positions near support with a stop-loss below the level.",
      "Enter short positions near resistance with a stop-loss above the level.",
      "Take profit at the opposite level or use a trailing stop.",
    ],
    riskLevel: "Medium",
    bestFor: "Traders comfortable with chart analysis who prefer clear entry and exit points.",
  },
  {
    id: "rsi-divergence",
    title: "RSI Divergence Strategy",
    difficulty: "Intermediate",
    timeframe: "Medium-term (days to weeks)",
    description:
      "Spot divergences between the Relative Strength Index (RSI) and price action to anticipate trend reversals. When price makes new highs but RSI does not, it signals weakening momentum.",
    steps: [
      "Add the RSI indicator (14-period) to your chart.",
      "Look for bullish divergence: price makes a lower low while RSI makes a higher low.",
      "Look for bearish divergence: price makes a higher high while RSI makes a lower high.",
      "Confirm the divergence with a candlestick reversal pattern.",
      "Enter the trade in the direction of the expected reversal with a tight stop-loss.",
      "Target the previous swing high or low as your take-profit level.",
    ],
    riskLevel: "Medium",
    bestFor: "Traders who understand technical indicators and want to catch trend reversals early.",
  },
  {
    id: "breakout",
    title: "Breakout Trading",
    difficulty: "Intermediate",
    timeframe: "Short-term (hours to days)",
    description:
      "Trade the initial move when price breaks through a significant support or resistance level with increased volume. Breakouts often lead to strong directional moves as new participants enter.",
    steps: [
      "Identify consolidation patterns: triangles, rectangles, or tight ranges.",
      "Set alerts just above resistance or below support.",
      "Confirm the breakout with a volume spike (at least 1.5x average volume).",
      "Enter the trade in the direction of the breakout on the candle close.",
      "Place a stop-loss just inside the broken level to guard against false breakouts.",
      "Use the height of the consolidation pattern as your profit target.",
    ],
    riskLevel: "High",
    bestFor: "Active traders who can monitor charts and react quickly to price movements.",
  },
  {
    id: "grid-trading",
    title: "Grid Trading",
    difficulty: "Advanced",
    timeframe: "Medium-term (weeks to months)",
    description:
      "Place a series of buy and sell orders at predefined intervals above and below a set price, creating a grid. This strategy profits from natural price oscillations within a range without predicting direction.",
    steps: [
      "Determine the expected trading range based on historical volatility.",
      "Set a grid with equal price intervals (e.g., every 2% from the midpoint).",
      "Place buy limit orders at each grid level below current price.",
      "Place sell limit orders at each grid level above current price.",
      "As orders fill, place opposite orders at the next grid level.",
      "Monitor margin usage and adjust the grid if price moves outside the range.",
    ],
    riskLevel: "Medium",
    bestFor: "Systematic traders who prefer automated approaches in range-bound markets.",
  },
  {
    id: "mean-reversion",
    title: "Mean Reversion",
    difficulty: "Advanced",
    timeframe: "Short to medium-term (hours to days)",
    description:
      "Exploit the tendency of asset prices to return to their historical average after extreme moves. Enter counter-trend trades when price deviates significantly from its moving average.",
    steps: [
      "Calculate the 20-period and 50-period moving averages on your timeframe.",
      "Measure the standard deviation of price from the moving average.",
      "Enter long positions when price is 2+ standard deviations below the mean.",
      "Enter short positions when price is 2+ standard deviations above the mean.",
      "Set your take-profit at the moving average (the mean).",
      "Use a stop-loss at 3 standard deviations to limit downside on continued trends.",
    ],
    riskLevel: "High",
    bestFor: "Quantitative traders comfortable with statistical concepts and counter-trend risk.",
  },
];
