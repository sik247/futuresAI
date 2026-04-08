"use client";

import Container from "@/components/ui/container";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EXCHANGE_GUIDES } from "../exchange-data";
import { getGuideContent } from "./guide-content";
import { notFound } from "next/navigation";

function StepCard({
  stepNumber,
  title,
  children,
  color,
}: {
  stepNumber: number;
  title: string;
  children: React.ReactNode;
  color: string;
}) {
  return (
    <div className="relative rounded-2xl bg-zinc-900/60 border border-white/[0.06] overflow-hidden">
      {/* Step indicator bar */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${color}, transparent)`,
        }}
      />
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold shrink-0"
            style={{
              backgroundColor: `${color}20`,
              color: color,
            }}
          >
            {stepNumber}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">{title}</h2>
        </div>
        <div className="space-y-5">{children}</div>
      </div>
    </div>
  );
}

function GuideImage({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="my-4">
      <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-zinc-800/30">
        <img
          src={src}
          alt={alt}
          className="w-full h-auto"
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-xs text-zinc-500 text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function ImageRow({
  images,
}: {
  images: { src: string; alt: string; caption?: string }[];
}) {
  return (
    <div
      className={`grid gap-3 my-4 ${images.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}
    >
      {images.map((img, i) => (
        <figure key={i}>
          <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-zinc-800/30">
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
          {img.caption && (
            <figcaption className="mt-1.5 text-xs text-zinc-500 text-center">
              {img.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

function WarningBox({
  children,
  isKo,
}: {
  children: React.ReactNode;
  isKo: boolean;
}) {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
      <svg
        className="w-5 h-5 text-amber-400 shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <div className="text-base text-amber-200/80 leading-relaxed">{children}</div>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-blue-500/[0.06] border border-blue-500/20">
      <svg
        className="w-5 h-5 text-blue-400 shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        />
      </svg>
      <div className="text-base text-blue-200/80 leading-relaxed">{children}</div>
    </div>
  );
}

export default function ExchangeGuidePage() {
  const params = useParams();
  const lang = params.lang as string;
  const exchangeSlug = params.exchange as string;
  const isKo = lang === "ko";

  const exchange = EXCHANGE_GUIDES.find((e) => e.slug === exchangeSlug);
  if (!exchange) return notFound();

  const content = getGuideContent(exchangeSlug, isKo);
  if (!content) return notFound();

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 sm:pt-28 pb-24">
      <Container className="max-w-4xl">
        {/* Back link */}
        <Link
          href={`/${lang}/guides`}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          {isKo ? "가이드 목록" : "All Guides"}
        </Link>

        {/* Hero Card */}
        <div className="rounded-2xl bg-zinc-900/60 border border-white/[0.06] overflow-hidden mb-8">
          <div
            className="h-1.5 w-full"
            style={{
              background: `linear-gradient(90deg, ${exchange.color}, ${exchange.color}60, transparent)`,
            }}
          />
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              {/* Logo */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
                style={{
                  backgroundColor: `${exchange.color}15`,
                  color: exchange.color,
                  border: `1px solid ${exchange.color}25`,
                }}
              >
                {exchange.logoText.charAt(0)}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {isKo
                    ? `${exchange.nameKo} 레퍼럴 코드 & KYC 변경 가이드`
                    : `${exchange.name} Referral Code & KYC Change Guide`}
                </h1>
                <p className="text-sm text-zinc-400">
                  {isKo
                    ? `FuturesAI 전용 ${exchange.paybackPercent}% 페이백 혜택 받기`
                    : `Get ${exchange.paybackPercent}% payback with FuturesAI`}
                </p>
              </div>
              {/* Payback badge */}
              <div
                className="self-start px-4 py-2 rounded-xl text-lg font-bold text-center"
                style={{
                  backgroundColor: `${exchange.color}15`,
                  color: exchange.color,
                  border: `1px solid ${exchange.color}30`,
                }}
              >
                {exchange.paybackPercent}%
                <div className="text-xs font-normal opacity-70">Payback</div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/[0.06]">
              <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                <div className="text-xs text-zinc-500 mb-1">
                  {isKo ? "레퍼럴 코드" : "Referral Code"}
                </div>
                <code className="text-sm font-mono text-white">
                  {exchange.referralCode}
                </code>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                <div className="text-xs text-zinc-500 mb-1">
                  {isKo ? "페이백" : "Payback"}
                </div>
                <div
                  className="text-sm font-bold"
                  style={{ color: exchange.color }}
                >
                  {exchange.paybackPercent}%
                </div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                <div className="text-xs text-zinc-500 mb-1">
                  {isKo ? "최대 계정" : "Max Accounts"}
                </div>
                <div className="text-sm font-medium text-white">
                  {exchange.maxAccounts}
                </div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                <div className="text-xs text-zinc-500 mb-1">
                  {isKo ? "KYC 수단" : "KYC Methods"}
                </div>
                <div className="text-sm font-medium text-white">
                  {isKo ? "3종" : "3 types"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guide Steps */}
        <div className="space-y-6">
          {content.sections.map((section, i) => (
            <StepCard
              key={i}
              stepNumber={i + 1}
              title={section.title}
              color={exchange.color}
            >
              {section.blocks.map((block, j) => {
                if (block.type === "text") {
                  return (
                    <p key={j} className="text-base text-zinc-300 leading-relaxed">
                      {block.content}
                    </p>
                  );
                }
                if (block.type === "warning") {
                  return (
                    <WarningBox key={j} isKo={isKo}>
                      {block.content}
                    </WarningBox>
                  );
                }
                if (block.type === "info") {
                  return <InfoBox key={j}>{block.content}</InfoBox>;
                }
                if (block.type === "image") {
                  return (
                    <GuideImage
                      key={j}
                      src={block.src!}
                      alt={block.alt || ""}
                      caption={block.caption}
                    />
                  );
                }
                if (block.type === "images") {
                  return <ImageRow key={j} images={block.images!} />;
                }
                if (block.type === "list") {
                  return (
                    <ul key={j} className="space-y-3 text-base text-zinc-300">
                      {block.items!.map((item, k) => (
                        <li key={k} className="flex gap-2">
                          <span className="text-zinc-500 shrink-0">
                            {k + 1}.
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }
                if (block.type === "code") {
                  return (
                    <div
                      key={j}
                      className="p-5 rounded-xl bg-zinc-800/60 border border-white/[0.06] font-mono text-base text-zinc-300 whitespace-pre-wrap leading-relaxed"
                    >
                      {block.content}
                    </div>
                  );
                }
                if (block.type === "link") {
                  return (
                    <a
                      key={j}
                      href={block.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-medium text-white transition-colors"
                      style={{
                        backgroundColor: `${exchange.color}20`,
                        border: `1px solid ${exchange.color}30`,
                      }}
                    >
                      <span>{block.content}</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    </a>
                  );
                }
                return null;
              })}
            </StepCard>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 rounded-2xl bg-zinc-900/60 border border-white/[0.06] p-6 sm:p-8 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            {isKo ? "도움이 필요하신가요?" : "Need Help?"}
          </h3>
          <p className="text-sm text-zinc-400 mb-5 max-w-md mx-auto">
            {isKo
              ? "진행 과정 중 어려운 부분이 있으시다면 FuturesAI 커뮤니티에서 도움을 받아보세요."
              : "If you need assistance during the process, reach out to the FuturesAI community."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={exchange.referralLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white transition-colors"
            >
              {isKo
                ? `${exchange.name} 가입하기`
                : `Sign up for ${exchange.name}`}
            </a>
            <a
              href="https://t.me/futuresai"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] text-zinc-300 transition-colors"
            >
              {isKo ? "고객센터 문의하기" : "Contact Support"}
            </a>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-8">
          <Link
            href={`/${lang}/guides`}
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            {isKo ? "전체 가이드 목록으로" : "Back to All Guides"}
          </Link>
        </div>
      </Container>
    </div>
  );
}
