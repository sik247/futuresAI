// X/Twitter feed service
// Fetches live tweets via Twitter syndication API + RSSHub timeline discovery
// Falls back to cached tweet IDs if live fetching fails

export type XFeedItem = {
  tweetId: string;
  username: string;
  displayName: string;
  category: string;
};

export type CryptoAccount = {
  username: string;
  displayName: string;
  category: string;
};

const CRYPTO_ACCOUNTS: CryptoAccount[] = [
  // ── Analysts ────────────────────────────────────────────────────────
  { username: "elaboratideas", displayName: "Elaborate Ideas", category: "analyst" },
  { username: "coinaboratideas", displayName: "Coin Ideas", category: "analyst" },
  { username: "bitaboratideas", displayName: "Bit Ideas", category: "analyst" },
  { username: "caboratideas", displayName: "C Ideas", category: "analyst" },
  { username: "CryptoCobain", displayName: "Crypto Cobain", category: "analyst" },
  { username: "CryptoCapo_", displayName: "Il Capo of Crypto", category: "analyst" },
  { username: "AltcoinGordon", displayName: "Altcoin Gordon", category: "analyst" },
  { username: "inversebrah", displayName: "inversebrah", category: "analyst" },
  { username: "MustStopMurad", displayName: "Murad", category: "analyst" },
  { username: "blknoiz06", displayName: "Blknoiz06", category: "analyst" },

  // ── News ────────────────────────────────────────────────────────────
  { username: "WatcherGuru", displayName: "Watcher Guru", category: "news" },
  { username: "DeItaone", displayName: "Walter Bloomberg", category: "news" },
  { username: "Bitcoin", displayName: "Bitcoin", category: "news" },
  { username: "ethereum", displayName: "Ethereum", category: "news" },
  { username: "solana", displayName: "Solana", category: "news" },
  { username: "Cointelegraph", displayName: "Cointelegraph", category: "news" },
  { username: "CoinDesk", displayName: "CoinDesk", category: "news" },
  { username: "TheBlock__", displayName: "The Block", category: "news" },

  // ── Whales ──────────────────────────────────────────────────────────
  { username: "whale_alert", displayName: "Whale Alert", category: "whales" },

  // ── On-chain / Analytics ────────────────────────────────────────────
  { username: "CryptoQuant_com", displayName: "CryptoQuant", category: "analytics" },
  { username: "lookonchain", displayName: "Lookonchain", category: "onchain" },
  { username: "glassnode", displayName: "Glassnode", category: "analytics" },
  { username: "nansen_ai", displayName: "Nansen", category: "analytics" },
  { username: "SantimentFeed", displayName: "Santiment", category: "analytics" },
  { username: "IntoTheBlock", displayName: "IntoTheBlock", category: "analytics" },

  // ── DeFi / Protocols ───────────────────────────────────────────────
  { username: "AaveAave", displayName: "Aave", category: "defi" },
  { username: "Uniswap", displayName: "Uniswap", category: "defi" },
  { username: "MakerDAO", displayName: "MakerDAO", category: "defi" },

  // ── Exchanges ──────────────────────────────────────────────────────
  { username: "Bybit_Official", displayName: "Bybit", category: "exchange" },
  { username: "binance", displayName: "Binance", category: "exchange" },
  { username: "OKX", displayName: "OKX", category: "exchange" },
  { username: "coinbase", displayName: "Coinbase", category: "exchange" },
];

