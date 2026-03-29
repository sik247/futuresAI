import Container from "@/components/ui/container";
import Link from "next/link";

export const metadata = {
  title: "AI 차트 분석 완벽 가이드 - FuturesAI",
  description: "FuturesAI의 AI 차트 분석 완벽 가이드. 차트 업로드부터 트레이드 셋업까지, 지지/저항선, RSI, MACD, 피보나치 분석 방법을 단계별로 설명합니다.",
};

export default function HowToPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const ko = lang === "ko";

  return (
    <div className="min-h-screen bg-zinc-950">
      <Container className="pt-28 pb-24 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-20">
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-blue-400 mb-4">
            {ko ? "완벽 가이드" : "Complete Guide"}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
            {ko ? "AI 차트 분석" : "AI Chart Analysis"}
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {ko ? "완벽 가이드" : "Complete Walkthrough"}
            </span>
          </h1>
          <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {ko
              ? "차트 캡처부터 AI 분석 결과 해석, 실전 트레이드 셋업까지. 기관급 퀀트 분석을 무료로 활용하는 방법을 알려드립니다."
              : "From chart capture to AI analysis interpretation and real trade setups. Learn how to use institutional-grade quant analysis for free."}
          </p>
        </div>

        {/* ================================================================ */}
        {/*  STEP 1: PREPARE YOUR CHART                                      */}
        {/* ================================================================ */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xl flex-shrink-0">1</div>
            <div>
              <h2 className="text-2xl font-bold text-white">{ko ? "차트 준비하기" : "Prepare Your Chart"}</h2>
              <p className="text-zinc-500 text-sm mt-1">{ko ? "좋은 스크린샷이 정확한 분석의 시작입니다" : "A good screenshot is the foundation of accurate analysis"}</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* TradingView recommendation */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
              <h3 className="text-base font-semibold text-white mb-3">{ko ? "추천: TradingView 사용" : "Recommended: Use TradingView"}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                {ko
                  ? "TradingView는 가장 정확한 분석 결과를 제공합니다. 무료 계정으로 충분합니다. 바이낸스, 바이빗 등 거래소 내장 차트도 가능하지만, TradingView 차트가 AI 인식률이 가장 높습니다."
                  : "TradingView provides the most accurate results. A free account is sufficient. Exchange built-in charts (Binance, Bybit) also work, but TradingView has the highest AI recognition rate."}
              </p>
              <a
                href="https://www.tradingview.com/chart/?symbol=BINANCE:BTCUSDT&interval=240"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-600/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                {ko ? "TradingView 열기 (BTC/USDT 4H)" : "Open TradingView (BTC/USDT 4H)"}
              </a>
            </div>

            {/* Best timeframes */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
              <h3 className="text-base font-semibold text-white mb-3">{ko ? "최적의 타임프레임" : "Best Timeframes"}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { tf: "4H", label: ko ? "4시간봉" : "4 Hour", desc: ko ? "스윙 트레이딩에 최적" : "Best for swing trading", best: true },
                  { tf: "1D", label: ko ? "일봉" : "Daily", desc: ko ? "중장기 추세 분석" : "Mid-long term trends", best: true },
                  { tf: "1H", label: ko ? "1시간봉" : "1 Hour", desc: ko ? "단타/스캘핑" : "Scalping/day trading", best: false },
                  { tf: "15m", label: ko ? "15분봉" : "15 Min", desc: ko ? "초단타 전용" : "Ultra-short term", best: false },
                ].map((t) => (
                  <div key={t.tf} className={`rounded-lg p-3 border ${t.best ? "bg-blue-500/[0.05] border-blue-500/20" : "bg-white/[0.02] border-white/[0.04]"}`}>
                    <p className="text-lg font-mono font-bold text-white">{t.tf}</p>
                    <p className="text-xs text-zinc-400">{t.label}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">{t.desc}</p>
                    {t.best && <span className="text-[9px] font-mono text-blue-400 mt-1 block">{ko ? "추천" : "RECOMMENDED"}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Screenshot tips */}
            <div className="rounded-xl bg-amber-500/[0.03] border border-amber-500/15 p-6">
              <h3 className="text-base font-semibold text-amber-400 mb-3">{ko ? "스크린샷 팁" : "Screenshot Tips"}</h3>
              <div className="space-y-2.5">
                {[
                  ko ? "캔들스틱이 선명하게 보이게 캡처하세요" : "Make candlesticks clearly visible",
                  ko ? "Y축 가격 스케일이 포함되어야 합니다" : "Include the Y-axis price scale",
                  ko ? "RSI, MACD 등 보조지표가 보이면 더 정확한 분석이 가능합니다" : "Visible RSI, MACD indicators enable more accurate analysis",
                  ko ? "최소 30개 이상의 캔들이 보이는 것이 이상적입니다" : "Ideally show at least 30+ candles",
                  ko ? "PNG 또는 JPG, 최대 10MB" : "PNG or JPG, max 10MB",
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400/60 flex-shrink-0" />
                    <p className="text-sm text-zinc-400">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/*  STEP 2: UPLOAD & ANALYZE                                        */}
        {/* ================================================================ */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xl flex-shrink-0">2</div>
            <div>
              <h2 className="text-2xl font-bold text-white">{ko ? "업로드 & 분석" : "Upload & Analyze"}</h2>
              <p className="text-zinc-500 text-sm mt-1">{ko ? "차트를 올리고 페어를 선택하면 AI가 15-30초 안에 분석합니다" : "Upload chart, select pair, AI analyzes in 15-30 seconds"}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
              <h3 className="text-base font-semibold text-white mb-4">{ko ? "분석 과정" : "Analysis Process"}</h3>
              <div className="space-y-4">
                {[
                  { icon: "1", title: ko ? "차트 업로드" : "Upload Chart", desc: ko ? "드래그 앤 드롭 또는 클릭하여 이미지를 업로드합니다. Supabase에 안전하게 저장됩니다." : "Drag & drop or click to upload. Stored securely on Supabase." },
                  { icon: "2", title: ko ? "거래 페어 선택" : "Select Trading Pair", desc: ko ? "BTC/USDT, ETH/USDT 등 10개 인기 페어 중 선택하거나 커스텀 페어를 입력합니다." : "Choose from 10 popular pairs or type a custom pair." },
                  { icon: "3", title: ko ? "뉴스 & 센티먼트 검색" : "News & Sentiment Search", desc: ko ? "Firecrawl을 통해 해당 페어의 최신 뉴스와 시장 센티먼트를 실시간으로 수집합니다." : "Firecrawl fetches latest news and market sentiment for the pair in real-time." },
                  { icon: "4", title: ko ? "바이낸스 실시간 데이터" : "Live Binance Data", desc: ko ? "50개의 4시간봉 캔들, 오더북 깊이(매수/매도 압력), 24시간 가격 변동을 가져옵니다." : "Fetches 50 4H candles, order book depth (buy/sell pressure), and 24h price data." },
                  { icon: "5", title: ko ? "AI 차트 분석 (Gemini 2.5 Pro)" : "AI Chart Analysis (Gemini 2.5 Pro)", desc: ko ? "Google의 최신 AI가 차트를 시각적으로 읽고(OCR), 모든 데이터를 결합하여 종합 분석을 생성합니다." : "Google's latest AI visually reads the chart (OCR) and combines all data for comprehensive analysis." },
                ].map((step) => (
                  <div key={step.icon} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">{step.icon}</div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">{step.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/*  STEP 3: UNDERSTANDING RESULTS                                   */}
        {/* ================================================================ */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xl flex-shrink-0">3</div>
            <div>
              <h2 className="text-2xl font-bold text-white">{ko ? "분석 결과 해석하기" : "Understanding Your Results"}</h2>
              <p className="text-zinc-500 text-sm mt-1">{ko ? "AI가 제공하는 각 데이터의 의미를 알아봅니다" : "Learn what each piece of AI output means"}</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Chart overlay */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
              <h3 className="text-base font-semibold text-white mb-2">{ko ? "차트 오버레이" : "Chart Overlay"}</h3>
              <p className="text-sm text-zinc-400 mb-4">{ko ? "업로드한 차트 위에 AI가 자동으로 핵심 레벨을 그려줍니다." : "AI automatically draws key levels on your uploaded chart."}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { color: "bg-green-500", label: ko ? "지지선 (Support)" : "Support Levels", desc: ko ? "가격이 하락할 때 반등할 가능성이 높은 가격대" : "Price levels where bounces are likely" },
                  { color: "bg-red-500", label: ko ? "저항선 (Resistance)" : "Resistance Levels", desc: ko ? "가격이 상승할 때 막힐 가능성이 높은 가격대" : "Price levels where rejections are likely" },
                  { color: "bg-blue-500", label: ko ? "진입가 (Entry)" : "Entry Price", desc: ko ? "AI가 추천하는 매매 진입 가격" : "AI-recommended entry price" },
                  { color: "bg-yellow-500", label: ko ? "목표가 (Take Profit)" : "Take Profit", desc: ko ? "수익 실현 목표 가격" : "Target price for profit taking" },
                ].map((l) => (
                  <div key={l.label} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02]">
                    <div className={`w-3 h-3 rounded-full ${l.color} mt-0.5 flex-shrink-0`} />
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{l.label}</p>
                      <p className="text-xs text-zinc-500">{l.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-600 mt-3">{ko ? "각 레벨 옆의 퍼센트(%)는 해당 가격에 도달할 확률(Hit Probability)입니다." : "The percentage next to each level is the hit probability."}</p>
            </div>

            {/* Live market data */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
              <h3 className="text-base font-semibold text-white mb-2">{ko ? "실시간 시장 데이터" : "Live Market Data"}</h3>
              <p className="text-sm text-zinc-400 mb-4">{ko ? "차트 분석과 함께 실시간 바이낸스 데이터가 제공됩니다." : "Real-time Binance data is provided alongside chart analysis."}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                {[
                  { label: ko ? "현재가" : "Live Price", desc: ko ? "바이낸스 실시간 가격" : "Binance real-time price" },
                  { label: ko ? "24시간 변동" : "24h Change", desc: ko ? "전일 대비 가격 변동률" : "Price change from yesterday" },
                  { label: ko ? "거래량" : "Volume", desc: ko ? "24시간 거래 대금" : "24h trading volume" },
                  { label: ko ? "센티먼트" : "Sentiment", desc: ko ? "뉴스 기반 시장 심리" : "News-based market sentiment" },
                  { label: ko ? "오더북" : "Order Book", desc: ko ? "매수/매도 압력 비율" : "Buy/sell pressure ratio" },
                  { label: ko ? "최신 뉴스" : "Latest News", desc: ko ? "해당 페어 관련 뉴스" : "Pair-related news" },
                ].map((d) => (
                  <div key={d.label} className="p-3 rounded-lg bg-white/[0.02]">
                    <p className="text-zinc-200 font-medium">{d.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{d.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trade setup */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
              <h3 className="text-base font-semibold text-white mb-2">{ko ? "트레이드 셋업" : "Trade Setup"}</h3>
              <p className="text-sm text-zinc-400 mb-4">{ko ? "AI가 제안하는 구체적인 매매 전략입니다. 단순 참고용이며, 투자 판단은 본인의 책임입니다." : "AI-suggested trading strategy. For reference only — trading decisions are your responsibility."}</p>

              <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-5 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">{ko ? "방향" : "Direction"}</span><span className="font-bold text-green-400">LONG</span></div>
                <div className="flex justify-between"><span className="text-blue-400">{ko ? "진입가" : "Entry"}</span><span className="text-white font-mono">$71,100</span></div>
                <div className="flex justify-between"><span className="text-red-400">{ko ? "손절가 (SL)" : "Stop Loss"}</span><span className="text-white font-mono">$69,800</span></div>
                <div className="flex justify-between"><span className="text-green-400">{ko ? "익절가 (TP)" : "Take Profit"}</span><span className="text-white font-mono">$74,200</span></div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between"><span className="text-zinc-500">{ko ? "리스크 리워드" : "Risk:Reward"}</span><span className="text-white font-mono font-bold">1:2.38</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">{ko ? "신뢰도" : "Confidence"}</span><span className="text-white font-mono">78%</span></div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/15">
                <p className="text-xs text-emerald-400 leading-relaxed">
                  {ko
                    ? "R:R(리스크 리워드)이 1:2 이상이면 좋은 셋업입니다. 손절 $1,300 위험으로 $3,100 수익을 목표로 합니다. 신뢰도가 70% 이상이면 높은 확신의 셋업입니다."
                    : "R:R above 1:2 is a good setup. Risking $1,300 loss for $3,100 profit. Confidence above 70% indicates a high-conviction setup."}
                </p>
              </div>
            </div>

            {/* Technical indicators */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
              <h3 className="text-base font-semibold text-white mb-2">{ko ? "기술적 지표 해석" : "Technical Indicators Explained"}</h3>
              <div className="space-y-4 mt-4">
                {[
                  {
                    name: "RSI (14)",
                    desc: ko ? "상대강도지수. 30 이하 = 과매도(반등 가능), 70 이상 = 과매수(하락 가능), 50 근처 = 중립." : "Relative Strength Index. Below 30 = oversold, above 70 = overbought, near 50 = neutral.",
                    example: ko ? "RSI 28 → 과매도 구간, 반등 기대" : "RSI 28 → Oversold, bounce expected"
                  },
                  {
                    name: "MACD",
                    desc: ko ? "이동평균수렴확산. 히스토그램이 양수로 전환 = 매수 시그널, 음수로 전환 = 매도 시그널." : "Moving Average Convergence Divergence. Histogram turning positive = buy signal, negative = sell signal.",
                    example: ko ? "MACD 골든크로스 → 상승 모멘텀" : "MACD golden cross → Bullish momentum"
                  },
                  {
                    name: ko ? "볼린저 밴드" : "Bollinger Bands",
                    desc: ko ? "가격 변동성 지표. 상단 밴드 돌파 = 과매수, 하단 밴드 이탈 = 과매도, 밴드 수축 = 큰 변동 임박." : "Volatility indicator. Upper band break = overbought, lower band break = oversold, band squeeze = big move incoming.",
                    example: ko ? "밴드 하단 터치 + RSI 30 → 강력한 매수 시그널" : "Lower band touch + RSI 30 → Strong buy signal"
                  },
                  {
                    name: ko ? "피보나치" : "Fibonacci",
                    desc: ko ? "되돌림 수준. 0.382, 0.5, 0.618이 핵심 레벨. 추세 중 이 레벨에서 반등/반락하는 경우가 많습니다." : "Retracement levels. 0.382, 0.5, 0.618 are key levels. Price often bounces at these levels during trends.",
                    example: ko ? "0.618 되돌림 + 이전 지지 = 강한 컨플루언스 존" : "0.618 retracement + prior support = strong confluence zone"
                  },
                ].map((ind) => (
                  <div key={ind.name} className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                    <p className="text-sm font-bold text-white">{ind.name}</p>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{ind.desc}</p>
                    <p className="text-xs text-blue-400 mt-2 font-mono">{ind.example}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk score */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
              <h3 className="text-base font-semibold text-white mb-2">{ko ? "위험 점수 (Risk Score)" : "Risk Score"}</h3>
              <p className="text-sm text-zinc-400 mb-4">{ko ? "1-10 스케일로 현재 트레이드의 위험도를 평가합니다." : "Evaluates trade risk on a 1-10 scale."}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/15 text-center">
                  <p className="text-lg font-bold text-emerald-400">1-3</p>
                  <p className="text-xs text-emerald-400/80">{ko ? "낮은 위험" : "Low Risk"}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/[0.05] border border-amber-500/15 text-center">
                  <p className="text-lg font-bold text-amber-400">4-6</p>
                  <p className="text-xs text-amber-400/80">{ko ? "중간 위험" : "Medium Risk"}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/[0.05] border border-red-500/15 text-center">
                  <p className="text-lg font-bold text-red-400">7-10</p>
                  <p className="text-xs text-red-400/80">{ko ? "높은 위험" : "High Risk"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/*  STEP 4: SHARE YOUR ANALYSIS                                     */}
        {/* ================================================================ */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-xl flex-shrink-0">4</div>
            <div>
              <h2 className="text-2xl font-bold text-white">{ko ? "분석 공유하기" : "Share Your Analysis"}</h2>
              <p className="text-zinc-500 text-sm mt-1">{ko ? "분석 결과를 X(트위터)에 공유하세요" : "Share results on X (Twitter)"}</p>
            </div>
          </div>

          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
            <p className="text-sm text-zinc-400 leading-relaxed">
              {ko
                ? "분석이 완료되면 하단에 '트윗 공유' 버튼이 나타납니다. AI가 자동으로 트레이드 셋업, 주요 레벨, 신뢰도를 포함한 포스트를 생성합니다. AI 코멘터리(Grok 스타일)도 함께 제공되어 시장 영향을 분석합니다. '복사' 버튼으로 클립보드에 복사하거나 'Share on X' 버튼으로 직접 트윗할 수 있습니다."
                : "After analysis completes, a 'Share on X' button appears. AI auto-generates a post with trade setup, key levels, and confidence. Grok-style AI commentary analyzes market impact. Copy to clipboard or share directly on X."}
            </p>
          </div>
        </section>

        {/* ================================================================ */}
        {/*  FAQ                                                             */}
        {/* ================================================================ */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8">{ko ? "자주 묻는 질문" : "FAQ"}</h2>
          <div className="space-y-4">
            {[
              {
                q: ko ? "분석 비용이 있나요?" : "Is there a cost?",
                a: ko ? "아니요. 현재 모든 분석은 완전 무료입니다." : "No. All analyses are currently completely free."
              },
              {
                q: ko ? "어떤 코인을 분석할 수 있나요?" : "Which coins can I analyze?",
                a: ko ? "USDT 페어라면 모든 코인이 가능합니다. BTC, ETH, SOL, XRP 등 인기 페어는 원클릭으로 선택하고, 다른 페어는 직접 입력할 수 있습니다." : "Any coin with a USDT pair. Popular pairs are one-click, others can be typed manually."
              },
              {
                q: ko ? "분석은 얼마나 정확한가요?" : "How accurate is the analysis?",
                a: ko ? "AI 분석은 참고용이며 투자 조언이 아닙니다. 실시간 가격, 뉴스, 오더북 데이터를 결합하여 객관적인 데이터를 제공하지만, 모든 투자 결정은 본인의 책임입니다." : "AI analysis is for reference only, not investment advice. It combines real-time data for objective insights, but all trading decisions are your responsibility."
              },
              {
                q: ko ? "하루에 몇 번 분석할 수 있나요?" : "How many analyses per day?",
                a: ko ? "현재 제한 없이 무료로 이용 가능합니다." : "Currently unlimited and free."
              },
            ].map((faq, i) => (
              <details key={i} className="group rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors">
                  <span className="text-sm font-semibold text-zinc-200">{faq.q}</span>
                  <svg className="w-4 h-4 text-zinc-500 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-6 pb-4">
                  <p className="text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link
            href={`/${lang}/chart-ideas/analyze`}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-base font-semibold transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30"
          >
            {ko ? "지금 무료로 분석하기" : "Try Free Analysis Now"}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
          <p className="text-zinc-600 text-xs mt-4">
            {ko ? "로그인 후 무료로 이용 가능합니다" : "Free after login. No credit card required."}
          </p>
        </div>
      </Container>
    </div>
  );
}
