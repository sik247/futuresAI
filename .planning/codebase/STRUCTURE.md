# CryptoX Directory Structure

## Overall Layout

```
src/
├── app/                          # Next.js App Router
│   ├── [lang]/                   # Language segment for i18n routing
│   ├── api/                      # API routes
│   ├── components/               # App-level shared components
│   ├── types/                    # App-level TypeScript types
│   ├── layout.tsx                # Root layout with providers
│   ├── globals.css               # Global styles
│   └── page.tsx                  # Root redirect page
├── components/                   # Shared component library
│   ├── ui/                       # Shadcn/ui primitives
│   └── providers/                # Context & provider setup
├── hooks/                        # Custom React hooks
├── i18n/                         # Internationalization
├── lib/                          # Core application logic
│   ├── data/                     # Static data & constants
│   ├── modules/                  # Feature modules
│   ├── services/                 # Business logic services
│   ├── stores/                   # Zustand state stores
│   ├── utils/                    # Utility functions
│   ├── zod/                      # Zod validation schemas
│   ├── prisma.ts                 # Prisma client singleton
│   ├── safe-action.ts            # Safe action wrapper
│   └── utils.ts                  # Common utilities
├── auth.ts                       # NextAuth configuration
└── middleware.ts                 # Next.js middleware (if present)
```

---

## Detailed Directory Breakdown

### `src/app/` - Application Routes & Pages

**Purpose**: Next.js App Router containing all routes, pages, and API endpoints.

#### `src/app/layout.tsx`

Root layout wrapping entire application:
```typescript
- Imports global CSS
- Wraps with Providers (theme, session)
- Adds Toaster, Loading, GlobalAlertDialog components
- Sets HTML lang and body classNames
```

#### `src/app/globals.css`

Global Tailwind CSS imports and application-wide styles.

#### `src/app/page.tsx`

Root page that redirects to language-specific dashboard.

---

### `src/app/[lang]/` - Language Routing

**Purpose**: Dynamic language segment for i18n routing.

#### Key Files

| File | Purpose |
|------|---------|
| `page.tsx` | Root lang page - redirects to dashboard |
| `(navigator)/layout.tsx` | Navigator layout - header, footer wrapper |
| `(navigator)/actions.ts` | Shared server actions for navigator pages |

#### Language Parameter

- Routes under this segment receive `params: { lang: string }`
- `getDictionary(lang)` loads translations in layout
- Static params: `generateStaticParams()` defines `['en', 'ko']`

---

### `src/app/[lang]/(navigator)/` - Main Application Layout Group

**Purpose**: Route group organizing main application pages under shared header/footer layout.

#### Core Pages

```
├── dashboard/
│   └── page.tsx              # Home page with hero, exchanges, news
├── news/
│   ├── page.tsx              # News listing
│   ├── [id]/page.tsx         # News detail view
│   ├── actions.ts            # News server actions
│   └── [id]/actions.ts       # Detail-specific actions
├── posts/
│   ├── page.tsx              # Community posts list
│   ├── [id]/page.tsx         # Post detail with comments
│   ├── new/page.tsx          # Create new post
│   ├── [id]/update/page.tsx  # Edit post
│   ├── actions.ts            # Post listing/query actions
│   ├── new/actions.ts        # Create post action
│   ├── [id]/actions.ts       # Get single post
│   ├── [id]/update/actions.ts # Update post action
│   ├── post-list-section.tsx # Posts listing component
│   ├── category-select-section.tsx
│   └── new/new-form.tsx      # Create post form
├── exchanges/
│   ├── page.tsx              # Exchange integrations list
│   ├── [id]/page.tsx         # Exchange detail/connect
│   └── actions.ts            # Exchange server actions
├── calculator/
│   ├── page.tsx              # Trading calculator
│   └── actions.ts            # Calculator computations
├── charts/
│   └── page.tsx              # Market charts view
├── markets/
│   └── page.tsx              # Market data/analysis
├── live/
│   └── page.tsx              # Live trading analysis
├── whales/
│   └── page.tsx              # Whale wallet tracking
├── insights/
│   ├── page.tsx              # Trading insights list
│   └── [id]/page.tsx         # Insight detail
├── payback/
│   └── page.tsx              # Payback dashboard
├── me/ (User Profile)
│   ├── page.tsx              # Profile summary
│   ├── edit/page.tsx         # Edit profile
│   ├── profile/page.tsx      # View profile
│   └── refund-withdraw/page.tsx # Withdrawal management
│   └── reward/page.tsx       # Reward tracking
├── login/
│   └── page.tsx              # Sign in form
├── signup/
│   └── page.tsx              # Registration form
├── team/
│   └── page.tsx              # Team/referral info
├── services/
│   └── page.tsx              # Services overview
├── sns/
│   └── page.tsx              # Social media integration
├── layout.tsx                # Navigator layout with Header/Footer
├── layout-client.tsx         # Client-side layout utilities
├── actions.ts                # Shared actions (getExchanges, getNews, etc.)
├── *-section.tsx             # Reusable page sections
│   ├── intro-section.tsx
│   ├── exchange-list-section.tsx
│   ├── news-section.tsx
│   ├── event-section.tsx
│   ├── introduce-section.tsx
│   ├── event-banner-section.tsx
│   └── community-section.tsx
```