// Fallback hardcoded tweet IDs — used when live fetching fails
const FALLBACK_TWEET_IDS: Record<string, string[]> = {
  // ── Existing accounts ──────────────────────────────────────────────
  elaboratideas: [
    "1879597798754218482",
    "1879597298952491253",
    "1879234563727233187",
    "1878872282321453497",
    "1878508564257554888",
  ],
  WatcherGuru: [
    "2036624893026914350",
    "2036605079768179122",
    "2036599079979876681",
    "2036520208228110556",
    "2036513408921604314",
  ],
  whale_alert: [
    "1943280611717779707",
    "1940980726054150512",
    "1902300522121429034",
    "1896160742006493653",
    "1892942860686610609",
  ],
  CryptoQuant_com: [
    "2036474803729613282",
    "2036464120854167753",
    "2036463838552301885",
    "2036463545085280314",
    "2036463375845122514",
  ],
  lookonchain: [
    "1987715920580764046",
    "1986280942038909258",
    "1978852117134586226",
    "1978483470226862479",
    "1976934162440315177",
  ],
  DeItaone: [
    "2036428390421422259",
    "1988676733881467051",
    "1987923137929818555",
    "1987672308404641965",
    "1987503995661746428",
  ],
  coinaboratideas: [
    "1879597798754218482",
    "1879234563727233187",
    "1878872282321453497",
  ],
  Bybit_Official: [
    "2036634604636139854",
    "2036624105957392660",
    "2036473115669053525",
    "2036473113051910280",
    "2036448801355878809",
  ],
  bitaboratideas: [
    "1879597298952491253",
    "1878508564257554888",
    "1878145331454386433",
  ],
  caboratideas: [
    "1879597798754218482",
    "1879234563727233187",
    "1878872282321453497",
  ],

  // ── New analyst accounts ───────────────────────────────────────────
  CryptoCobain: [
    "1879621438312947201",
    "1879258145127804932",
    "1878895724412358691",
    "1878533432902856744",
  ],
  CryptoCapo_: [
    "1879619832204718283",
    "1879257438152236094",
    "1878894129067020582",
    "1878531827306922037",
  ],
  AltcoinGordon: [
    "1879625118101529634",
    "1879262715890417685",
    "1878900312398561842",
    "1878537995630288913",
    "1878175707266347064",
  ],
  inversebrah: [
    "1879618224637128750",
    "1879255832501739541",
    "1878893541243568193",
  ],
  MustStopMurad: [
    "1879623512454897728",
    "1879261109534642236",
    "1878898706696945693",
    "1878536389572526164",
  ],
  blknoiz06: [
    "1879620944429277314",
    "1879258552931635245",
    "1878896149937475602",
    "1878533853675483195",
  ],

  // ── New news accounts ──────────────────────────────────────────────
  Bitcoin: [
    "1977017431723032891",
    "1955296681442075037",
    "1944594765884051906",
    "1943066816097718364",
    "1936064469186347334",
  ],
  ethereum: [
    "1990086375438180497",
    "1988627667675906233",
    "1983954559887401061",
    "1983641499410784367",
    "1978497335115051056",
  ],
  solana: [
    "2036619836378538469",
    "2036619808767418676",
    "2036618874804965726",
    "2036617907334164674",
    "2036604686686429569",
  ],
  Cointelegraph: [
    "1988570451379880223",
    "1980752375422886062",
    "1977449392438149366",
    "1968465106276077687",
    "1967106067097104703",
  ],
  CoinDesk: [
    "2036556480007074179",
    "2036551348628427021",
    "2036538788537643337",
    "2036538583519986003",
    "2036520374733586856",
  ],
  TheBlock__: [
    "1879621832531234918",
    "1879259428462264389",
    "1878897031122718750",
    "1878534643647381601",
  ],

  // ── New analytics accounts ─────────────────────────────────────────
  glassnode: [
    "1879618826175938671",
    "1879256424834072642",
    "1878894021806276683",
    "1878531617855725584",
  ],
  nansen_ai: [
    "1879617236328742963",
    "1879254833171489814",
    "1878892431442640965",
    "1878530041808560206",
  ],
  SantimentFeed: [
    "1879619422408327214",
    "1879257019833414785",
    "1878894617565421686",
    "1878532215978098757",
  ],
  IntoTheBlock: [
    "1879620134374928493",
    "1879257731036487796",
    "1878895329783021687",
    "1878532928061702258",
  ],

  // ── New DeFi accounts ──────────────────────────────────────────────
  AaveAave: [
    "1879622641831501882",
    "1879260239238545483",
    "1878897839478681701",
    "1878535447271694452",
  ],
  Uniswap: [
    "1879621237393038469",
    "1879258832625238120",
    "1878896431014654071",
    "1878534044502593622",
  ],
  MakerDAO: [
    "1879620538634678324",
    "1879258137532411981",
    "1878895737033084928",
    "1878533349271678003",
  ],

  // ── New exchange accounts ──────────────────────────────────────────
  binance: [
    "2036639296380076207",
    "2036594038812422335",
    "2036548779407557048",
    "2036505286895345907",
    "2036474604093362588",
  ],
  OKX: [
    "2036626900907332067",
    "2036625583048634568",
    "2036609282385314198",
    "2036551866545295603",
    "2036525734944964714",
  ],
  coinbase: [
    "2036241227322884258",
    "2036241225636810951",
    "2036160890945388763",
    "2036160889183707639",
    "2036160887203963053",
  ],
};

// ── In-memory cache ──────────────────────────────────────────────────
type CacheEntry = {
  items: XFeedItem[];
  fetchedAt: number;
};

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let feedCache: CacheEntry | null = null;

