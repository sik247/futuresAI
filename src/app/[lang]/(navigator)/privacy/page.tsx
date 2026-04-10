import Container from "@/components/ui/container";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Futures AI",
  description: "Privacy Policy for Futures AI (AlphAi) crypto analytics platform.",
};

const content = {
  ko: {
    title: "개인정보 처리방침",
    lastUpdated: "최종 수정일: 2026년 3월 1일",
    sections: [
      {
        heading: "1. 수집하는 정보",
        body: `Futures AI는 서비스 제공을 위해 다음과 같은 정보를 수집합니다:\n\n• 계정 정보: 이메일 주소, 사용자 이름, 프로필 이미지 (소셜 로그인 시 제공되는 정보 포함)\n• 거래소 API 키: 페이백 추적 및 포트폴리오 분석을 위해 사용자가 자발적으로 제공하는 거래소 API 키 (읽기 전용 권한만 요구)\n• 이용 분석 데이터: 페이지 방문, 기능 사용 패턴, 기기 정보 등 서비스 개선을 위한 분석 데이터\n• 사용자 생성 콘텐츠: 커뮤니티 게시물, 댓글, 차트 아이디어 등`,
      },
      {
        heading: "2. 데이터 저장",
        body: `수집된 정보는 다음과 같이 안전하게 저장됩니다:\n\n• PostgreSQL 데이터베이스: 계정 정보, 사용자 설정, 게시물 등 핵심 데이터\n• Supabase Storage: 사용자 업로드 파일 (프로필 이미지, 차트 스크린샷 등)\n• 암호화: API 키 등 민감한 정보는 암호화하여 저장\n\n데이터는 업계 표준 보안 조치를 적용하여 보호됩니다.`,
      },
      {
        heading: "3. 제3자 서비스",
        body: `본 서비스는 기능 제공을 위해 다음 제3자 서비스를 이용합니다:\n\n• CoinGecko API: 실시간 암호화폐 시세 및 시장 데이터\n• TradingView 위젯: 차트 표시 및 기술적 분석 도구\n• Google Translate API: 뉴스 콘텐츠 번역\n• Telegram Bot API: 알림 및 뉴스 브리핑 전송\n• Google Gemini AI: AI 기반 분석 및 시그널 생성\n• Bitget / Bybit API: 거래소 연동 및 페이백 추적\n\n각 제3자 서비스의 개인정보 처리방침이 별도로 적용됩니다.`,
      },
      {
        heading: "4. 쿠키 및 분석",
        body: `본 서비스는 다음 목적으로 쿠키를 사용합니다:\n\n• 필수 쿠키: 로그인 세션 유지, 언어 설정 등 서비스 운영에 필수적인 쿠키\n• 분석 쿠키: 서비스 개선을 위한 이용 패턴 분석\n\n브라우저 설정을 통해 쿠키 수집을 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.`,
      },
      {
        heading: "5. 사용자 권리",
        body: `사용자는 다음과 같은 권리를 가집니다:\n\n• 데이터 열람: 본인의 개인정보에 대한 열람을 요청할 수 있습니다\n• 데이터 수정: 부정확한 정보의 수정을 요청할 수 있습니다\n• 데이터 삭제: 계정 삭제 및 관련 데이터의 완전한 삭제를 요청할 수 있습니다\n• 데이터 내보내기: 본인의 데이터를 일반적인 형식으로 내보내기를 요청할 수 있습니다\n• 동의 철회: 데이터 수집 및 처리에 대한 동의를 언제든지 철회할 수 있습니다\n\n위 권리 행사를 위해 admin@futuresai.io으로 연락해 주시기 바랍니다.`,
      },
      {
        heading: "6. 문의",
        body: `개인정보 처리방침에 대한 문의사항은 아래로 연락해 주시기 바랍니다.\n\n이메일: admin@futuresai.io\nTelegram: @FuturesAI_Official`,
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: March 1, 2026",
    sections: [
      {
        heading: "1. Information We Collect",
        body: `Futures AI collects the following information to provide our services:\n\n• Account Information: Email address, username, profile image (including information provided via social login)\n• Exchange API Keys: Read-only API keys voluntarily provided by users for payback tracking and portfolio analysis\n• Usage Analytics: Page visits, feature usage patterns, device information, and other analytics for service improvement\n• User-Generated Content: Community posts, comments, chart ideas, etc.`,
      },
      {
        heading: "2. Data Storage",
        body: `Collected information is securely stored as follows:\n\n• PostgreSQL Database: Core data including account information, user settings, and posts\n• Supabase Storage: User-uploaded files (profile images, chart screenshots, etc.)\n• Encryption: Sensitive information such as API keys is stored in encrypted form\n\nData is protected using industry-standard security measures.`,
      },
      {
        heading: "3. Third-Party Services",
        body: `The Service utilizes the following third-party services:\n\n• CoinGecko API: Real-time cryptocurrency prices and market data\n• TradingView Widgets: Chart display and technical analysis tools\n• Google Translate API: News content translation\n• Telegram Bot API: Notifications and news briefing delivery\n• Google Gemini AI: AI-powered analysis and signal generation\n• Bitget / Bybit API: Exchange integration and payback tracking\n\nEach third-party service has its own privacy policy that applies separately.`,
      },
      {
        heading: "4. Cookies and Analytics",
        body: `The Service uses cookies for the following purposes:\n\n• Essential Cookies: Required for service operation, such as login sessions and language settings\n• Analytics Cookies: Usage pattern analysis for service improvement\n\nYou can refuse cookie collection through your browser settings, but some services may be limited.`,
      },
      {
        heading: "5. User Rights",
        body: `Users have the following rights:\n\n• Data Access: Request to view your personal information\n• Data Correction: Request correction of inaccurate information\n• Data Deletion: Request complete deletion of your account and related data\n• Data Export: Request export of your data in a common format\n• Withdrawal of Consent: Withdraw consent for data collection and processing at any time\n\nTo exercise these rights, please contact admin@futuresai.io.`,
      },
      {
        heading: "6. Contact",
        body: `For questions regarding this Privacy Policy, please contact us at:\n\nEmail: admin@futuresai.io\nTelegram: @FuturesAI_Official`,
      },
    ],
  },
};

export default function PrivacyPolicy({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const t = lang === "ko" ? content.ko : content.en;

  return (
    <div className="pt-20 pb-16 min-h-screen bg-zinc-950">
      <Container className="flex flex-col gap-8 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {t.title}
          </h1>
          <p className="text-sm text-zinc-500 font-mono">{t.lastUpdated}</p>
        </div>

        <div className="flex flex-col gap-8">
          {t.sections.map((section) => (
            <section
              key={section.heading}
              className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6"
            >
              <h2 className="text-lg font-semibold text-white">
                {section.heading}
              </h2>
              <p className="text-sm leading-relaxed text-zinc-400 whitespace-pre-line">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </Container>
    </div>
  );
}