#### Section Components

**Pattern**: Feature sections are `*-section.tsx` files colocated with pages for organization.

```typescript
// Example: src/app/[lang]/(navigator)/intro-section.tsx
export async function IntroSection({ exchanges }) {
  return <section>...</section>;
}

// Used in dashboard/page.tsx
<IntroSection exchanges={exchanges} />
```

---

### `src/app/api/` - API Routes & Endpoints

**Purpose**: RESTful API endpoints for external integrations, webhooks, and internal operations.

#### Structure

```
api/
├── auth/
│   └── [...nextauth]/route.ts     # NextAuth handler (GET, POST)
├── news/
│   └── crypto/route.ts            # Crypto news API
├── coiness/
│   └── route.ts                   # Coiness platform API
├── whales/
│   └── route.ts                   # Whale wallet API
├── polymarket/
│   └── route.ts                   # Polymarket predictions API
├── affiliate/
│   ├── bitget/route.ts            # Bitget affiliate
│   ├── bybit/route.ts             # Bybit affiliate
│   ├── bingx/route.ts             # BingX affiliate
│   ├── okx/route.ts               # OKX affiliate
│   └── test-all/route.ts          # Test all affiliates
├── cron/
│   └── route.ts                   # Background job runner
└── cron-news/
    └── route.ts                   # News update cron task
```

#### Patterns

- Each route has `route.ts` file
- Exports handler: `export { handler as GET, handler as POST }`
- Delegates business logic to services
- Returns JSON responses
- Used for external integrations and scheduled jobs

---

### `src/app/components/` - App-Level Shared Components

**Purpose**: Reusable components used across multiple pages.

#### Contents

```
components/
├── me-detail-card.tsx          # User profile card component
├── me-detail-list.tsx          # User details list
├── chart.tsx                   # Reusable chart wrapper
├── feature-card.tsx            # Feature card display
```

#### Types

```
types/
├── auth.d.ts                   # Auth type definitions
├── me-menu.ts                  # User menu types
└── calculator-step.ts          # Calculator step types
```

---

### `src/components/` - Global Component Library

**Purpose**: Reusable components, primitives, and providers.

#### UI Components

```
ui/
├── alert-dialog.tsx            # Alert dialog primitive
├── button.tsx                  # Button component
├── card.tsx                    # Card container
├── dialog.tsx                  # Modal dialog
├── input.tsx                   # Form input
├── label.tsx                   # Form label
├── select.tsx                  # Dropdown select
├── textarea.tsx                # Textarea input
├── toast.tsx                   # Toast notifications
├── ... (43 shadcn/ui components total)
├── loading.tsx                 # Global loading indicator
├── container.tsx               # Layout container
└── (42 more UI primitives)
```

**Pattern**: Shadcn/ui components - Radix primitives with Tailwind styling and CVA (Class Variance Authority).

#### Shared Components

```
├── header-hamburger.tsx        # Mobile menu
├── headers.tsx                 # Main header
├── footer.tsx                  # Application footer
├── post-card.tsx               # Post display card
├── comment-card.tsx            # Comment component
├── comment-tip-tap.tsx         # Comment editor
├── tip-tap.tsx                 # Rich text editor
├── file-uploader.tsx           # File upload widget
├── file-card.tsx               # Uploaded file display
├── pagenation.tsx              # Pagination component
├── language-switcher.tsx       # Language toggle
├── theme-switcher.tsx          # Dark/light mode toggle
├── header-selection.tsx        # Header menu
├── header-me-menu.tsx          # User menu dropdown
├── client-html-renderer.tsx    # HTML renderer
├── html-renderer.tsx           # Static HTML display
├── twitter-html-renderer.tsx   # Twitter embed handler
├── get-html.ts                 # HTML conversion utilities
├── ensure-login.tsx            # Auth guard wrapper
└── pagenation.tsx              # Pagination UI
```

#### Providers

```
providers/
├── providers.tsx               # Main provider composition
├── session-provider.tsx        # NextAuth session context
├── theme-provider.tsx          # Dark/light mode context
└── aos-initializer.tsx         # Scroll animation init
```

---

### `src/i18n/` - Internationalization

**Purpose**: Language dictionaries and translation loading.

#### Contents

```
i18n/
├── index.ts                    # Dictionary loading logic
├── en.json                     # English translations
└── ko.json                     # Korean translations
```

