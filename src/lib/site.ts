/** Site-wide constants and the SEO helpers every page uses. */
import { useHead } from '@unhead/vue'

export const SITE_NAME = 'Hammadi.dev'
export const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://hammadi.dev'

/**
 * Waitlist delivery. The site is static (no backend), so signups POST to a
 * form service. Using Web3Forms: create a free access key at https://web3forms.com
 * (just enter the email you want signups sent to) and paste it below.
 * Until `accessKey` is set, the form confirms to the visitor but nothing is
 * delivered, so set it before relying on collected emails.
 */
export const WAITLIST = {
  endpoint: 'https://api.web3forms.com/submit',
  accessKey: '', // TODO: paste Web3Forms access key
}

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

