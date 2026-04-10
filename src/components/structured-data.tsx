const BASE_URL = 'https://futuresai.io'

export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Futures AI',
    description: 'AI-Powered Crypto Trading Intelligence Platform — real-time signals, whale tracking, market analytics, and trading rebates.',
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/images/futures-ai-logo.png`,
      width: 512,
      height: 512,
    },
    sameAs: [
      'https://www.youtube.com/@TetherBase',
      'https://t.me/FuturesAIOfficial',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'admin@futuresai.io',
      contactType: 'customer support',
      availableLanguage: ['English', 'Korean'],
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function WebsiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Futures AI',
    url: BASE_URL,
    description: 'AI-Powered Crypto Trading Intelligence — signals, charts, whale tracking, news, and market analytics.',
    inLanguage: ['en', 'ko'],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/en/news?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function SoftwareApplicationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Futures AI',
    url: BASE_URL,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description: 'Free AI-powered crypto trading platform with real-time signals, quant analysis, whale tracking, and chart analysis for Bitcoin, Ethereum, Solana and 10+ coins.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
      bestRating: '5',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function FAQJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Futures AI?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Futures AI is a free AI-powered crypto trading intelligence platform that provides real-time trading signals, whale tracking, chart analysis, RSI/MACD indicators, and market analytics for Bitcoin, Ethereum, Solana, and other major cryptocurrencies.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does Futures AI generate trading signals?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Futures AI uses quantitative analysis combining RSI, MACD, price action, volume profile, and order book data from Binance to generate LONG/SHORT/NEUTRAL signals with confidence scores for 10 major cryptocurrencies updated every 60 seconds.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Futures AI free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, Futures AI offers free access to AI trading signals, market data, whale tracking, crypto news, and community features. Premium chart analysis is available for subscribers.',
        },
      },
      {
        '@type': 'Question',
        name: 'What cryptocurrencies does Futures AI support?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Futures AI currently tracks Bitcoin (BTC), Ethereum (ETH), Solana (SOL), XRP, BNB, Dogecoin (DOGE), Cardano (ADA), Avalanche (AVAX), Polkadot (DOT), and Chainlink (LINK) with real-time signals and analysis.',
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
