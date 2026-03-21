# CryptoX Architecture

## Overview

CryptoX is a Next.js 14 application built with TypeScript that provides a crypto exchange/community web platform. The application follows a layered architecture pattern with clear separation of concerns between pages, components, services, and data layers.

## Overall Pattern: Next.js App Router

The application leverages **Next.js 14 App Router** with the following architectural patterns:

- **File-based routing**: Routes are defined by directory structure within `src/app/`
- **Server Components by default**: Components are server-rendered unless marked with `"use client"`
- **Server Actions**: Backend operations colocated with route handlers in `actions.ts` files
- **API Routes**: RESTful endpoints under `src/app/api/`
- **Dynamic Routes**: Parameterized segments like `[lang]` and `[id]` for dynamic content

## Layered Architecture

### 1. **Entry Points**

```
src/app/layout.tsx          # Root layout with global providers
src/auth.ts                 # NextAuth configuration & session management
```

The root layout wraps the entire application with:
- Global providers (theme, session, AOS animation)
- Toast notifications (`Toaster`)
- Loading states (`Loading`)
- Alert dialogs

### 2. **Routing Layer**

#### i18n Routing Structure

The application implements **middleware-based i18n routing** with the following structure:

```
src/app/[lang]/              # Language segment (ko, en)
  └── (navigator)/           # Layout group - main application layout
      ├── page.tsx           # Redirect to /dashboard
      ├── layout.tsx         # Navigator layout with Header & Footer
      ├── dashboard/         # Home/dashboard page
      ├── news/              # News section
      ├── posts/             # Community posts (CRUD)
      ├── exchanges/         # Exchange integrations
      ├── calculator/        # Trading calculator
      ├── charts/            # Market charts
      ├── markets/           # Market data
      ├── whales/            # Whale wallets tracking
      ├── payback/           # Payback dashboard
      ├── live/              # Live trading analysis
      ├── insights/          # Trading insights
      ├── me/                # User profile
      ├── login/             # Authentication
      ├── signup/            # Registration
      └── actions.ts         # Shared server actions for pages
```

**Route Parameters**:
- `[lang]`: Locale identifier (`en`, `ko`)
- `[id]`: Dynamic resource identifiers (news, posts)
- `(navigator)`: Route group - organizes pages under shared layout without adding to URL

#### Data Flow for i18n

1. URL contains language: `/en/dashboard`, `/ko/news`
2. `[lang]` segment captures locale and passes via params
3. `layout.tsx` calls `getDictionary(lang)` to load translations
4. Dictionary passed to components as `translations` prop
5. Pages receive `lang` param to determine locale-specific behavior

### 3. **Page Layer**

Pages are async server components that:

- Accept `params: { lang: string }` for i18n routing
- Fetch data via server actions or services
- Render UI components
- Generate metadata for SEO

Example: `src/app/[lang]/(navigator)/dashboard/page.tsx`
```typescript
export default async function DashboardPage({ params: { lang } }) {
  const [exchanges, events, news] = await Promise.all([
    getExchanges(),
    getEvents(),
    getCoinessNews(),
  ]);
  return <div>Dashboard content</div>;
}
```

### 4. **API Routes Layer**

RESTful endpoints for external integrations and internal operations:

```
src/app/api/
├── auth/[...nextauth]/      # NextAuth authentication handler
├── news/crypto/             # Crypto news aggregation
├── coiness/                 # Coiness API integration
├── whales/                  # Whale wallet tracking API
├── polymarket/              # Polymarket predictions
├── affiliate/               # Exchange affiliate endpoints
│   ├── bitget/
│   ├── bybit/
│   ├── bingx/
│   └── okx/
├── cron/                    # Scheduled background jobs
└── cron-news/               # News update cron task
```

API routes delegate to service layer for business logic.

### 5. **Components Layer**

#### Layout Components

- `src/components/headers.tsx` - Main header with navigation
- `src/components/footer.tsx` - Application footer
- `src/components/ui/` - Shadcn/ui primitive components (43 components)

#### Feature Components

