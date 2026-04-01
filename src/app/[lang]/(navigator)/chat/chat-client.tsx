"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

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

/* -------------------------------------------------------------------------- */
/*  TradingView Chart Widget                                                   */
/* -------------------------------------------------------------------------- */
function TradingViewChart({ ticker }: { ticker: TickerInfo }) {
  const { symbol, exchange } = ticker;
  const src = `https://s.tradingview.com/widgetembed/?frameElementId=tv_chart&symbol=${exchange}:${symbol}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=1e1e2e&studies=[]&theme=dark&style=1&timezone=exchange&withdateranges=1&showpopupbutton=0&width=100%25&height=400`;

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-white/[0.06] bg-zinc-900/60">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
        <ChartBarIcon className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-mono text-zinc-300 font-semibold tracking-wide">
          {exchange}:{symbol}
        </span>
        <span className="ml-auto text-[10px] text-zinc-500 uppercase tracking-widest">
          TradingView
        </span>
      </div>
      <iframe
        src={src}
        style={{ width: "100%", height: 400 }}
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

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message ?? data.content ?? data.reply ?? "",
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

  /* ---- Welcome state ---- */
  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-zinc-950">
      {/* ---------------------------------------------------------------- */}
      {/*  Top bar — persona selector + new chat                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl">
        {/* Persona pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPersona("crypto")}
            className={[
              "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
              persona === "crypto"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-300",
            ].join(" ")}
          >
            {ko ? "크립토" : "Crypto"}
          </button>
          <button
            onClick={() => setPersona("us-stocks")}
            className={[
              "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
              persona === "us-stocks"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-300",
            ].join(" ")}
          >
            {ko ? "미국 주식" : "US Stocks"}
          </button>
        </div>

        {/* New chat button */}
        <button
          onClick={handleNewChat}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all duration-200 border border-white/[0.06]"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          {ko ? "새 채팅" : "New Chat"}
        </button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/*  Body                                                             */}
      {/* ---------------------------------------------------------------- */}
      {!hasAccess ? (
        <AccessDenied ko={ko} />
      ) : (
        <>
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {/* Welcome state */}
            {isEmpty && (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-xl shadow-purple-500/20">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-white">
                    {ko ? "AI 퀀트 챗봇" : "AI Quant Chatbot"}
                  </h3>
                  <p className="text-sm text-zinc-500 max-w-xs">
                    {ko
                      ? "암호화폐와 주식 시장에 대해 전문적인 분석을 제공합니다."
                      : "Professional market analysis for crypto and equities."}
                  </p>
                </div>
                {/* Suggested prompts */}
                <div className="flex flex-wrap gap-2 justify-center mt-2 max-w-md">
                  {(ko
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
                      ]
                  ).map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        setInput(prompt);
                        inputRef.current?.focus();
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-300 border border-white/[0.06] transition-all duration-200"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={[
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start",
                ].join(" ")}
              >
                <div
                  className={[
                    "max-w-[80%]",
                    msg.role === "user" ? "order-2" : "order-1",
                  ].join(" ")}
                >
                  {/* Bubble */}
                  <div
                    className={[
                      "px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "bg-zinc-800/50 text-zinc-100 rounded-tl-sm border border-white/[0.05]",
                    ].join(" ")}
                  >
                    {msg.content}
                  </div>

                  {/* TradingView chart if ticker present */}
                  {msg.role === "assistant" && msg.ticker && (
                    <TradingViewChart ticker={msg.ticker} />
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800/50 border border-white/[0.05] rounded-2xl rounded-tl-sm">
                  <LoadingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* -------------------------------------------------------------- */}
          {/*  Input bar                                                       */}
          {/* -------------------------------------------------------------- */}
          <div className="shrink-0 border-t border-white/[0.06] bg-zinc-900/90 backdrop-blur-xl px-4 py-3">
            <div className="flex items-end gap-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    /* Auto-resize */
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  disabled={loading}
                  rows={1}
                  className={[
                    "w-full resize-none bg-zinc-800/60 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500",
                    "focus:outline-none focus:border-blue-500/50 focus:bg-zinc-800/80",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all duration-200 leading-relaxed",
                    "min-h-[48px] max-h-[160px] overflow-y-auto",
                  ].join(" ")}
                />
              </div>

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className={[
                  "shrink-0 w-11 h-11 rounded-xl flex items-center justify-center",
                  "transition-all duration-200",
                  loading || !input.trim()
                    ? "bg-zinc-700/50 text-zinc-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/25 active:scale-95",
                ].join(" ")}
                aria-label={ko ? "전송" : "Send"}
              >
                <SendIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Hint */}
            <p className="text-center text-[10px] text-zinc-600 mt-2">
              {ko
                ? "Enter로 전송 · Shift+Enter로 줄바꿈"
                : "Enter to send · Shift+Enter for new line"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
