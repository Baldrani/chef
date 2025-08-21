import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://chef-app.vercel.app'
  const lastModified = new Date()

  const routes = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/en`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 1,
      alternates: {
        languages: {
          'en': `${baseUrl}/en`,
          'fr': `${baseUrl}/fr`,
        },
      },
    },
    {
      url: `${baseUrl}/fr`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 1,
      alternates: {
        languages: {
          'en': `${baseUrl}/en`,
          'fr': `${baseUrl}/fr`,
        },
      },
    },
    {
      url: `${baseUrl}/en/trips`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/fr/trips`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]

  return routes
}