<script setup lang="ts">
/** "My orders": re-download delivered files for 7 days. Opened from the emailed
 * link (?t=token) or directly when signed in; otherwise asks for the email. */
import { onMounted, ref } from 'vue'
import { API_BASE, SITE_NAME, useSeo } from '../lib/site'

useSeo({ title: `My orders | ${SITE_NAME}`, description: 'Download your hammadi.dev orders again, any time within 7 days.', path: '/orders' })

type File = { id: number; name: string; size: number }
type Order = { id: number; product: string; input: string; status: string; rows?: number; report?: string; date: string; files: File[]; expires: number }
const token = ref('')
const orders = ref<Order[] | null>(null)
const who = ref('')
const days = ref(7)
const email = ref('')
const sent = ref(false)
const busy = ref(false)
const err = ref('')

const q = () => (token.value ? `?t=${encodeURIComponent(token.value)}` : '')
const kb = (n: number) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB')
const left = (exp: number) => {
  const d = Math.ceil((exp * 1000 - Date.now()) / 86400000)
  return d <= 0 ? 'expired' : d === 1 ? 'available 1 more day' : `available ${d} more days`
}
const label: Record<string, string> = { manual: 'In progress (within 24h)', done: 'Delivered', running: 'In progress', queued: 'Queued', error: 'Needs attention' }

async function load() {
  try {
    const r = await fetch(`${API_BASE}/public/v1/my-orders${q()}`, { credentials: 'include' })
    if (r.status === 401) {
      orders.value = null
      if (token.value) err.value = 'This link has expired. Enter your email for a new one.'
      return
    }
    const d = await r.json()
    orders.value = d.orders || []
    who.value = d.email || ''
    days.value = d.days || 7
  } catch {
    err.value = 'Could not load your orders, try again.'
  }
}
async function request() {
  if (!email.value.includes('@')) return
  busy.value = true
  err.value = ''
  try {
    await fetch(`${API_BASE}/public/v1/my-orders/link`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: email.value.trim() }),
    })
    sent.value = true
  } catch {
    err.value = 'Could not send the email, try again.'
  } finally {
    busy.value = false
  }
}
onMounted(() => {
  token.value = new URLSearchParams(window.location.search).get('t') || ''
  load()
})
</script>

<template>
  <article class="mo">
    <h1>My orders</h1>

    <template v-if="orders">
      <p class="lede">Orders for <b>{{ who }}</b> from the last {{ days }} days. Download your files again any time.</p>
      <p v-if="!orders.length" class="empty">No orders in the last {{ days }} days. <RouterLink to="/">See what you can order →</RouterLink></p>
      <div v-for="(o, i) in orders" :key="o.id" class="card" :style="{ animationDelay: i * 0.05 + 's' }">
        <div class="top">
          <div>
            <b>{{ o.product }}</b>
            <small>{{ o.input }}</small>
            <small>{{ new Date(o.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }}<template v-if="o.rows"> · {{ Number(o.rows).toLocaleString() }} rows</template> · {{ left(o.expires) }}</small>
          </div>
          <span class="st" :class="o.status">{{ label[o.status] || o.status }}</span>
        </div>
        <div v-if="o.files.length || o.report" class="dl">
          <a v-if="o.report" :href="o.report" target="_blank" rel="noopener" class="btn">📊 Open interactive report</a>
          <a v-for="f in o.files" :key="f.id" :href="`${API_BASE}/public/v1/my-orders/file/${f.id}${q()}`" class="btn ghost">⬇ {{ f.name }} <small>{{ kb(f.size) }}</small></a>
        </div>
        <p v-else-if="o.status === 'done'" class="note">Delivered by email (file not stored for this order).</p>
        <p v-else-if="o.status === 'error'" class="note">We're on it. Reply to your order email if you need help.</p>
        <p v-else class="note">Working on it - you'll get an email as soon as it's ready.</p>
      </div>
    </template>

    <template v-else>
      <p class="lede">Enter the email you paid with. We'll send you a private link to all your orders from the last 7 days.</p>
      <form v-if="!sent" class="ask" @submit.prevent="request">
        <input v-model="email" type="email" required placeholder="you@example.com" autocomplete="email" />
        <button type="submit" :disabled="busy">{{ busy ? 'Sending…' : 'Email me my orders →' }}</button>
      </form>
      <p v-else class="ok">✅ If there are orders for <b>{{ email }}</b>, the link is on its way. Check your inbox (and spam).</p>
      <p v-if="err" class="err">{{ err }}</p>
    </template>
  </article>
</template>

<style scoped>
.mo { max-width: 760px; }
h1 { font-size: clamp(28px, 4.5vw, 38px); letter-spacing: -0.02em; margin: 0 0 10px; }
.lede { color: var(--muted); font-size: 17px; margin: 0 0 20px; }
.empty { color: var(--muted); }
.card { border: 1px solid var(--line); border-radius: 16px; background: var(--card); padding: 16px 18px; margin-bottom: 12px; animation: rise 0.45s ease-out both; }
.top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.top b { display: block; font-size: 16.5px; }
.top small { display: block; color: var(--muted); font-size: 13.5px; word-break: break-word; }
.st { font-size: 12px; font-weight: 700; border-radius: 999px; padding: 3px 10px; white-space: nowrap; background: var(--chip); }
.st.done { background: color-mix(in srgb, #16a34a 14%, var(--card)); color: #15803d; }
.st.running, .st.queued { background: color-mix(in srgb, #f59e0b 16%, var(--card)); color: #b45309; }
.st.error { background: color-mix(in srgb, #dc2626 14%, var(--card)); color: #b91c1c; }
.dl { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.btn { display: inline-flex; gap: 6px; align-items: center; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 999px; padding: 9px 16px;
  color: #fff; background: linear-gradient(135deg, #f58529, #dd2a7b 55%, #8134af); }
.btn.ghost { background: none; color: var(--accent); border: 2px solid var(--accent); }
.btn small { font-weight: 500; opacity: 0.8; }
.note { margin: 10px 0 0; color: var(--muted); font-size: 14px; }
.ask { display: flex; gap: 8px; flex-wrap: wrap; }
.ask input { flex: 1 1 240px; min-width: 0; font: inherit; font-size: 16px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--line); background: var(--card); color: var(--fg); }
.ask button { font: inherit; font-weight: 800; border: 0; cursor: pointer; color: #fff; border-radius: 999px; padding: 12px 22px;
  background: linear-gradient(135deg, #f58529, #dd2a7b 55%, #8134af); }
.ask button:disabled { opacity: 0.6; }
.ok { font-size: 16px; }
.err { color: #c0392b; }
@keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .card { animation: none; } }
</style>
