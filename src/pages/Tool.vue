<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import ToolRunner from '../components/ToolRunner.vue'
import InfluencerOrder from '../components/InfluencerOrder.vue'
import catalog from '../catalog.json'
import type { Tool } from '../lib/api'
import { API_BASE, GUIDES_URL, KEPT_TOOLS, LISTING_URL, SITE_NAME, SITE_URL, breadcrumbs, useSeo } from '../lib/site'

const route = useRoute()
const tools = catalog.tools as Tool[]
const limits = catalog.limits as { per_hour: number; per_day: number; max_count: number }

// A slug that isn't in the catalog can only be reached by client-side
// navigation (nginx 404s the URL), but the page must not blow up on it.
const tool = computed(() => tools.find((t) => t.slug === route.params.slug) as Tool | undefined)
const PAY_SLUGS = new Set(['export-instagram-comments', 'export-instagram-reels', 'instagram-likers', 'instagram-influencer-search', 'instagram-posts', 'instagram-profile-info', 'instagram-following', 'instagram-followers'])
const related = computed(() =>
  tools.filter((t) => t.slug !== tool.value?.slug && KEPT_TOOLS.has(t.slug)).slice(0, 4),
)
const path = computed(() => `/tools/${route.params.slug}`)

// Tool-specific questions first (they carry the long-tail search intent),
// then the ones every tool shares.
const faq = computed(() => [
  // Paid pages skip the old free-tool FAQ (it talked about running the form).
  ...(tool.value && PAY_SLUGS.has(tool.value.slug) ? [] : ((tool.value?.faq || []) as { q: string; a: string }[])),
  ...(tool.value && PAY_SLUGS.has(tool.value.slug) ? [
    { q: 'What exactly do I get?', a: 'An Excel file with every row we can read from Instagram, not a sample: all the columns shown above, ready for Excel or Google Sheets.' },
    { q: 'Can I see a competitor\'s data?', a: 'Yes, for any public account. Nothing is asked of your Instagram login, and the account is never notified.' },
  ] : []),
  {
    q: 'How much does it cost?',
    a: tool.value?.slug === 'instagram-influencer-search'
      ? 'It depends on how many creators you take: 25 for $1, 100 for $3, 500 for $9, 1,000 for $15, 5,000 for $39. Paid once with Stripe, Excel by email, no subscription.'
      : 'One flat price per export ($1 for comments, posts, reels or likers), paid once with Stripe. You get the full result as an Excel file by email. No subscription.',
  },
  {
    q: 'Do I need to log in to Instagram?',
    a: 'No. Nothing is asked of your Instagram account, and nothing you do here is visible to the account you look up.',
  },
  {
    q: 'How fast do I get it?',
    a: 'Usually within minutes of paying. Very large posts or profiles can take up to an hour. If anything goes wrong, reply to the email and we fix it or refund you.',
  },
  {
    q: 'Does it work on private accounts?',
    a: 'No. Only public profiles and posts can be read - private accounts return an error.',
  },
])

