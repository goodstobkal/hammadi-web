<script setup lang="ts">
/** Bulk profile lookup: paste or upload a list of Instagram profiles, get an
 * Excel file by email. Priced per profile (1 lookup, 2 with account country),
 * runs as a background job on the API. */
import { computed, onMounted, ref, watch } from 'vue'
import { ApiError, jobStatus } from '../lib/api'
import { askFeedbackOnce } from '../lib/feedback'
import { API_BASE, SITE_NAME, breadcrumbs, useSeo } from '../lib/site'

const path = '/tools/bulk-profile-lookup'
useSeo({
  title: `Bulk Instagram Profile Lookup - Followers, Country & Bio to Excel | ${SITE_NAME}`,
  description:
    'Paste or upload a list of Instagram usernames and get followers, following, posts, verified status, category, bio and account country for every profile — emailed to you as an Excel file.',
  path,
  jsonld: [breadcrumbs([{ name: 'Cheap tools', path: '/tools' }, { name: 'Bulk profile lookup', path }])],
})

const text = ref('')
const country = ref(false)
const quote = ref<{ profiles: number; lookups: number; sample: string[]; max: number } | null>(null)
const busy = ref(false)
const err = ref<{ message: string; code: string } | null>(null)
const job = ref<{ token: string; progress: number; total: number } | null>(null)
const done = ref<{ ok: number; total: number } | null>(null)
const me = ref<{ email: string } | null>(null)
const fileName = ref('')

onMounted(async () => {
  try {
    const r = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
    if (r.ok) {
      const d = await r.json()
      me.value = d.user ? { email: d.user.email } : null
    }
  } catch {
    /* anonymous */
  }
})