- `src/app/components/` - App-level shared components (charts, cards, forms)
- `src/app/[lang]/(navigator)/*` - Page-specific sections (colocated with routes)

Example structure:
```
src/app/[lang]/(navigator)/
├── dashboard/page.tsx
├── intro-section.tsx        # Reusable section component
├── exchange-list-section.tsx
├── news-section.tsx
└── event-section.tsx
```

#### Provider Components

- `src/components/providers/` - Context and provider setup
  - `providers.tsx` - Main provider composition
  - `session-provider.tsx` - NextAuth session context
  - `theme-provider.tsx` - Dark/light mode theming
  - `aos-initializer.tsx` - Scroll animation initialization

### 6. **Services Layer**

Business logic and data access abstractions:

```
src/lib/services/
├── core/
│   └── core.service.ts       # Base service class with Prisma access
├── users/
│   └── users.service.ts      # User authentication & profile
├── posts/
│   └── posts.service.ts      # Community posts CRUD
├── comments/
│   └── comments.service.ts   # Post comments
├── exchanges/
│   ├── exchanges.service.ts  # Exchange registry
│   ├── bitget.service.ts     # Bitget API integration
│   ├── bybit.service.ts      # Bybit API integration
│   ├── bingx.service.ts      # BingX API integration
│   └── okx.service.ts        # OKX API integration
├── exchange-accounts/
│   └── exchange-accounts.service.ts
├── news/
│   ├── news.service.ts       # News management
│   └── crypto-news.service.ts # Crypto news API
├── events/
│   └── events.service.ts     # Event management
├── payback/
│   └── payback.service.ts    # Payback calculations
├── trades/
│   └── trades.service.ts     # Trading data
├── withdraws/
│   └── withdraws.service.ts  # Withdrawal management
└── (likes, comment-likes)/    # Social interactions
```

**Service Pattern**: All services extend `CoreService` which provides database access via Prisma singleton.

### 7. **Server Actions Layer**

Co-located with route segments for type-safe mutations:

- Marked with `"use server"` directive
- Located in `actions.ts` files in route directories
- Support for Zod validation
- Wrapped with `next-safe-action` for error handling

Example: `src/app/[lang]/(navigator)/posts/new/actions.ts`

### 8. **Database Layer**

```
src/lib/prisma.ts           # Prisma client singleton for hot reloading safety
schema.prisma               # Database schema (external, in project root)
```

**Database Access Pattern**:
1. Services extend `CoreService`
2. `CoreService` accesses `prisma` singleton
3. Type-safe queries via Prisma generated types
4. Server actions trigger service methods

## Data Flow

### Client → API Route → Service → Database

#### Example: Fetching Exchange Data

1. **Page Component** (`dashboard/page.tsx`)
   - Calls server action `getExchanges()`

2. **Server Action** (`actions.ts`)
   ```typescript
   export async function getExchanges() {
     return await exchangesService.getAll();
   }
   ```

3. **Service Layer** (`exchanges.service.ts`)
   ```typescript
   async getAll() {
     return this.db.exchange.findMany();
   }
   ```

4. **Database** (Prisma)
   - Executes query
   - Returns typed results

5. **Back to Component**
   - Renders data

### Client → Form Submission → Server Action → Service

#### Example: Creating a Post

1. **Client Component** (form with `"use client"`)
   - Collects user input
   - Calls server action with form data

2. **Server Action** (`new/actions.ts`)
   - Validates with Zod schema
   - Authenticates via `auth()`
   - Calls `postsService.create()`

3. **Service Layer** (`posts.service.ts`)
   - Business logic
   - Database mutation via Prisma
   - Returns result

4. **Response to Client**
   - Revalidate cache
   - Show toast notification

## Abstractions & Patterns

### 1. **Prisma Service Pattern**

Base class provides database access:

```typescript
// src/lib/services/core/core.service.ts
export class CoreService {
  protected db = prisma;
}

// Usage in services
export class PostsService extends CoreService {
  async findMany(page: number) {
    return this.db.post.findMany(/* ... */);
  }
}
```

### 2. **Type-Safe Server Actions**