// Paid one-off exports: Stripe Payment Link, link entered at checkout, Excel by email.
type Pay = { title: string; sub: string; url: string; btn?: string; h1?: string; price?: string; input?: string; cols?: string[]; rows?: string[][] }
const PAY: Record<string, Pay> = {
  'export-instagram-comments': {
    input: "the post or reel link",
    cols: ["Username", "Comment", "Likes", "Date", "Reply to", "Sentiment"],
    rows: [["@ana.style", "Love this colour! 😍", "214", "2026-09-28", "", "positive"], ["@mike_r", "Where can I buy it?", "37", "2026-09-28", "", "neutral"], ["@brand", "Link in bio 💛", "12", "2026-09-28", "@mike_r", "positive"]],
    h1: 'Get all comments of any Instagram post for $1',
    title: 'Get every comment by email · $1',
    sub: 'All comments and replies (up to 5,000) with usernames, likes, dates and sentiment, as Excel. Paste the post link at checkout.',
    url: 'https://buy.stripe.com/00w5kwcN6aebgXx9cHcbC0b',
  },
  'export-instagram-reels': {
    input: "the profile username or link",
    cols: ["Date", "Plays", "Likes", "Comments", "Caption", "Link"],
    rows: [["2026-09-27", "1,204,880", "88,412", "1,903", "Morning routine ☀️", "instagram.com/reel/…"], ["2026-09-21", "356,019", "21,077", "644", "3 tips for…", "instagram.com/reel/…"]],
    h1: 'Get all reels of any Instagram profile for $1',
    title: 'Get every reel by email · $1',
    sub: 'All reels of a profile (up to 500) with play counts, likes, comments and captions, as Excel. Enter the profile at checkout.',
    url: 'https://buy.stripe.com/00wcMYaEY5XVgXxex1cbC0d',
  },
  'instagram-likers': {
    input: "the post or reel link",
    cols: ["Username", "Full name", "Verified", "Private", "Profile link"],
    rows: [["@sara.k", "Sara K.", "no", "no", "instagram.com/sara.k"], ["@fitwithjo", "Jo Martin", "yes", "no", "instagram.com/fitwithjo"]],
    h1: 'Get all likers of any Instagram post for $1',
    title: 'Get every liker by email · $1',
    sub: 'The accounts that liked a post (up to 1,000) with names and profile links, as Excel. Paste the post link at checkout.',
    url: 'https://buy.stripe.com/4gM00cbJ20DB7mX74zcbC0e',
  },
  'instagram-influencer-search': {
    input: "your filters and how many creators you want",
    cols: ["Username", "Name", "Platform", "Country", "Followers", "Avg views", "Engagement %"],
    rows: [["@glowbyleah", "Leah M.", "instagram", "US", "48,200", "12,400", "4.1"], ["@homewithnina", "Nina R.", "instagram", "US", "112,900", "30,150", "2.7"]],
    h1: 'Find Instagram influencers by niche, country and size, from $1',
    title: 'Influencer list from your filters',
    sub: 'Pick a niche, country and follower range, see how many creators match, and choose how many you want.',
    url: 'https://buy.stripe.com/28EdR24gAeurbDdgF9cbC02',
    price: '$1',
  },
  'instagram-profile-info': {
    h1: 'Get the full profile of any Instagram account for $1',
    title: 'Full profile export by email · $1',
    sub: 'Bio, followers, following, category, website, account country and date joined, engagement rate, plus every post (up to 500) with likes, comments and views, in Excel.',
    url: 'https://buy.stripe.com/cNi5kw9AU5XV8r14WrcbC0l',
    input: 'the username or profile link',
    cols: ['Field', 'Value'],
    rows: [['Followers', '48,200'], ['Engagement rate', '3.4%'], ['Account based in', 'United States'], ['Posts per week', '4.5'], ['Top hashtags', '#skincare #glow']],
  },
  'instagram-following': {
    h1: 'See everyone an Instagram account follows, for $1',
    title: 'Following list by email · $1',
    sub: 'Every account a public profile follows (up to 2,000) with username, name, verified and private flags and profile link, in Excel.',
    url: 'https://buy.stripe.com/9B6bIU8wQgCz8r1ex1cbC0m',
    input: 'the username or profile link',
    cols: ['Username', 'Name', 'Verified', 'Private', 'Profile'],
    rows: [['@glowbyleah', 'Leah M.', 'no', 'no', 'instagram.com/glowbyleah'], ['@brandofficial', 'Brand', 'yes', 'no', 'instagram.com/brandofficial']],
  },
  'instagram-followers': {
    h1: 'Export the followers of any Instagram account for $1',
    title: 'Followers list by email · $1',
    sub: 'Followers of a public profile (up to 2,000, as many as Instagram exposes) with username, name and profile link, in Excel.',
    url: 'https://buy.stripe.com/6oU28keVebif5eP2OjcbC0n',
    input: 'the username or profile link',
    cols: ['Username', 'Name', 'Verified', 'Private', 'Profile'],
    rows: [['@sara.k', 'Sara K.', 'no', 'no', 'instagram.com/sara.k'], ['@fitwithjo', 'Jo Martin', 'yes', 'no', 'instagram.com/fitwithjo']],
  },
  'instagram-posts': {
    input: "the profile username or link",
    cols: ["Date", "Type", "Likes", "Comments", "Views", "Caption", "Link"],
    rows: [["2026-09-29", "carousel", "12,480", "318", "", "New drop 🔥", "instagram.com/p/…"], ["2026-09-25", "video", "8,902", "140", "96,550", "Behind the scenes", "instagram.com/p/…"]],
    h1: 'Get all posts of any Instagram profile for $1',
    title: 'Get every post by email · $1',
    sub: 'All posts of a profile (up to 500) with likes, comments, views and captions, as Excel. Enter the profile at checkout.',
    url: 'https://buy.stripe.com/9B6cMY7sM9a7fTtex1cbC0c',
  },
}

