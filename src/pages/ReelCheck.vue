<script setup lang="ts">
/** Free reel comment checker: paste a reel -> sentiment %, questions, how many
 * people want to buy (sampled). Upsells the $5 buyer list and $19 analysis. */
import { onMounted, onUnmounted, ref } from 'vue'
import { API_BASE, SITE_NAME, SITE_URL, breadcrumbs, useSeo } from '../lib/site'

const LEADS_URL = 'https://buy.stripe.com/5kQbIU4gA9a7bDd3SncbC0g'
const ANALYSIS_URL = 'https://buy.stripe.com/bJe6oA00k0DB22DagLcbC08'
const FAQ: [string, string][] = [
  ['How does it find buyers in my comments?', 'It reads every comment and flags the ones that show purchase intent: people asking the price, the link, where to buy, about shipping or availability, or saying they want it. It works in English, Spanish, French, German, Portuguese, Italian, Turkish and Arabic.'],
  ['Is the checker free?', 'Yes: it reads up to 300 comments of any public reel or post and shows the numbers. The full list of buyers (with usernames and profile links) is $5, and the complete reel analysis is $19.'],
  ['Can I check a competitor\'s reel?', 'Yes, any public reel or post. Nothing is asked of your Instagram login and nobody is notified.'],
  ['What do I do with the buyer list?', 'Reply to those comments or DM the people: they already asked how to buy. It is the warmest lead list you can get from a reel.'],
]
const path = '/reel-comment-checker'
useSeo({
  title: `Instagram Reel Comment Checker - Find Buyers in Your Comments (Free) | ${SITE_NAME}`,
  description: 'Paste a reel and see how many people asked the price, the link or where to buy, plus comment sentiment and questions. Free, no login.',
  path,
  jsonld: [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Instagram Reel Comment Checker', url: `${SITE_URL}${path}`,
      applicationCategory: 'BusinessApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    breadcrumbs([{ name: 'Tools', path: '/tools' }, { name: 'Reel comment checker', path }]),
  ],
})

type Res = { code: string; owner: string; views?: number; likes?: number; comments_total: number; sampled: number;
  sentiment: { positive: number; neutral: number; negative: number }; questions: number; buyers: number; buyers_estimate: number;
  buyer_preview: { u: string; t: string; why: string }[] }
const url = ref('')
const res = ref<Res | null>(null)
const busy = ref(false)
const err = ref('')
const secs = ref(0)
let timer: ReturnType<typeof setInterval> | undefined
const STAGES = ['Opening the reel…', 'Reading comments…', 'Spotting buying questions…', 'Scoring sentiment…', 'Almost there…']

