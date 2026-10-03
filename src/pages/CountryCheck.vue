<script setup lang="ts">
/** Account country check: paste usernames, price by count, pay with Stripe,
 * Excel by email (fulfilled by services._country on the API). */
import { computed, onMounted, ref, watch } from 'vue'
import { API_BASE, SITE_NAME, SITE_URL, breadcrumbs, useSeo } from '../lib/site'

const ONE_URL = 'https://buy.stripe.com/14A3co9AUeur22D4WrcbC0f'
const TIERS = [
  { max: 1, price: 1, label: '1 account' },
  { max: 100, price: 9, label: 'Up to 100 accounts' },
  { max: 1000, price: 49, label: 'Up to 1,000 accounts' },
]
const FAQ: [string, string][] = [
  ['Which country do I get?', 'The one Instagram itself shows publicly on the profile, under "About this account" → "Account based in". Nothing more precise: no city, no address.'],
  ['Does it work for any account?', 'Any public account that Instagram shows the country for. Private, deleted or renamed accounts are marked in the file and do not count against you.'],
  ['What else is in the file?', 'For each account: username, account based in, date joined, former usernames and the profile link.'],
  ['How fast is it?', 'Usually within minutes. 1,000 accounts can take up to an hour. If anything goes wrong, reply to the email and we fix it or refund you.'],
  ['I have more than 1,000 accounts', 'Use the chat (bottom right) for a quote, or see the 20,000-influencer list with country and emails for $200.'],
]

const path = '/services/country-check'
useSeo({
  title: `Instagram Account Country Checker - Where Is an Account Based? | ${SITE_NAME}`,
  description: 'Find the country any public Instagram account is based in, from Instagram\'s "About this account". $1 for one account, $9 for 100, $49 for 1,000. Excel by email.',
  path,
  jsonld: [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Instagram account country check',
      image: `${SITE_URL}/logo.png`,
      brand: { '@type': 'Brand', name: SITE_NAME },
      url: `${SITE_URL}${path}`,
      offers: TIERS.map((t) => ({ '@type': 'Offer', name: t.label, price: String(t.price), priceCurrency: 'USD', availability: 'https://schema.org/InStock' })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
    breadcrumbs([{ name: 'Services', path: '/' }, { name: 'Account country check', path }]),
  ],
})

const text = ref('')
const count = ref(0)
const sample = ref<string[]>([])
const busy = ref(false)
const err = ref('')
const paid = ref(false)

// Same rules as the API: usernames, @handles or profile links.
function parse(raw: string): string[] {
  const out = new Set<string>()
  for (let tok of raw.split(/[\s,;]+/)) {
    tok = tok.trim().replace(/^@/, '')
    if (!tok) continue
    const m = tok.match(/instagram\.com\/([A-Za-z0-9._]{1,30})/i)
    const u = m ? m[1] : /^[A-Za-z0-9._]{1,30}$/.test(tok) ? tok : ''
    if (u && !['p', 'reel', 'reels', 'stories', 'explore'].includes(u.toLowerCase())) out.add(u.toLowerCase())
  }
  return [...out]
}
watch(text, (v) => {
  const names = parse(v)
  count.value = names.length
  sample.value = names.slice(0, 4)
  err.value = ''
})
const tier = computed(() => TIERS.find((t) => count.value <= t.max))

async function pay() {
  if (!count.value || !tier.value) return
  busy.value = true
  err.value = ''
  try {
    const r = await fetch(`${API_BASE}/public/v1/country-order`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ profiles: text.value }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok || !d.url) throw new Error(d?.detail?.error || d?.detail || d?.error || 'Checkout unavailable, try again.')
    window.location.href = d.url
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e)
    busy.value = false
  }
}
onMounted(() => {
  paid.value = new URLSearchParams(window.location.search).get('paid') === '1'
})
</script>

<template>
  <article class="cc">
    <p class="crumb"><RouterLink to="/">Services</RouterLink> · Account country check</p>

    <div v-if="paid" class="paid">
      <b>✅ Payment received.</b> Your Excel file is on its way to your inbox, usually within minutes.
    </div>

    <h1>Which country is an Instagram account based in?</h1>
    <p class="lede">
      Paste one or many accounts. We read the country Instagram shows publicly under
      <em>"About this account"</em> and email you an Excel file.
    </p>

    <div class="box">
      <label for="cc-in">Instagram usernames or profile links</label>
      <textarea id="cc-in" v-model="text" rows="6" placeholder="nasa&#10;@natgeo&#10;https://www.instagram.com/instagram/"></textarea>
      <div class="row">
        <p class="count">
          <template v-if="count">
            <b>{{ count.toLocaleString() }}</b> account{{ count === 1 ? '' : 's' }}
            <span class="sample">· {{ sample.map((s) => '@' + s).join(', ') }}{{ count > sample.length ? '…' : '' }}</span>
          </template>
          <template v-else>One per line, or separated by commas.</template>
        </p>
        <button type="button" class="pay" :disabled="!count || !tier || busy" @click="pay">
          <template v-if="busy">Opening checkout…</template>
          <template v-else-if="count && !tier">Over 1,000 - ask us in the chat</template>
          <template v-else>Get the countries · ${{ tier ? tier.price : 1 }} →</template>
        </button>
      </div>
      <p v-if="err" class="err">{{ err }}</p>
      <p class="secure">🔒 Secure checkout by Stripe · No account needed · Full refund if we can't deliver</p>
    </div>

    <h2>Prices</h2>
    <div class="tiers">
      <div v-for="t in TIERS" :key="t.max" class="tier" :class="{ on: tier && tier.max === t.max && count }">
        <p class="t-price">${{ t.price }}</p>
        <p class="t-label">{{ t.label }}</p>
        <p class="t-per">{{ t.max === 1 ? 'one-time' : `≈ $${(t.price / t.max).toFixed(2)} per account` }}</p>
      </div>
    </div>
    <p class="one">Just one account? <a :href="ONE_URL" rel="noopener">Pay $1 and type the username at checkout →</a></p>

    <h2>What you get</h2>
    <div class="sheet">
      <div class="sheet-bar"><span></span><span></span><span></span><b>instagram-countries.xlsx</b></div>
      <div class="sheet-scroll">
        <table>
          <thead><tr><th>Username</th><th>Account based in</th><th>Date joined</th><th>Former usernames</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>@nasa</td><td>United States</td><td>August 2013</td><td></td><td>ok</td></tr>
            <tr><td>@example.creator</td><td>Canada</td><td>June 2016</td><td>old.name</td><td>ok</td></tr>
            <tr><td>@private_acc</td><td></td><td></td><td></td><td>not found / private</td></tr>
            <tr class="fade"><td>…</td><td>…</td><td>…</td><td>…</td><td>…</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <h2>Frequently asked questions</h2>
    <div v-for="[q, a] in FAQ" :key="q">
      <h3>{{ q }}</h3>
      <p>{{ a }}</p>
    </div>
  </article>
