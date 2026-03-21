# Technology Stack - CryptoX

## Languages & Runtime

- **Language**: TypeScript 5.x
- **Runtime**: Node.js (Next.js server-side runtime)
- **JSX**: React with TypeScript support

## Framework & Core

- **Framework**: Next.js 14 (App Router)
- **React**: 18.x
- **Package Manager**: npm

## UI & Styling

- **CSS Framework**: Tailwind CSS 3.4.1
- **Component Library**: shadcn/ui (Radix UI primitives + CVA)
- **Icons**:
  - Lucide React 0.394.0
  - Heroicons 2.1.3
  - @heroicons/react 2.1.3
- **Styling Utilities**:
  - class-variance-authority 0.7.0
  - clsx 2.1.1
  - tailwind-merge 2.3.0
  - tailwindcss-animate 1.0.7
- **Animation**: AOS (Animate on Scroll) 2.3.4
- **Carousel**: Embla Carousel React 8.0.4
- **Drawer**: Vaul 0.9.1

## State Management

- **State**: Zustand 4.5.2

## Forms & Validation

- **Form Library**: React Hook Form 7.51.4
- **Form Resolvers**: @hookform/resolvers 3.3.4
- **Schema Validation**: Zod 3.23.8

## Rich Text Editing

- **Editor**: TipTap 2.6.4
  - @tiptap/react 2.6.4
  - @tiptap/starter-kit 2.6.4
  - @tiptap/extension-image 2.6.6
  - @tiptap/extension-link 2.7.2
  - @tiptap/pm 2.6.4

## Authentication & Authorization

- **Auth Framework**: NextAuth.js 4.24.11
- **Auth Database Adapter**: @next-auth/prisma-adapter 1.0.7
- **Password Hashing**:
  - bcrypt 6.0.0
  - bcryptjs 2.4.3

## Database & ORM

- **Database**: PostgreSQL
- **ORM**: Prisma 5.22.0
  - @prisma/client 5.22.0
- **Database Client**: pg 8.13.1

## API Client & HTTP

- **HTTP Client**: Axios 1.7.2
- **RESTful API Integration**: next-safe-action 4.0.4

## External API Integrations

- **Bitget Exchange API**: bitget-api 2.0.10
- **Bybit Exchange API**: bybit-api 3.10.18
- **AI**: Replicate 0.29.4 (AI image/content generation)
- **OpenAPI Client Generator**: Uses openapi-generator-cli (postinstall script)

## Cloud Storage & Backend Services

- **File Storage**: Supabase Storage
  - @supabase/supabase-js 2.43.2
  - @supabase/ssr 0.3.0

## Content & Social

- **Tweet Embed**: react-tweet 3.3.0

## Utilities & Cryptography

- **Date/Time**:
  - date-fns 3.6.0
  - moment 2.30.1
- **Cryptography**:
  - crypto-js 4.2.0
  - node-rsa 1.1.1
- **Image Compression**: browser-image-compression 2.0.2
- **DOM Parsing**:
  - jsdom 25.0.1
  - htmlparser2 9.1.0
- **Environment Variables**: dotenv 16.4.7
- **Compression**: jszip 3.10.1
- **i18n Utilities**:
  - @formatjs/intl-localematcher 0.5.9
  - negotiator 1.0.0
- **HTML Content**: dangerously-set-html-content 1.1.0
- **Date Picker**: react-day-picker 8.10.1
- **Scroll Area**: @radix-ui/react-scroll-area 1.0.5

## Theme & Localization

- **Theme Switching**: next-themes 0.3.0
- **i18n Strategy**: Custom middleware-based routing with `/[lang]/...` pattern
- **Translation Files**: JSON dictionaries (`ko.json` / `en.json`)

## AI Integration

- **AI SDK**: ai 3.1.10

## Configuration Files

- **TypeScript**: `tsconfig.json` with path aliases (`@/*` → `./src/*`)
- **Tailwind**: `tailwind.config.ts` with custom theme, dark mode support
- **Next.js**: `next.config.mjs` with image remote patterns configuration
- **Prisma**: `prisma/schema.prisma` with PostgreSQL provider
- **Middleware**: `middleware.ts` for i18n locale detection and routing

## Build Tools & Development

- **Bundler**: Next.js built-in bundler (webpack)
- **PostCSS**: 8.x (for Tailwind)
- **ESLint**: 8.x with next.config rules

## Dev Dependencies

- TypeScript: 5.x
- @types packages for type support:
  - @types/node 20.x
  - @types/react 18.x
  - @types/react-dom 18.x
  - @types/browser-image-compression 1.0.1
  - @types/crypto-js 4.2.2
  - @types/jsdom 21.1.7
  - @types/moment 2.11.29
  - @types/aos 3.0.7
  - @types/bcryptjs 2.4.6
  - @types/negotiator 0.6.3
  - @types/node-rsa 1.1.4
- ESLint configuration for Next.js
- Prisma CLI for migrations

## Project Structure & Standards

- **Path Aliases**: Configured in `tsconfig.json` (`@/*` maps to `./src/*`)
- **Server Actions**: Colocated in `actions.ts` files with their routes
- **UI Patterns**: Follows shadcn/ui component patterns
- **Database Access**: Singleton Prisma client pattern (`src/lib/prisma.ts`)
- **Safe Server Actions**: Built with `next-safe-action` wrapper