async function check() {
  if (!url.value.trim()) return
  busy.value = true
  err.value = ''
  res.value = null
  secs.value = 0
  timer = setInterval(() => secs.value++, 1000)
  try {
    const r = await fetch(`${API_BASE}/public/v1/reel-check?url=${encodeURIComponent(url.value.trim())}`)
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(d?.detail?.error || (typeof d?.detail === 'string' ? d.detail : '') || 'Could not read that reel.')
    res.value = d
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
    clearInterval(timer)
  }
}
const fmt = (n?: number) => (n == null ? '–' : n.toLocaleString())
onMounted(() => {
  const u = new URLSearchParams(window.location.search).get('url')
  if (u) { url.value = u; check() }
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <article class="rc">
    <p class="crumb"><RouterLink to="/tools">Tools</RouterLink> · Free</p>
    <h1>Who wants to buy in your reel comments?</h1>
    <p class="lede">Paste any Instagram reel. See how many people asked the price, the link or where to buy, plus what the comments feel like. Free, no login.</p>

    <form class="box" @submit.prevent="check">
      <input v-model="url" type="text" placeholder="https://www.instagram.com/reel/…" autocomplete="off" aria-label="Reel link" />
      <button type="submit" :disabled="busy || !url.trim()">{{ busy ? 'Checking…' : 'Check comments →' }}</button>
    </form>

    <div v-if="busy" class="wait">
      <div class="bar"><div class="fill" :style="{ width: Math.min(95, secs * 2.2) + '%' }"></div></div>
      <p>{{ STAGES[Math.min(STAGES.length - 1, Math.floor(secs / 9))] }} <span>{{ secs }}s</span></p>
    </div>
    <p v-if="err" class="err">{{ err }}</p>

    <section v-if="res" class="res">
      <div class="hero">
        <p class="big">{{ fmt(res.buyers_estimate) }}</p>
        <p>people want to buy<span v-if="res.owner"> on @{{ res.owner }}'s reel</span></p>
        <small>Found {{ res.buyers }} in the {{ res.sampled }} comments we checked, out of {{ fmt(res.comments_total) }}.</small>
      </div>
      <div class="kpis">
        <div><b class="pos">{{ res.sentiment.positive }}%</b><span>positive</span></div>
        <div><b>{{ res.sentiment.neutral }}%</b><span>neutral</span></div>
        <div><b class="neg">{{ res.sentiment.negative }}%</b><span>negative</span></div>
        <div><b>{{ fmt(res.questions) }}</b><span>questions</span></div>
      </div>
      <div v-if="res.buyer_preview.length" class="pv">
        <p class="pv-h">Some of them:</p>
        <div v-for="(b, i) in res.buyer_preview" :key="i" class="pv-row">
          <b>@{{ b.u }}</b> <span>“{{ b.t }}”</span> <em>{{ b.why }}</em>
        </div>
        <div class="pv-row blur"><b>@••••••</b> <span>“How much is it and do you ship to…”</span></div>
      </div>
      <div class="cta">
        <a class="pay" :href="LEADS_URL" rel="noopener">See every buyer · $5 →</a>
        <a class="ghost" :href="ANALYSIS_URL" rel="noopener">Full reel analysis · $19</a>
      </div>
      <p class="note">The buyer list has every username, their comment and profile link in Excel, ready to reply or DM. Paste the same reel link at checkout.
        The full analysis adds the transcript, what fans love, complaints and an <a href="/report/PMOS0b8RawF1k9X9BYH_sw" target="_blank">interactive report</a>.</p>
    </section>

    <h2>What it looks for</h2>
    <ul class="sig">
      <li><b>Price</b> “how much?”, “¿cuánto cuesta?”, “combien ?”</li>
      <li><b>Link</b> “link pls”, “website?”</li>
      <li><b>Where to buy</b> “where can I get it?”, “¿dónde lo compro?”</li>
      <li><b>Want it</b> “I need this”, “take my money”</li>
      <li><b>Shipping & stock</b> “do you ship to UK?”, “still available?”</li>
      <li><b>Discounts</b> “any code?”, “promo?”</li>
    </ul>

    <h2>Frequently asked questions</h2>
    <div v-for="[q, a] in FAQ" :key="q"><h3>{{ q }}</h3><p>{{ a }}</p></div>
  </article>
</template>

<style scoped>
.crumb { font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); margin: 0 0 10px; }
.crumb a { color: inherit; }
h1 { font-size: clamp(28px, 4.5vw, 38px); line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 12px; }
.lede { font-size: 18px; color: var(--muted); margin: 0; }
h2 { font-size: 21px; margin: 40px 0 10px; } h3 { font-size: 17px; margin: 22px 0 4px; }
.box { display: flex; flex-wrap: wrap; gap: 8px; margin: 22px 0 0; padding: 16px; border-radius: 20px; border: 2px solid var(--accent);
  background: linear-gradient(120deg, color-mix(in srgb, var(--accent) 8%, var(--card)), var(--card)); animation: rise 0.6s ease-out both; }
.box input { flex: 1 1 260px; min-width: 0; font: inherit; font-size: 16px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--line); background: var(--card); color: var(--fg); }
.box button, .pay { position: relative; overflow: hidden; border: 0; cursor: pointer; font: inherit; font-weight: 800; color: #fff; border-radius: 999px; padding: 12px 22px;
  background: linear-gradient(135deg, #f58529, #dd2a7b 55%, #8134af); text-decoration: none; }
.box button:disabled { opacity: 0.55; cursor: default; }
.wait { margin: 16px 0 0; } .wait p { color: var(--muted); margin: 6px 0 0; } .wait span { float: right; }
.bar { height: 8px; border-radius: 999px; background: var(--line); overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, #f58529, #dd2a7b, #8134af); transition: width 1s linear; }
.err { color: #c0392b; }
.res { margin-top: 20px; animation: rise 0.5s ease-out both; }
.hero { text-align: center; padding: 22px; border-radius: 20px; background: var(--card); border: 1px solid var(--line); }
.hero p { margin: 0; } .big { font-size: 64px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; color: var(--accent); }
.hero small { color: var(--muted); }
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 12px 0; }
.kpis div { text-align: center; padding: 12px; border: 1px solid var(--line); border-radius: 14px; background: var(--card); }
.kpis b { display: block; font-size: 24px; } .kpis span { color: var(--muted); font-size: 13px; }
.pos { color: #16a34a; } .neg { color: #dc2626; }
@media (max-width: 520px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
.pv { border: 1px solid var(--line); border-radius: 14px; background: var(--card); padding: 12px 14px; }
.pv-h { margin: 0 0 6px; font-weight: 700; }
.pv-row { padding: 6px 0; border-top: 1px solid var(--line); font-size: 14.5px; } .pv-row:first-of-type { border-top: 0; }
.pv-row span { color: var(--muted); } .pv-row em { font-style: normal; font-size: 12px; color: var(--accent); margin-left: 6px; }
.pv-row.blur { filter: blur(4px); user-select: none; }
.cta { display: flex; flex-wrap: wrap; gap: 10px; margin: 14px 0 6px; }
.ghost { font-weight: 800; border-radius: 999px; padding: 12px 22px; border: 2px solid var(--accent); color: var(--accent); text-decoration: none; }
.pay::after { content: ''; position: absolute; inset: 0 auto 0 0; width: 40%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent); animation: shine 3.2s ease-in-out .5s infinite; }
.note { color: var(--muted); font-size: 14px; }
.sig { padding-left: 20px; } .sig li { margin: 6px 0; }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes shine { 0%, 70% { transform: translateX(-120%) skewX(-20deg); } 100% { transform: translateX(260%) skewX(-20deg); } }
@media (prefers-reduced-motion: reduce) { .box, .res, .pay::after { animation: none !important; } }
</style>