const pay = computed(() => (tool.value ? PAY[tool.value.slug] : undefined))

// --- Free basic preview (behind a free account) --------------------------------
// A small taste of the result so visitors see value before paying $1. Anonymous
// visitors get a friendly sign-up card; logged-in free accounts get a few rows.
const mainField = computed(() => tool.value?.fields?.find((f) => f.type === 'text') || null)
type Col = { key: string; label: string; type?: string }
const pv = reactive({
  input: '',
  busy: false,
  gate: false,
  error: '',
  rows: [] as Record<string, unknown>[],
  cols: [] as Col[],
  layout: 'table' as 'table' | 'people' | 'media',
  keys: {} as { avatar?: string; username?: string; verified?: string; text?: string; name?: string; thumb?: string; url?: string; type?: string; stats?: Col[] },
  total: 0,
  shown: 0,
  done: false,
})
const canPreview = computed(() => !!mainField.value && tool.value?.slug !== 'instagram-influencer-search')

// Raw (unformatted) value at a possibly-dotted key.
function raw(row: Record<string, unknown>, key?: string): unknown {
  if (!key) return undefined
  return key.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), row)
}
function str(row: Record<string, unknown>, key?: string): string {
  const v = raw(row, key)
  return v == null ? '' : String(v)
}
function num(row: Record<string, unknown>, key?: string): string {
  const n = Number(raw(row, key))
  if (!n) return '0'
  return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n)
}
function when(row: Record<string, unknown>, key?: string): string {
  const n = Number(raw(row, key))
  return n ? new Date(n * (n < 1e12 ? 1000 : 1)).toLocaleDateString() : ''
}

// Read a possibly-dotted key, formatted by the column type (for the table layout).
function cell(row: Record<string, unknown>, col: Col): string {
  const v = raw(row, col.key)
  if (v == null || v === '') return ''
  if (col.type === 'timestamp') { const n = Number(v); if (n) return new Date(n * (n < 1e12 ? 1000 : 1)).toLocaleDateString() }
  if (col.type === 'bool' || typeof v === 'boolean') return v ? 'Yes' : 'No'
  const s = String(v)
  return s.length > 80 ? s.slice(0, 80) + '…' : s
}

// A tiny inline placeholder avatar/thumb so broken Instagram CDN images (hotlink
// blocks) still look tidy.
const AVATAR_FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23efe7ed"/><circle cx="40" cy="32" r="15" fill="%23cbb8c6"/><rect x="16" y="52" width="48" height="26" rx="13" fill="%23cbb8c6"/></svg>')
function onImgError(e: Event) { (e.target as HTMLImageElement).src = AVATAR_FALLBACK }

function scrollToPreview() {
  const el = document.getElementById('preview')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    ;(el.querySelector('input') as HTMLInputElement | null)?.focus()
  }
}

function pvAuthUrl(dest: 'signup' | 'login'): string {
  const next = `${window.location.pathname}?preview=${encodeURIComponent(pv.input)}`
  return `/${dest}?next=${encodeURIComponent(next)}`
}

