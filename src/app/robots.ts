import { MetadataRoute } from 'next'

const AI_TRAINING_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'CCBot',
  'anthropic-ai',
  'Claude-Web',
  'ClaudeBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Bytespider',
  'Amazonbot',
  'FacebookBot',
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  'cohere-ai',
  'cohere-training-data-crawler',
  'DataForSeoBot',
  'Diffbot',
  'ImagesiftBot',
  'Omgilibot',
  'Applebot-Extended',
  'YouBot',
  'AwarioRssBot',
  'AwarioSmartBot',
  'magpie-crawler',
  'TimpiBot',
  'PetalBot',
  'Scrapy',
]

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://futuresai.io'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/me/',
          '/admin/',
          '/admin-login/',
          '/dashboard/admin/',
          '/dashboard/content-bot/',
          '/ko/chat',
          '/en/chat',
          '/ko/charts',
          '/en/charts',
          '/ko/whales',
          '/en/whales',
          '/ko/chart-ideas',
          '/en/chart-ideas',
        ],
      },
      ...AI_TRAINING_CRAWLERS.map((userAgent) => ({
        userAgent,
        disallow: '/',
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
