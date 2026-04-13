# CryptoX

Crypto exchange/community web application with AI-powered trading analysis.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui (Radix primitives + CVA + tailwind-merge)
- **Auth**: NextAuth.js v4 with Prisma adapter
- **Database**: PostgreSQL via Prisma ORM
- **State**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Rich Text**: TipTap editor
- **i18n**: Custom middleware-based routing (`/[lang]/...`) with `ko.json` / `en.json` dictionaries
- **AI Models**: Gemini 2.5 Pro (chat, chart analysis, OCR), Gemini 2.0/2.5 Flash (notifications, cron), GPT-5.4 (fallback)
- **APIs**: Bitget, Bybit exchange APIs; Supabase (storage/SSR); CoinGecko, Upbit (price data); Polymarket (predictions)

## Project Structure

```
src/
├── app/[lang]/              # i18n-routed pages (ko/en)
│   ├── (navigator)/         # Main layout group (header + bottom nav)
│   │   ├── chat/            # AI chat (viewport-locked)
│   │   ├── charts/          # Trading charts (viewport-locked)
│   │   ├── home/            # Dashboard (viewport-locked)
│   │   ├── whales/          # Whale tracker (viewport-locked)
│   │   ├── markets/         # Polymarket predictions (scrollable)
│   │   ├── chart-ideas/     # Chart analysis & ideas (scrollable)
│   │   ├── news/            # News section (scrollable)
│   │   ├── quant/           # Quant signals (scrollable)
│   │   ├── dashboard/       # User/admin dashboards
│   │   ├── me/              # Profile/settings
│   │   └── layout.tsx       # Navigator layout (header + footer + bottom nav)
│   └── page.tsx             # Root redirect
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── headers.tsx          # Fixed header (64px mobile, 92px desktop)
│   ├── mobile-bottom-nav.tsx # Fixed bottom nav (56px, mobile only)
│   └── providers/           # Context providers
├── i18n/                    # Translation files (ko.json, en.json, index.ts)
├── lib/
│   ├── services/
│   │   ├── chat/            # Chat context building
│   │   ├── chart-analysis/  # Multi-agent chart analysis pipeline
│   │   ├── notifications/   # Telegram bots, alerts, cron services
│   │   ├── portfolio/       # OCR, portfolio management
│   │   └── user/            # Trading profiles
│   ├── modules/             # Feature modules
│   ├── stores/              # Zustand stores
│   ├── utils/               # Utility functions
│   └── zod/                 # Zod schemas
├── auth.ts                  # NextAuth configuration
└── hooks/                   # Custom React hooks
```

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
npx tsc --noEmit  # Type check (use before push)
```

## Deployment

- **Vercel project**: `tetherbases-projects/futuresai_x` (https://vercel.com/tetherbases-projects/futuresai_x)
- **GitHub repo**: `kkyungslim/futuresai_x` — Vercel auto-deploys on push to `main`
- Always push to the `vercel` remote for production deployment:
  ```bash
  git push vercel main      # Deploy to Vercel (tetherbases-projects/futuresai_x)
  git push origin main      # Backup to sik247/futuresAI
  ```
- The `vercel` remote (`git@github-kkyungslim:kkyungslim/futuresai_x.git`) uses SSH key `~/.ssh/id_kkyungslim` via `github-kkyungslim` host alias
- Environment variables are managed in Vercel dashboard (never commit `.env`)

## Conventions

- Path alias: `@/*` maps to `./src/*`
- Server Actions are in `actions.ts` files co-located with their route
- UI components use shadcn/ui patterns (components.json configured)
- i18n: middleware detects locale and routes to `/ko/...` or `/en/...`
- Database access via singleton Prisma client (`src/lib/prisma.ts`)
- Safe server actions via `next-safe-action` (`src/lib/safe-action.ts`)

---

## Engineering Framework

### Mobile Layout Rules

The app has a fixed header and a mobile-only bottom navigation bar. Every page must account for these.

**Layout dimensions:**
| Element | Mobile (<1024px) | Desktop (>=1024px) |
|---------|-----------------|-------------------|
| Header | 64px (`h-16`, `top-0`) | 92px (`top-[28px]` + `h-16`) |
| Bottom nav | 56px (`fixed bottom-0`, `lg:hidden`, `z-50`) | Hidden |
| Safe content area | `100dvh - 64px - 56px` | `100dvh - 92px` |

**Page types and their height strategy:**

1. **Viewport-locked pages** (chat, charts, home dashboard, whales) — content fills exact viewport, no page scroll:
   ```tsx
   // Fixed positioning (e.g., chat):
   className="fixed inset-x-0 top-16 sm:top-[92px] bottom-[56px] lg:bottom-0"

   // Calculated height (e.g., dashboard):
   className="h-[calc(100dvh-64px-56px)] sm:h-[calc(100dvh-92px)] lg:h-[calc(100dvh-92px)]"
   ```

2. **Scrollable pages** (news, markets, pricing, posts) — content scrolls naturally:
   ```tsx
   // Parent layout already provides pb-16 lg:pb-0 (navigator/layout.tsx:59)
   // Just use min-h-screen, content scrolls past bottom nav:
   className="min-h-screen bg-zinc-950"
   ```

**Rules:**
- NEVER use `h-screen` on content containers — use `min-h-screen` (scrollable) or calculated `dvh` (viewport-locked)
- ALWAYS use `100dvh` not `100vh` — `dvh` handles Safari's collapsing address bar
- Fixed elements on mobile (filter bars, toolbars) must use `bottom-[56px]` not `bottom-0` to sit above the nav
- The navigator layout (`layout.tsx`) provides `pb-16 lg:pb-0` — don't duplicate this padding
- Root layout has `viewportFit: "cover"` for iOS safe-area support

### i18n Language Rules

The app supports Korean (`ko`) and English (`en`) via the `lang` parameter from the URL route.

**AI prompt language isolation (CRITICAL):**
```tsx
// WRONG — leaves English mode without explicit instruction:
const langNote = lang === "ko" ? "한국어로 답변하세요." : "";

// CORRECT — both modes get explicit instructions:
const langNote = lang === "ko"
  ? "\n\nIMPORTANT: 한국어로 답변하세요. ..."
  : "\n\nIMPORTANT: Respond ENTIRELY in English. Do NOT include any Korean text.";
```

**Rules:**
- Every AI prompt MUST include explicit language instructions for BOTH `ko` and `en` — never leave one empty
- List specific text fields in the instruction (e.g., "summary, professionalSummary, patterns...")
- Final prompt instructions must also be language-specific, not just the system prompt
- GPT fallback prompts must mirror the same language instructions as Gemini prompts
- Client-side generated text (commentary functions, share posts) must accept `lang` parameter
- UI labels: use `translations.key` from i18n dictionary, or inline ternary: `lang === "ko" ? "한국어" : "English"`
- Technical trading terms (RSI, MACD, LONG, SHORT, BUY, SELL, R:R) stay English in both modes
- Telegram/notification services (`src/lib/services/notifications/`) are intentionally bilingual — exempt from toggle

### AI Service Conventions

**API key:** All Gemini services use `process.env.GEMINI_API_KEY` (single key on Vercel). OpenAI uses `process.env.OPENAI_API_KEY` as fallback.

**Model selection:**
| Use case | Model | Rationale |
|----------|-------|-----------|
| Chat (user-facing) | `gemini-2.5-pro` | Premium quality for paying users |
| Chart analysis | `gemini-2.5-pro` | Complex vision + reasoning |
| Portfolio/order OCR | `gemini-2.5-pro` | Vision accuracy |
| Blog generation | `gemini-2.5-flash-preview` | Cost-effective for long content |
| Notifications/alerts | `gemini-2.0-flash` | Fast, cheap, high-volume |
| Polymarket analysis | `gemini-2.5-flash` | Mid-tier for summaries |
| Fallback | `gpt-5.4` (OpenAI) | When Gemini fails |

**Prompt structure:**
```
[System persona prompt]
[Language instruction — ALWAYS explicit for both ko/en]
[User trading profile context]
[Real-time market data]
[Conversation history]
[User message]
[Final instruction with language reminder]
```

### Error Handling Pattern

**API routes** must return specific, typed errors:
```tsx
// WRONG — generic error:
return NextResponse.json({ error: "Something went wrong" }, { status: 500 });

// CORRECT — specific error with metadata:
return NextResponse.json({
  error: "rate_limit",
  shouldUpgrade: rateCheck.shouldUpgrade,
  retryAfterMinutes: rateCheck.retryAfterMinutes,
}, { status: 429 });
```

**Client-side** must handle each error type with localized messages:
```tsx
// WRONG — generic catch-all:
catch { setError(ko ? "오류가 발생했습니다" : "An error occurred") }

// CORRECT — specific handling:
if (data.error === "rate_limit") {
  errorMsg = ko ? `⏳ 요청 한도에 도달했습니다. ${mins}분 후에 다시 시도해 주세요.` : `⏳ Request limit reached...`;
} else if (res.status === 401) {
  errorMsg = ko ? "로그인이 필요합니다." : "Please log in to continue.";
} else if (res.status === 503) {
  errorMsg = ko ? "🔧 AI 서비스에 일시적으로 연결할 수 없습니다." : "🔧 AI service temporarily unavailable.";
}
```

**Standard error codes:**
| Code | HTTP | Meaning |
|------|------|---------|
| `rate_limit` | 429 | User hit usage cap, include `retryAfterMinutes` + `shouldUpgrade` |
| `Unauthorized` | 401 | Not logged in or session expired |
| `User not found` | 404 | Auth session valid but user missing from DB |
| `Missing fields` | 400 | Required request body fields missing |
| `AI service temporarily unavailable` | 503 | Both Gemini and GPT fallback failed |

### Quality Checklist

Before pushing any feature or fix, verify:

- [ ] **Mobile**: test on 375px width — content not cut off, input accessible, no horizontal scroll
- [ ] **Bottom nav**: no fixed elements overlap the 56px mobile nav
- [ ] **Language toggle**: switch to both `ko` and `en` — zero mixed-language output
- [ ] **AI prompts**: both language modes have explicit instructions
- [ ] **Error states**: trigger rate limit / network error — user sees helpful localized message
- [ ] **TypeScript**: `npx tsc --noEmit` passes with no errors
- [ ] **No `h-screen`**: content containers use `min-h-screen` or calculated `dvh`
- [ ] **No `100vh`**: use `100dvh` for viewport-dependent heights