async function runPreview() {
  if (!tool.value || !mainField.value) return
  const val = pv.input.trim()
  if (!val) { pv.error = `Enter ${pay.value?.input || 'a value'} first.`; return }
  pv.busy = true
  pv.error = ''
  pv.gate = false
  pv.done = false
  try {
    const q = new URLSearchParams({ [mainField.value.name]: val })
    const res = await fetch(`${API_BASE}/public/v1/preview/${tool.value.slug}?${q}`, { credentials: 'include' })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      const code = body?.detail?.code || body?.code
      if (code === 'login_required') { pv.gate = true; return }
      pv.error = body?.detail?.error || body?.error || 'Preview failed — try again.'
      return
    }
    const key = body.result_key
    const data = body.data || {}
    const list = key && Array.isArray(data[key]) ? (data[key] as Record<string, unknown>[]) : []
    const cols: Col[] = Array.isArray(body.columns) ? body.columns : []
    pv.layout = 'table'
    pv.keys = {}
    if (list.length) {
      const find = (p: (c: Col) => boolean) => cols.find(p)?.key
      const avatar = find((c) => c.key.endsWith('profile_pic_url'))
      const thumb = find((c) => c.key === 'image_url' || c.key.endsWith('thumbnail') || c.key === 'thumb')
      const username = find((c) => c.key === 'username' || c.key.endsWith('.username'))
      if (thumb) {
        // Posts / reels -> Instagram-style thumbnail grid.
        pv.layout = 'media'
        pv.keys = {
          thumb, username, url: find((c) => c.key === 'url'), type: find((c) => c.key === 'type'),
          stats: cols.filter((c) => ['like_count', 'comment_count', 'view_count'].includes(c.key)),
        }
      } else if (avatar) {
        // Comments / likers / followers / following -> avatar + username rows.
        pv.layout = 'people'
        pv.keys = {
          avatar, username, verified: find((c) => c.key.endsWith('is_verified')),
          name: find((c) => c.key.endsWith('full_name')),
          text: find((c) => c.key === 'text' || c.key === 'comment'),
          stats: cols.filter((c) => ['like_count', 'reply_count'].includes(c.key)),
        }
      }
      pv.cols = cols.length ? cols.slice(0, 6) : Object.keys(list[0]).slice(0, 5).map((k) => ({ key: k, label: k }))
      pv.rows = list
    } else if (data && typeof data === 'object') {
      // Single-object tools (profile info): show a few public header fields.
      const entries = Object.entries(data).filter(([, v]) => v != null && typeof v !== 'object').slice(0, 6)
      pv.cols = [{ key: 'field', label: 'field' }, { key: 'value', label: 'value' }]
      pv.rows = entries.map(([k, v]) => ({ field: k, value: v }))
    }
    pv.shown = list.length ? Math.min(list.length, pv.rows.length) : pv.rows.length
    pv.total = typeof body.total === 'number' ? body.total : pv.shown
    pv.done = true
  } catch {
    pv.error = 'Network error — try again.'
  } finally {
    pv.busy = false
  }
}

// Resume a preview after signup/login (?preview=<value>).
if (typeof window !== 'undefined') {
  const qp = new URLSearchParams(window.location.search)
  const pr = qp.get('preview')
  if (pr) { pv.input = pr; setTimeout(runPreview, 50) }
}

useSeo({
  title: tool.value ? `${PAY[tool.value.slug]?.h1 || tool.value.title} | ${SITE_NAME}` : 'Tool not found',
  description: tool.value?.description || 'That tool does not exist.',
  path: path.value,
  jsonld: [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.value?.title,
      url: `${SITE_URL}${path.value}`,
      image: `${SITE_URL}/logo.png`,
      description: tool.value?.description,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '1', priceCurrency: 'USD' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.value.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
    breadcrumbs([
      { name: 'Cheap tools', path: '/tools' },
      { name: tool.value?.title || 'Not found', path: path.value },
    ]),
  ],
})

</script>

