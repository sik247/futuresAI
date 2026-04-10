import Container from "@/components/ui/container";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Futures AI",
  description: "Terms of Service for Futures AI (AlphAi) crypto analytics platform.",
};

const content = {
  ko: {
    title: "이용약관",
    lastUpdated: "최종 수정일: 2026년 3월 1일",
    sections: [
      {
        heading: "1. 서비스 설명",
        body: `Futures AI (이하 "AlphAi" 또는 "본 서비스")는 암호화폐 시장 분석, AI 기반 시그널, 차트 분석, 뉴스 집계 및 포트폴리오 추적 기능을 제공하는 정보 분석 플랫폼입니다. 본 서비스는 암호화폐 거래소가 아니며, 본 플랫폼에서 직접적인 매매가 이루어지지 않습니다. 본 서비스는 교육 및 정보 제공 목적으로만 운영됩니다.`,
      },
      {
        heading: "2. 이용 자격",
        body: `본 서비스를 이용하려면 만 19세 이상이어야 하며, 거주 지역의 법률에 따라 암호화폐 관련 서비스 이용이 허용되어야 합니다. 계정을 등록함으로써 귀하는 이러한 요건을 충족함을 확인합니다.`,
      },
      {
        heading: "3. 계정 조건",
        body: `계정 생성 시 정확한 정보를 제공해야 하며, 계정 보안을 유지할 책임은 사용자에게 있습니다. 계정의 무단 사용이 의심되는 경우 즉시 통보해야 합니다. 본 서비스는 사전 통지 없이 계정을 정지하거나 해지할 수 있습니다.`,
      },
      {
        heading: "4. 허용되는 이용",
        body: `사용자는 본 서비스를 합법적인 목적으로만 이용해야 합니다. 다음 행위는 금지됩니다:\n\n• 서비스의 보안 메커니즘을 우회하거나 무력화하는 행위\n• 자동화된 방법(봇, 스크래퍼 등)으로 데이터를 무단 수집하는 행위\n• 타인의 계정에 무단 접근하는 행위\n• 서비스를 이용하여 불법 활동을 수행하는 행위\n• 서비스의 정상적 운영을 방해하는 행위`,
      },
      {
        heading: "5. 지적 재산권",
        body: `본 서비스의 모든 콘텐츠, AI 모델, 분석 알고리즘, 디자인 및 소프트웨어는 Futures AI의 지적 재산입니다. 사용자는 개인적, 비상업적 목적으로만 콘텐츠를 이용할 수 있으며, 명시적 서면 동의 없이 재배포, 복제 또는 상업적 이용을 할 수 없습니다.`,
      },
      {
        heading: "6. 면책 조항 (투자 조언 아님)",
        body: `본 서비스에서 제공하는 모든 정보, AI 시그널, 차트 분석 및 뉴스는 일반적인 정보 제공 목적으로만 제공되며, 금융 투자 조언, 매매 권유 또는 추천이 아닙니다. 암호화폐 투자에는 원금 손실을 포함한 상당한 위험이 수반됩니다. 모든 투자 결정은 사용자 본인의 판단과 책임 하에 이루어져야 합니다.`,
      },
      {
        heading: "7. 책임 제한",
        body: `법률이 허용하는 최대 범위 내에서, Futures AI 및 그 임직원, 파트너는 본 서비스 이용으로 인해 발생하는 직접적, 간접적, 우발적, 특별 또는 결과적 손해에 대해 책임을 지지 않습니다. 여기에는 투자 손실, 데이터 손실 또는 서비스 중단으로 인한 손해가 포함됩니다.`,
      },
      {
        heading: "8. 약관 변경",
        body: `본 약관은 사전 통지 후 변경될 수 있습니다. 변경 사항은 본 페이지에 게시되며, 변경 후 서비스를 계속 이용하는 경우 변경된 약관에 동의한 것으로 간주됩니다. 중요한 변경 사항의 경우 이메일 또는 서비스 내 알림을 통해 통지합니다.`,
      },
      {
        heading: "9. 문의",
        body: `본 약관에 대한 문의사항은 아래로 연락해 주시기 바랍니다.\n\n이메일: admin@futuresai.io\nTelegram: @FuturesAI_Official`,
      },
    ],
  },
  en: {
    title: "Terms of Service",
    lastUpdated: "Last updated: March 1, 2026",
    sections: [
      {
        heading: "1. Service Description",
        body: `Futures AI (also known as "AlphAi" or "the Service") is an information and analytics platform providing cryptocurrency market analysis, AI-powered signals, chart analysis, news aggregation, and portfolio tracking. The Service is NOT a cryptocurrency exchange and no trading occurs on the platform. The Service is operated solely for educational and informational purposes.`,
      },
      {
        heading: "2. User Eligibility",
        body: `You must be at least 19 years old to use this Service. By creating an account, you confirm that you meet this requirement and that the use of cryptocurrency-related services is permitted under the laws of your jurisdiction.`,
      },
      {
        heading: "3. Account Terms",
        body: `You must provide accurate information when creating an account and are responsible for maintaining the security of your account. You must notify us immediately of any suspected unauthorized use. We reserve the right to suspend or terminate accounts without prior notice.`,
      },
      {
        heading: "4. Acceptable Use",
        body: `You agree to use the Service only for lawful purposes. The following are prohibited:\n\n• Circumventing or disabling security mechanisms\n• Unauthorized data collection via automated means (bots, scrapers, etc.)\n• Unauthorized access to other users' accounts\n• Using the Service for illegal activities\n• Interfering with the normal operation of the Service`,
      },
      {
        heading: "5. Intellectual Property",
        body: `All content, AI models, analysis algorithms, designs, and software of the Service are the intellectual property of Futures AI. Users may use content for personal, non-commercial purposes only and may not redistribute, reproduce, or commercially exploit it without explicit written consent.`,
      },
      {
        heading: "6. Disclaimer (Not Financial Advice)",
        body: `All information, AI signals, chart analysis, and news provided by the Service are for general informational purposes only and do not constitute financial investment advice, solicitation, or recommendation. Cryptocurrency investment involves significant risks, including loss of principal. All investment decisions must be made at your own judgment and responsibility.`,
      },
      {
        heading: "7. Limitation of Liability",
        body: `To the maximum extent permitted by law, Futures AI and its officers, employees, and partners shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from the use of the Service, including investment losses, data loss, or damages from service interruptions.`,
      },
      {
        heading: "8. Changes to Terms",
        body: `These Terms may be modified with prior notice. Changes will be posted on this page, and continued use of the Service after changes constitutes acceptance of the modified Terms. For significant changes, we will notify you via email or in-app notification.`,
      },
      {
        heading: "9. Contact",
        body: `For questions regarding these Terms, please contact us at:\n\nEmail: admin@futuresai.io\nTelegram: @FuturesAI_Official`,
      },
    ],
  },
};

export default function TermsOfService({
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
