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
    "1879616153129316831",
    "1879609093713162620",
    "1879600019999404357",
    "1879582665534116078",
    "1879568447070027787",
  ],
  whale_alert: [
    "1879610236690424050",
    "1879595001178427406",
    "1879580246918332805",
    "1879565504866525543",
    "1879550764828508281",
  ],
  CryptoQuant_com: [
    "1879532889384329479",
    "1879170596893376823",
    "1878808236398575706",
    "1878445948839678314",
    "1878083661331619862",
  ],
  lookonchain: [
    "1879611836968444084",
    "1879599133432926249",
    "1879478261330604224",
    "1879416966254317978",
    "1879061652539633785",
  ],
  DeItaone: [
    "1879614437428834753",
    "1879613816457924697",
    "1879612821401284780",
    "1879611206325629087",
    "1879609846490014038",
  ],
  coinaboratideas: [
    "1879597798754218482",
    "1879234563727233187",
    "1878872282321453497",
  ],
  Bybit_Official: [
    "1879568100285190295",
    "1879206071716880673",
    "1878843447857463335",
    "1878481111682584854",
    "1878118823561957852",
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
    "1879617452499230762",
    "1879255044736217143",
    "1878892651803578494",
    "1878530264756785225",
  ],
  ethereum: [
    "1879616831933652013",
    "1879254428848723004",
    "1878892037933809755",
    "1878529647594258476",
  ],
  solana: [
    "1879615219894861934",
    "1879252815824670765",
    "1878890424548597806",
    "1878528033991163927",
  ],
  Cointelegraph: [
    "1879624618652278849",
    "1879262215506231386",
    "1878899817537658957",
    "1878537429352923208",
    "1878175041433202715",
  ],
  CoinDesk: [
    "1879623014813454477",
    "1879260612292050028",
    "1878898214910771279",
    "1878535826671550530",
    "1878173438764384266",
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
    "1879624218826137690",
    "1879261816509661241",
    "1878899419066081352",
    "1878537031015784509",
    "1878174643049189460",
  ],
  OKX: [
    "1879622031539154963",
    "1879259628983336014",
    "1878897228817506401",
    "1878534842439421012",
  ],
  coinbase: [
    "1879623818026668144",
    "1879261416310437892",
    "1878899019722311753",
    "1878536631030136865",
    "1878174242946232361",
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
          "Mozilla/5.0 (compatible; CryptoX/1.0; +https://cryptox.app)",
        Accept: "text/html",
      },
    });

    if (!res.ok) return [];

    const html = await res.text();
    // The syndication timeline page embeds tweet IDs in data attributes
    // and in links like /username/status/ID
    const idPattern = /\/status\/(\d{15,22})/g;
    const tweetIds = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = idPattern.exec(html)) !== null) {
      tweetIds.add(match[1]);
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
  "https://nitter.woodland.cafe",
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