<template>
  <div v-if="!tool">
    <h1>Tool not found</h1>
    <p>That tool doesn't exist. See <RouterLink to="/tools">all cheap tools</RouterLink>.</p>
  </div>

  <article v-else class="tool">
    <p class="eyebrow">
      <RouterLink to="/tools">Cheap tools</RouterLink> · {{ tool.category }}
    </p>
    <h1>{{ pay?.h1 || tool.title }}</h1>
    <p class="lede">{{ tool.tagline }}</p>

    <template v-if="pay">
      <InfluencerOrder v-if="tool.slug === 'instagram-influencer-search'" :tool="tool" />
      <div v-else class="buy">
        <div class="buy-l">
          <p class="buy-price">{{ pay.price || '$1' }} <small>one-time</small></p>
          <p class="buy-what"><b>{{ pay.title.replace(/ · \$\d+$/, '') }}</b>{{ pay.sub }}</p>
          <ul class="ticks">
            <li>Everything, not a preview</li>
            <li>Excel file in your inbox, usually within minutes</li>
            <li>No account, no subscription</li>
          </ul>
        </div>
        <div class="buy-r">
          <a class="buy-btn" :href="pay.url" rel="noopener">{{ pay.btn || 'Buy now · $1' }} →</a>
          <a v-if="canPreview" class="buy-preview" href="#preview" @click.prevent="scrollToPreview">👀 or see a free preview first</a>
        </div>
      </div>
      <p v-if="tool.slug !== 'instagram-influencer-search'" class="secure">🔒 Secure checkout by Stripe · Full refund if we can't deliver · Need several? <RouterLink to="/services/bundle">5 exports for $4 →</RouterLink></p>
      <p v-else class="secure">25 for $1 · 100 for $3 · 500 for $9 · 1,000 for $15 · 5,000 for $39. Need their emails? <a href="/services/influencer-lists">Lists with emails →</a></p>

      <div v-if="canPreview" id="preview" class="pvbox">
        <p class="pvbox-h">👀 Not sure yet? <b>See a free preview</b> — the first few rows, free with an account.</p>
        <div class="pvbox-form">
          <input v-model="pv.input" type="text" :placeholder="mainField?.placeholder || pay?.input || 'Paste a link or @handle'" @keydown.enter="runPreview" />
          <button type="button" :disabled="pv.busy" @click="runPreview">{{ pv.busy ? 'Loading…' : 'See free preview →' }}</button>
        </div>

        <div v-if="pv.gate" class="pvgate">
          <b>Create a free account to see your preview</b>
          <p>Free, no card. You'll come right back to this preview.</p>
          <div class="pvgate-cta">
            <a :href="pvAuthUrl('signup')" class="pvgate-primary">Create free account →</a>
            <a :href="pvAuthUrl('login')" class="pvgate-secondary">Log in</a>
          </div>
        </div>

        <p v-if="pv.error" class="pverr">{{ pv.error }}</p>

        <div v-if="pv.done && pv.rows.length" class="pvresult">
          <p class="pvtotal">
            Showing <b>{{ pv.shown }}</b><template v-if="pv.total > pv.shown"> of <b>{{ pv.total.toLocaleString() }}</b></template>
            <template v-if="tool.slug === 'export-instagram-comments'"> comments</template>
            <template v-else> rows</template> — the full file has them all.
          </p>
          <!-- Instagram-style: avatar + username rows (comments, likers, followers) -->
          <div v-if="pv.layout === 'people'" class="ig-people">
            <div v-for="(r, i) in pv.rows" :key="i" class="ig-row">
              <img class="ig-av" :src="str(r, pv.keys.avatar) || AVATAR_FALLBACK" loading="lazy" referrerpolicy="no-referrer" alt="" @error="onImgError" />
              <div class="ig-main">
                <div class="ig-top">
                  <b>{{ str(r, pv.keys.username) }}</b>
                  <span v-if="pv.keys.verified && raw(r, pv.keys.verified)" class="ig-verif">✔</span>
                  <span v-if="pv.keys.name && str(r, pv.keys.name)" class="ig-name">{{ str(r, pv.keys.name) }}</span>
                </div>
                <div v-if="pv.keys.text && str(r, pv.keys.text)" class="ig-text">{{ str(r, pv.keys.text) }}</div>
              </div>
              <div v-if="pv.keys.text" class="ig-likes">♥ {{ num(r, 'like_count') }}</div>
            </div>
          </div>

          <!-- Instagram-style: thumbnail grid (posts, reels) -->
          <div v-else-if="pv.layout === 'media'" class="ig-grid">
            <div v-for="(r, i) in pv.rows" :key="i" class="ig-cell">
              <div class="ig-thumb"><img :src="str(r, pv.keys.thumb) || AVATAR_FALLBACK" loading="lazy" referrerpolicy="no-referrer" alt="" @error="onImgError" />
                <span v-if="pv.keys.type && str(r, pv.keys.type)" class="ig-badge">{{ str(r, pv.keys.type) }}</span>
              </div>
              <div class="ig-stats">♥ {{ num(r, 'like_count') }} · 💬 {{ num(r, 'comment_count') }}<template v-if="raw(r, 'view_count')"> · ▶ {{ num(r, 'view_count') }}</template></div>
            </div>
          </div>

          <!-- Fallback table for anything else -->
          <div v-else class="sheet">
            <div class="sheet-scroll">
              <table>
                <thead><tr><th v-for="c in pv.cols" :key="c.key">{{ c.label }}</th></tr></thead>
                <tbody>
                  <tr v-for="(r, i) in pv.rows" :key="i"><td v-for="c in pv.cols" :key="c.key">{{ cell(r, c) }}</td></tr>
                  <tr class="fade"><td v-for="c in pv.cols" :key="c.key">…</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="pvcta">
            <p>That's a free preview.
              <template v-if="pv.total > pv.shown">Get <b>all {{ pv.total.toLocaleString() }}</b> rows</template>
              <template v-else>Get the <b>complete file</b></template>
              (every column, as Excel) for {{ pay?.price || '$1' }}.</p>
            <a class="buy-btn" :href="pay?.url" rel="noopener">{{ pay?.btn || 'Get the full file · $1' }} →</a>
          </div>
        </div>
      </div>

      <h2>What you get</h2>
      <div class="sheet" role="img" :aria-label="`Example of the Excel columns: ${pay.cols?.join(', ')}`">
        <div class="sheet-bar"><span></span><span></span><span></span><b>example.xlsx</b></div>
        <div class="sheet-scroll">
          <table>
            <thead><tr><th v-for="c in pay.cols" :key="c">{{ c }}</th></tr></thead>
            <tbody>
              <tr v-for="(r, i) in pay.rows" :key="i"><td v-for="(v, j) in r" :key="j">{{ v }}</td></tr>
              <tr class="fade"><td v-for="c in pay.cols" :key="c">…</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <h2>How it works</h2>
      <ol class="steps">
        <li v-if="tool.slug === 'instagram-influencer-search'"><b>Set filters, pay from $1</b><span>Choose {{ pay.input }}.</span></li>
        <li v-else><b>Pay {{ pay.price || '$1' }}</b><span>Enter {{ pay.input }} and your email at checkout.</span></li>
        <li><b>We fetch everything</b><span>Live from Instagram, public data only.</span></li>
        <li><b>Get your Excel</b><span>Emailed to you, ready for Excel or Google Sheets.</span></li>
      </ol>

      <h2>Frequently asked questions</h2>
      <div v-for="item in faq" :key="item.q">
        <h3>{{ item.q }}</h3>
        <p>{{ item.a }}</p>
      </div>

      <div v-if="tool.slug !== 'instagram-influencer-search'" class="buy buy-end">
        <p class="buy-what"><b>{{ pay.h1 || pay.title }}</b>Pay once, get the full file by email.</p>
        <a class="buy-btn" :href="pay.url" rel="noopener">{{ pay.btn || 'Buy now · $1' }} →</a>
      </div>
    </template>

    <template v-else>
      <ToolRunner :tool="tool" :limits="limits" />

      <h2>What this tool does</h2>
      <p>{{ tool.description }}</p>

      <h2>Frequently asked questions</h2>
      <div v-for="item in faq" :key="item.q">
        <h3>{{ item.q }}</h3>
        <p>{{ item.a }}</p>
      </div>
    </template>

    <template v-if="!pay">
    <h2>Need this in your own app?</h2>
    <p>
      Every tool here is one call to the
      <a :href="LISTING_URL" rel="noopener">Instagram Scraper API</a> — the same data as JSON, with
      no hourly limit, higher counts and a response you can pipe straight into your code.
      <template v-if="tool.guide">
        <a :href="`${GUIDES_URL}/${tool.guide}`">This job has its own guide</a> with copy-paste
        Python.
      </template>
      <template v-else>
        The <a :href="GUIDES_URL">guides</a> have copy-paste Python for the common jobs.
      </template>
    </p>

    </template>

    <template v-if="related.length">
      <h2>Related tools</h2>
      <ul class="related">
        <li v-for="item in related" :key="item.slug">
          <RouterLink :to="`/tools/${item.slug}`">{{ item.title }}</RouterLink> — {{ item.tagline }}
        </li>
      </ul>
    </template>
  </article>