#### Dictionary Type

```typescript
export type Dictionary = {
  home: string;
  dashboard: string;
  news: string;
  exchanges: string;
  community: string;
  services: string;
  calculator: string;
  charts: string;
  sns: string;
  markets: string;
  whales: string;
  payback: string;
  live: string;
  team: string;
  login: string;
  signup: string;
  insights: string;
};
```

#### Loading Pattern

```typescript
const dictionaries = {
  en: () => import('./en.json'),
  ko: () => import('./ko.json'),
};

export const getDictionary = async (locale: string) => {
  return dictionaries[locale] ?? dictionaries.en;
};
```

---

### `src/lib/` - Core Application Logic

**Purpose**: Reusable business logic, services, stores, and utilities.

#### `src/lib/prisma.ts`

Singleton Prisma client for database access:
```typescript
- Creates single PrismaClient instance
- Stored in globalThis for hot reload safety
- Imported by all services
```

#### `src/lib/safe-action.ts`

Wrapper for type-safe server actions:
```typescript
import { createSafeActionClient } from "next-safe-action";
export const action = createSafeActionClient();
```

---

### `src/lib/services/` - Business Logic Layer

**Purpose**: Domain-specific services handling business logic and database operations.

#### Base Service

```typescript
// src/lib/services/core/core.service.ts
export class CoreService {
  protected db = prisma;  // Singleton Prisma instance
}
```

All services extend `CoreService` for database access.

#### Service Modules

```
services/
├── core/
│   ├── core.service.ts         # Base service class
│   └── affiliate.service.ts    # Affiliate logic
├── users/
│   └── users.service.ts        # User auth & profiles
├── posts/
│   └── posts.service.ts        # Community posts CRUD
├── comments/
│   └── comments.service.ts     # Post comments
├── comment-likes/
│   └── comment-likes.service.ts # Comment likes
├── post-likes/
│   └── post-likes.service.ts   # Post likes
├── exchanges/
│   ├── exchanges.service.ts    # Exchange registry
│   ├── bitget.service.ts       # Bitget API wrapper
│   ├── bybit.service.ts        # Bybit API wrapper
│   ├── bingx.service.ts        # BingX API wrapper
│   └── okx.service.ts          # OKX API wrapper
├── exchange-accounts/
│   └── exchange-accounts.service.ts # User exchange accounts
├── news/
│   ├── news.service.ts         # News management
│   └── crypto-news.service.ts  # Crypto news API integration
├── events/
│   └── events.service.ts       # Event management
├── trades/
│   └── trades.service.ts       # Trading data aggregation
├── withdraws/
│   └── withdraws.service.ts    # Withdrawal processing
├── payback/
│   └── payback.service.ts      # Payback calculations
└── revalidate.ts               # ISR revalidation utilities
```

#### Service Pattern

```typescript
// Example: posts.service.ts
import { CoreService } from "../core/core.service";

export class PostsService extends CoreService {
  async findMany(page: number) {
    return this.db.post.findMany({
      where: { published: true },
      skip: (page - 1) * 10,
      take: 10,
    });
  }

  async create(data: PostInput) {
    return this.db.post.create({ data });
  }
}

export const postsService = new PostsService();
```

**Advantages**:
- Reusable across routes and API endpoints
- Testable in isolation
- Single responsibility principle
- Type-safe with TypeScript

---

### `src/lib/stores/` - Client-Side State Management

**Purpose**: Zustand stores for global client state.

#### Stores

```
stores/
├── alert-dialog-store.ts       # Global alert/confirm dialogs
├── calculator-store.ts         # Trading calculator state
├── loading-store.ts            # Global loading indicator
├── rich-text-store.ts          # Editor/markdown state
└── withdraw-store.ts           # Withdrawal form state
```

#### Usage Pattern

```typescript
// src/lib/stores/calculator-store.ts
import { create } from 'zustand';

export const useCalculatorStore = create((set) => ({
  step: 1,
  setStep: (step) => set({ step }),
}));

// In component
const { step, setStep } = useCalculatorStore();
```

---

### `src/lib/utils/` - Utility Functions

**Purpose**: Reusable helper functions.

#### Utilities

```
utils/
├── date-formatting.ts          # Date/time formatting functions
├── get-animation-props.ts      # AOS animation helpers
├── get-image-url.ts            # Image URL builder (Supabase)
├── password.ts                 # Password validation/hashing
└── send-mail.ts                # Email sending via Nodemailer
```

#### Example

```typescript
// date-formatting.ts
export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US').format(date);
};
```

---

### `src/lib/zod/` - Validation Schemas

**Purpose**: Zod validation schemas for forms and inputs.

#### Contents

```
zod/
└── sign-in-schema.ts          # Login form validation

// Root level
├── zod.ts                     # Zod configuration
```

