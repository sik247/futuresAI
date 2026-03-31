const BASE_URL = 'https://futuresai.co'

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
      email: 'support@futuresai.co',
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
