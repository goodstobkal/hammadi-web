<script setup lang="ts">
/** Static landing page: showcases our Chrome extensions and links to the Web
 * Store. No backend — everything the tools do runs in the user's own browser. */
import { SITE_NAME, SITE_URL, useSeo } from '../lib/site'

const EXTS = [
  {
    emoji: '💬',
    name: 'Comment Exporter for Instagram & YouTube',
    tagline: 'Export comments, posts, followers, likers, reels — and download reels & whole profiles — straight to CSV, in your own tab.',
    bullets: ['Every comment & reply of a post or reel', 'Followers, following, likers, suggested accounts', 'Download reels / whole profiles (stories, highlights)', 'Hashtag top posts, creator score, giveaway picker', 'AI replies with your own OpenAI/Claude key'],
    url: 'https://chromewebstore.google.com/detail/instagram-comment-post-ex/ejjfocklfpidcfenanddaedohidmmjba',
    cta: 'Add to Chrome — free',
    live: true,
  },
  {
    emoji: '📍',
    name: 'Lead Scraper for Google Maps',
    tagline: 'Turn any Google Maps search into a lead list — name, phone, website, rating, address — exported to CSV. Scan a whole city.',
    bullets: ['Name, rating, reviews, category, address, phone, website', 'City-wide scan across many areas', 'Table view + one-click CSV export', 'Runs in your own tab — public business data'],
    url: 'https://github.com/abdel-ml/maps-lead-scraper',
    cta: 'Coming soon · view on GitHub',
    live: false,
  },
  {
    emoji: '✉️',
    name: 'Reply Assistant for Etsy Sellers',
    tagline: 'AI reply suggestions on your Etsy messages. Draft warm, on-brand replies with your own OpenAI/Claude key — you press send.',
    bullets: ['“✨ Suggest reply” on Etsy Messages', 'Saved quick-reply chips', 'Your own API key — private to you', 'You always press send (safe)'],
    url: 'https://github.com/abdel-ml/etsy-reply-assistant',
    cta: 'Coming soon · view on GitHub',
    live: false,
  },
]

useSeo({
  title: `${SITE_NAME} — Free Chrome Extensions for Instagram, Google Maps & Etsy`,
  description: 'Free browser extensions that run in your own tab: export Instagram & YouTube comments, scrape Google Maps business leads, and draft Etsy replies with AI. No account, no server.',
  path: '/',
  jsonld: [
    { '@context': 'https://schema.org', '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  ],
})
</script>

<template>
  <main class="wrap">
    <section class="hero">
      <h1>Browser extensions that do the work <span>in your own tab</span></h1>
      <p class="lede">Free Chrome tools for creators, marketers and sellers. No account, no subscription, no server —
        your data never leaves your browser.</p>
    </section>

    <section class="grid">
      <article v-for="e in EXTS" :key="e.name" class="card">
        <div class="emoji">{{ e.emoji }}</div>
        <h2>{{ e.name }}</h2>
        <p class="tag">{{ e.tagline }}</p>
        <ul>
          <li v-for="b in e.bullets" :key="b">{{ b }}</li>
        </ul>
        <a class="cta" :class="{ soon: !e.live }" :href="e.url" target="_blank" rel="noopener">{{ e.cta }} →</a>
      </article>
    </section>

    <section class="why">
      <h2>Why these tools</h2>
      <div class="whys">
        <div><b>🔒 Private</b><span>Everything runs in your own browser. We don't see or store your data.</span></div>
        <div><b>⚡ Instant</b><span>One click, results in your tab, export to CSV/Excel.</span></div>
        <div><b>🆓 Free</b><span>No login, no payment. Install and go.</span></div>
      </div>
    </section>

    <p class="foot">© {{ new Date().getFullYear() }} {{ SITE_NAME }} · <RouterLink to="/privacy">Privacy</RouterLink></p>
  </main>
</template>

<style scoped>
.wrap { max-width: 1000px; margin: 0 auto; padding: 32px 18px 64px; }
.hero { text-align: center; padding: 20px 0 10px; }
.hero h1 { font-size: clamp(30px, 5vw, 46px); line-height: 1.1; margin: 0 0 12px; }
.hero h1 span { background: linear-gradient(90deg, #f58529, #dd2a7b 55%, #8134af); -webkit-background-clip: text; background-clip: text; color: transparent; }
.lede { color: var(--muted, #6b5260); font-size: 18px; max-width: 620px; margin: 0 auto; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; margin: 30px 0; }
.card { border: 1px solid var(--line, #eadfe6); border-radius: 20px; padding: 22px; background: var(--card, #fff); display: flex; flex-direction: column; }
.emoji { font-size: 34px; }
.card h2 { font-size: 19px; margin: 10px 0 6px; }
.tag { color: var(--muted, #6b5260); font-size: 14.5px; margin: 0 0 12px; }
.card ul { margin: 0 0 18px; padding-left: 18px; font-size: 13.5px; line-height: 1.6; }
.cta { margin-top: auto; text-align: center; background: linear-gradient(135deg, #f58529, #dd2a7b 60%, #8134af); color: #fff; text-decoration: none; font-weight: 800; padding: 12px 18px; border-radius: 999px; }
.cta.soon { background: #eee; color: #555; }
.why { margin: 40px 0 0; }
.why h2 { text-align: center; font-size: 22px; }
.whys { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-top: 14px; }
.whys div { border: 1px solid var(--line, #eadfe6); border-radius: 14px; padding: 16px; }
.whys b { display: block; margin-bottom: 4px; }
.whys span { color: var(--muted, #6b5260); font-size: 14px; }
.foot { text-align: center; color: var(--muted, #9a7f90); font-size: 13px; margin-top: 40px; }
.foot a { color: inherit; }
</style>
