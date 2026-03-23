import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://futuresai.com'
  const pages = [
    'dashboard', 'charts', 'signals', 'markets', 'whales',
    'sns', 'news', 'calculator', 'chart-ideas', 'payback',
    'login', 'signup', 'exchanges', 'insights', 'team'
  ]

  const routes: MetadataRoute.Sitemap = []

  // Add root
  routes.push({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  })

  // Add language variants
  for (const lang of ['en', 'ko']) {
    routes.push({
      url: `${baseUrl}/${lang}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    })
    for (const page of pages) {
      routes.push({
        url: `${baseUrl}/${lang}/${page}`,
        lastModified: new Date(),
        changeFrequency: page === 'news' || page === 'signals' ? 'hourly' : 'daily',
        priority: ['dashboard', 'signals', 'charts'].includes(page) ? 0.8 : 0.7,
      })
    }
  }

  return routes
}
