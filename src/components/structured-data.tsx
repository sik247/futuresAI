export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Futures AI',
    description: 'AI-Powered Crypto Trading Intelligence Platform',
    url: 'https://futuresai.com',
    logo: 'https://futuresai.com/images/futures-ai-logo.png',
    sameAs: [
      'https://www.youtube.com/@TetherBase',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@futuresai.com',
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
    url: 'https://futuresai.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://futuresai.com/en/news?q={search_term_string}',
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
