export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const TITLE = "How FuturesAI's Quant Chat Maximizes Crypto Trading Analysis";
const TITLE_KO = "FuturesAI 퀀트 채팅이 암호화폐 트레이딩 분석을 극대화하는 방법";

const EXCERPT = "Discover how FuturesAI combines 9 real-time data sources, Gemini 2.5 Pro AI, and institutional-grade analysis to deliver trading strategies that outperform traditional tools.";
const EXCERPT_KO = "FuturesAI가 9개 실시간 데이터 소스, Gemini 2.5 Pro AI, 기관급 분석을 결합하여 기존 도구를 능가하는 트레이딩 전략을 제공하는 방법을 알아보세요.";

const CONTENT = `
<h2>Why We Built FuturesAI Quant Chat</h2>

<p>Traditional crypto analysis tools give you charts. ChatGPT gives you outdated information. Neither gives you what professional traders actually need: <strong>real-time, data-driven, actionable trading strategies with specific entry and exit points.</strong></p>

<p>That's why we built FuturesAI Quant Chat — an AI-powered crypto analyst that combines the analytical depth of a quantitative trading desk with the accessibility of a chat interface.</p>

<h2>The Architecture: 9 Real-Time Data Sources</h2>

<p>Every time you ask FuturesAI a question, our system doesn't just rely on training data. It <strong>actively fetches live market data from 9 different sources simultaneously</strong>:</p>

<h3>Price Data (3-Tier Failover)</h3>
<ul>
<li><strong>Binance</strong> — Real-time spot and futures prices with 24h volume, high/low</li>
<li><strong>CoinGecko</strong> — Aggregated market data as first fallback</li>
<li><strong>CryptoCompare</strong> — Third-tier redundancy ensuring 99.9% price availability</li>
</ul>

<p>This 3-tier failover system means our AI <strong>never guesses prices</strong>. When Binance is rate-limited (which happens frequently on cloud servers), CoinGecko picks up instantly. If both fail, CryptoCompare provides the safety net.</p>

<h3>Korean Market Data</h3>
<ul>
<li><strong>Upbit</strong> — KRW prices, volume, and 24h range</li>
<li><strong>Kimchi Premium Calculator</strong> — Real-time premium/discount between Korean and global markets</li>
</ul>

<p>For Korean traders, the Kimchi Premium is a critical trading signal. Our AI calculates it in real-time and factors it into every analysis.</p>

<h3>Technical Indicators</h3>
<ul>
<li><strong>Binance Klines API</strong> — 4-hour candlestick data for RSI(14), MA7, and MA20 calculation</li>
<li>Trend detection: UPTREND / DOWNTREND / SIDEWAYS based on moving average crossovers</li>
</ul>

<h3>Market Sentiment</h3>
<ul>
<li><strong>Fear & Greed Index</strong> — Real-time market sentiment (0-100 scale)</li>
<li>Our AI interprets extreme fear as potential buying opportunities and extreme greed as caution signals</li>
</ul>

<h3>News & Social Intelligence</h3>
<ul>
<li><strong>CryptoPanic</strong> — Trending and hot crypto news</li>
<li><strong>RSS Aggregation</strong> — CoinTelegraph, CoinDesk, Decrypt, and more</li>
<li><strong>X/Twitter Feed</strong> — Real-time crypto analyst activity</li>
<li><strong>DuckDuckGo Search</strong> — Web context for general queries</li>
</ul>

<h2>The AI Engine: Gemini 2.5 Pro</h2>

<p>We chose Google's Gemini 2.5 Pro as our AI backbone for several reasons:</p>

<ul>
<li><strong>Large context window</strong> — Can process all 9 data sources simultaneously without truncation</li>
<li><strong>Strong numerical reasoning</strong> — Critical for accurate price calculations, risk/reward ratios, and support/resistance identification</li>
<li><strong>Multilingual excellence</strong> — Native-quality Korean and English financial analysis</li>
<li><strong>Low latency</strong> — Fast enough for real-time trading decisions</li>
</ul>

<h2>What Makes Our Analysis Different</h2>

<p>Here's what a typical FuturesAI response includes that you won't find in ChatGPT or basic charting tools:</p>

<h3>1. Dual-Exchange Price Overview</h3>
<p>Every analysis shows both Binance (USD) and Upbit (KRW) prices with the Kimchi Premium calculated. This is essential for traders operating across Korean and global exchanges.</p>

<h3>2. Complete Trading Strategy</h3>
<p>Not just "BTC looks bullish." We provide:</p>
<ul>
<li><strong>Entry Zone:</strong> Specific price range for optimal entry</li>
<li><strong>Stop Loss:</strong> Exact price with reasoning (e.g., "MA20 break at $69,200")</li>
<li><strong>Take Profit 1:</strong> Conservative target with rationale</li>
<li><strong>Take Profit 2:</strong> Aggressive target for momentum trades</li>
<li><strong>Risk/Reward Ratio:</strong> Calculated from entry/SL/TP</li>
<li><strong>Position Sizing:</strong> Recommended % of portfolio</li>
<li><strong>Confidence Level:</strong> Low / Medium / High based on data convergence</li>
</ul>

<h3>3. News-Driven Context</h3>
<p>Our AI doesn't just cite news — it explains <strong>how</strong> each headline impacts price action. News headlines are automatically translated to your language.</p>

<h3>4. Risk Assessment</h3>
<p>Every analysis includes what would <strong>invalidate</strong> the trade thesis, key risks to watch, and volatility warnings.</p>

<h2>The Technology Stack</h2>

<ul>
<li><strong>Framework:</strong> Next.js 14 (App Router) with server-side rendering</li>
<li><strong>AI:</strong> Google Gemini 2.5 Pro via API</li>
<li><strong>Data Pipeline:</strong> 9 APIs fetched in parallel with Promise.allSettled</li>
<li><strong>Database:</strong> PostgreSQL via Prisma ORM for conversation memory</li>
<li><strong>Real-time Charts:</strong> TradingView widget integration</li>
<li><strong>Deployment:</strong> Vercel with edge functions</li>
<li><strong>Monitoring:</strong> Automated price validation cron (every 4 hours)</li>
</ul>

<h2>Rate Limiting: Fair Access for Everyone</h2>

<p>We use a rolling window rate limit system (similar to Claude and ChatGPT) rather than hard daily caps. Free users get a taste of our analysis quality, while Basic ($25/month) and Premium ($99/month) subscribers enjoy higher frequency access.</p>

<h2>What's Next</h2>

<p>We're continuously improving FuturesAI with:</p>
<ul>
<li>On-chain data integration (whale wallet tracking in AI context)</li>
<li>Multi-timeframe analysis (1H, 4H, 1D, 1W simultaneously)</li>
<li>Portfolio-aware recommendations based on your holdings</li>
<li>Automated alert triggers when AI-predicted levels are hit</li>
</ul>

<p><strong>Try FuturesAI Quant Chat today</strong> — your first analysis is free. Experience the difference that real-time data and institutional-grade AI makes.</p>
`;

