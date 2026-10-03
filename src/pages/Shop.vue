<script setup lang="ts">
/** Digital products store: our own Instagram products (templates, hooks,
 * hashtag packs, outreach scripts). Pay by card, files emailed instantly. */
import { onMounted, ref } from 'vue'
import { API_BASE, SITE_NAME, SITE_URL, breadcrumbs, useSeo } from '../lib/site'

type Product = { pack: string; name: string; price: number; files: string[]; count: number }

// Static copy keyed by pack (the price/name come live from the API, so they
// never drift from the backend). Emoji + blurb make the cards scannable.
const META: Record<string, { emoji: string; blurb: string; bullets: string[] }> = {
  dp_toolkit: {
    emoji: '🧰',
    blurb: 'Everything below in one pack — the fastest way to plan a month of Instagram.',
    bullets: ['30-day content calendar', '300 reels hooks', 'Hashtag packs (6 niches)', 'Outreach templates'],
  },
  dp_calendar: {
    emoji: '🗓️',
    blurb: 'A 30-day plan with content pillars, formats, hooks, CTAs and best posting times. Ready to fill in.',
    bullets: ['CSV — opens in Excel & Google Sheets', '30 days mapped out', 'Pillars, formats, hooks & CTAs'],
  },
  dp_hooks: {
    emoji: '🪝',
    blurb: '300 proven reel hooks across 5 styles. Say one in the first 2 seconds to stop the scroll.',
    bullets: ['Curiosity, list, story, bold, save-worthy', 'Swap in your niche', 'Plain text, use anywhere'],
  },
  dp_hashtags: {
    emoji: '#️⃣',
    blurb: 'Copy-paste hashtag sets for 6 niches (beauty, fitness, food, travel, fashion, small business).',
    bullets: ['30 tags per niche', 'Mixed sizes for reach', 'CSV, ready to paste'],
  },
  dp_outreach: {
    emoji: '✉️',
    blurb: 'Email + DM scripts to land brand/creator collabs, including follow-ups and a rate request.',
    bullets: ['First-touch + follow-up emails', 'Warm DM scripts', 'Rate/brief request'],
  },
}

const products = ref<Product[]>([])
const loading = ref(true)
const busy = ref('')

async function load() {
  try {
    const r = await fetch(`${API_BASE}/public/v1/digital-products`)
    const d = await r.json()
    // Toolkit first, then by price.
    products.value = (d.products || []).sort((a: Product, b: Product) =>
      (a.pack === 'dp_toolkit' ? -1 : b.pack === 'dp_toolkit' ? 1 : a.price - b.price))
  } catch {
    products.value = []
  } finally {
    loading.value = false
  }
}

async function buy(pack: string) {
  busy.value = pack
  try {
    const r = await fetch(`${API_BASE}/public/v1/digital-order`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pack }),
    })
    const d = await r.json()
    if (d.url) window.location.href = d.url
    else busy.value = ''
  } catch {
    busy.value = ''
  }
}

const meta = (p: string) => META[p] || { emoji: '📦', blurb: '', bullets: [] }

onMounted(load)

useSeo({
  title: `Instagram Templates & Digital Products | ${SITE_NAME}`,
  description:
    'Instagram digital products: a 30-day content calendar, 300 reels hooks, hashtag packs and influencer outreach templates. Instant download, pay by card.',
  path: '/shop',
  jsonld: [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Instagram Creator Toolkit',
      description: '30-day content calendar, 300 reels hooks, hashtag packs and influencer outreach templates.',
      image: `${SITE_URL}/logo.png`,
      brand: { '@type': 'Brand', name: SITE_NAME },
      url: `${SITE_URL}/shop`,
      offers: { '@type': 'Offer', price: '9', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    },
    breadcrumbs([{ name: 'Shop', path: '/shop' }]),
  ],
})
</script>

<template>
  <main class="wrap">
    <nav class="crumbs"><RouterLink to="/home">Home</RouterLink> · <span>Shop</span></nav>
    <h1>Instagram templates &amp; digital products</h1>
    <p class="lede">Done-for-you templates to plan, post and grow on Instagram. Pay by card, and the files are
      <b>emailed to you instantly</b> — yours to keep.</p>

    <p v-if="loading" class="muted">Loading products…</p>

    <div v-else class="grid">
      <article v-for="p in products" :key="p.pack" class="card" :class="{ feat: p.pack === 'dp_toolkit' }">
        <div class="emoji">{{ meta(p.pack).emoji }}</div>
        <h2>{{ p.name }}</h2>
        <p class="blurb">{{ meta(p.pack).blurb }}</p>
        <ul>
          <li v-for="b in meta(p.pack).bullets" :key="b">{{ b }}</li>
        </ul>
        <div class="foot">
          <span class="price">${{ p.price % 1 ? p.price.toFixed(2) : p.price }}</span>
          <button :disabled="busy === p.pack" @click="buy(p.pack)">
            {{ busy === p.pack ? 'Opening…' : 'Buy &amp; download →' }}
          </button>
        </div>
        <span v-if="p.pack === 'dp_toolkit'" class="badge">Best value</span>
      </article>
    </div>

    <p class="note">🔒 Secure checkout by Stripe · Instant email delivery · These are our own products, made to use freely.</p>
  </main>
</template>

<style scoped>
.wrap { max-width: 1000px; margin: 0 auto; padding: 28px 16px 60px; }
.crumbs { color: var(--muted); font-size: 13px; margin: 0 0 10px; }
.crumbs a { color: var(--muted); }
h1 { font-size: clamp(26px, 4vw, 38px); margin: 0 0 8px; }
.lede { color: var(--muted); font-size: 16px; max-width: 640px; margin: 0 0 24px; }
.muted { color: var(--muted); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.card { position: relative; border: 1px solid var(--line); border-radius: 18px; padding: 20px; background: var(--card); display: flex; flex-direction: column; }
.card.feat { border: 2px solid var(--accent); background: linear-gradient(140deg, color-mix(in srgb, var(--accent) 8%, var(--card)), var(--card)); }
.emoji { font-size: 32px; }
.card h2 { font-size: 18px; margin: 10px 0 6px; }
.blurb { color: var(--muted); font-size: 14px; margin: 0 0 12px; }
.card ul { margin: 0 0 16px; padding-left: 18px; font-size: 13.5px; color: var(--fg); }
.card ul li { margin: 3px 0; }
.foot { margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.price { font-size: 24px; font-weight: 800; }
.foot button { border: 0; border-radius: 999px; padding: 11px 18px; font-weight: 700; font-size: 14.5px; color: #fff; cursor: pointer;
  background: linear-gradient(135deg, #f58529, #dd2a7b 60%, #8134af); }
.foot button:disabled { opacity: 0.6; cursor: progress; }
.badge { position: absolute; top: -10px; right: 14px; background: var(--accent); color: #fff; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
.note { margin: 24px 0 0; color: var(--muted); font-size: 13.5px; text-align: center; }
</style>