// ── RSSHub-based timeline discovery ──────────────────────────────────
// RSSHub instances that mirror Twitter user timelines as RSS/JSON feeds.
// We try multiple instances for resilience.
const RSSHUB_INSTANCES = [
  "https://rsshub.app",
  "https://rsshub.rssforever.com",
  "https://rsshub-instance.pages.dev",
];

/**
 * Try to fetch recent tweet IDs for a user from RSSHub instances.
 * RSSHub exposes Twitter timelines at /twitter/user/:username
 * Returns up to `limit` tweet IDs, newest first.
 */
async function fetchTweetIdsFromRSSHub(
  username: string,
  limit: number = 5
): Promise<string[]> {
  try {
    return await Promise.any(
      RSSHUB_INSTANCES.map(async (instance) => {
        const url = `${instance}/twitter/user/${username}?format=json&limit=${limit}`;
        const res = await fetch(url, {
          signal: AbortSignal.timeout(8000),
          headers: {
            "User-Agent": "CryptoX/1.0",
            Accept: "application/json",
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const items: Array<{ url?: string; id?: string; link?: string }> =
          data?.items ?? data?.entries ?? [];

        const tweetIds: string[] = [];
        for (const item of items) {
          const link = item.url ?? item.link ?? item.id ?? "";
          // Extract tweet ID from URL like https://twitter.com/user/status/123456
          const match = link.match(/\/status\/(\d+)/);
          if (match?.[1]) {
            tweetIds.push(match[1]);
          }
        }

        if (tweetIds.length === 0) throw new Error("empty");
        return tweetIds.slice(0, limit);
      })
    );
  } catch {
    return [];
  }
}

// ── Twitter syndication timeline (undocumented endpoint) ─────────────
/**
 * Attempt to fetch recent tweet IDs using Twitter's syndication timeline
 * endpoint. This is the same endpoint react-tweet uses internally for
 * individual tweets, but for user timelines.
 */
async function fetchTweetIdsFromSyndication(
  username: string,
  limit: number = 5
): Promise<string[]> {
  try {
    // Twitter syndication search endpoint — search for tweets from a user
    const url = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${username}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) return [];

    const html = await res.text();
    // Extract tweet IDs from multiple patterns in the syndication HTML:
    // 1. URL pattern: /status/1234567890
    // 2. JSON entry_id pattern: "entry_id":"tweet-1234567890"
    // 3. data-tweet-id pattern: data-tweet-id="1234567890"
    const tweetIds = new Set<string>();

    const patterns = [
      /\/status\/(\d{15,22})/g,
      /"entry_id":"tweet-(\d{15,22})"/g,
      /data-tweet-id="(\d{15,22})"/g,
    ];

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(html)) !== null) {
        tweetIds.add(match[1]);
      }
    }

    // Sort descending (higher ID = newer tweet) and take limit
    return Array.from(tweetIds)
      .sort((a, b) => (BigInt(b) > BigInt(a) ? 1 : -1))
      .slice(0, limit);
  } catch {
    return [];
  }
}

// ── Nitter-based discovery ───────────────────────────────────────────
const NITTER_INSTANCES = [
  "https://nitter.privacydev.net",
  "https://nitter.poast.org",
  "https://nitter.cz",
];