let t: ReturnType<typeof setTimeout> | undefined
watch([text, country], () => {
  if (t) clearTimeout(t)
  t = setTimeout(refreshQuote, 350)
})
async function refreshQuote() {
  if (!text.value.trim()) {
    quote.value = null
    return
  }
  const r = await fetch(`${API_BASE}/public/v1/bulk/quote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ profiles: text.value, country: country.value }),
  })
  if (r.ok) quote.value = await r.json()
}

async function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  fileName.value = f.name
  text.value = await f.text()
}

async function start() {
  err.value = null
  done.value = null
  busy.value = true
  try {
    const r = await fetch(`${API_BASE}/public/v1/bulk`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ profiles: text.value, country: country.value }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) {
      const det = (d.detail && typeof d.detail === 'object' ? d.detail : {}) as { error?: string; code?: string }
      throw new ApiError(det.error || d.error || (typeof d.detail === 'string' ? d.detail : 'Could not start the batch.'), det.code || d.code || 'error', r.status)
    }
    job.value = { token: d.job, progress: 0, total: d.total }
    for (;;) {
      await new Promise((res) => setTimeout(res, 3000))
      let st
      try {
        st = await jobStatus(d.job)
      } catch {
        continue
      }
      job.value.progress = st.progress
      if (st.status === 'done') {
        const data = (st.data || {}) as { ok?: number; profiles?: unknown[] }
        done.value = { ok: data.ok || 0, total: (data.profiles || []).length }
        askFeedbackOnce('bulk-profile-lookup')
        break
      }
      if (st.status === 'error') throw new ApiError(st.error || 'That batch failed.', 'job_failed', 500)
    }
  } catch (e) {
    err.value = e instanceof ApiError ? { message: e.message, code: e.code } : { message: 'Network error - please try again.', code: 'network' }
  } finally {
    job.value = null
    busy.value = false
  }
}

const pct = computed(() => (job.value ? Math.max(3, Math.round((job.value.progress / Math.max(1, job.value.total)) * 100)) : 0))
</script>

<template>
  <article class="bulk">
    <p class="eyebrow"><RouterLink to="/tools">Cheap tools</RouterLink> · Profiles</p>
    <h1>Bulk Instagram profile lookup</h1>
    <p class="lede">
      Drop in a list of profiles and get followers, following, posts, verified status, category, bio — and
      optionally the account's country — for every one of them, emailed to you as an Excel file. 💌
    </p>

    <section class="card">
      <label for="bulk-in" class="lbl">Profiles — usernames or links, one per line</label>
      <textarea id="bulk-in" v-model="text" rows="9" spellcheck="false"
        placeholder="@nasa&#10;natgeo&#10;https://www.instagram.com/nike/"></textarea>

      <div class="row">
        <label class="upload">
          <input type="file" accept=".txt,.csv,text/plain,text/csv" hidden @change="onFile" />
          📎 {{ fileName || 'Upload a .txt or .csv' }}
        </label>
        <label class="toggle">
          <input v-model="country" type="checkbox" />
          <span>Include account country &amp; join date <small>(2 lookups per profile)</small></span>
        </label>
      </div>

      <div class="quote" v-if="quote">
        <span class="big">{{ quote.profiles.toLocaleString() }}</span> profiles found ·
        uses <b>{{ quote.lookups.toLocaleString() }}</b> lookup{{ quote.lookups === 1 ? '' : 's' }} from your plan
        <span v-if="quote.profiles > quote.max" class="warn"> · max {{ quote.max.toLocaleString() }} per batch</span>
        <div class="sample" v-if="quote.sample.length">{{ quote.sample.map((s) => '@' + s).join(' · ') }}<span v-if="quote.profiles > quote.sample.length"> …</span></div>
      </div>

      <button class="go" :disabled="busy || !quote || !quote.profiles" @click="start">
        <span v-if="busy" class="spinner" aria-hidden="true"></span>
        {{ busy ? 'Working…' : 'Start my batch →' }}
      </button>
      <p class="note">
        <template v-if="me">We'll email the Excel file to <b>{{ me.email }}</b> — you can close this tab.</template>
        <template v-else><a href="/login?next=/tools/bulk-profile-lookup">Log in</a> or <a href="/signup">create a free account</a> — we email the Excel file to you.</template>
        Free accounts include 10 lookups a month; <a href="/pricing">plans</a> start at 1,500.
      </p>

      <div v-if="job" class="job" role="status" aria-live="polite">
        <div class="job-top"><span class="spinner" aria-hidden="true"></span><b>Looking up profiles…</b>
          <span class="n">{{ job.progress.toLocaleString() }} / {{ job.total.toLocaleString() }}</span></div>
        <div class="bar"><div class="fill" :style="{ width: pct + '%' }"></div></div>
        <p>💌 The Excel file is on its way to your inbox when it's done — feel free to close this tab.</p>
      </div>

      <div v-if="done" class="ok">✨ Done! {{ done.ok.toLocaleString() }} of {{ done.total.toLocaleString() }} profiles found. Check your inbox for the Excel file.</div>

      <p v-if="err" class="error">
        {{ err.message }}
        <a v-if="err.code === 'login_required'" href="/signup">Create a free account →</a>
        <a v-else-if="err.code === 'quota_exceeded'" href="/pricing">Upgrade your plan →</a>
      </p>
    </section>

    <h2>What you get for each profile</h2>
    <p>Username, name, followers, following, number of posts, verified / private / business flags, category, website,
      bio — and with the country option, the country Instagram lists for the account and the month it joined.
      Profiles that don't exist or are private are marked in a <b>Status</b> column, so nothing silently disappears.</p>

    <h2>How much does it cost?</h2>
    <p>One lookup per profile, or two with account country. Free accounts get 10 lookups a month to try it; paid plans
      include 1,500 to 9,000 a month. Need a one-off list of 50,000+? Email
      <a href="mailto:hello@hammadi.dev">hello@hammadi.dev</a>.</p>
  </article>
</template>

<style scoped>
.eyebrow { font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); margin: 0 0 10px; }
.eyebrow a { color: inherit; }
h1 { font-size: clamp(28px, 4.5vw, 38px); line-height: 1.15; margin: 0 0 12px; }
.lede { font-size: 18px; color: var(--muted); margin: 0 0 24px; }
.card {
  border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--line));
  border-radius: 20px;
  padding: 22px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 7%, transparent), transparent 70%), var(--card);
  box-shadow: 0 10px 30px rgba(214, 51, 122, 0.08);
}
.lbl { display: block; font-size: 13px; font-weight: 600; color: var(--muted); margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.04em; }
textarea {
  width: 100%; border: 1.5px solid var(--line); border-radius: 14px; padding: 14px 16px; background: var(--bg);
  color: var(--fg); font: 15px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; resize: vertical;
}
textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent); }
.row { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; margin: 14px 0; }
.upload { border: 1px dashed color-mix(in srgb, var(--accent) 50%, var(--line)); border-radius: 999px; padding: 8px 16px; cursor: pointer; font-weight: 600; font-size: 14px; }
.upload:hover { background: color-mix(in srgb, var(--accent) 8%, transparent); }
.toggle { display: flex; gap: 8px; align-items: center; font-size: 14.5px; cursor: pointer; }
.toggle input { accent-color: var(--accent); width: 18px; height: 18px; }
.toggle small { color: var(--muted); }
.quote { margin: 4px 0 16px; padding: 12px 16px; border-radius: 14px; background: var(--chip); font-size: 15px; }
.quote .big { font-size: 20px; font-weight: 800; color: var(--accent); }
.quote .warn { color: #c2410c; font-weight: 600; }
.sample { font-size: 13px; color: var(--muted); margin-top: 4px; overflow-wrap: anywhere; }
.go {
  height: 54px; padding: 0 28px; border: 0; border-radius: 999px; background: var(--accent); color: #fff; font: inherit;
  font-size: 16px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 10px;
  box-shadow: 0 6px 18px color-mix(in srgb, var(--accent) 30%, transparent);
}
.go:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
.note { font-size: 13.5px; color: var(--muted); margin: 14px 0 0; }
.note a, .error a { color: var(--accent); font-weight: 600; }
.job { margin: 18px 0 0; padding: 16px 18px; border-radius: 16px; background: color-mix(in srgb, var(--accent) 6%, var(--card)); border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--line)); }
.job-top { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
.job-top .n { margin-left: auto; color: var(--muted); font-variant-numeric: tabular-nums; }
.job p { margin: 10px 0 0; font-size: 14px; color: var(--muted); }
.bar { height: 8px; border-radius: 999px; background: var(--chip); overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, var(--accent), #fb923c); transition: width 0.4s; }
.ok { margin: 18px 0 0; padding: 14px 18px; border-radius: 14px; background: color-mix(in srgb, #22c55e 12%, var(--card)); font-weight: 600; }
.error { margin: 16px 0 0; padding: 12px 14px; border-radius: 12px; background: var(--chip); }
.spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,.45); border-top-color: #fff; animation: spin 0.8s linear infinite; display: inline-block; }
.job .spinner { border-color: color-mix(in srgb, var(--accent) 30%, transparent); border-top-color: var(--accent); }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) { .card { padding: 16px; } .go { width: 100%; justify-content: center; } }
</style>
