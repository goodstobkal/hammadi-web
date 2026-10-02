<script setup lang="ts">
/** Home page: the three done-for-you products (lib/products.ts). Cheap tools
 * and guides stay live as their own pages and are linked at the bottom. */
import catalog from '../catalog.json'
import type { Tool } from '../lib/api'
import ProductIcon from '../components/ProductIcon.vue'
import { PRODUCTS } from '../lib/products'
import { GUIDES_URL, SITE_NAME, SITE_URL, useSeo, KEPT_TOOLS } from '../lib/site'

const tools = (catalog.tools as Tool[]).filter((t) => KEPT_TOOLS.has(t.slug))
const from = (packs: { price: number }[]) => Math.min(...packs.map((k) => k.price))

// $1 one-off exports: Stripe Payment Links; the link is entered at checkout and
// the Excel file is emailed automatically (services.py "export").
const EXPORTS = [
  { name: 'Full comments export', desc: 'Every comment and reply on a post or reel (up to 5,000), with usernames, likes, dates and sentiment.', to: 'https://buy.stripe.com/00w5kwcN6aebgXx9cHcbC0b' },
  { name: 'Full posts export', desc: 'Every post of a profile (up to 500) with likes, comments, views, captions and links.', to: 'https://buy.stripe.com/9B6cMY7sM9a7fTtex1cbC0c' },
  { name: 'Full reels export', desc: 'Every reel of a profile (up to 500) with play counts, likes, comments and captions.', to: 'https://buy.stripe.com/00wcMYaEY5XVgXxex1cbC0d' },
  { name: 'Full likers export', desc: 'The accounts that liked a post (up to 1,000), with names and profile links.', to: 'https://buy.stripe.com/4gM00cbJ20DB7mX74zcbC0e' },
]

const FAQ: [string, string][] = [
  ['How fast do I get my report?', 'Reel analyses usually arrive within 30 minutes, profile packs within an hour, and influencer lists within 24 hours.'],
  ['Do you need my Instagram password?', 'No. We only read public data. You never connect or share an account.'],
  ['How do I pay?', 'One-time payment by card, Apple Pay or Google Pay through Stripe. No subscription.'],
  ['What if I’m not happy?', 'Reply to the delivery email and tell us what’s missing. We’ll fix it or refund you.'],
]

