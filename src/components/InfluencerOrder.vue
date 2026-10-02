<script setup lang="ts">
/** Filtered influencer list: set filters -> live match count + masked preview
 * -> pick a size (price by size, from $1) -> Stripe Checkout -> Excel by email. */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { Tool } from '../lib/api'
import { API_BASE } from '../lib/site'

const props = defineProps<{ tool: Tool }>()
const opts = (name: string) =>
  ((props.tool.fields.find((f) => f.name === name) as { options?: { value: string; label: string }[] } | undefined)?.options) || []

const f = reactive({ q: '', platform: 'instagram', country: '', min_followers: '1000', max_followers: '' })
type Tier = { pack: string; count: number; price_cents: number }
type Row = { username: string; country: string; followers: number; engagement_rate: string; platform: string }
const total = ref<number | null>(null)
const preview = ref<Row[]>([])
const tiers = ref<Tier[]>([
  { pack: 'inf25', count: 25, price_cents: 100 }, { pack: 'inf100', count: 100, price_cents: 300 },
  { pack: 'inf500', count: 500, price_cents: 900 }, { pack: 'inf1000', count: 1000, price_cents: 1500 },
  { pack: 'inf5000', count: 5000, price_cents: 3900 },
])
const notice = ref('')
const pick = ref(100)
const loading = ref(false)
const busy = ref(false)
const err = ref('')
const paid = ref(false)

let timer: ReturnType<typeof setTimeout> | undefined
let seq = 0
async function quote() {
  const my = ++seq
  loading.value = true
  try {
    const r = await fetch(`${API_BASE}/public/v1/influencer-order/quote`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f),
    })
    const d = await r.json()
    if (my !== seq) return
    total.value = d.total ?? 0
    preview.value = d.preview || []
    if (d.tiers) tiers.value = d.tiers
    notice.value = d.notice || ''
  } catch {
    if (my === seq) total.value = null
  } finally {
    if (my === seq) loading.value = false
  }
}
watch(f, () => { clearTimeout(timer); timer = setTimeout(quote, 350) }, { deep: true })
onMounted(() => {
  paid.value = new URLSearchParams(window.location.search).get('paid') === '1'
  quote()
})

// Sizes the visitor can buy: full tiers below the match count, plus "all N" when it's smaller than the next tier.
const sizes = computed(() => {
  const t = total.value ?? 0
  const out: { count: number; price: number; all?: boolean }[] = []
  for (const x of tiers.value) {
    if (x.count < t) out.push({ count: x.count, price: x.price_cents / 100 })
    else { if (t > 0) out.push({ count: t, price: x.price_cents / 100, all: true }); break }
  }
  return out
})
watch(sizes, (s) => {
  if (s.length && !s.some((x) => x.count === pick.value)) pick.value = (s.find((x) => x.count === 100) || s[Math.min(1, s.length - 1)]).count
})
const chosen = computed(() => sizes.value.find((x) => x.count === pick.value))
const fmt = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(n))

async function pay() {
  if (!chosen.value) return
  busy.value = true
  err.value = ''
  try {
    const r = await fetch(`${API_BASE}/public/v1/influencer-order`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...f, count: chosen.value.count }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok || !d.url) throw new Error(d?.detail?.error || d?.detail || 'Checkout unavailable, try again.')
    window.location.href = d.url
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e)
    busy.value = false
  }
}
</script>

<template>
  <div class="io">
    <div v-if="paid" class="paid"><b>✅ Payment received.</b> Your Excel list is on its way to your inbox, usually within a few minutes.</div>
    <div class="filters">
      <label class="wide">Niche or topic
        <input v-model="f.q" type="text" placeholder="skincare, fitness, home decor…" />
      </label>
      <label>Platform
        <select v-model="f.platform"><option v-for="o in opts('platform')" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      </label>
      <label>Country
        <select v-model="f.country"><option v-for="o in opts('country')" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      </label>
      <label>Min followers
        <select v-model="f.min_followers"><option v-for="o in opts('min_followers')" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      </label>
      <label>Max followers
        <select v-model="f.max_followers"><option v-for="o in opts('max_followers')" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      </label>
    </div>

    <div class="match" :class="{ dim: loading }">
      <span class="big">{{ total == null ? '…' : total.toLocaleString() }}</span>
      <span>creators match <span v-if="loading" class="dots">updating</span></span>
    </div>
    <p v-if="notice" class="notice">{{ notice }}</p>

    <div v-if="preview.length" class="pv">
      <div v-for="(r, i) in preview" :key="i" class="pv-row" :style="{ animationDelay: i * 0.07 + 's' }">
        <b>@{{ r.username }}</b><span>{{ r.country || '–' }}</span><span>{{ fmt(r.followers || 0) }} followers</span>
        <span>{{ r.engagement_rate ? (Number(r.engagement_rate) * 100).toFixed(1) + '% eng.' : '' }}</span>
      </div>
      <p class="pv-note">🔒 Full usernames, profile links and stats are in the Excel you get after paying.</p>
    </div>

    <template v-if="sizes.length">
      <p class="how">How many do you want?</p>
      <div class="sizes">
        <button v-for="s in sizes" :key="s.count" type="button" :class="{ on: s.count === pick }" @click="pick = s.count">
          <b>{{ s.all ? 'All ' : '' }}{{ s.count.toLocaleString() }}</b><span>${{ s.price }}</span>
        </button>
      </div>
      <div class="go">
        <button type="button" class="pay" :disabled="busy || !chosen" @click="pay">
          {{ busy ? 'Opening checkout…' : `Get ${chosen ? chosen.count.toLocaleString() : ''} influencers · $${chosen ? chosen.price : 1} →` }}
        </button>
        <span class="secure">🔒 Stripe checkout · Excel by email · No account needed</span>
      </div>
      <p v-if="err" class="err">{{ err }}</p>
    </template>
    <p v-else-if="total === 0 && !loading" class="notice">Nothing matches yet. Try a broader niche, another country or a wider follower range.</p>
  </div>
