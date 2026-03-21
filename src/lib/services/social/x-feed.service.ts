// X/Twitter feed service
// Uses hardcoded tweet IDs as primary source (syndication endpoint is unreliable)

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
  { username: "elaboratideas", displayName: "Elaborate Ideas", category: "analyst" },
  { username: "WatcherGuru", displayName: "Watcher Guru", category: "news" },
  { username: "whale_alert", displayName: "Whale Alert", category: "whales" },
  { username: "CryptoQuant_com", displayName: "CryptoQuant", category: "analytics" },
  { username: "lookonchain", displayName: "Lookonchain", category: "onchain" },
  { username: "DeItaone", displayName: "Walter Bloomberg", category: "news" },
  { username: "coinaboratideas", displayName: "Coin Ideas", category: "analyst" },
  { username: "Bybit_Official", displayName: "Bybit", category: "exchange" },
  { username: "bitaboratideas", displayName: "Bit Ideas", category: "analyst" },
  { username: "caboratideas", displayName: "C Ideas", category: "analyst" },
];

const TWEET_IDS: Record<string, string[]> = {
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
};

/**
 * Fetch the crypto X feed — uses hardcoded tweet IDs (instant, no network calls).
 */
export async function fetchCryptoFeed(): Promise<XFeedItem[]> {
  const feedItems: XFeedItem[] = [];

  for (const account of CRYPTO_ACCOUNTS) {
    const tweetIds = TWEET_IDS[account.username] ?? [];
    for (const tweetId of tweetIds) {
      feedItems.push({
        tweetId,
        username: account.username,
        displayName: account.displayName,
        category: account.category,
      });
    }
  }

  // Shuffle for variety
  return feedItems.sort(() => Math.random() - 0.5);
}

export function getCryptoAccounts(): CryptoAccount[] {
  return CRYPTO_ACCOUNTS;
}

export function getFeedCategories(): string[] {
  return Array.from(new Set(CRYPTO_ACCOUNTS.map((a) => a.category)));
}