useSeo({
  title: `Instagram Influencer Lists, Profile & Reel Analysis - Done For You | ${SITE_NAME}`,
  description:
    'Order a targeted influencer list with emails, a full Instagram profile pack with comment sentiment, or a reel analysis with transcript and comments. One-time price, delivered to your inbox.',
  path: '/',
  jsonld: [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${SITE_NAME} services`,
      itemListElement: PRODUCTS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: `${SITE_URL}/services/${p.slug}` })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ],
})
</script>

<template>
  <div class="home">
    <section class="hero">
      <span class="eyebrow">Done for you · delivered to your inbox</span>
      <h1>Instagram research, <span class="grad">done for you.</span></h1>
      <p class="lede">
        Find the right influencers, understand any profile, and learn what viewers really think of a reel. Tell us what
        you need, pay once, and get a clear report by email.
      </p>
      <div class="ctas">
        <a class="cta" href="#services">See the services →</a>
      </div>
      <ul class="trust">
        <li>⚡ Most reports in <b>under an hour</b></li>
        <li>🔒 No Instagram login needed</li>
        <li>💳 One-time payment, <b>no subscription</b></li>
      </ul>
    </section>

    <section id="services" class="services">
      <RouterLink v-for="p in PRODUCTS" :key="p.slug" :to="`/services/${p.slug}`" class="svc">
        <ProductIcon :slug="p.slug" class="svc-icon" />
        <h2>{{ p.name }}</h2>
        <p class="svc-tag">{{ p.tagline }}</p>
        <ul><li v-for="g in p.youGet.slice(0, 4)" :key="g">{{ g }}</li></ul>
        <div class="svc-foot">
          <span class="svc-price">from <b>${{ from(p.packs) }}</b></span>
          <span class="svc-go">Details &amp; order →</span>
        </div>
        <span class="svc-time">⏱ {{ p.delivery }}</span>
      </RouterLink>
    </section>

    <section class="one">
      <div class="one-head">
        <h2>One-off exports for <span class="grad">$1</span></h2>
        <p>Need just one thing? Pay $1, paste the link at checkout, and get the complete data by email as Excel.</p>
      </div>
      <div class="one-grid">
        <a v-for="e in EXPORTS" :key="e.to" :href="e.to" class="one-card" rel="noopener">
          <span class="one-price">$1</span>
          <b>{{ e.name }}</b>
          <p>{{ e.desc }}</p>
          <span class="one-go">Buy · $1 →</span>
        </a>
      </div>
    </section>

    <section class="how">
      <h2>How it works</h2>
      <ol>
        <li><span>1</span><div><b>Pick a service</b><p>Influencer list, profile pack or reel analysis.</p></div></li>
        <li><span>2</span><div><b>Tell us what you need</b><p>A profile, a reel link, or a short description of the influencers you want.</p></div></li>
        <li><span>3</span><div><b>Get your report</b><p>A clear email report plus an Excel file you can sort and share.</p></div></li>
      </ol>
    </section>

    <section class="who">
      <h2>Who it's for</h2>
      <div class="who-grid">
        <div><b>Brands &amp; agencies</b><p>Shortlist creators with real engagement and a reachable email, then vet them before you pay.</p></div>
        <div><b>Influencers</b><p>See what your audience loves, what they ask and what turns them off, straight from your comments.</p></div>
        <div><b>Marketers</b><p>Study competitors' best posts and reels and the reactions they get.</p></div>
      </div>
    </section>

    <section class="faq">
      <h2>Questions</h2>
      <details v-for="([q, a], i) in FAQ" :key="q" :open="i === 0"><summary>{{ q }}</summary><p>{{ a }}</p></details>
    </section>

    <section class="more">
      <h2>Cheap tools &amp; guides</h2>
      <p>Want to look something up yourself first? Our cheap tools and <a :href="GUIDES_URL">guides</a> are still here.</p>
      <ul class="links">
        <li v-for="t in tools" :key="t.slug"><RouterLink :to="`/tools/${t.slug}`">{{ t.title.split(' - ')[0] }}</RouterLink></li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.hero { position: relative; text-align: center; padding: 56px 0 8px; }
.hero::before {
  content: ''; position: absolute; inset: -24px -20px auto; height: 420px; z-index: -1; pointer-events: none;
  background:
    radial-gradient(40% 60% at 25% 20%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%),
    radial-gradient(40% 60% at 80% 10%, color-mix(in srgb, #fb923c 14%, transparent), transparent 70%);
}
.eyebrow { display: inline-block; font-size: 13px; font-weight: 600; color: var(--accent); background: var(--chip); border-radius: 999px; padding: 6px 14px; margin-bottom: 18px; }
h1 { font-size: clamp(34px, 6vw, 56px); line-height: 1.06; letter-spacing: -0.03em; margin: 0 0 14px; }
.grad { background: linear-gradient(90deg, var(--accent), #fb923c); -webkit-background-clip: text; background-clip: text; color: transparent; }
.lede { font-size: 19px; color: var(--muted); max-width: 38em; margin: 0 auto 26px; }
.cta { display: inline-block; background: var(--accent); color: #fff; border-radius: 999px; padding: 14px 28px; text-decoration: none; font-weight: 700; box-shadow: 0 8px 22px color-mix(in srgb, var(--accent) 30%, transparent); }
.trust { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 26px; list-style: none; padding: 0; margin: 24px 0 0; color: var(--muted); font-size: 14.5px; }
.trust b { color: var(--fg); }

.services { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 18px; margin: 48px 0 0; }
.svc { position: relative; display: flex; flex-direction: column; padding: 26px 22px 20px; border: 1px solid var(--line); border-radius: 20px; background: var(--card); color: inherit; text-decoration: none; transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s; }
.svc:hover { transform: translateY(-4px); border-color: var(--accent); box-shadow: 0 16px 36px rgba(180, 35, 111, 0.12); }
.svc-icon { flex: none; }
.svc h2 { font-size: 22px; margin: 10px 0 6px; }
.svc-tag { margin: 0 0 12px; color: var(--muted); }
.svc ul { margin: 0 0 18px; padding-left: 18px; flex: 1; }
.svc li { margin: 0 0 6px; font-size: 14.5px; }
.svc-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.svc-price { color: var(--muted); }
.svc-price b { font-size: 26px; color: var(--fg); }
.svc-go { background: var(--accent); color: #fff; font-weight: 700; border-radius: 999px; padding: 9px 16px; font-size: 14px; }
.svc-time { margin-top: 12px; font-size: 13px; color: #16a34a; font-weight: 600; }

h2 { letter-spacing: -0.01em; }
.one { margin: 40px 0 0; padding: 26px; border-radius: 22px; border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line));
  background: linear-gradient(120deg, color-mix(in srgb, var(--accent) 8%, var(--card)), var(--card)); }
.one-head h2 { font-size: 26px; margin: 0 0 6px; }
.one-head p { margin: 0 0 18px; color: var(--muted); }
.one-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
.one-card { position: relative; display: flex; flex-direction: column; gap: 6px; padding: 18px 18px 16px; border-radius: 16px; background: var(--card);
  border: 1px solid var(--line); color: inherit; text-decoration: none; transition: transform 0.15s, border-color 0.15s; }
.one-card:hover { transform: translateY(-2px); border-color: var(--accent); }
.one-card b { font-size: 18px; padding-right: 60px; }
.one-card p { margin: 0; color: var(--muted); font-size: 14.5px; flex: 1; }
.one-price { position: absolute; top: 14px; right: 16px; font-size: 26px; font-weight: 800; color: var(--accent); }
.one-go { margin-top: 8px; align-self: flex-start; background: var(--accent); color: #fff; font-weight: 700; font-size: 14px; border-radius: 999px; padding: 8px 16px; }
.how h2, .who h2, .faq h2, .more h2 { font-size: 26px; margin: 56px 0 16px; }
.how ol { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
.how li { display: flex; gap: 14px; background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 18px; }
.how span { flex: none; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--accent); color: #fff; font-weight: 800; }
.how p, .who p { margin: 4px 0 0; color: var(--muted); font-size: 14.5px; }
.who-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
.who-grid > div { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 18px; }
.faq details { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 14px 18px; margin: 0 0 10px; }
.faq summary { cursor: pointer; font-weight: 700; }
.faq p { color: var(--muted); margin: 10px 0 2px; }
.more p { color: var(--muted); }
.more a { color: var(--accent); }
.links { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; padding: 0; margin: 14px 0 24px; }
.links a { display: inline-block; border: 1px solid var(--line); background: var(--card); border-radius: 999px; padding: 6px 12px; font-size: 14px; text-decoration: none; color: var(--fg); }
.links a:hover { border-color: var(--accent); color: var(--accent); }
@media (max-width: 760px) { .hero { padding: 28px 0 4px; } .lede { font-size: 17px; } .cta { width: 100%; text-align: center; } }
</style>
