/** Site-wide constants and the SEO helpers every page uses. */
import { useHead } from '@unhead/vue'

export const SITE_NAME = 'Hammadi.dev'
export const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://hammadi.dev'
/** Empty in production: Caddy proxies /public/v1/* on this domain to the API,
 * so calls are same-origin. Dev sets it to the absolute API URL (.env.development). */
export const API_BASE = import.meta.env.VITE_API_BASE ?? ''
export const LISTING_URL =
  'https://rapidapi.com/goodstobkal-goodstobkal-default/api/instagram-scraper57'
/** Guides are rendered by the API and proxied onto this domain at /spotlights. */
export const GUIDES_URL = '/spotlights'

type Meta = {
  title: string
  description: string
  path: string
  jsonld?: Record<string, unknown>[]
}

/** Title, description, canonical, Open Graph and JSON-LD in one call. */
export function useSeo({ title, description, path, jsonld = [] }: Meta) {
  const url = `${SITE_URL}${path}`
  useHead({
    title,
    link: [{ rel: 'canonical', href: url }],
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SITE_NAME },
      { name: 'twitter:card', content: 'summary' },
    ],
    script: jsonld.map((block) => ({
      type: 'application/ld+json',
      innerHTML: JSON.stringify(block),
    })),
  })
}

export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}
