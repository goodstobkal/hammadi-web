<script setup lang="ts">
/** Bundle: up to 5 exports (comments / posts / reels / likers) for $4, one checkout. */
import { computed, onMounted, reactive, ref } from 'vue'
import { API_BASE, SITE_NAME, SITE_URL, breadcrumbs, useSeo } from '../lib/site'

type Kind = 'comments' | 'posts' | 'reels' | 'likers'
const KINDS: { v: Kind; label: string; ph: string }[] = [
  { v: 'comments', label: 'Every comment of a post', ph: 'https://www.instagram.com/reel/…' },
  { v: 'posts', label: 'Every post of a profile', ph: '@username or profile link' },
  { v: 'reels', label: 'Every reel of a profile', ph: '@username or profile link' },
  { v: 'likers', label: 'Who liked a post', ph: 'https://www.instagram.com/p/…' },
]
const rows = reactive(Array.from({ length: 5 }, () => ({ type: 'comments' as Kind, link: '' })))
const filled = computed(() => rows.filter((r) => r.link.trim()).length)
const busy = ref(false)
const err = ref('')
const paid = ref(false)
const ph = (k: Kind) => KINDS.find((x) => x.v === k)!.ph

const path = '/services/bundle'
useSeo({
  title: `5 Instagram Exports for $4 - Comments, Posts, Reels, Likers | ${SITE_NAME}`,
  description: 'Bundle up to 5 Instagram exports (every comment, post, reel or liker) for $4. One payment, each Excel file emailed to you.',
  path,
  jsonld: [
    { '@context': 'https://schema.org', '@type': 'Product', name: '5 Instagram exports bundle', image: `${SITE_URL}/logo.png`, brand: { '@type': 'Brand', name: SITE_NAME },
      url: `${SITE_URL}${path}`, offers: { '@type': 'Offer', price: '4', priceCurrency: 'USD', availability: 'https://schema.org/InStock' } },
    breadcrumbs([{ name: 'Services', path: '/' }, { name: '5 exports for $4', path }]),
  ],
})

async function pay() {
  if (!filled.value) return
  busy.value = true
  err.value = ''
  try {
    const r = await fetch(`${API_BASE}/public/v1/bundle-order`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: rows.filter((x) => x.link.trim()).map((x) => ({ type: x.type, link: x.link.trim() })) }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok || !d.url) throw new Error(d?.detail?.error || (typeof d?.detail === 'string' ? d.detail : '') || 'Check your links and try again.')
    window.location.href = d.url
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e)
    busy.value = false
  }
}
onMounted(() => { paid.value = new URLSearchParams(window.location.search).get('paid') === '1' })
</script>

<template>
  <article class="bd">
    <p class="crumb"><RouterLink to="/">Services</RouterLink> · Bundle</p>
    <div v-if="paid" class="paid"><b>✅ Payment received.</b> Each export is emailed to you as its own Excel file, usually within minutes.</div>
    <h1>5 Instagram exports for <span class="grad">$4</span></h1>
    <p class="lede">Mix and match: every comment of a post, every post or reel of a profile, or who liked a post. One payment, each result emailed as Excel.</p>

    <div class="box">
      <div v-for="(r, i) in rows" :key="i" class="row" :style="{ animationDelay: i * 0.06 + 's' }">
        <span class="n">{{ i + 1 }}</span>
        <select v-model="r.type" :aria-label="`Export ${i + 1} type`">
          <option v-for="k in KINDS" :key="k.v" :value="k.v">{{ k.label }}</option>
        </select>
        <input v-model="r.link" type="text" :placeholder="ph(r.type)" :aria-label="`Export ${i + 1} link`" autocomplete="off" />
      </div>
      <div class="go">
        <button type="button" class="pay" :disabled="!filled || busy" @click="pay">
          {{ busy ? 'Opening checkout…' : `Get ${filled || 5} export${filled === 1 ? '' : 's'} · $4 →` }}
        </button>
        <span class="save">{{ filled > 4 ? 'You save $1 vs. 5 × $1' : 'Fill up to 5 - same $4' }}</span>
      </div>
      <p v-if="err" class="err">{{ err }}</p>
      <p class="secure">🔒 Secure checkout by Stripe · No account needed · Full refund if we can't deliver</p>
    </div>

    <h2>What each export contains</h2>
    <ul class="what">
      <li><b>Comments</b> - every comment and reply (up to 5,000) with username, likes, date and sentiment.</li>
      <li><b>Posts</b> - every post of the profile (up to 500) with likes, comments, views, caption and link.</li>
      <li><b>Reels</b> - every reel (up to 500) with play counts, likes, comments and caption.</li>
      <li><b>Likers</b> - the accounts that liked a post (up to 1,000) with names and profile links.</li>
    </ul>
    <p class="one">Only need one? Each export is <RouterLink to="/tools/export-instagram-comments">$1 on its own</RouterLink>.</p>
  </article>
</template>

<style scoped>
.crumb { font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); margin: 0 0 10px; }
.crumb a { color: inherit; }
h1 { font-size: clamp(28px, 4.5vw, 38px); line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 12px; }
.grad { background: linear-gradient(135deg, #f58529, #dd2a7b 55%, #8134af); -webkit-background-clip: text; background-clip: text; color: transparent; }
.lede { font-size: 18px; color: var(--muted); margin: 0; }
h2 { font-size: 21px; margin: 40px 0 10px; }
.paid { margin: 0 0 18px; padding: 14px 18px; border-radius: 14px; background: color-mix(in srgb, #16a34a 12%, var(--card)); border: 1px solid #16a34a; }
.box { margin: 22px 0 0; padding: 20px; border-radius: 20px; border: 2px solid var(--accent); animation: rise 0.6s ease-out both;
  background: linear-gradient(120deg, color-mix(in srgb, var(--accent) 8%, var(--card)), var(--card)); }
.row { display: grid; grid-template-columns: 28px minmax(0, 220px) minmax(0, 1fr); gap: 8px; align-items: center; margin-bottom: 10px; animation: rowin 0.4s ease-out both; }
.n { width: 26px; height: 26px; border-radius: 50%; background: var(--accent); color: #fff; font-weight: 800; font-size: 13px; display: grid; place-items: center; }
select, input { font: inherit; font-size: 15px; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--card); color: var(--fg); min-width: 0; width: 100%; box-sizing: border-box; }
@media (max-width: 560px) { .row { grid-template-columns: 28px minmax(0, 1fr); } .row input { grid-column: 2; } }
.go { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; margin-top: 14px; }
.pay { position: relative; overflow: hidden; border: 0; cursor: pointer; background: linear-gradient(135deg, #f58529, #dd2a7b 55%, #8134af);
  color: #fff; font: inherit; font-weight: 800; font-size: 16px; border-radius: 999px; padding: 14px 26px; }
.pay:disabled { opacity: 0.5; cursor: default; }
.pay:not(:disabled)::after { content: ''; position: absolute; inset: 0 auto 0 0; width: 40%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent); animation: shine 3.2s ease-in-out 0.5s infinite; }
.save { color: var(--muted); font-size: 14px; }
.err { color: #c0392b; margin: 10px 0 0; font-size: 14px; }
.secure { margin: 12px 0 0; color: var(--muted); font-size: 13px; }
.what { padding-left: 20px; } .what li { margin: 8px 0; }
.one { font-size: 14.5px; }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes rowin { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }
@keyframes shine { 0%, 70% { transform: translateX(-120%) skewX(-20deg); } 100% { transform: translateX(260%) skewX(-20deg); } }
@media (prefers-reduced-motion: reduce) { .box, .row, .pay::after { animation: none !important; } }
</style>
