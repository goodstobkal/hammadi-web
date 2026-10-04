/**
 * The extension catalog. Each extension gets its own page at /extensions/<slug>.
 * `status: 'live'` links to the Chrome Web Store; `status: 'soon'` shows a
 * waitlist form so we can gauge demand before building/publishing it.
 */
export type Extension = {
  slug: string
  emoji: string
  name: string
  short: string
  tagline: string
  bullets: string[]
  status: 'live' | 'soon'
  storeUrl?: string
}

export const EXTENSIONS: Extension[] = [
  {
    slug: 'instagram-youtube-comment-exporter',
    emoji: '💬',
    name: 'Comment Exporter for Instagram & YouTube',
    short: 'Export comments, posts, followers & reels to CSV — in your own tab.',
    tagline:
      'Export comments, posts, followers, likers and reels — and download reels and whole profiles — straight to CSV, all in your own browser tab.',
    bullets: [
      'Every comment & reply of a post or reel',
      'Followers, following, likers, suggested accounts',
      'Download reels / whole profiles (stories, highlights)',
      'Hashtag top posts, creator score, giveaway picker',
      'AI replies with your own OpenAI / Claude key',
    ],
    status: 'live',
    storeUrl:
      'https://chromewebstore.google.com/detail/instagram-comment-post-ex/ejjfocklfpidcfenanddaedohidmmjba',
  },
  {
    slug: 'google-maps-lead-scraper',
    emoji: '📍',
    name: 'Lead Scraper for Google Maps',
    short: 'Turn any Maps search into a lead list — name, phone, website — to CSV.',
    tagline:
      'Turn any Google Maps search into a lead list — name, phone, website, rating, address — exported to CSV. Scan a whole city.',
    bullets: [
      'Name, rating, reviews, category, address, phone, website',
      'City-wide scan across many areas',
      'Table view + one-click CSV export',
      'Runs in your own tab — public business data',
    ],
    status: 'soon',
  },
  {
    slug: 'etsy-reply-assistant',
    emoji: '✉️',
    name: 'Reply Assistant for Etsy Sellers',
    short: 'AI reply suggestions on your Etsy messages — you press send.',
    tagline:
      'AI reply suggestions on your Etsy messages. Draft warm, on-brand replies with your own OpenAI / Claude key — you always press send.',
    bullets: [
      '“✨ Suggest reply” on Etsy Messages',
      'Saved quick-reply chips',
      'Your own API key — private to you',
      'You always press send (safe)',
    ],
    status: 'soon',
  },
]

export function getExtension(slug: string): Extension | undefined {
  return EXTENSIONS.find((e) => e.slug === slug)
}