</template>

<style scoped>
.crumb { font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); margin: 0 0 10px; }
.crumb a { color: inherit; }
h1 { font-size: clamp(28px, 4.5vw, 38px); line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 12px; }
.lede { font-size: 18px; color: var(--muted); margin: 0; }
h2 { font-size: 21px; margin: 40px 0 10px; }
h3 { font-size: 17px; margin: 22px 0 4px; }
.paid { margin: 0 0 18px; padding: 14px 18px; border-radius: 14px; background: color-mix(in srgb, #16a34a 12%, var(--card)); border: 1px solid #16a34a; }
.box { margin: 22px 0 0; padding: 20px; border-radius: 20px; border: 2px solid var(--accent); animation: rise 0.6s ease-out both;
  background: linear-gradient(120deg, color-mix(in srgb, var(--accent) 8%, var(--card)), var(--card)); }
.box label { display: block; font-weight: 700; margin-bottom: 8px; }
textarea { width: 100%; box-sizing: border-box; font: inherit; font-size: 15px; padding: 12px 14px; border-radius: 12px;
  border: 1px solid var(--line); background: var(--card); color: var(--fg); resize: vertical; }
textarea:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
.row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; }
.count { margin: 0; color: var(--muted); font-size: 14.5px; flex: 1 1 220px; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.count b { color: var(--fg); }
.pay { position: relative; overflow: hidden; border: 0; cursor: pointer; white-space: nowrap; background: linear-gradient(135deg, #f58529, #dd2a7b 55%, #8134af);
  color: #fff; font: inherit; font-weight: 800; font-size: 16px; border-radius: 999px; padding: 14px 26px; }
.pay:disabled { opacity: 0.5; cursor: default; }
.pay:not(:disabled)::after { content: ''; position: absolute; inset: 0 auto 0 0; width: 40%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent); animation: shine 3.2s ease-in-out 0.5s infinite; }
.err { color: #c0392b; margin: 10px 0 0; font-size: 14px; }
.secure { margin: 12px 0 0; color: var(--muted); font-size: 13px; }
.tiers { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; }
.tier { padding: 16px; border: 1px solid var(--line); border-radius: 14px; background: var(--card); transition: transform 0.2s, border-color 0.2s; }
.tier.on { border-color: var(--accent); transform: translateY(-3px); box-shadow: 0 6px 18px color-mix(in srgb, var(--accent) 18%, transparent); }
.tier p { margin: 0; }
.t-price { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; }
.t-label { font-weight: 700; }
.t-per { color: var(--muted); font-size: 13.5px; }
.one { margin: 12px 0 0; font-size: 14.5px; }
.sheet { border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: var(--card); }
.sheet-bar { display: flex; align-items: center; gap: 6px; padding: 9px 12px; border-bottom: 1px solid var(--line); font-size: 12.5px; color: var(--muted); }
.sheet-bar span { width: 9px; height: 9px; border-radius: 50%; background: var(--line); }
.sheet-bar b { margin-left: 8px; font-weight: 600; }
.sheet-scroll { overflow-x: auto; }
.sheet table { border-collapse: collapse; width: 100%; font-size: 13.5px; }
.sheet th { text-align: left; background: color-mix(in srgb, #1d6f42 12%, var(--card)); font-weight: 700; }
.sheet th, .sheet td { padding: 8px 12px; border-bottom: 1px solid var(--line); white-space: nowrap; }
.sheet tbody tr { animation: rowin 0.45s ease-out both; }
.sheet tbody tr:nth-child(1) { animation-delay: 0.5s; } .sheet tbody tr:nth-child(2) { animation-delay: 0.9s; }
.sheet tbody tr:nth-child(3) { animation-delay: 1.3s; } .sheet tbody tr:nth-child(4) { animation-delay: 1.7s; }
.sheet tr.fade td { color: var(--muted); border-bottom: 0; }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes rowin { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }
@keyframes shine { 0%, 70% { transform: translateX(-120%) skewX(-20deg); } 100% { transform: translateX(260%) skewX(-20deg); } }
@media (prefers-reduced-motion: reduce) { .box, .sheet tbody tr, .pay::after { animation: none !important; } }
</style>
