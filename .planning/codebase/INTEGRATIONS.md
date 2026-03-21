# External Integrations & API Services - CryptoX

## Cryptocurrency Exchange APIs

### Bybit Exchange API
- **Package**: bybit-api 3.10.18
- **Documentation**: RestClientV5 for affiliate data queries
- **Service File**: `src/lib/services/exchanges/bybit.service.ts`
- **Environment Variables**:
  - `BYBIT_API_KEY`
  - `BYBIT_API_SECRET`
- **API Route**: `src/app/api/affiliate/bybit/route.ts`
- **Capabilities**: Get affiliate user information, commission tracking

### Bitget Exchange API
- **Package**: bitget-api 2.0.10
- **Documentation**: RestClientV2 with custom commission endpoint
- **Service File**: `src/lib/services/exchanges/bitget.service.ts`
- **Environment Variables**:
  - `BITGET_API_KEY`
  - `BITGET_API_SECRET`
  - `BITGET_API_PASS` (passphrase)
- **API Route**: `src/app/api/affiliate/bitget/route.ts`
- **Capabilities**: Get broker commission data, customer commission tracking

### BingX Exchange API
- **Service File**: `src/lib/services/exchanges/bingx.service.ts`
- **Environment Variables**:
  - `BINGX_API_KEY`
  - `BINGX_API_SECRET`
- **Host**: open-api.bingx.com
- **API Route**: `src/app/api/affiliate/bingx/route.ts`
- **Capabilities**: Commission data list, reward tracking
- **Authentication**: HMAC-SHA256 signature-based

### OKX Exchange API
- **Service File**: `src/lib/services/exchanges/okx.service.ts`
- **Environment Variables**:
  - `OKX_API_KEY`
  - `OKX_API_SECRET`
- **API Route**: `src/app/api/affiliate/okx/route.ts`
- **Capabilities**: Affiliate data retrieval

### Multi-Exchange Test Route
- **API Route**: `src/app/api/affiliate/test-all/route.ts`
- **Purpose**: Test all exchange API integrations

## Cryptocurrency Data & News APIs

### CryptoCompare News API
- **Endpoint**: https://min-api.cryptocompare.com/data/v2/news/
- **Service File**: `src/lib/services/news/crypto-news.service.ts`
- **Features**:
  - Fetches crypto news with category filtering
  - Implements 5-minute caching
  - Returns news items with source, image, categories, and publish dates
- **API Route**: `src/app/api/news/crypto/route.ts`
- **Image Source**: Remote images from `*.cryptocompare.com` domains
- **Language**: English news only

### Coinness API
- **Service File**: News service integration
- **Environment Variables**: `COINESS_API_KEY`
- **API Route**: `src/app/api/coiness/route.ts`
- **Endpoint**: https://api.coinness.com/feed/v1/partners/ko/news
- **Capabilities**: Korean crypto news feed
- **Authentication**: API key header-based

## Blockchain & Wallet APIs

### Etherscan API
- **Service**: Whale wallet monitoring
- **API Route**: `src/app/api/whales/route.ts`
- **Endpoints**:
  - Account balance: `/api?module=account&action=balance`
  - Recent transactions: `/api?module=account&action=txlist`
- **Capabilities**:
  - ETH balance queries for specific addresses
  - Recent transaction history
  - Revalidation: 60-120 seconds
- **Tracked Wallets**:
  - Trump WLFI Treasury (0x5be9a4959308A0D0c7bC0870E319314d8D957dBB)
  - Trump WLFI Operations (0x97f1f8003ad0fb1c99361170310c65dc84f921e3)
- **Additional Data**: Links to Arkham Intelligence for institutional wallet tracking

## Prediction Markets API

### Polymarket API
- **Service**: Crypto predictions and markets
- **API Route**: `src/app/api/polymarket/route.ts`
- **Endpoint**: https://gamma-api.polymarket.com/events
- **Capabilities**:
  - Fetch crypto-tagged prediction markets
  - Get market outcomes and pricing
  - Volume and liquidity data