#### Schema Pattern

```typescript
import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password too short'),
});

export type SignInInput = z.infer<typeof signInSchema>;
```

---

### `src/lib/data/` - Static Data

**Purpose**: Constants and static data structures.

```
data/
├── (various data files)        # Lookup tables, constants
```

---

### `src/lib/modules/` - Feature Modules

**Purpose**: Self-contained feature bundles.

```
modules/
├── (feature modules)           # Organized by feature
```

---

### `src/hooks/` - Custom React Hooks

**Purpose**: Reusable React hooks for logic encapsulation.

#### Contents

```
hooks/
└── use-action.ts               # Wrapper for server action calls
```

#### Example

```typescript
// use-action.ts
export const useAction = (action: ServerAction) => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (input) => {
    setIsPending(true);
    try {
      return await action(input);
    } catch (err) {
      setError(err);
    } finally {
      setIsPending(false);
    }
  }, [action]);

  return { execute, isPending, error };
};
```

---

### `src/auth.ts` - Authentication Configuration

**Purpose**: NextAuth.js setup and session management.

#### Key Sections

```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      // Email/password authentication
    }),
  ],
  callbacks: {
    session: ({ session, token }) => {
      // Populate session with user data
    },
    jwt: ({ token, user }) => {
      // Encode user data in JWT
    },
  },
  pages: {
    signIn: '/login',
  },
};

// Server-side session helper
export const auth = () => getServerSession(authOptions);
```

#### Usage in Pages

```typescript
// Protected page
const session = await auth();
if (!session) redirect('/login');
```

---

## File Organization Patterns

### By Type vs. By Feature

CryptoX uses a **hybrid approach**:

#### By Type (Top-Level)

```
src/
├── app/          (routes & pages)
├── components/   (UI components)
├── lib/          (business logic)
├── hooks/        (custom hooks)
├── i18n/         (translations)
```

#### By Feature (Within Routes)

```
src/app/[lang]/(navigator)/
├── posts/
│   ├── page.tsx
│   ├── new/
│   ├── [id]/
│   ├── actions.ts          (colocated with feature)
│   └── *-section.tsx       (reusable sections)
```

**Benefits**:
- Clear separation of concerns
- Easier to find related code
- Scale independently
- Feature-isolated colocated actions

### Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Pages | `page.tsx` | `dashboard/page.tsx` |
| Layouts | `layout.tsx` | `(navigator)/layout.tsx` |
| Server Actions | `actions.ts` | `posts/actions.ts` |
| API Routes | `route.ts` | `api/news/crypto/route.ts` |
| Components | `{name}.tsx` | `post-card.tsx` |
| Services | `{domain}.service.ts` | `users.service.ts` |
| Stores | `{domain}-store.ts` | `calculator-store.ts` |
| Schemas | `{domain}-schema.ts` | `sign-in-schema.ts` |
| Utilities | `{action}.ts` | `date-formatting.ts` |
| Sections | `{domain}-section.tsx` | `news-section.tsx` |
| Layout Groups | `(name)` | `(navigator)` |
| Dynamic Segments | `[param]` | `[id]`, `[lang]` |

---

## Key Directories Reference

### Critical Paths

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `src/app/[lang]/(navigator)/` | Main app pages | 15+ page.tsx files |
| `src/lib/services/` | Business logic | 14 service modules |
| `src/components/` | UI library | 43+ components |
| `src/app/api/` | API endpoints | 8+ route.ts files |
| `src/i18n/` | Translations | en.json, ko.json |
| `src/lib/stores/` | Client state | 5 Zustand stores |

### Important Singletons

- `src/lib/prisma.ts` - Database access
- `src/auth.ts` - Authentication
- `src/app/layout.tsx` - Root layout

### Important Config Files (Project Root)

- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript settings
- `tailwind.config.ts` - Tailwind CSS
- `components.json` - Shadcn/ui CLI config
- `prisma/schema.prisma` - Database schema
- `.env.local` - Environment variables

---

## File Count Summary

- **Total TypeScript/TSX files**: 222+
- **Pages**: 25+ (routes in `src/app/[lang]/(navigator)/`)
- **Components**: 43+ (UI) + 20+ (app-specific)
- **Services**: 14+ domain modules
- **API Routes**: 8+ endpoints
- **Configuration files**: 10+ (auth, Prisma, etc.)

---

## Summary

CryptoX organizes code with:

1. **Clear layering**: Pages → Components → Services → Database
2. **Feature-based routing**: Each major feature has dedicated route directory
3. **Colocated actions**: `actions.ts` with their pages
4. **Service abstraction**: Reusable business logic
5. **UI component library**: 40+ shadcn/ui primitives
6. **Global providers**: Theme, auth, animations
7. **i18n support**: Language-aware routing
8. **Type safety**: TypeScript + Zod throughout
