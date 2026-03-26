import Container from "@/components/ui/container";
import Link from "next/link";

export const metadata = {
  title: "How to Use AI Chart Analysis - FuturesAI",
  description: "Step-by-step guide to using FuturesAI's AI-powered chart analysis. Upload a chart, get instant quant analysis with support/resistance, RSI, MACD, trade setups.",
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
        <div className="text-center mb-16">
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-blue-400 mb-4">
            {ko ? "사용 가이드" : "User Guide"}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            {ko ? "AI 차트 분석 사용법" : "How to Use AI Chart Analysis"}
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            {ko
              ? "3단계만으로 프로급 퀀트 분석을 받으세요. 무료입니다."
              : "Get pro-level quant analysis in 3 steps. Completely free."}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-16 mb-20">
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-3">
                {ko ? "TradingView에서 차트 스크린샷 촬영" : "Screenshot Your Chart from TradingView"}
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                {ko
                  ? "TradingView, 바이낸스, 바이빗 등 원하는 거래소에서 분석하고 싶은 차트를 캡처하세요. 4시간봉 또는 일봉을 권장합니다. 캔들스틱, 볼린저 밴드, RSI 등 지표가 보이면 더 정확한 분석을 제공합니다."
                  : "Capture a chart from TradingView, Binance, Bybit, or any exchange. We recommend 4H or Daily timeframe. Visible indicators like candlesticks, Bollinger Bands, and RSI enable more accurate analysis."}
              </p>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <p className="text-xs text-zinc-500 font-mono mb-2">{ko ? "팁" : "Tips"}</p>
                <ul className="space-y-1.5 text-sm text-zinc-400">
                  <li>• {ko ? "깨끗한 차트일수록 정확도가 높습니다" : "Cleaner charts give more accurate results"}</li>
                  <li>• {ko ? "가격 축이 보이게 캡처하세요" : "Make sure the price axis is visible"}</li>
                  <li>• {ko ? "PNG, JPG 10MB 이하" : "PNG, JPG under 10MB"}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-3">
                {ko ? "업로드 & 거래 페어 선택" : "Upload & Select Trading Pair"}
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                {ko
                  ? "차트를 드래그 앤 드롭하거나 클릭하여 업로드합니다. BTC/USDT, ETH/USDT 등 인기 페어를 선택하거나 커스텀 페어를 입력할 수 있습니다. '분석하기' 버튼을 클릭하면 AI 분석이 시작됩니다."
                  : "Drag & drop or click to upload your chart. Select from popular pairs like BTC/USDT, ETH/USDT, or type a custom pair. Click 'Analyze' to start."}
              </p>
              <div className="flex flex-wrap gap-2">
                {["BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT", "BNB/USDT"].map((p) => (
                  <span key={p} className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/[0.05] border border-white/[0.08] text-zinc-400">{p}</span>
                ))}
                <span className="px-3 py-1.5 rounded-lg text-xs font-mono bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  {ko ? "+ 커스텀 페어" : "+ Custom"}
                </span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-lg flex-shrink-0">
              3
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-3">
                {ko ? "AI 분석 결과 확인" : "Get Your AI Analysis"}
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                {ko
                  ? "AI가 차트를 읽고 실시간 바이낸스 가격, 뉴스 센티먼트, 오더북 데이터를 결합하여 종합 분석을 제공합니다. 분석에는 15-30초가 소요됩니다."
                  : "AI reads your chart and combines it with live Binance prices, news sentiment, and order book data for comprehensive analysis. Takes 15-30 seconds."}
              </p>
            </div>
          </div>
        </div>

        {/* Analysis Example */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">
              {ko ? "실제 분석 결과 예시" : "Real Analysis Example"}
            </h2>
            <p className="text-zinc-500">
              {ko ? "BTC/USDT 4시간봉 차트에 대한 AI 분석 결과" : "AI analysis result for BTC/USDT 4H chart"}
            </p>
          </div>

          <div className="space-y-4">
            {/* Mock analysis result cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Summary */}
              <div className="lg:col-span-2 rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">{ko ? "분석 요약" : "Analysis Summary"}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-green-400">BULLISH</span>
                    <span className="text-xs text-zinc-500">|</span>
                    <span className="text-sm text-zinc-400">{ko ? "신뢰도" : "Confidence"}: <span className="text-white font-mono">78%</span></span>
                  </div>
                </div>
                <p className="text-zinc-300 leading-relaxed text-sm">
                  {ko
                    ? "BTC/USDT는 4시간봉에서 상승 채널을 형성하고 있으며, $70,500 지지선에서 반등하여 현재 $71,300 부근에서 거래 중입니다. RSI 56으로 과매수 구간에 진입하지 않았으며, EMA 9가 EMA 21 위에서 골든크로스를 유지하고 있어 단기 상승 모멘텀이 지속될 것으로 보입니다."
                    : "BTC/USDT is forming an ascending channel on the 4H timeframe, bouncing from the $70,500 support level and currently trading around $71,300. RSI at 56 is not yet overbought, and EMA 9 maintains a golden cross above EMA 21, suggesting short-term bullish momentum continues."}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {["Ascending Channel", "Golden Cross", "Higher Lows"].map((p) => (
                    <span key={p} className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 border border-purple-500/30 text-purple-300">{p}</span>
                  ))}
                </div>
              </div>

              {/* Risk Score */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6 flex flex-col items-center gap-3">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">{ko ? "위험 점수" : "Risk Score"}</h3>
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="132 264" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">5</span><span className="text-xs text-zinc-500">/10</span>
                  </div>
                </div>
                <span className="text-xs text-zinc-500">{ko ? "중간 위험" : "Medium Risk"}</span>
              </div>
            </div>

            {/* Trade Setup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">{ko ? "트레이드 설정" : "Trade Setup"}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-500">{ko ? "방향" : "Direction"}</span><span className="font-bold text-green-400">LONG</span></div>
                  <div className="flex justify-between"><span className="text-blue-400">{ko ? "진입가" : "Entry"}</span><span className="text-white font-mono">$71,100</span></div>
                  <div className="flex justify-between"><span className="text-red-400">{ko ? "손절가" : "Stop Loss"}</span><span className="text-white font-mono">$69,800</span></div>
                  <div className="flex justify-between"><span className="text-green-400">{ko ? "목표가" : "Take Profit"}</span><span className="text-white font-mono">$74,200</span></div>
                  <div className="h-px bg-white/10 my-1" />
                  <div className="flex justify-between"><span className="text-zinc-500">R:R</span><span className="text-white font-mono font-bold">1:2.38</span></div>
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">{ko ? "기술 지표" : "Indicators"}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center"><div><span className="text-white">RSI (14)</span><br /><span className="text-zinc-500 text-xs">56.3</span></div><span className="px-2 py-0.5 rounded text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/30">BUY</span></div>
                  <div className="flex justify-between items-center"><div><span className="text-white">MACD</span><br /><span className="text-zinc-500 text-xs">{ko ? "히스토그램 양전환" : "Histogram positive"}</span></div><span className="px-2 py-0.5 rounded text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/30">BUY</span></div>
                  <div className="flex justify-between items-center"><div><span className="text-white">{ko ? "볼린저 밴드" : "Bollinger"}</span><br /><span className="text-zinc-500 text-xs">{ko ? "중심선 위" : "Above middle"}</span></div><span className="px-2 py-0.5 rounded text-xs font-semibold text-zinc-400 bg-zinc-500/10 border border-zinc-500/30">NEUTRAL</span></div>
                  <div className="flex justify-between items-center"><div><span className="text-white">{ko ? "거래량" : "Volume"}</span><br /><span className="text-zinc-500 text-xs">{ko ? "평균 이상" : "Above average"}</span></div><span className="px-2 py-0.5 rounded text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/30">BUY</span></div>
                </div>
              </div>
            </div>

            {/* Key Levels */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">{ko ? "핵심 가격 수준" : "Key Price Levels"}</h3>
              <div className="flex flex-col sm:flex-row gap-6">
                <div>
                  <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">{ko ? "지지선" : "Support"}</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["$70,500", "$69,200", "$67,800"].map((l) => (
                      <span key={l} className="px-3 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-300 font-mono text-sm">{l}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">{ko ? "저항선" : "Resistance"}</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["$72,100", "$73,500", "$75,000"].map((l) => (
                      <span key={l} className="px-3 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-sm">{l}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