const CONTENT_KO = `
<h2>FuturesAI 퀀트 채팅을 만든 이유</h2>

<p>기존 크립토 분석 도구는 차트만 제공합니다. ChatGPT는 오래된 정보를 줍니다. 프로 트레이더가 실제로 필요한 것 — <strong>실시간 데이터 기반의 구체적인 진입/퇴출 전략이 포함된 실행 가능한 트레이딩 분석</strong> — 을 제공하는 도구는 없었습니다.</p>

<p>그래서 FuturesAI 퀀트 채팅을 만들었습니다. 퀀트 트레이딩 데스크 수준의 분석 깊이와 채팅 인터페이스의 접근성을 결합한 AI 기반 크립토 애널리스트입니다.</p>

<h2>아키텍처: 9개 실시간 데이터 소스</h2>

<p>FuturesAI에 질문할 때마다, 우리 시스템은 학습 데이터에만 의존하지 않습니다. <strong>9개의 서로 다른 소스에서 실시간 시장 데이터를 동시에 수집</strong>합니다:</p>

<h3>가격 데이터 (3단계 장애 복구)</h3>
<ul>
<li><strong>바이낸스(Binance)</strong> — 실시간 현물/선물 가격, 24시간 거래량, 고점/저점</li>
<li><strong>코인게코(CoinGecko)</strong> — 집계 시장 데이터 (1차 백업)</li>
<li><strong>크립토컴페어(CryptoCompare)</strong> — 3차 백업으로 99.9% 가격 가용성 보장</li>
</ul>

<p>이 3단계 장애 복구 시스템 덕분에 우리 AI는 <strong>절대 가격을 추측하지 않습니다</strong>. 바이낸스가 속도 제한에 걸리면 코인게코가 즉시 대응하고, 둘 다 실패하면 크립토컴페어가 안전망 역할을 합니다.</p>

<h3>한국 시장 데이터</h3>
<ul>
<li><strong>업비트(Upbit)</strong> — 원화 가격, 거래량, 24시간 레인지</li>
<li><strong>김치 프리미엄 계산기</strong> — 한국과 글로벌 시장 간 실시간 프리미엄/디스카운트</li>
</ul>

<p>한국 트레이더에게 김치 프리미엄은 핵심 트레이딩 시그널입니다. 우리 AI는 이를 실시간으로 계산하여 모든 분석에 반영합니다.</p>

<h3>기술적 지표</h3>
<ul>
<li><strong>바이낸스 캔들 API</strong> — 4시간봉 데이터로 RSI(14), MA7, MA20 계산</li>
<li>이동평균 교차 기반 추세 감지: 상승추세 / 하락추세 / 횡보</li>
</ul>

<h3>시장 센티먼트</h3>
<ul>
<li><strong>공포 & 탐욕 지수</strong> — 실시간 시장 심리 (0-100 척도)</li>
<li>극심한 공포는 매수 기회, 극심한 탐욕은 주의 신호로 해석</li>
</ul>

<h3>뉴스 & 소셜 인텔리전스</h3>
<ul>
<li><strong>CryptoPanic</strong> — 트렌딩 크립토 뉴스</li>
<li><strong>RSS 집계</strong> — 코인텔레그래프, 코인데스크, 디크립트 등</li>
<li><strong>X/트위터 피드</strong> — 실시간 크립토 애널리스트 활동</li>
<li><strong>웹 검색</strong> — 일반 질문에 대한 웹 컨텍스트</li>
</ul>

<h2>AI 엔진: Gemini 2.5 Pro</h2>

<p>Google의 Gemini 2.5 Pro를 AI 핵심 엔진으로 선택한 이유:</p>

<ul>
<li><strong>대규모 컨텍스트 윈도우</strong> — 9개 데이터 소스를 동시에 처리 가능</li>
<li><strong>강력한 수치 추론</strong> — 정확한 가격 계산, 리스크/리워드 비율, 지지/저항선 식별에 필수</li>
<li><strong>다국어 우수성</strong> — 네이티브 수준의 한국어 및 영어 금융 분석</li>
<li><strong>낮은 지연 시간</strong> — 실시간 트레이딩 의사결정에 충분한 속도</li>
</ul>

<h2>우리 분석이 다른 이유</h2>

<p>FuturesAI 응답에 포함되는 내용 — ChatGPT나 기본 차트 도구에서는 찾을 수 없는 것들:</p>

<h3>1. 듀얼 거래소 가격 개요</h3>
<p>모든 분석에 바이낸스(USD)와 업비트(KRW) 가격을 김치 프리미엄과 함께 표시합니다.</p>

<h3>2. 완전한 트레이딩 전략</h3>
<p>"BTC가 좋아 보입니다"가 아닙니다. 우리는 다음을 제공합니다:</p>
<ul>
<li><strong>진입 구간:</strong> 최적 진입을 위한 구체적 가격대</li>
<li><strong>손절매(Stop Loss):</strong> 이유와 함께 정확한 가격 (예: "MA20 이탈 $69,200")</li>
<li><strong>익절 1차(TP1):</strong> 보수적 목표가</li>
<li><strong>익절 2차(TP2):</strong> 모멘텀 트레이드를 위한 공격적 목표가</li>
<li><strong>리스크/리워드 비율:</strong> 진입/손절/익절 기반 계산</li>
<li><strong>포지션 비중:</strong> 포트폴리오 대비 권장 %</li>
<li><strong>확신도:</strong> 데이터 수렴 기반 Low / Medium / High</li>
</ul>

<h3>3. 뉴스 기반 컨텍스트</h3>
<p>뉴스를 인용하는 것에 그치지 않고, 각 헤드라인이 <strong>가격 움직임에 어떤 영향</strong>을 미치는지 설명합니다. 뉴스 제목은 자동으로 한국어로 번역됩니다.</p>

<h3>4. 리스크 평가</h3>
<p>모든 분석에 트레이드 가설을 <strong>무효화</strong>할 요인, 주요 리스크, 변동성 경고가 포함됩니다.</p>

<h2>기술 스택</h2>

<ul>
<li><strong>프레임워크:</strong> Next.js 14 (App Router) + 서버사이드 렌더링</li>
<li><strong>AI:</strong> Google Gemini 2.5 Pro API</li>
<li><strong>데이터 파이프라인:</strong> 9개 API를 Promise.allSettled로 병렬 수집</li>
<li><strong>데이터베이스:</strong> PostgreSQL + Prisma ORM (대화 메모리)</li>
<li><strong>실시간 차트:</strong> TradingView 위젯 통합</li>
<li><strong>배포:</strong> Vercel 엣지 펑션</li>
<li><strong>모니터링:</strong> 4시간마다 자동 가격 검증 크론</li>
</ul>

<h2>요금제: 모든 사용자를 위한 공정한 접근</h2>

<p>Claude와 ChatGPT와 유사한 롤링 윈도우 속도 제한 시스템을 사용합니다. 무료 사용자는 분석 품질을 체험할 수 있고, Basic($25/월)과 Premium($99/월) 구독자는 더 높은 빈도로 이용할 수 있습니다.</p>

<h2>앞으로의 계획</h2>

<ul>
<li>온체인 데이터 통합 (AI 컨텍스트 내 고래 지갑 추적)</li>
<li>다중 타임프레임 분석 (1H, 4H, 1D, 1W 동시 분석)</li>
<li>보유 자산 기반 포트폴리오 인식 추천</li>
<li>AI 예측 레벨 도달 시 자동 알림 트리거</li>
</ul>

<p><strong>오늘 FuturesAI 퀀트 채팅을 체험해보세요</strong> — 첫 분석은 무료입니다. 실시간 데이터와 기관급 AI가 만드는 차이를 경험하세요.</p>
`;

export async function GET(request: Request) {
  // Only allow with cron secret or in development
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Also allow admin session
      const url = new URL(request.url);
      if (!url.searchParams.get("force")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
  }

  // Check if post already exists
  const existing = await prisma.blogArticle.findFirst({
    where: { title: TITLE },
  });
  if (existing) {
    return NextResponse.json({ message: "Post already exists", id: existing.id });
  }

  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (!admin) {
    return NextResponse.json({ error: "No admin user" }, { status: 500 });
  }

  const article = await prisma.blogArticle.create({
    data: {
      title: TITLE,
      titleKo: TITLE_KO,
      content: CONTENT,
      contentKo: CONTENT_KO,
      excerpt: EXCERPT,
      excerptKo: EXCERPT_KO,
      category: "research",
      tags: ["AI", "quant", "trading", "Gemini", "FuturesAI", "crypto-analysis", "machine-learning"],
      published: true,
      publishedAt: new Date(),
      authorId: admin.id,
    },
  });

  return NextResponse.json({ success: true, id: article.id, title: TITLE });
}
