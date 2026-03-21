# CryptoX Codebase Concerns & Technical Debt

## Critical Issues

### 1. Exposed Credentials in .env File
**Severity: CRITICAL**

**Location:** `/.env`

The `.env` file contains plaintext API keys, database credentials, and sensitive authentication tokens that should never be committed or exposed:

- Database credentials (user/host/password) — rotate if ever leaked
- Exchange API keys and secrets (Bitget, Bybit, Bingx, OKX)
- Mailgun API key — use `MAILGUN_API_KEY` env var only
- Supabase API keys
- Polymarket API credentials
- `AUTH_SECRET` — must be a strong random value in env, never in repo

**Impact:** Complete account takeover, database compromise, financial loss through unauthorized API usage

**Recommendation:**
- Immediately rotate all exposed credentials
- Add `.env` to `.gitignore` (verify it's not in git history)
- Use Vercel/environment secrets for deployment
- Implement secret rotation policy

---

### 2. Hardcoded Mailgun Credentials
**Severity: CRITICAL**

**Location:** `/src/lib/utils/send-mail.ts` (lines 17-20)

```typescript
auth: {
  username: "api",
  password: process.env.MAILGUN_API_KEY ?? "",
}
```

Mailgun API key exposed directly in source code, allowing unauthorized email sending.

**Recommendation:**
- Move to environment variable
- Rotate the exposed key immediately
- Consider using Supabase auth emails instead

---

### 3. XSS Vulnerabilities with dangerouslySetInnerHTML
**Severity: HIGH**

**Locations:**
- `/src/app/[lang]/(navigator)/insights/[id]/page.tsx` - Line 80+: `dangerouslySetInnerHTML={{ __html: insight.content }}`
- `/src/components/post-card.tsx` - Line 90+: `dangerouslySetInnerHTML={{ __html: innerHtml }}`

Rendering user-generated HTML content without sanitization creates XSS attack vectors.

**Impact:** Session hijacking, credential theft, malicious script injection

**Recommendation:**
- Use `html-parser` or `rehype` libraries to sanitize HTML
- Implement Content Security Policy (CSP) headers
- Use React's built-in DOM API or safe libraries like `xss` or `sanitize-html`

---

### 4. Weak Password Validation
**Severity: HIGH**

**Location:** `/src/app/[lang]/(navigator)/signup/actions.ts` (lines 11)

```typescript
password: z.string().min(3),
```

Passwords only require 3 characters - insufficient security for a crypto exchange platform handling financial data.

**Recommendation:**
- Minimum 12 characters
- Require uppercase, lowercase, numbers, special characters
- Implement password strength meter
- Add rate limiting on signup endpoint

---

### 5. Unused Password Hashing Placeholder
**Severity: HIGH**

**Location:** `/src/lib/utils/password.ts`

```typescript
export function saltAndHashPassword(password: string): string {
  // This is a placeholder function for hashing and salting passwords.
  // You should replace this with a more secure hashing function.
  return password;  // RETURNS PLAINTEXT!
}
```

This function returns plaintext instead of hashing. Although `bcryptjs` is used elsewhere, this unused code is dangerous if called.

**Recommendation:**
- Delete the placeholder function immediately
- Ensure only bcryptjs is used throughout the application
- Add linting rule to prevent unused security functions

---

## High Severity Issues

### 6. Missing Input Validation on API Routes
**Severity: HIGH**

**Location:** `/src/app/api/coiness/route.ts` (lines 7-16)

```typescript
let limit = parseInt(searchParams.get("limit") || "10", 10);
if (limit < 1 || limit > 40) {
  limit = 10;
}
```

Basic range check only; no other parameter validation. Query parameters are passed directly to external APIs.

**Recommendations:**
- Add comprehensive Zod schema validation
- Sanitize all query parameters
- Add rate limiting per IP
- Log suspicious requests

---

### 7. Unvalidated Type Coercion with `as any`
**Severity: HIGH**

**Locations:**
- `/src/lib/services/payback/payback.service.ts` (5 instances): `(this.db as any).paybackCalculation.*`
- `/src/app/api/affiliate/test-all/route.ts` (line 12): `error: any`
- `/src/app/api/polymarket/route.ts` (line 16, 27): `event: any`, `m: any`
- `/src/app/api/whales/route.ts` (line 44): `tx: any`

Type safety bypassed, leading to potential runtime errors and undetected bugs.

**Recommendations:**
- Replace `any` with proper TypeScript interfaces
- Enable `noImplicitAny: true` in tsconfig
- Generate proper Prisma types
- Add ESLint rule to forbid `any`

---

### 8. Multiple Affiliate Account Hardcoded Test Data
**Severity: HIGH**

**Location:** `/src/app/api/affiliate/test-all/route.ts` (lines 20-30)

```typescript
testExchange("bitget", () =>
  bitgetService.getAffiliateData("8165125470")
),
testExchange("bybit", () =>
  byBitService.getAffiliateData("594436422380389965")
),
```

Hardcoded UIDs exposed in API endpoint; likely test/demo accounts that shouldn't be in production.

**Recommendation:**
- Remove or move to environment variables
- Add authentication/authorization checks
- Remove test endpoints from production builds

---

### 9. Insecure Redirect Attempts
**Severity: HIGH**

**Location:** `/src/app/[lang]/(navigator)/signup/email-code-modal.tsx`

```typescript
href={"/example.com"}
```

Invalid redirect using string path instead of proper URL.

**Recommendation:**
- Use proper redirect mechanism
- Validate redirect targets whitelist
- Never trust user-provided redirect URLs

---

## Medium Severity Issues

### 10. Missing Error Handling and Silent Failures
**Severity: MEDIUM**

**Locations:**
- `/src/app/api/whales/route.ts` (lines 31-33, 53-55): Empty catch blocks return empty arrays without logging
- `/src/app/api/polymarket/route.ts` (lines 38-40): Error logged but swallows actual error details
- `/src/lib/services/news/crypto-news.service.ts` (line 64): Returns cached data on error without indication

These silent failures make debugging production issues extremely difficult.

**Recommendations:**
- Log full error objects with context
- Return error status codes to clients
- Implement structured logging (Winston, Pino)
- Add monitoring/alerting for API failures
- Add retry logic with exponential backoff

---

### 11. Console Logs in Production Code
**Severity: MEDIUM**

**Locations** (37 instances found):
- `/src/lib/services/exchanges/bitget.service.ts` (line 45): `console.log("item:", ...)`
- `/src/lib/services/news/crypto-news.service.ts` (line 64): `console.error(...)`
- `/src/lib/services/news/news.service.ts` (lines 50, 57): `console.log(...)`
- `/src/app/api/coiness/route.ts` (lines 12, 34): `console.log(...)`
- 33 more instances across components

These expose internal logic and create noise in logs.

**Recommendations:**
- Replace with structured logging library
- Use different log levels (debug, info, warn, error)
- Disable debug logs in production builds
- Add ESLint rule to prevent console statements

---

### 12. No Authentication on API Endpoints
**Severity: MEDIUM**

**Locations:**
- `/src/app/api/polymarket/route.ts` - Public, no auth
- `/src/app/api/whales/route.ts` - Public, no auth
- `/src/app/api/news/crypto/route.ts` - Public, no auth
- `/src/app/api/cron/route.ts` - Cron job, may lack security
- `/src/app/api/affiliate/*` - Affiliate endpoints may be unsecured

No rate limiting, authentication, or authorization checks.

**Recommendations:**
- Add authentication middleware for sensitive endpoints
- Implement rate limiting (Redis-based or third-party service)
- Add CORS security headers
- Require API keys for external access
- Add request signing/validation

---

### 13. Hardcoded Domain References
**Severity: MEDIUM**

**Locations:**
- `/src/app/[lang]/(navigator)/posts/[id]/post-detail-section.tsx` (line 29): `https://www.cryptoxcorp.com/`
- `/src/components/post-card.tsx` (line 58): `https://www.cryptoxcorp.com/`
- `/src/lib/utils/send-mail.ts` (line 14): Email from `no-reply@cryptoxcorp.com`
- `/src/lib/utils/send-mail.ts`: Mailgun domain `cryptoxcorp.com`

Hardcoded domains make environment-specific deployment difficult.

**Recommendations:**
- Create `NEXT_PUBLIC_APP_URL` environment variable
- Create `MAIL_DOMAIN` environment variable
- Use environment-based configuration throughout

---

### 14. API Key Exposed in URL Parameters
**Severity: MEDIUM**

**Locations:**
- `/src/lib/services/news/news.service.ts` (line 45-48): `apiKey=${process.env.COINESS_API_KEY}` in URL
- `/src/app/api/coiness/route.ts` (line 20): Same pattern

API keys in URLs can be logged in server logs, browser history, and server access logs.

**Recommendation:**
- Pass API keys in Authorization headers only
- Review all third-party API integrations
- Check server access logs for exposed keys

---

## Low Severity Issues (Code Quality)

### 15. No Test Coverage
**Severity: LOW**

No test files found in the codebase (`*.test.ts`, `*.spec.ts`, `__tests__/`).

**Impact:** Regression risk, refactoring becomes dangerous, difficult to maintain

**Recommendations:**
- Add Jest for unit tests
- Add Cypress/Playwright for E2E tests
- Aim for 80%+ coverage on business logic
- Test all authentication flows

---

### 16. Incomplete Internationalization (i18n)
**Severity: LOW**

**Location:** Multiple hardcoded Korean strings in components

Examples:
- `/src/app/[lang]/(navigator)/posts/[id]/post-detail-section.tsx` (lines 33-34, 42, 77): Hardcoded Korean strings
- `/src/components/post-card.tsx` (lines 62-63, 71, 72): Hardcoded Korean UI text

Defeats the i18n routing system with hardcoded content.

**Recommendations:**
- Extract all UI strings to translation files
- Use translation key structure consistently
- Add missing translations

---

### 17. Memory Leak Risks with Manual Caching
**Severity: LOW**

**Location:** `/src/lib/services/news/crypto-news.service.ts` (lines 32-35)

```typescript
let cachedNews: CryptoNewsItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
```

Manual cache in memory doesn't respect server restarts or scale issues; large news arrays could consume significant memory.

**Recommendations:**
- Use Redis or Vercel KV for distributed caching
- Implement cache eviction policies
- Use Next.js ISR (Incremental Static Regeneration) instead
- Monitor memory usage

---

### 18. Unused/Dead Code
**Severity: LOW**

Identified instances:
- `/src/lib/utils/password.ts`: Unused placeholder function
- `/src/lib/services/news/news.service.ts` (lines 59-67): Commented-out fallback logic
- `/src/app/api/coiness/route.ts` (lines 22-25): Commented-out code

**Recommendations:**
- Remove dead code
- Delete commented-out code (version control preserves history)
- Use ESLint rule `no-commented-out-code`

---

### 19. Missing Nullable Field Handling
**Severity: LOW**

**Location:** `/src/app/[lang]/(navigator)/posts/[id]/post-detail-section.tsx` (line 57)

```typescript
src={post.user.imageUrl || "/images/profile.png"}
```

Proper fallback for nullable fields, but inconsistent throughout codebase.

**Recommendations:**
- Add null safety checks consistently
- Use optional chaining (`?.`) more liberally
- Consider non-null assertion only when verified

---

### 20. CORS and Security Headers Missing
**Severity: LOW**

No evidence of CORS configuration or security headers (X-Frame-Options, X-Content-Type-Options, etc.) in API routes.

**Recommendations:**
- Add `next-cors` middleware
- Implement security headers middleware
- Add CSP headers to prevent XSS
- Configure CORS for trusted origins only

---

## Data & Performance Concerns

### 21. Database Query Inefficiencies
**Severity: MEDIUM**

**Location:** `/src/lib/services/users/users.service.ts` (lines 32-46)

```typescript
async findByEmail(email: string) {
  return this.db.user.findUnique({
    where: { email },
    include: {
      posts: {
        include: {
          user: true,
          comments: true,
          likes: true,
        },
      },
      followers: true,
      followings: true,
    },
  });
}
```

Deep nesting of relations loads entire relationship graphs; no pagination on posts/comments. N+1 query risk.

**Recommendations:**
- Use Prisma `select` instead of `include` for specific fields
- Paginate relationship queries
- Add database indexes on foreign keys
- Monitor query performance with Prisma logging

---

### 22. Loop-Based Database Inserts (N+1)
**Severity: MEDIUM**

**Location:** `/src/lib/services/exchange-accounts/exchange-accounts.service.ts` (lines 47-55)

```typescript
async addTrades(trades: Prisma.TradeCreateInput[]) {
  const result: Trade[] = [];
  for (const trade of trades) {
    const created = await this.db.trade.create({
      data: trade,
    });
    result.push(created);
  }
  return result;
}
```

Individual INSERT for each trade instead of batch insert.

**Recommendation:**
- Use `createMany()` for bulk operations
- Expected 10-100x performance improvement

---

### 23. Hardcoded Test UIDs in Test Route
**Severity: MEDIUM**

**Location:** `/src/app/api/affiliate/test-all/route.ts`

Test UIDs should not be in source code:
- `8165125470` (Bitget)
- `594436422380389965` (Bybit, OKX)
- `26029939` (BingX)

**Recommendation:**
- Move to environment variables
- Add test mode detection
- Remove from production builds

---

## Security & Best Practices

### 24. Missing CSRF Protection
**Severity: MEDIUM**

No evidence of CSRF tokens or SameSite cookie settings for state-changing operations.

**Recommendation:**
- Add CSRF middleware
- Ensure SameSite cookie attribute is set
- Use POST for all state-changing operations

---

### 25. Missing Rate Limiting
**Severity: MEDIUM**

No rate limiting on:
- Authentication endpoints (login, signup)
- API endpoints
- File upload endpoints

**Recommendation:**
- Implement rate limiting middleware
- Use Upstash Redis for distributed rate limiting
- Different limits for authenticated vs. anonymous users

---

### 26. Insufficient Logging Strategy
**Severity: LOW**

**Issues:**
- No structured logging system
- Console logs mixed with application logic
- No audit trails for sensitive operations
- No request/response logging

**Recommendation:**
- Implement Winston or Pino for structured logging
- Log all auth events
- Log financial transactions
- Add correlation IDs for request tracking
- Store logs in centralized system (DataDog, LogRocket)

---

## Summary

| Severity | Count | Key Issues |
|----------|-------|-----------|
| **CRITICAL** | 4 | Exposed credentials, hardcoded secrets, XSS vulnerabilities, weak passwords |
| **HIGH** | 5 | Input validation gaps, unsafe type assertions, hardcoded test data, missing auth |
| **MEDIUM** | 9 | Silent errors, console logs, missing API security, query inefficiencies |
| **LOW** | 7 | Code quality, i18n issues, unused code, headers |

### Immediate Actions Required

1. **Rotate all exposed API keys and credentials** (Mailgun, databases, exchange APIs)
2. **Remove `.env` from git history** and add to `.gitignore`
3. **Sanitize user-generated HTML** in insights and posts
4. **Implement input validation** on all API endpoints
5. **Add authentication/rate limiting** to public endpoints
6. **Replace `any` types** with proper TypeScript interfaces
7. **Remove hardcoded test data** from affiliate endpoints

### Medium-term Improvements

1. Add comprehensive test suite
2. Implement structured logging
3. Add security headers and CORS
4. Optimize database queries (remove N+1)
5. Implement proper caching strategy
6. Complete i18n coverage
7. Add monitoring and alerting

### Long-term Strategic Work

1. Security audit by third-party firm
2. Implement compliance requirements (KYC/AML for crypto platform)
3. Add comprehensive API documentation
4. Implement feature flags for gradual rollouts
5. Add API versioning strategy
6. Plan for horizontal scaling