- **Query Parameters**:
  - `closed=false` (active markets only)
  - `tag=crypto`
  - `limit=12`
- **Cache**: 5 minutes (revalidate=300)
- **Response Shape**: Events with nested markets, outcomes, and pricing

## Database & Persistent Storage

### PostgreSQL Database
- **Service**: Supabase PostgreSQL instance
- **Configuration**: `prisma/schema.prisma`
- **Environment Variables**:
  - `DATABASE_URL` (pooled connection with Supavisor)
  - `DIRECT_URL` (direct connection for migrations)
- **Provider**: AWS in ap-northeast-2 region (Supabase)
- **ORM**: Prisma 5.22.0
- **Schema Models**:
  - User (authentication, profiles, follow relationships)
  - Post, Comment, PostLike, CommentLike (social content)
  - ExchangeAccount (user exchange connections)
  - Trade, Withdrawal (transaction tracking)
  - Exchange (exchange metadata and payback data)
  - PaybackCalculation (trading fee analysis)
  - News, Event (content management)
  - Banner (promotional content)
  - HashTag, Verification (utilities)

### Supabase Storage
- **Service**: File/image storage and SSR support
- **Packages**:
  - @supabase/supabase-js 2.43.2
  - @supabase/ssr 0.3.0
- **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Bucket**: CryptoX
- **Module**: `src/lib/modules/file-upload.ts`
- **Capabilities**: Image uploads with validation, URL generation
- **Remote Image Patterns** (next.config.mjs):
  - `nkkuehjtdudabogzwibw.supabase.co`
  - `resources.cryptocompare.com`
  - `images.cryptocompare.com`

## Authentication & Session Management

### NextAuth.js with Credentials Provider
- **Configuration**: `src/auth.ts`
- **Provider**: Credentials-based (email/password)
- **Database Adapter**: Prisma adapter
- **Environment Variables**: `AUTH_SECRET`
- **Features**:
  - Custom JWT callbacks
  - Session callbacks
  - Secure token storage
  - Redirect to `/login` on auth failure

## AI & ML Services

### Replicate
- **Package**: replicate 0.29.4
- **Service**: AI-powered image/content generation
- **Environment**: Server-side only (not exposed to client)
- **Purpose**: Potential use for AI-generated content or image processing

## Miscellaneous Services

### Crypto News Cron Job
- **API Route**: `src/app/api/cron-news/route.ts`
- **Purpose**: Automated news fetching and updates

### General Cron Service
- **API Route**: `src/app/api/cron/route.ts`
- **Purpose**: Scheduled background tasks

## Environment Variables Summary

### Required Authentication Variables
- `AUTH_SECRET` - NextAuth session secret
- `DATABASE_URL` - PostgreSQL connection string (pooled)
- `DIRECT_URL` - PostgreSQL direct connection (migrations)

### Exchange API Credentials
- `BYBIT_API_KEY` / `BYBIT_API_SECRET`
- `BITGET_API_KEY` / `BITGET_API_SECRET` / `BITGET_API_PASS`
- `BINGX_API_KEY` / `BINGX_API_SECRET`
- `OKX_API_KEY` / `OKX_API_SECRET`

### Third-Party API Keys
- `COINESS_API_KEY` - Coinness news API
- `POLYMARKET_API_KEY` / `POLYMARKET_API_SECRET` / `POLYMARKET_API_PASSPHRASE` - Server-side only

### Cloud Storage (Supabase)
- `NEXT_PUBLIC_SUPABASE_URL` - Public client config
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public client config

### Region & Deployment
- **Database Region**: ap-northeast-2 (Seoul, AWS)
- **Supabase Project**: nkkuehjtdudabogzwibw

## Security Notes

- Polymarket API credentials are server-side only (not exposed to client)
- Replicate is used server-side only for secure AI operations
- All exchange API keys handled server-side in server actions
- DIRECT_URL separate from DATABASE_URL to ensure migrations work correctly
- Auth secret should be securely rotated in production environments