</template>

<style scoped>
.io { margin: 22px 0 8px; padding: 20px; border-radius: 20px; border: 2px solid var(--accent); animation: rise 0.6s ease-out both;
  background: linear-gradient(120deg, color-mix(in srgb, var(--accent) 8%, var(--card)), var(--card)); }
.paid { margin: 0 0 14px; padding: 12px 16px; border-radius: 12px; background: color-mix(in srgb, #16a34a 12%, var(--card)); border: 1px solid #16a34a; }
.filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
.filters label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; font-weight: 700; color: var(--muted); min-width: 0; }
.filters .wide { grid-column: 1 / -1; }
.filters input, .filters select { font: inherit; font-size: 15px; font-weight: 400; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--line);
  background: var(--card); color: var(--fg); min-width: 0; }
.match { display: flex; align-items: baseline; gap: 10px; margin: 18px 0 4px; transition: opacity 0.2s; }
.match.dim { opacity: 0.55; }
.big { font-size: 40px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
.dots { color: var(--muted); font-size: 13px; }
.notice { color: var(--muted); font-size: 14px; margin: 6px 0 0; }
.pv { margin: 10px 0 0; border: 1px solid var(--line); border-radius: 12px; background: var(--card); overflow: hidden; }
.pv-row { display: grid; grid-template-columns: 1.4fr 0.5fr 1fr 0.8fr; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--line);
  font-size: 14px; animation: rowin 0.4s ease-out both; }
.pv-row span { color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pv-note { margin: 0; padding: 8px 12px; font-size: 13px; color: var(--muted); }
.how { margin: 18px 0 8px; font-weight: 700; }
.sizes { display: flex; flex-wrap: wrap; gap: 8px; }
.sizes button { font: inherit; cursor: pointer; display: flex; flex-direction: column; align-items: center; min-width: 86px; padding: 10px 14px;
  border-radius: 14px; border: 1px solid var(--line); background: var(--card); color: var(--fg); transition: transform 0.15s, border-color 0.15s; }
.sizes button span { color: var(--muted); font-size: 13px; }
.sizes button.on { border: 2px solid var(--accent); transform: translateY(-2px); }
.sizes button.on span { color: var(--accent); font-weight: 700; }
.go { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; margin-top: 16px; }
.pay { position: relative; overflow: hidden; border: 0; cursor: pointer; background: linear-gradient(135deg, #f58529, #dd2a7b 55%, #8134af);
  color: #fff; font: inherit; font-weight: 800; font-size: 16px; border-radius: 999px; padding: 14px 26px; }
.pay:disabled { opacity: 0.5; cursor: default; }
.pay:not(:disabled)::after { content: ''; position: absolute; inset: 0 auto 0 0; width: 40%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent); animation: shine 3.2s ease-in-out 0.5s infinite; }
.secure { color: var(--muted); font-size: 13px; }
.err { color: #c0392b; margin: 10px 0 0; font-size: 14px; }
@media (max-width: 520px) { .pv-row { grid-template-columns: 1.3fr 0.5fr 1fr; } .pv-row span:last-child { display: none; } }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes rowin { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }
@keyframes shine { 0%, 70% { transform: translateX(-120%) skewX(-20deg); } 100% { transform: translateX(260%) skewX(-20deg); } }
@media (prefers-reduced-motion: reduce) { .io, .pv-row, .pay::after { animation: none !important; } }
</style>
