import type { MetadataRoute } from 'next';
import { getAllIdentities } from '@/lib/db';

const BASE_URL = 'https://redd.love';

// Static pages that are always present
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/explore`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/register`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/platforms`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  },
  {
    url: `${BASE_URL}/verify`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  },
  {
    url: `${BASE_URL}/staking`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  },
  {
    url: `${BASE_URL}/roadmap`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  },
  {
    url: `${BASE_URL}/bridge`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  {
    url: `${BASE_URL}/reserve`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  },
  {
    url: `${BASE_URL}/privacy`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    url: `${BASE_URL}/terms`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Dynamic: one entry per registered handle
  let handleRoutes: MetadataRoute.Sitemap = [];

  try {
    const identities = getAllIdentities();
    handleRoutes = identities
      .filter((id) => !id.revokedAt)
      .map((id) => ({
        url: `${BASE_URL}/@${id.handle}`,
        lastModified: id.updatedAt ? new Date(id.updatedAt) : new Date(id.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
  } catch {
    // Data layer not available at build time — static pages only
  }

  return [...STATIC_ROUTES, ...handleRoutes];
}
