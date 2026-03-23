# CryptoX

Crypto exchange/community web application.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui (Radix primitives + CVA + tailwind-merge)
- **Auth**: NextAuth.js v4 with Prisma adapter
- **Database**: PostgreSQL via Prisma ORM
- **State**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Rich Text**: TipTap editor
- **i18n**: Custom middleware-based routing (`/[lang]/...`) with `ko.json` / `en.json` dictionaries
- **APIs**: Bitget, Bybit exchange APIs; Supabase (storage/SSR); Replicate (AI)

## Project Structure

```
src/
├── app/[lang]/          # i18n-routed pages (ko/en)
│   ├── (navigator)/     # Main layout group (header/footer)
│   │   ├── dashboard/   # Dashboard pages
│   │   ├── calculator/  # Calculator feature
│   │   ├── exchanges/   # Exchange integrations
│   │   ├── news/        # News section
│   │   ├── posts/       # Community posts
│   │   └── layout.tsx   # Navigator layout
│   └── page.tsx         # Root redirect
├── components/          # Shared components
│   ├── ui/              # shadcn/ui primitives
│   └── providers/       # Context providers
├── i18n/                # Translation files (ko.json, en.json)
├── lib/
│   ├── modules/         # Feature modules
│   ├── services/        # API service layer
│   ├── stores/          # Zustand stores
│   ├── utils/           # Utility functions
│   └── zod/             # Zod schemas
├── auth.ts              # NextAuth configuration
└── hooks/               # Custom React hooks
```

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
```

## Deployment

- **Vercel** auto-deploys from `kkyungslim/futuresai_x` on GitHub
- Always push to the `vercel` remote for production deployment:
  ```bash
  git push vercel main      # Deploy to Vercel (kkyungslim/futuresai_x)
  git push origin main      # Backup to sik247/futuresAI
  ```
- The `vercel` remote uses SSH key `~/.ssh/id_kkyungslim` via `github-kkyungslim` host alias
- Environment variables are managed in Vercel dashboard (never commit `.env`)

## Conventions

- Path alias: `@/*` maps to `./src/*`
- Server Actions are in `actions.ts` files co-located with their route
- UI components use shadcn/ui patterns (components.json configured)
- i18n: middleware detects locale and routes to `/ko/...` or `/en/...`
- Database access via singleton Prisma client (`src/lib/prisma.ts`)
- Safe server actions via `next-safe-action` (`src/lib/safe-action.ts`)
