"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

const PERSONA_AVATARS: Record<string, string> = {
  crypto: "/images/personas/crypto-analyst.png",
  "us-stocks": "/images/personas/us-stocks-analyst.png",
};
const PERSONA_NAMES: Record<string, Record<string, string>> = {
  crypto: { en: "Alex Kim — Crypto Analyst", ko: "김알렉스 — 크립토 애널리스트" },
  "us-stocks": { en: "Sarah Chen — Equity Analyst", ko: "첸사라 — 주식 애널리스트" },
};

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */
type Persona = "crypto" | "us-stocks";

interface TickerInfo {
  symbol: string;
  exchange: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  ticker?: TickerInfo;
}

interface Props {
  lang: string;
  hasAccess: boolean;
  userName: string;
}

/* -------------------------------------------------------------------------- */
/*  SVG Icons                                                                  */
/* -------------------------------------------------------------------------- */
function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}

function LockClosedIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  TradingView Chart Widget                                                   */
/* -------------------------------------------------------------------------- */
function TradingViewChart({ ticker }: { ticker: TickerInfo }) {
  const { symbol, exchange } = ticker;
  const src = `https://s.tradingview.com/widgetembed/?frameElementId=tv_chart&symbol=${exchange}:${symbol}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=0a0a0f&studies=[]&theme=dark&style=1&timezone=exchange&withdateranges=1&showpopupbutton=0&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=[]&disabled_features=[]&locale=en&width=100%25&height=500`;

  return (
    <div className="mt-3 w-full rounded-xl overflow-hidden border border-white/[0.08] bg-zinc-900/80">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06]">
        <ChartBarIcon className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-mono text-zinc-200 font-semibold">
          {exchange}:{symbol}
        </span>
        <span className="ml-auto text-[10px] text-zinc-600 uppercase tracking-widest">
          TradingView
        </span>
      </div>
      <iframe
        src={src}
        className="w-full"
        style={{ height: 500 }}
        frameBorder="0"
        allowFullScreen
        title={`${exchange}:${symbol} Chart`}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading Dots                                                               */
/* -------------------------------------------------------------------------- */
function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Access Denied Card                                                         */
/* -------------------------------------------------------------------------- */
function AccessDenied({ ko }: { ko: boolean }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-zinc-900/60 border border-white/[0.08] rounded-2xl p-8 text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
            <LockClosedIcon className="w-7 h-7 text-zinc-400" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-white">
          {ko ? "접근 제한" : "Access Restricted"}
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          {ko
            ? "AI 채팅은 승인된 회원에게만 제공됩니다. 관리자에게 문의하여 액세스를 요청하세요."
            : "AI Chat is available for approved members only. Contact admin for access."}
        </p>
        <div className="pt-2">
          <a
            href="https://t.me/futuresai_official"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {ko ? "텔레그램으로 문의하기" : "Contact via Telegram"}
          </a>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Chat Client Component                                                 */
/* -------------------------------------------------------------------------- */
export default function ChatClient({ lang, hasAccess, userName }: Props) {
  const ko = lang === "ko";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [persona, setPersona] = useState<Persona>("crypto");
  const [sessionId, setSessionId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* Generate sessionId on mount */
  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  /* Scroll to bottom on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setSessionId(crypto.randomUUID());
    setInput("");
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          persona,
          sessionId,
          lang,
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || data.message || data.content || "",
        ticker: data.ticker ?? undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: ko
            ? "오류가 발생했습니다. 다시 시도해 주세요."
            : "An error occurred. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, persona, sessionId, lang, ko]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const placeholder = ko
    ? "크립토, 주식, 시장에 대해 물어보세요..."
    : "Ask about crypto, stocks, markets...";

  const isEmpty = messages.length === 0 && !loading;

  /* Persona metadata */
  const personaMeta: Record<Persona, { tagline: string; desc: string }> = {
    crypto: {
      tagline: ko ? "크립토 애널리스트" : "Crypto Analyst",
      desc: ko
        ? "실시간 암호화폐 분석 · 선물 포지션 · 온체인 데이터"
        : "Real-time crypto analysis, futures positions & on-chain data",
    },
    "us-stocks": {
      tagline: ko ? "주식 애널리스트" : "Equity Analyst",
      desc: ko
        ? "미국 주식 시장 인사이트 · 섹터 분석 · 실적 데이터"
        : "US stock market insights, sector analysis & earnings data",
    },
  };

  const suggestedPrompts = ko
    ? [
        "비트코인 현재 추세 분석해줘",
        "이더리움 지지/저항 레벨",
        "오늘 공포탐욕지수 얼마야?",
        "솔라나 선물 포지션 추천",
      ]
    : [
        "Analyze Bitcoin trend",
        "ETH support/resistance levels",
        "Today's Fear & Greed Index?",
        "SOL futures position idea",
      ];

  /* ======================================================================== */
  /*  RENDER                                                                   */
  /* ======================================================================== */
  return (
    <div className="fixed inset-0 top-[92px] flex flex-col bg-zinc-950 z-10">
      {!hasAccess ? (
        <AccessDenied ko={ko} />
      ) : isEmpty ? (
        /* ------------------------------------------------------------------ */
        /*  INITIAL STATE — Perplexity-style centered layout                   */
        /* ------------------------------------------------------------------ */
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 overflow-y-auto">
          <div className="w-full max-w-2xl flex flex-col items-center gap-8">

            {/* Greeting */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
                {ko ? "무엇을 분석할까요?" : "What would you like to analyze?"}
              </h1>
              <p className="text-sm text-zinc-500">
                {ko
                  ? "아래 애널리스트를 선택하고 질문을 입력하세요"
                  : "Select an analyst below, then ask your question"}
              </p>
            </div>

            {/* Persona selector cards */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {(["crypto", "us-stocks"] as Persona[]).map((p) => {
                const isSelected = persona === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPersona(p)}
                    className={[
                      "relative flex flex-col gap-3 p-4 rounded-2xl text-left",
                      "border transition-all duration-200",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
                      isSelected
                        ? "border-blue-500/40 bg-blue-500/[0.06] shadow-[0_0_0_1px_rgba(59,130,246,0.15)]"
                        : "border-white/[0.06] bg-zinc-900/40 hover:border-white/[0.12] hover:bg-zinc-900/60",
                    ].join(" ")}
                  >
                    {/* Selected checkmark */}
                    {isSelected && (
                      <span className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30">
                        <CheckIcon className="w-3 h-3 text-blue-400" />
                      </span>
                    )}

                    {/* Avatar */}
                    <div className="flex items-center gap-3">
                      <Image
                        src={PERSONA_AVATARS[p]}
                        alt={personaMeta[p].tagline}
                        width={44}
                        height={44}
                        className="w-11 h-11 rounded-full object-cover ring-1 ring-white/10"
                      />
                      <div>
                        <p className="text-sm font-semibold text-zinc-100 leading-tight">
                          {p === "crypto" ? (ko ? "김알렉스" : "Alex Kim") : (ko ? "첸사라" : "Sarah Chen")}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {personaMeta[p].tagline}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {personaMeta[p].desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Centered input */}
            <div className="w-full">
              <div className="relative flex items-end gap-3 bg-zinc-900/60 border border-white/[0.08] rounded-2xl px-4 py-3 focus-within:border-white/[0.16] focus-within:bg-zinc-900/80 transition-all duration-200">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  disabled={loading}
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none leading-relaxed min-h-[28px] max-h-[160px] overflow-y-auto disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  aria-label={ko ? "전송" : "Send"}
                  className={[
                    "shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                    loading || !input.trim()
                      ? "text-zinc-600 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/25 active:scale-95",
                  ].join(" ")}
                >
                  <SendIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Suggested prompt pills */}
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt);
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-zinc-900/40 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-300 border border-white/[0.06] hover:border-white/[0.10] transition-all duration-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------------ */
        /*  CHAT MODE — messages + fixed bottom input                          */
        /* ------------------------------------------------------------------ */
        <>
          {/* Top bar — active persona + new chat */}
          <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-zinc-900/60 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Image
                src={PERSONA_AVATARS[persona]}
                alt={personaMeta[persona].tagline}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/30"
              />
              <div>
                <span className="text-sm font-semibold text-white block">
                  {PERSONA_NAMES[persona]?.[ko ? "ko" : "en"]}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {ko ? "온라인" : "Online"}
                </span>
              </div>
            </div>
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all duration-200 border border-white/[0.06]"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              {ko ? "새 채팅" : "New Chat"}
            </button>
          </div>

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto py-6">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 w-full space-y-6">

              {messages.map((msg, idx) => (
                <React.Fragment key={idx}>
                  {msg.role === "user" ? (
                    /* User message — right-aligned bubble */
                    <div className="flex justify-end">
                      <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm bg-blue-600 text-white text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    /* Assistant message — avatar + left-aligned text */
                    <div className="flex gap-3 items-start">
                      <Image
                        src={PERSONA_AVATARS[persona]}
                        alt="AI"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10 shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-zinc-500 mb-1.5 tracking-wide">
                          {PERSONA_NAMES[persona]?.[ko ? "ko" : "en"]}
                        </p>
                        <div className="text-sm text-zinc-100 leading-relaxed whitespace-pre-wrap pl-3 border-l border-white/[0.08]">
                          {msg.content}
                        </div>
                        {/* TradingView chart — full width */}
                        {msg.ticker && (
                          <div className="mt-4 -ml-3">
                            <TradingViewChart ticker={msg.ticker} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex gap-3 items-start">
                  <Image
                    src={PERSONA_AVATARS[persona]}
                    alt="AI"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10 shrink-0 mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-[11px] font-medium text-zinc-500 mb-1.5 tracking-wide">
                      {PERSONA_NAMES[persona]?.[ko ? "ko" : "en"]}
                    </p>
                    <div className="pl-3 border-l border-white/[0.08]">
                      <LoadingDots />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Fixed bottom input bar */}
          <div className="shrink-0 border-t border-white/[0.06] bg-zinc-950/90 backdrop-blur-xl px-4 py-3">
            <div className="max-w-3xl mx-auto w-full">
              <div className="relative flex items-end gap-3 bg-zinc-900/60 border border-white/[0.08] rounded-2xl px-4 py-3 focus-within:border-white/[0.16] focus-within:bg-zinc-900/80 transition-all duration-200">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  disabled={loading}
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none leading-relaxed min-h-[28px] max-h-[160px] overflow-y-auto disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  aria-label={ko ? "전송" : "Send"}
                  className={[
                    "shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                    loading || !input.trim()
                      ? "text-zinc-600 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/25 active:scale-95",
                  ].join(" ")}
                >
                  <SendIcon className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-center text-[10px] text-zinc-600 mt-2">
                {ko
                  ? "Enter로 전송 · Shift+Enter로 줄바꿈"
                  : "Enter to send · Shift+Enter for new line"}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