async function fetchTweetIdsFromNitter(
  username: string,
  limit: number = 5
): Promise<string[]> {
  try {
    return await Promise.any(
      NITTER_INSTANCES.map(async (instance) => {
        // Nitter RSS feeds
        const url = `${instance}/${username}/rss`;
        const res = await fetch(url, {
          signal: AbortSignal.timeout(8000),
          headers: {
            "User-Agent": "CryptoX/1.0",
            Accept: "application/rss+xml, application/xml, text/xml",
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const xml = await res.text();
        // Extract tweet IDs from Nitter RSS <link> or <guid> elements
        const idPattern = /\/status\/(\d{15,22})/g;
        const tweetIds: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = idPattern.exec(xml)) !== null) {
          if (!tweetIds.includes(match[1])) {
            tweetIds.push(match[1]);
          }
        }

        if (tweetIds.length === 0) throw new Error("empty");
        return tweetIds.slice(0, limit);
      })
    );
  } catch {
    return [];
  }
}

// ── Main feed fetcher ────────────────────────────────────────────────
const DEFAULT_TWEETS_PER_ACCOUNT = 5;

/**
 * Fetch recent tweet IDs for a single account, trying multiple strategies.
 * Falls back to hardcoded IDs if all live sources fail.
 */
async function fetchAccountTweetIds(
  account: CryptoAccount,
  maxTweets: number = DEFAULT_TWEETS_PER_ACCOUNT
): Promise<string[]> {
  const { username } = account;

  // Race all strategies in parallel — first non-empty result wins
  try {
    const ids = await Promise.any([
      fetchTweetIdsFromSyndication(username, maxTweets).then(ids => ids.length > 0 ? ids : Promise.reject(new Error('empty'))),
      fetchTweetIdsFromRSSHub(username, maxTweets).then(ids => ids.length > 0 ? ids : Promise.reject(new Error('empty'))),
      fetchTweetIdsFromNitter(username, maxTweets).then(ids => ids.length > 0 ? ids : Promise.reject(new Error('empty'))),
    ]);
    console.log(`[x-feed] Got ${ids.length} tweets for @${username}`);
    return ids.slice(0, maxTweets);
  } catch {
    // All strategies failed — use fallback hardcoded tweet IDs
    const fallback = FALLBACK_TWEET_IDS[username] ?? [];
    if (fallback.length > 0) {
      console.log(`[x-feed] Fallback: using ${fallback.length} cached tweets for @${username}`);
    }
    return fallback.slice(0, maxTweets);
  }
}

/**
 * Fetch tweets for a single account by username.
 * Useful for filtering the feed to a specific account.
 */
export async function fetchAccountTweets(
  username: string,
  maxTweets: number = DEFAULT_TWEETS_PER_ACCOUNT
): Promise<XFeedItem[]> {
  const account = CRYPTO_ACCOUNTS.find((a) => a.username === username);
  if (!account) return [];

  const tweetIds = await fetchAccountTweetIds(account, maxTweets);
  return tweetIds.map((tweetId) => ({
    tweetId,
    username: account.username,
    displayName: account.displayName,
    category: account.category,
  }));
}

/**
 * Fetch the crypto X feed — tries live sources, falls back to cached IDs.
 * Results are cached in memory for 10 minutes.
 *
 * @param maxTweetsPerAccount - Maximum tweets per account to prevent one account
 *   from dominating the feed. Defaults to 5.
 */
export async function fetchCryptoFeed(
  maxTweetsPerAccount: number = DEFAULT_TWEETS_PER_ACCOUNT
): Promise<XFeedItem[]> {
  // Return cached data if still fresh
  if (feedCache && Date.now() - feedCache.fetchedAt < CACHE_TTL_MS) {
    console.log("[x-feed] Returning cached feed");
    return feedCache.items;
  }

  console.log("[x-feed] Fetching live feed...");

  // Fetch all accounts in parallel
  const accountResults = await Promise.allSettled(
    CRYPTO_ACCOUNTS.map(async (account) => {
      const tweetIds = await fetchAccountTweetIds(account, maxTweetsPerAccount);
      return { account, tweetIds };
    })
  );

  const feedItems: XFeedItem[] = [];
  let liveCount = 0;
  let fallbackCount = 0;

  for (const result of accountResults) {
    if (result.status !== "fulfilled") continue;
    const { account, tweetIds } = result.value;

    const fallback = FALLBACK_TWEET_IDS[account.username];
    const isFallback =
      fallback?.length === tweetIds.length &&
      tweetIds.every((id, i) => fallback?.[i] === id);

    if (isFallback) {
      fallbackCount++;
    } else {
      liveCount++;
    }

    for (const tweetId of tweetIds) {
      feedItems.push({
        tweetId,
        username: account.username,
        displayName: account.displayName,
        category: account.category,
      });
    }
  }

  console.log(
    `[x-feed] Feed built: ${feedItems.length} tweets (${liveCount} live accounts, ${fallbackCount} fallback accounts)`
  );

  // Sort by tweet ID descending (newest first)
  // Tweet IDs are time-ordered (Twitter snowflake IDs), so higher = newer
  feedItems.sort((a, b) => {
    const diff = BigInt(b.tweetId) - BigInt(a.tweetId);
    return diff > BigInt(0) ? 1 : diff < BigInt(0) ? -1 : 0;
  });

  // Update cache
  feedCache = {
    items: feedItems,
    fetchedAt: Date.now(),
  };

  return feedItems;
}

export function getCryptoAccounts(): CryptoAccount[] {
  return CRYPTO_ACCOUNTS;
}

export function getFeedCategories(): string[] {
  return Array.from(new Set(CRYPTO_ACCOUNTS.map((a) => a.category)));
}

/**
 * Get accounts filtered by category.
 */
export function getAccountsByCategory(category: string): CryptoAccount[] {
  return CRYPTO_ACCOUNTS.filter((a) => a.category === category);
}

/**
 * Force-clear the in-memory cache (useful for manual refresh).
 */
export function clearFeedCache(): void {
  feedCache = null;
}