Via `next-safe-action`:

```typescript
import { action } from "@/lib/safe-action";

export const createPostAction = action
  .schema(PostSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Validated, type-safe input
  });
```

### 3. **i18n Dictionary Pattern**

Dynamic locale loading:

```typescript
// src/i18n/index.ts
const dictionaries = {
  en: () => import('./en.json'),
  ko: () => import('./ko.json'),
};

export const getDictionary = async (locale: string) => {
  return dictionaries[locale]?.() ?? dictionaries.en();
};
```

### 4. **Form Validation**

Zod schemas with colocated action handlers:

```typescript
// src/lib/zod/sign-in-schema.ts
export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Usage in server action
const { email, password } = await signInSchema.parseAsync(credentials);
```

### 5. **State Management**

Zustand stores for client-side state:

```typescript
// src/lib/stores/
├── alert-dialog-store.ts   # Global alert dialogs
├── calculator-store.ts     # Calculator state
├── loading-store.ts        # Loading indicators
├── rich-text-store.ts      # Editor state
└── withdraw-store.ts       # Withdrawal form state
```

**Usage**: Import and use in client components with hooks.

## Key Architectural Decisions

### 1. **Server-Centric Approach**

- Pages are async server components by default
- Data fetching happens on server (no redundant API calls)
- Client components only for interactivity (forms, dropdowns)
- Reduces client bundle size and improves performance

### 2. **Colocated Server Actions**

- `actions.ts` files live alongside routes they serve
- Keeps related code together
- Easier to understand data flow for each page
- Type-safe by default with TypeScript

### 3. **Service Layer Abstraction**

- Isolates business logic from routes
- Reusable across multiple endpoints
- Testable in isolation
- Single responsibility principle

### 4. **Middleware-Based i18n**

- Language routing integrated into URL structure
- Dictionary loading per request (not client-side)
- Static generation for known locales (`generateStaticParams`)
- No build-time locale code splitting needed

### 5. **Prisma Singleton Pattern**

- Prevents connection pool exhaustion in development
- Safely hot-reloads without creating new clients
- Centralized database access point

## Authentication Flow

1. **User submits login form** → `login/actions.ts`
2. **Server action validates** with `signInSchema`
3. **Calls `usersService.login()`** with credentials
4. **Prisma query** validates user in database
5. **NextAuth JWT flow** creates session
6. **Session cookie** returned to browser
7. **Protected pages** check session via `auth()` function

## External Integrations

### Exchange APIs

- **Bitget** - `src/lib/services/exchanges/bitget.service.ts`
- **Bybit** - `src/lib/services/exchanges/bybit.service.ts`
- **BingX** - `src/lib/services/exchanges/bingx.service.ts`
- **OKX** - `src/lib/services/exchanges/okx.service.ts`

### Third-Party Services

- **Supabase** - File storage, SSR utilities
- **Replicate** - AI image generation
- **News API** - Crypto news aggregation
- **Polymarket** - Prediction market data
- **Twitter/X** - Social feed integration

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Pages | `page.tsx` | `dashboard/page.tsx` |
| Layouts | `layout.tsx` | `(navigator)/layout.tsx` |
| Server Actions | `actions.ts` | `posts/actions.ts` |
| API Routes | `route.ts` | `api/news/crypto/route.ts` |
| Services | `*.service.ts` | `users.service.ts` |
| Components | `*.tsx` | `post-card.tsx` |
| Stores | `*-store.ts` | `alert-dialog-store.ts` |
| Schemas | `*-schema.ts` | `sign-in-schema.ts` |
| Utilities | `*.ts` | `date-formatting.ts` |
| Config | `*config*` | `auth.ts` |

## Summary

CryptoX follows a **Server-First Next.js architecture** with:

- **Layered separation**: Pages → Components → Services → Database
- **Type safety**: TypeScript + Zod validation throughout
- **Internationalization**: Middleware-based routing with locale dictionary loading
- **Scalability**: Service abstraction enables feature growth
- **Developer experience**: Colocated actions, clear file structure, convention-based routing
