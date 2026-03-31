import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://futuresai.co'

  // Pages with their priorities and change frequencies
  const pages: Array<{
    path: string
    priority: number
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  }> = [
    { path: 'quant',       priority: 0.9, changeFrequency: 'hourly' },
    { path: 'signals',     priority: 0.9, changeFrequency: 'hourly' },
    { path: 'news',        priority: 0.9, changeFrequency: 'hourly' },
    { path: 'sns',         priority: 0.8, changeFrequency: 'hourly' },
    { path: 'charts',      priority: 0.8, changeFrequency: 'daily' },
    { path: 'whales',      priority: 0.8, changeFrequency: 'daily' },
    { path: 'markets',     priority: 0.8, changeFrequency: 'daily' },
    { path: 'dashboard',   priority: 0.8, changeFrequency: 'daily' },
    { path: 'calculator',  priority: 0.7, changeFrequency: 'weekly' },
    { path: 'chart-ideas', priority: 0.7, changeFrequency: 'daily' },
    { path: 'insights',    priority: 0.7, changeFrequency: 'daily' },
    { path: 'payback',     priority: 0.7, changeFrequency: 'weekly' },
    { path: 'exchanges',   priority: 0.6, changeFrequency: 'weekly' },
    { path: 'team',        priority: 0.5, changeFrequency: 'monthly' },
    { path: 'services',    priority: 0.5, changeFrequency: 'monthly' },
    { path: 'login',       priority: 0.4, changeFrequency: 'monthly' },
    { path: 'signup',      priority: 0.4, changeFrequency: 'monthly' },
  ]

  const routes: MetadataRoute.Sitemap = []

  // Root URL
  routes.push({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  })

  // Language root pages
  for (const lang of ['en', 'ko']) {
    routes.push({
      url: `${baseUrl}/${lang}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    })

    // Add each page for each language
    for (const page of pages) {
      routes.push({
        url: `${baseUrl}/${lang}/${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      })
    }
  }

  return routes
}