</template>

<style scoped>
.eyebrow {
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 10px;
}
.eyebrow a {
  color: inherit;
}
h1 {
  font-size: clamp(28px, 4.5vw, 38px);
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0 0 12px;
}
.lede {
  font-size: 19px;
  color: var(--muted);
  margin: 0;
}
h2 {
  font-size: 21px;
  margin: 40px 0 8px;
}
h3 {
  font-size: 17px;
  margin: 22px 0 4px;
}
ol,
.related {
  padding-left: 20px;
}
li {
  margin: 8px 0;
}
.buy { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px 24px; margin: 22px 0 8px; padding: 22px 24px;
  border-radius: 20px; border: 2px solid var(--accent);
  background: linear-gradient(120deg, color-mix(in srgb, var(--accent) 10%, var(--card)), var(--card)); }
.buy-l { flex: 1 1 320px; }
.buy-price { margin: 0 0 6px; font-size: 40px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
.buy-price small { font-size: 14px; font-weight: 600; color: var(--muted); letter-spacing: 0; }
.buy-what { margin: 0; color: var(--muted); font-size: 15px; flex: 1 1 300px; }
.buy-what b { display: block; color: var(--fg); font-size: 18px; margin-bottom: 4px; }
.ticks { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 14px; }
.ticks li { margin: 0; }
.ticks li::before { content: '✓ '; color: var(--accent); font-weight: 800; }
.buy-btn { white-space: nowrap; background: linear-gradient(135deg, #f58529, #dd2a7b 55%, #8134af); color: #fff; font-weight: 800; font-size: 17px;
  border-radius: 999px; padding: 15px 28px; text-decoration: none; box-shadow: 0 6px 18px color-mix(in srgb, #dd2a7b 30%, transparent); }
.buy-btn:hover { filter: brightness(1.06); }
.buy-end { margin-top: 40px; }
.secure { margin: 6px 0 0; color: var(--muted); font-size: 13.5px; }
.buy-r { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.buy-preview { font-size: 13px; font-weight: 600; color: var(--accent); text-decoration: none; }
.buy-preview:hover { text-decoration: underline; }
.pvbox { margin: 18px 0 0; padding: 16px; border: 1px dashed #e3b9cf; border-radius: 16px; background: #fffafc; }
.pvbox-h { margin: 0 0 10px; font-size: 14.5px; }
.pvbox-form { display: flex; gap: 8px; flex-wrap: wrap; }
.pvbox-form input { flex: 1 1 220px; min-width: 0; padding: 11px 13px; border: 1px solid var(--line); border-radius: 10px; font: inherit; font-size: 15px; }
.pvbox-form button { white-space: nowrap; border: 0; border-radius: 10px; padding: 11px 18px; font-weight: 700; font-size: 15px; color: #fff; cursor: pointer; background: linear-gradient(135deg, #f58529, #dd2a7b 60%, #8134af); }
.pvbox-form button:disabled { opacity: 0.6; cursor: progress; }
.pvgate { margin: 14px 0 0; padding: 16px; text-align: center; border-radius: 14px; background: linear-gradient(160deg, #fff5eb, #fdeef6 60%, #f3ebff); border: 1px solid #f6d3e3; }
.pvgate b { font-size: 16px; color: #2b1a24; }
.pvgate p { margin: 4px 0 12px; font-size: 13.5px; color: #6b5260; }
.pvgate-cta { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.pvgate-primary { background: linear-gradient(135deg, #f58529, #d6337a 60%, #8134af); color: #fff; text-decoration: none; font-weight: 800; padding: 12px 26px; border-radius: 999px; box-shadow: 0 6px 18px rgba(214, 51, 122, 0.28); }
.pvgate-secondary { color: #8a4a6a; text-decoration: none; font-weight: 600; font-size: 13.5px; }
.pverr { margin: 12px 0 0; color: #c0356b; font-size: 13.5px; }
.pvresult { margin: 14px 0 0; }
.pvtotal { margin: 0 0 10px; font-size: 13.5px; color: var(--fg); }
.ig-people { border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: var(--card); }
.ig-row { display: flex; align-items: flex-start; gap: 11px; padding: 11px 13px; border-bottom: 1px solid var(--line); }
.ig-row:last-child { border-bottom: 0; }
.ig-av { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: var(--bg2); }
.ig-main { flex: 1; min-width: 0; }
.ig-top { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.ig-top b { font-size: 14px; }
.ig-verif { color: #3897f0; font-size: 11px; }
.ig-name { color: var(--muted); font-size: 12.5px; }
.ig-text { font-size: 13.5px; color: var(--fg); margin-top: 2px; word-break: break-word; }
.ig-likes { color: var(--muted); font-size: 12.5px; white-space: nowrap; }
.ig-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
.ig-cell { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: var(--card); }
.ig-thumb { position: relative; aspect-ratio: 1 / 1; background: var(--bg2); }
.ig-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ig-badge { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,.6); color: #fff; font-size: 10.5px; padding: 1px 7px; border-radius: 999px; text-transform: capitalize; }
.ig-stats { font-size: 12px; font-weight: 600; padding: 7px 9px; color: var(--fg); }

.pvcta { margin: 12px 0 0; text-align: center; }
.pvcta p { margin: 0 0 10px; font-size: 14px; }
.sheet { border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: var(--card); }
.sheet-bar { display: flex; align-items: center; gap: 6px; padding: 9px 12px; border-bottom: 1px solid var(--line); font-size: 12.5px; color: var(--muted); }
.sheet-bar span { width: 9px; height: 9px; border-radius: 50%; background: var(--line); }
.sheet-bar b { margin-left: 8px; font-weight: 600; }
.sheet-scroll { overflow-x: auto; }
.sheet table { border-collapse: collapse; width: 100%; font-size: 13.5px; }
.sheet th { text-align: left; background: color-mix(in srgb, #1d6f42 12%, var(--card)); color: var(--fg); font-weight: 700; }
.sheet th, .sheet td { padding: 8px 12px; border-bottom: 1px solid var(--line); white-space: nowrap; }
.sheet tr.fade td { color: var(--muted); border-bottom: 0; }
.steps { list-style: none; padding: 0; margin: 12px 0 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; counter-reset: s; }
.steps li { margin: 0; padding: 16px; border: 1px solid var(--line); border-radius: 14px; background: var(--card); counter-increment: s; }
.steps li::before { content: counter(s); display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--accent); color: #fff; font-weight: 800; font-size: 13px; margin-bottom: 8px; }
.steps b { display: block; margin-bottom: 2px; }
.steps span { color: var(--muted); font-size: 14px; }
.paybox { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 20px; margin: 18px 0 6px; padding: 18px 20px;
  border-radius: 18px; text-decoration: none; color: inherit; border: 2px solid var(--accent);
  background: linear-gradient(120deg, color-mix(in srgb, var(--accent) 10%, var(--card)), var(--card)); }
.paybox b { display: block; font-size: 19px; margin-bottom: 4px; }
.paybox span:first-child { flex: 1 1 320px; color: var(--muted); font-size: 14.5px; }
.paybox b { color: var(--fg); }
.paybtn { white-space: nowrap; background: linear-gradient(135deg, #f58529, #dd2a7b 55%, #8134af); color: #fff; font-weight: 800; border-radius: 999px; padding: 12px 22px; }
.paynote { margin: 4px 0 14px; color: var(--muted); font-size: 13.5px; }
/* Motion: card rises in, rows "type" into the sheet, button shines. */
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes rowin { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }
@keyframes shine { 0%, 70% { transform: translateX(-120%) skewX(-20deg); } 100% { transform: translateX(260%) skewX(-20deg); } }
@keyframes pop { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.035); } }
@keyframes blink { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
.buy { animation: rise 0.6s ease-out both; }
.buy-btn { position: relative; overflow: hidden; animation: pop 2.8s ease-in-out 1.2s infinite; }
.buy-btn::after { content: ''; position: absolute; inset: 0 auto 0 0; width: 40%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent); animation: shine 3.2s ease-in-out 0.8s infinite; }
.ticks li { animation: rise 0.5s ease-out both; }
.ticks li:nth-child(1) { animation-delay: 0.25s; } .ticks li:nth-child(2) { animation-delay: 0.4s; } .ticks li:nth-child(3) { animation-delay: 0.55s; }
.sheet { animation: rise 0.6s ease-out 0.2s both; }
.sheet tbody tr { animation: rowin 0.45s ease-out both; }
.sheet tbody tr:nth-child(1) { animation-delay: 0.7s; } .sheet tbody tr:nth-child(2) { animation-delay: 1.1s; }
.sheet tbody tr:nth-child(3) { animation-delay: 1.5s; } .sheet tbody tr:nth-child(4) { animation-delay: 1.9s; }
.sheet tr.fade td { animation: blink 1.4s ease-in-out 2.3s infinite; }
.steps li { animation: rise 0.55s ease-out both; transition: transform 0.2s, border-color 0.2s; }
.steps li:nth-child(2) { animation-delay: 0.12s; } .steps li:nth-child(3) { animation-delay: 0.24s; }
.steps li:hover { transform: translateY(-3px); border-color: var(--accent); }
@media (prefers-reduced-motion: reduce) {
  .buy, .buy-btn, .buy-btn::after, .ticks li, .sheet, .sheet tbody tr, .sheet tr.fade td, .steps li { animation: none !important; }
}
</style>
