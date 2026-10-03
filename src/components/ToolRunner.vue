<script setup lang="ts">
/** The interactive half of a tool page: the form, the results table and the
 * export buttons. Everything above it on the page is static HTML so the page
 * still says something useful before any JavaScript runs. */
import { computed, onMounted, reactive, ref } from 'vue'
import { ApiError, jobStatus, pick, resendVerification, rowsOf, runTool, type RunResult, type Tool } from '../lib/api'
import { download, stamp, toCsv, toGrid } from '../lib/export'
import { toXlsx } from '../lib/xlsx'
import { API_BASE, LISTING_URL } from '../lib/site'
import { track } from '../lib/analytics'
import { askFeedbackOnce } from '../lib/feedback'
import { conversionId, trackAd } from '../lib/ads'

// The IG Comment & Post Exporter extension: works on private accounts the user follows.
const EXT_WEBSTORE =
  'https://chromewebstore.google.com/detail/instagram-comment-post-ex/ejjfocklfpidcfenanddaedohidmmjba'

const props = defineProps<{ tool: Tool; limits: { per_hour: number; per_day: number } }>()

const form = reactive<Record<string, string | number>>({})
for (const field of props.tool.fields) form[field.name] = field.default ?? ''

/** The first text field is the "main" input (profile, post link or keyword);
 * everything else (count, selects) is an option shown in a row beneath it. */
const mainField = computed(() => props.tool.fields.find((f) => f.type === 'text') || null)
const optionFields = computed(() => props.tool.fields.filter((f) => f !== mainField.value))

// `?q=` (e.g. from the home page search box) prefills the main input.
onMounted(() => {
  const q = new URLSearchParams(window.location.search).get('q')
  if (q && mainField.value) form[mainField.value.name] = q
})

/** One-click examples for the main input. */
const examples = computed<{ label: string; value: string }[]>(() => {
  const f = mainField.value
  if (!f) return []
  if (f.name === 'channel_url') return ['nasa', 'natgeo', 'nike'].map((u) => ({ label: '@' + u, value: '@' + u }))
  const ph = String(f.placeholder || '').trim()
  if (f.name === 'post_url' && /^https:\/\/www\.instagram\.com\//.test(ph)) return [{ label: 'a sample reel', value: ph }]
  if (ph && !/^https?:/.test(ph)) return [{ label: ph, value: ph }]
  return []
})

/** Live read-back of what the main input will look up. */
const detected = computed(() => {
  const f = mainField.value
  const v = String((f && form[f.name]) || '').trim()
  if (!f || !v) return ''
  const post = v.match(/instagram\.com\/(?:[^/]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/)
  if (post) return (post[1] === 'p' ? 'Post ' : 'Reel ') + post[2]
  if (f.name === 'channel_url') {
    const u = v.replace(/^@/, '').match(/^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/)?([A-Za-z0-9._]{1,30})\/?(?:\?.*)?$/)
    return u ? 'Profile @' + u[1] : ''
  }
  return ''
})
function useExample(value: string) {
  if (!mainField.value) return
  form[mainField.value.name] = value
  submit()
}
function clearMain() {
  if (mainField.value) form[mainField.value.name] = ''
}

const result = ref<RunResult | null>(null)
/** A big run handed to a background job: real progress + emailed Excel. */
const job = ref<{ token: string; progress: number; total: number } | null>(null)
const upsell = computed(() => result.value?.upsell || null)
const error = ref<{ message: string; code: string } | null>(null)
const loading = ref(false)

/** A live progress bar for the run. The scrape returns in one response (no
 * server-side stream), so the bar eases toward ~92% on a timer and snaps to
 * 100% on completion — honest about elapsed time, never faking a row count. */
const elapsed = ref(0)
const progress = ref(0)
let ticker: ReturnType<typeof setInterval> | undefined
const stage = computed(() => {
  const s = elapsed.value
  if (s < 2) return 'Connecting to Instagram…'
  if (s < 6) return 'Loading the profile…'
  if (s < 15) return 'Collecting results…'
  return 'Bigger requests take a little longer — hang tight…'
})
function startProgress() {
  elapsed.value = 0
  progress.value = 6
  ticker = setInterval(() => {
    elapsed.value += 0.25
    // Ease toward 92% and slow as it approaches, so the bar never stalls flat
    // yet always leaves room for the real completion to fill it.
    progress.value = Math.min(92, progress.value + Math.max(0.4, (92 - progress.value) * 0.03))
  }, 250)
}
function stopProgress() {
  if (ticker) clearInterval(ticker)
  ticker = undefined
}

const rows = computed(() => (result.value ? rowsOf(props.tool, result.value) : []))
/** Tools without a list (a profile lookup) render their object as key/value. */
const detail = computed(() => {
  if (!result.value || props.tool.result_key) return []
  return Object.entries(result.value.data)
    .filter(([, v]) => v != null && typeof v !== 'object')
    .map(([key, value]) => [key.replace(/_/g, ' '), value] as const)
})
/** The comment-sentiment tool's post-level split, shown as a stacked bar. */
type SentimentSummary = Record<'positive' | 'neutral' | 'negative' | 'positive_pct' | 'neutral_pct' | 'negative_pct' | 'net_score', number>
const sentimentSummary = computed(
  () => (result.value?.data?.sentiment_summary as SentimentSummary | undefined) || null,
)
const subject = computed(() =>
  String(form.channel_url || form.post_url || form.q || 'results').replace(/^https?:\/\/\S+?\/([^/?]+).*/, '$1'),
)
const notice = computed(() => {
  const meta = result.value?.data?.meta as { notice?: string } | undefined
  return meta?.notice || ''
})

/** A single public profile (the profile-info tool): render it as a real
 * profile card — avatar, verified handle, stat row, bio — instead of a flat
 * grid of key/value pairs. Gated on the distinctive profile shape so other
 * object-returning tools keep the generic detail grid. */
type Profile = Record<string, unknown>
const profile = computed<Profile | null>(() => {
  if (!result.value || props.tool.result_key) return null
  const d = result.value.data as Profile
  const looksLikeProfile =
    d && d.username && (d.follower_count != null || d.profile_pic_url || d.biography != null)
  return looksLikeProfile ? d : null
})
/** Scalar fields not already shown in the profile card, for a "more" grid. */
const profileExtra = computed(() => {
  const p = profile.value
  if (!p) return [] as (readonly [string, unknown])[]
  const shown = new Set([
    'username', 'full_name', 'biography', 'external_url', 'follower_count',
    'following_count', 'media_count', 'is_verified', 'is_private', 'is_business',
    'category', 'profile_pic_url', 'id',
  ])
  return Object.entries(p)
    .filter(([k, v]) => !shown.has(k) && v != null && v !== '' && typeof v !== 'object')
    .map(([k, v]) => [k.replace(/_/g, ' '), v] as const)
})

/** List tools whose rows are Instagram accounts (a profile-handle column plus
 * an avatar column): followers, following, similar accounts, likers … Render
 * each as an avatar + verified handle row rather than a wide table with a raw
 * image column and "yes"/blank flag columns. */
const cols = computed(() => props.tool.columns)
const picKey = computed(() => cols.value.find((c) => c.type === 'image')?.key || '')
const userKey = computed(() => cols.value.find((c) => c.type === 'profile')?.key || '')
const nameKey = computed(
  () => cols.value.find((c) => /name/.test(c.key) && c.key !== userKey.value)?.key || '',
)
const numberCols = computed(() => cols.value.filter((c) => c.type === 'number'))
const isAccountList = computed(
  () => rows.value.length > 0 && !!picKey.value && !!userKey.value,
)

/** Instagram avatar URLs are signed and can 403; track failures so we can show
 * initials instead of a broken image. */
const badPics = reactive(new Set<string>())
function picFail(url: string) {
  if (url) badPics.add(url)
}
function initials(row: Record<string, unknown>) {
  const src = String(cell(row, nameKey.value) || cell(row, userKey.value) || '?')
  return src.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?'
}
function pInitials() {
  const src = String(profile.value?.full_name || profile.value?.username || '?')
  return src.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?'
}

// --- $1 task credits: full result for 1 credit --------------------------------
const credits = reactive({ open: false, balance: null as number | null, loggedIn: true, buying: 0, err: '' })
async function openCredits() {
  credits.open = true
  credits.err = ''
  try {
    const r = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
    const d = r.ok ? await r.json() : {}
    credits.loggedIn = !!d.user
    credits.balance = d.user ? Number(d.user.task_credits || 0) : null
  } catch {
    credits.loggedIn = false
  }
}
function resumeUrl() {
  const q = new URLSearchParams({ resume: 'full' })
  for (const [k, v] of Object.entries(form)) if (v !== '' && v != null) q.set(`f_${k}`, String(v))
  return `${window.location.pathname}?${q}`
}
async function buyCredits(n: number) {
  credits.buying = n
  credits.err = ''
  try {
    const r = await fetch(`${API_BASE}/billing/task-credits`, {
      method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ credits: n, back: resumeUrl() }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok || !d.url) throw new Error(typeof d.detail === 'string' ? d.detail : 'Checkout unavailable.')
    track('export', { tool: props.tool.slug, meta: { credits_checkout: n } })
    window.location.href = d.url
  } catch (e) {
    credits.err = e instanceof Error ? e.message : 'Checkout unavailable.'
    credits.buying = 0
  }
}
function runFull() {
  credits.open = false
  submit(true)
}
onMounted(() => {
  const q = new URLSearchParams(window.location.search)
  // Back from Stripe: restore the form and run the full task right away.
  if (q.get('resume') === 'full') {
    for (const [k, v] of q.entries()) if (k.startsWith('f_') && k.slice(2) in form) form[k.slice(2)] = v
    if (q.get('credits') === 'added') submit(true)
    else openCredits()
    return
  }
  // Back from signup/login (the gate below sent them): restore their input and
  // run the lookup immediately, so logging in feels like it just worked.
  if (q.get('resume') === 'login') {
    for (const [k, v] of q.entries()) if (k.startsWith('f_') && k.slice(2) in form) form[k.slice(2)] = v
    if (!requiredMissing()) submit()
  }
})

/** The current page plus the filled form, so after signup/login we return here
 * and re-run the lookup automatically (reuses the ?resume= mechanism above). */
function resumeNext(): string {
  const p = new URLSearchParams({ resume: 'login' })
  for (const f of props.tool.fields) {
    const v = String(form[f.name] ?? '').trim()
    if (v) p.set('f_' + f.name, v)
  }
  return `${window.location.pathname}?${p.toString()}`
}
function authUrl(dest: 'signup' | 'login'): string {
  return `/${dest}?next=${encodeURIComponent(resumeNext())}`
}
function requiredMissing(): boolean {
  const f = mainField.value
  return !f || !String(form[f.name] ?? '').trim()
}

async function submit(fullArg: unknown = false) {
  // Called from the form with an Event: only an explicit `true` spends a credit.
  const full = fullArg === true
  loading.value = true
  error.value = null
  startProgress()
  const started = Date.now()
  try {
    const first = await runTool(props.tool.slug, full ? { ...form, full: '1' } : { ...form })
    if (first.job) {
      job.value = { token: first.job, progress: 0, total: first.total || Number(form.count) || 0 }
      stopProgress()
      result.value = await waitForJob(first.job)
      job.value = null
    } else {
      result.value = first
    }
    askFeedbackOnce(props.tool.slug)
    const convId = conversionId()
    track('tool_run', {
      tool: props.tool.slug,
      conversionId: convId,
      meta: {
        rows: rows.value.length,
        cached: result.value.cached,
        seconds: Math.round((Date.now() - started) / 1000),
      },
    })
    // A completed lookup is the conversion worth optimising against - the
    // visitor got something rather than merely landing. Reddit names it
    // `Lead`: it rejects SEARCH as a campaign optimisation goal, and the
    // optimiser can only learn from the event it is optimising for.
    trackAd('Lead', { itemCount: rows.value.length }, convId)
  } catch (err) {
    result.value = null
    error.value =
      err instanceof ApiError
        ? { message: err.message, code: err.code }
        : { message: 'Network error - please try again.', code: 'network' }
    track('tool_error', { tool: props.tool.slug, meta: { code: error.value.code } })
  } finally {
    progress.value = 100
    stopProgress()
    loading.value = false
  }
}

async function waitForJob(token: string): Promise<RunResult> {
  for (;;) {
    await new Promise((r) => setTimeout(r, 3000))
    let st
    try {
      st = await jobStatus(token)
    } catch {
      continue // a blip while polling - keep waiting
    }
    if (job.value) {
      job.value.progress = st.progress
      job.value.total = st.total || job.value.total
    }
    if (st.status === 'done') return st as RunResult
    if (st.status === 'error') throw new ApiError(st.error || 'That export failed.', 'job_failed', 500)
  }
}

const resendState = ref<'idle' | 'sending' | 'sent' | 'error'>('idle')
async function resendVerify() {
  resendState.value = 'sending'
  try {
    await resendVerification()
    resendState.value = 'sent'
  } catch {
    resendState.value = 'error'
  }
}

function exportCsv() {
  track('export', { tool: props.tool.slug, meta: { format: 'csv', rows: rows.value.length } })
  download(stamp(props.tool.slug, subject.value, 'csv'), toCsv(props.tool.columns, rows.value), 'text/csv')
}

function exportExcel() {
  track('export', { tool: props.tool.slug, meta: { format: 'xlsx', rows: rows.value.length } })
  download(
    stamp(props.tool.slug, subject.value, 'xlsx'),
    toXlsx(toGrid(props.tool.columns, rows.value), props.tool.category),
  )
}

function exportJson() {
  track('export', { tool: props.tool.slug, meta: { format: 'json', rows: rows.value.length } })
  download(
    stamp(props.tool.slug, subject.value, 'json'),
    JSON.stringify(result.value?.data ?? {}, null, 2),
    'application/json',
  )
}


function cell(row: Record<string, unknown>, key: string) {
  return pick(row, key)
}

function formatNumber(value: unknown) {
  return typeof value === 'number' ? value.toLocaleString() : (value ?? '')
}

function formatTime(value: unknown) {
  if (!value) return ''
  const ms = typeof value === 'number' ? value * 1000 : Date.parse(String(value))
  return Number.isNaN(ms) ? String(value) : new Date(ms).toISOString().slice(0, 16).replace('T', ' ')
}

function shortText(value: unknown) {
  const text = String(value ?? '')
  return text.length > 140 ? `${text.slice(0, 140)}…` : text
}
</script>

<template>
  <section class="runner" id="try">
    <form class="tool-form" @submit.prevent="openCredits">
      <div v-if="mainField" class="main-field">
        <label :for="`f-${mainField.name}`">{{ mainField.label }}</label>
        <div class="main-row">
          <div class="main-input">
            <svg v-if="mainField.name !== 'q'" class="ig" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>
            <svg v-else class="ig" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            <input
              :id="`f-${mainField.name}`"
              v-model="form[mainField.name]"
              type="text"
              :placeholder="mainField.placeholder"
              :required="mainField.required"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
            />
            <button v-if="form[mainField.name]" type="button" class="clear" aria-label="Clear" @click="clearMain">×</button>
          </div>
          <button type="submit" class="go" :disabled="loading">
            <span v-if="loading" class="spinner" aria-hidden="true"></span>
            {{ loading ? 'Working…' : 'Get it all · $1 →' }}
          </button>
        </div>
        <div class="below">
          <span v-if="detected" class="detected">✓ {{ detected }}</span>
          <span v-else-if="mainField.help" class="help">{{ mainField.help }}</span>
          <span v-if="examples.length && !form[mainField.name]" class="examples">
            Try:
            <button v-for="e in examples" :key="e.value" type="button" class="ex" @click="useExample(e.value)">{{ e.label }}</button>
          </span>
        </div>
      </div>

      <div v-if="optionFields.length" class="options">
        <div v-for="field in optionFields" :key="field.name" class="field">
          <label :for="`f-${field.name}`">{{ field.label }}</label>
          <select v-if="field.type === 'select'" :id="`f-${field.name}`" v-model="form[field.name]">
            <option v-for="option in field.options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <input
            v-else
            :id="`f-${field.name}`"
            v-model="form[field.name]"
            :type="field.type"
            :placeholder="field.placeholder"
            :min="field.min"
            :max="field.paid_max || field.max"
            :required="field.required"
          />
          <small v-if="field.paid_max" class="cap">
            $1 gets the full result: up to {{ field.paid_max.toLocaleString() }}, big runs emailed to you as Excel 💌
          </small>
          <small v-if="field.help">{{ field.help }}</small>
        </div>
      </div>

      <button v-if="!mainField" type="submit" class="go solo" :disabled="loading">
        <span v-if="loading" class="spinner" aria-hidden="true"></span>
        {{ loading ? 'Working…' : 'Get it all · $1 →' }}
      </button>

      <p class="hint">
        <span class="pill">✓ $1 per task, the full result</span>
        <span class="pill">✓ Excel, CSV &amp; JSON</span>
        <span class="pill">✓ No subscription, credits never expire</span>
      </p>
    </form>

    <div v-if="job" class="job" role="status" aria-live="polite">
      <div class="job-top">
        <span class="spinner" aria-hidden="true"></span>
        <b>Big export running in the background</b>
        <span class="elapsed">{{ job.progress.toLocaleString() }} / {{ job.total.toLocaleString() }}</span>
      </div>
      <div class="bar"><div class="fill" :style="{ width: Math.max(4, Math.round((job.progress / Math.max(1, job.total)) * 100)) + '%' }"></div></div>
      <p class="job-sub">💌 We'll <b>email you the Excel file</b> as soon as it's done — you can close this tab.
        If you stay, the full table shows up right here.</p>
    </div>

    <div v-else-if="loading" class="progress" role="status" aria-live="polite">
      <div class="bar"><div class="fill" :style="{ width: progress + '%' }"></div></div>
      <p class="progress-text">
        <span class="spinner" aria-hidden="true"></span>
        {{ stage }}
        <span class="elapsed">{{ Math.floor(elapsed) }}s</span>
      </p>
      <p class="progress-sub">Scraping live — keep this tab open.</p>
    </div>

    <div v-if="error && error.code === 'login_required'" class="gate">
      <div class="gate-badge">🔓</div>
      <h3>Your result is ready — create a free account to see it</h3>
      <p class="gate-sub">Your first lookup is <b>free</b>, no card needed. Takes 10 seconds and you keep access to all the tools.</p>
      <div class="gate-cta">
        <a :href="authUrl('signup')" class="gate-primary">Create free account →</a>
        <a :href="authUrl('login')" class="gate-secondary">I already have one · Log in</a>
      </div>
      <p class="gate-trust">✓ We never ask for your Instagram password · ✓ Public data only · ✓ Cancel anytime</p>
    </div>

    <p v-else-if="error" class="error">
      {{ error.message }}
      <template v-if="error.code === 'email_unverified'">
        <button
          v-if="resendState !== 'sent'"
          type="button"
          class="link-btn"
          :disabled="resendState === 'sending'"
          @click="resendVerify"
        >
          {{ resendState === 'sending' ? 'Sending…' : 'Resend verification email →' }}
        </button>
        <span v-else class="ok-note">✓ Sent — check your inbox.</span>
        <span v-if="resendState === 'error'" class="err-note">Couldn't send — try again shortly.</span>
      </template>
      <button
        v-else-if="error.code === 'quota_exceeded' || error.code === 'upgrade_for_more' || error.code === 'need_credits'"
        type="button" class="link-btn" @click="openCredits"
      >
        Get the full result for $1 →
      </button>
      <a v-else-if="error.code === 'free_limit_reached'" :href="LISTING_URL" rel="noopener">
        Get unlimited access →
      </a>
      <a
        v-else-if="error.code === 'private_account' || error.code === 'instagram_restricted'"
        :href="`mailto:hello@hammadi.dev?subject=${encodeURIComponent(`Question about ${subject}`)}`"
      >
        Questions? Contact us →
      </a>
    </p>
    <a
      v-if="error && (error.code === 'private_account' || error.code === 'instagram_restricted')"
      class="ext-card"
      :href="EXT_WEBSTORE"
      target="_blank"
      rel="noopener"
      @click="track('extension_click', { tool: props.tool.slug, meta: { subject, reason: error.code } })"
    >
      <span class="ext-icon" aria-hidden="true">🧩</span>
      <span class="ext-text">
        <b>Follow this account? Use our free Chrome extension.</b>
        It runs in your own logged-in browser, so it can export posts and comments from private accounts you
        follow, straight to CSV.
      </span>
      <span class="ext-go">Add to Chrome →</span>
    </a>

    <div v-if="credits.open" class="cr-back" @click.self="credits.open = false">
      <div class="cr" role="dialog" aria-label="Get the full result">
        <button class="cr-x" type="button" aria-label="Close" @click="credits.open = false">×</button>
        <p class="cr-t">Get the full result for $1</p>
        <p class="cr-s">1 credit = 1 full task: every comment, every liker, every post, up to the tool's maximum. Delivered here, or by email for big runs.</p>
        <template v-if="!credits.loggedIn">
          <a class="cr-main" :href="`/login?next=${encodeURIComponent(resumeUrl())}`">Log in to continue →</a>
          <p class="cr-s">No account? <a :href="`/signup?next=${encodeURIComponent(resumeUrl())}`">Create one free</a>.</p>
        </template>
        <template v-else>
          <p class="cr-bal">Your balance: <b>{{ credits.balance ?? '…' }} credit{{ credits.balance === 1 ? '' : 's' }}</b></p>
          <button v-if="(credits.balance || 0) > 0" type="button" class="cr-main" @click="runFull">Run the full task · 1 credit →</button>
          <p class="cr-s">{{ (credits.balance || 0) > 0 ? 'Or add more credits:' : 'Add credits (no subscription):' }}</p>
          <div class="cr-packs">
            <button v-for="n in [1, 5, 10, 25]" :key="n" type="button" :disabled="!!credits.buying" @click="buyCredits(n)">
              <b>{{ n }}</b> credit{{ n > 1 ? 's' : '' }}<span>${{ n }}</span>
            </button>
          </div>
          <p v-if="credits.err" class="cr-err">{{ credits.err }}</p>
          <p class="cr-f">🔒 Secure payment by Stripe. Unused credits never expire.</p>
        </template>
      </div>
    </div>

    <div v-if="result" class="results">
      <div class="results-head">
        <h2 v-if="profile">Profile<span v-if="result.cached" class="tag">cached</span></h2>
        <h2 v-else>
          {{ rows.length || detail.length }} result<span v-if="(rows.length || detail.length) !== 1">s</span>
          <span v-if="result.cached" class="tag">cached</span>
        </h2>
        <div class="exports" v-if="rows.length || detail.length">
          <button type="button" @click="exportExcel" v-if="rows.length">Export Excel</button>
          <button type="button" @click="exportCsv" v-if="rows.length">Export CSV</button>
          <button type="button" @click="exportJson">Export JSON</button>
        </div>
      </div>

      <div v-if="upsell" class="upsell">
        <span class="upsell-i" aria-hidden="true">{{ upsell.upgrade === false ? '💌' : '✨' }}</span>
        <p>{{ upsell.message }}</p>
        <div class="upsell-cta">
          <button v-if="upsell.upgrade !== false" type="button" class="up-btn" @click="openCredits">Get the full result · $1 →</button>
          <a v-if="upsell.contact" class="up-link" :href="`mailto:${upsell.contact}?subject=${encodeURIComponent('More data: ' + tool.slug)}`">Email {{ upsell.contact }}</a>
        </div>
      </div>
      <p v-if="notice" class="notice">{{ notice }}</p>
      <div v-if="sentimentSummary" class="senti">
        <div class="senti-top">
          <b>AI sentiment</b>
          <span>Net score <b :class="sentimentSummary.net_score >= 0 ? 'pos' : 'neg'">{{ sentimentSummary.net_score > 0 ? '+' : '' }}{{ sentimentSummary.net_score }}</b></span>
        </div>
        <div class="senti-bar" role="img" :aria-label="`${sentimentSummary.positive_pct}% positive, ${sentimentSummary.neutral_pct}% neutral, ${sentimentSummary.negative_pct}% negative`">
          <span class="p" :style="{ width: sentimentSummary.positive_pct + '%' }"></span>
          <span class="n" :style="{ width: sentimentSummary.neutral_pct + '%' }"></span>
          <span class="x" :style="{ width: sentimentSummary.negative_pct + '%' }"></span>
        </div>
        <div class="senti-legend">
          <span><i class="p"></i>😊 Positive {{ sentimentSummary.positive_pct }}% ({{ sentimentSummary.positive }})</span>
          <span><i class="n"></i>😐 Neutral {{ sentimentSummary.neutral_pct }}% ({{ sentimentSummary.neutral }})</span>
          <span><i class="x"></i>😡 Negative {{ sentimentSummary.negative_pct }}% ({{ sentimentSummary.negative }})</span>
        </div>
      </div>

      <!-- A single public profile, rendered as a card. -->
      <div v-if="profile" class="profile-card">
        <div class="avatar-lg">
          <img
            v-if="profile.profile_pic_url && !badPics.has(String(profile.profile_pic_url))"
            :src="String(profile.profile_pic_url)"
            alt=""
            loading="lazy"
            referrerpolicy="no-referrer"
            @error="picFail(String(profile.profile_pic_url))"
          />
          <span v-else class="ava-fallback">{{ pInitials() }}</span>
        </div>
        <div class="profile-main">
          <div class="profile-handle">
            <a :href="`https://www.instagram.com/${profile.username}/`" target="_blank" rel="noopener nofollow">
              @{{ profile.username }}
            </a>
            <span v-if="profile.is_verified" class="verified" title="Verified account">✔</span>
          </div>
          <p v-if="profile.full_name" class="profile-full">{{ profile.full_name }}</p>
          <div class="chips" v-if="profile.is_private || profile.is_business || profile.category">
            <span v-if="profile.is_private" class="chip">Private</span>
            <span v-if="profile.is_business" class="chip">Business</span>
            <span v-if="profile.category" class="chip">{{ profile.category }}</span>
          </div>
          <div class="stats">
            <div><strong>{{ formatNumber(profile.media_count) }}</strong><span>Posts</span></div>
            <div><strong>{{ formatNumber(profile.follower_count) }}</strong><span>Followers</span></div>
            <div><strong>{{ formatNumber(profile.following_count) }}</strong><span>Following</span></div>
          </div>
          <p v-if="profile.biography" class="bio">{{ profile.biography }}</p>
          <p v-if="profile.external_url" class="ext">
            <a :href="String(profile.external_url)" target="_blank" rel="noopener nofollow">{{ profile.external_url }}</a>
          </p>
          <dl v-if="profileExtra.length" class="detail small">
            <div v-for="[key, value] in profileExtra" :key="key">
              <dt>{{ key }}</dt>
              <dd>{{ value }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <dl v-else-if="detail.length" class="detail">
        <div v-for="[key, value] in detail" :key="key">
          <dt>{{ key }}</dt>
          <dd>{{ value }}</dd>
        </div>
      </dl>

      <!-- A list of Instagram accounts, rendered as avatar + handle rows. -->
      <ul v-if="isAccountList" class="account-list">
        <li v-for="(row, index) in rows" :key="index">
          <div class="avatar">
            <img
              v-if="cell(row, picKey) && !badPics.has(String(cell(row, picKey)))"
              :src="String(cell(row, picKey))"
              alt=""
              loading="lazy"
              referrerpolicy="no-referrer"
              @error="picFail(String(cell(row, picKey)))"
            />
            <span v-else class="ava-fallback">{{ initials(row) }}</span>
          </div>
          <div class="acct-main">
            <div class="acct-handle">
              <a :href="`https://www.instagram.com/${cell(row, userKey)}/`" target="_blank" rel="noopener nofollow">
                @{{ cell(row, userKey) }}
              </a>
              <span v-if="cell(row, 'is_verified')" class="verified" title="Verified account">✔</span>
              <span v-if="cell(row, 'is_private')" class="chip sm">Private</span>
            </div>
            <div v-if="nameKey && cell(row, nameKey)" class="acct-name">{{ cell(row, nameKey) }}</div>
          </div>
          <div v-if="numberCols.length" class="acct-stats">
            <div v-for="c in numberCols" :key="c.key">
              <strong>{{ formatNumber(cell(row, c.key)) }}</strong><span>{{ c.label }}</span>
            </div>
          </div>
        </li>
      </ul>

      <div v-else-if="rows.length" class="table-scroll">
        <table>
          <thead>
            <tr>
              <th v-for="column in tool.columns" :key="column.key">{{ column.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in rows" :key="index">
              <td v-for="column in tool.columns" :key="column.key">
                <a
                  v-if="column.type === 'link' && cell(row, column.key)"
                  :href="String(cell(row, column.key))"
                  target="_blank"
                  rel="noopener nofollow"
                >open</a>
                <a
                  v-else-if="column.type === 'profile' && cell(row, column.key)"
                  :href="`https://www.instagram.com/${cell(row, column.key)}/`"
                  target="_blank"
                  rel="noopener nofollow"
                >@{{ cell(row, column.key) }}</a>
                <img
                  v-else-if="column.type === 'image' && cell(row, column.key)"
                  :src="String(cell(row, column.key))"
                  alt=""
                  loading="lazy"
                  referrerpolicy="no-referrer"
                />
                <span v-else-if="column.type === 'number'">{{ formatNumber(cell(row, column.key)) }}</span>
                <span v-else-if="column.type === 'timestamp'">{{ formatTime(cell(row, column.key)) }}</span>
                <span v-else-if="column.type === 'bool'">{{ cell(row, column.key) ? 'yes' : '' }}</span>
                <span v-else>{{ shortText(cell(row, column.key)) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="!rows.length && !detail.length && !profile" class="status">
        Nothing came back for that input. Check the profile is public and spelled right.
      </p>
    </div>
  </section>
</template>

<style scoped>
.runner {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 24px;
  margin: 28px 0 8px;
}
.tool-form {
  border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--line));
  border-radius: 18px;
  padding: 22px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--accent) 7%, transparent), transparent 70%),
    var(--card);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
}
.main-field > label,
.field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.main-row {
  display: flex;
  gap: 10px;
}
.main-input {
  position: relative;
  flex: 1;
  min-width: 0;
}
.main-input .ig {
  position: absolute;
  left: 16px;
  top: 50%;
  width: 20px;
  height: 20px;
  transform: translateY(-50%);
  color: var(--muted);
  pointer-events: none;
}
.main-input input {
  height: 56px;
  padding: 0 44px 0 48px;
  font-size: 17px;
  border-radius: 14px;
  border-width: 1.5px;
}
.main-input input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
}
.clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 0;
  background: var(--chip);
  color: var(--muted);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}
.go {
  height: 56px;
  padding: 0 26px;
  border: 0;
  border-radius: 14px;
  background: var(--accent);
  color: #fff;
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: transform 0.1s, filter 0.15s;
}
.go:hover {
  filter: brightness(1.08);
}
.go:active {
  transform: translateY(1px);
}
.go:disabled {
  opacity: 0.7;
  cursor: progress;
}
.go.solo {
  margin-top: 16px;
}
.go .spinner {
  border-color: rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
}
.below {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
  margin-top: 10px;
  min-height: 28px;
  font-size: 13.5px;
}
.detected {
  color: #1a7f4b;
  font-weight: 600;
}
@media (prefers-color-scheme: dark) {
  .detected {
    color: #7ee787;
  }
}
.help {
  color: var(--muted);
}
.examples {
  color: var(--muted);
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.ex {
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--fg);
  border-radius: 999px;
  padding: 3px 11px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.ex:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.options {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--line);
}
.field {
  display: flex;
  flex-direction: column;
  flex: 1 1 180px;
  max-width: 260px;
}
input,
select {
  padding: 11px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--bg);
  color: var(--fg);
  font: inherit;
  width: 100%;
}
input:focus,
select:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
small {
  color: var(--muted);
  font-size: 12px;
  margin-top: 4px;
}
.job {
  margin: 20px 0 0;
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line));
  background: color-mix(in srgb, var(--accent) 6%, var(--card));
}
.job-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.job-top .elapsed {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}
.job-sub {
  margin: 10px 0 0;
  font-size: 14px;
  color: var(--muted);
}
.upsell {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  margin: 16px 0;
  padding: 14px 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, var(--card)), color-mix(in srgb, #fb923c 10%, var(--card)));
  border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line));
}
.upsell-i {
  font-size: 22px;
}
.upsell p {
  margin: 0;
  flex: 1 1 260px;
  font-weight: 600;
}
.upsell-cta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.up-btn {
  background: var(--accent);
  color: #fff;
  text-decoration: none;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 999px;
  white-space: nowrap;
}
.up-link {
  color: var(--accent);
  font-weight: 600;
}
.cap a {
  color: var(--accent);
  font-weight: 600;
}
.cap.over {
  color: var(--fg);
  font-weight: 600;
}
.hint {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: var(--muted);
  margin: 18px 0 0;
}
.hint .pill {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 3px 10px;
  background: var(--bg);
}
.hint a {
  color: var(--accent);
  font-weight: 600;
}
.hint .more {
  margin-left: auto;
}
@media (max-width: 640px) {
  .tool-form {
    padding: 16px;
  }
  .main-row {
    flex-direction: column;
  }
  .go {
    justify-content: center;
    width: 100%;
  }
  .field {
    max-width: none;
  }
  .hint .more {
    margin-left: 0;
  }
}
.status {
  margin: 16px 0 0;
  color: var(--muted);
}
.error {
  margin: 16px 0 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--chip);
  color: var(--fg);
}
.gate {
  margin: 18px 0 0;
  padding: 26px 22px;
  border-radius: 18px;
  text-align: center;
  background: linear-gradient(160deg, #fff5eb, #fdeef6 55%, #f3ebff);
  border: 1px solid #f6d3e3;
  box-shadow: 0 10px 32px rgba(214, 51, 122, 0.12);
}
.gate-badge {
  font-size: 30px;
  width: 58px;
  height: 58px;
  line-height: 58px;
  margin: 0 auto 10px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 4px 14px rgba(214, 51, 122, 0.18);
}
.gate h3 {
  margin: 0 0 6px;
  font-size: 19px;
  color: #2b1a24;
}
.gate-sub {
  margin: 0 auto 16px;
  max-width: 420px;
  font-size: 14.5px;
  line-height: 1.55;
  color: #6b5260;
}
.gate-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.gate-primary {
  display: inline-block;
  background: linear-gradient(135deg, #f58529, #d6337a 60%, #8134af);
  color: #fff;
  text-decoration: none;
  font-weight: 800;
  font-size: 16px;
  padding: 13px 30px;
  border-radius: 999px;
  box-shadow: 0 6px 18px rgba(214, 51, 122, 0.3);
}
.gate-primary:hover {
  filter: brightness(1.05);
}
.gate-secondary {
  color: #8a4a6a;
  text-decoration: none;
  font-weight: 600;
  font-size: 13.5px;
}
.gate-secondary:hover {
  text-decoration: underline;
}
.gate-trust {
  margin: 16px 0 0;
  font-size: 12px;
  color: #a07e8f;
  line-height: 1.7;
}
.link-btn {
  background: none;
  border: 0;
  padding: 0;
  margin-left: 6px;
  font: inherit;
  font-weight: 700;
  color: var(--accent);
  cursor: pointer;
}
.link-btn:disabled {
  opacity: 0.6;
  cursor: progress;
}
.ok-note {
  margin-left: 6px;
  font-weight: 600;
  color: #1a7f4b;
}
.err-note {
  margin-left: 6px;
  color: var(--muted);
}
.results {
  margin-top: 28px;
  border-top: 1px solid var(--line);
  padding-top: 20px;
}
.results-head {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.results-head h2 {
  margin: 0;
  font-size: 18px;
  margin-right: auto;
}
.tag {
  font-size: 12px;
  background: var(--chip);
  color: var(--muted);
  border-radius: 999px;
  padding: 2px 8px;
  margin-left: 8px;
  vertical-align: middle;
}
.exports {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.exports button {
  background: none;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 14px;
  font: inherit;
  color: var(--fg);
  cursor: pointer;
}
.exports button:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.notice {
  font-size: 13px;
  color: var(--muted);
  background: var(--chip);
  border-radius: 10px;
  padding: 10px 12px;
}
.detail {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px 24px;
  margin: 16px 0 0;
}
.detail dt {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
}
.detail dd {
  margin: 2px 0 0;
  word-break: break-word;
  white-space: pre-line;
}
.table-scroll {
  overflow-x: auto;
  margin-top: 16px;
}
table {
  border-collapse: collapse;
  width: 100%;
  font-size: 14px;
}
th,
td {
  text-align: left;
  padding: 9px 12px;
  border-bottom: 1px solid var(--line);
  vertical-align: top;
  max-width: 340px;
}
th {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  white-space: nowrap;
}
td img {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 8px;
}

/* Live progress bar */
.progress {
  margin: 20px 0 0;
}
.bar {
  height: 8px;
  border-radius: 999px;
  background: var(--chip);
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 55%, #fff));
  transition: width 0.25s ease;
}
.progress-text {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0 0;
  font-weight: 600;
  font-size: 14px;
}
.progress-text .elapsed {
  margin-left: auto;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
.progress-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--muted);
}
.spinner {
  width: 15px;
  height: 15px;
  border: 2px solid var(--chip);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex: 0 0 auto;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Verified badge + flag chips, shared by the profile card and account list */
.verified {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: #3897f0;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  flex: 0 0 auto;
}
.chip {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  background: var(--chip);
  border-radius: 999px;
  padding: 3px 10px;
}
.chip.sm {
  font-size: 11px;
  padding: 1px 8px;
}
.ava-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--chip);
  color: var(--muted);
  font-weight: 700;
  letter-spacing: 0.02em;
}

/* Profile card (profile-info) */
.profile-card {
  display: flex;
  gap: 20px;
  margin-top: 18px;
  align-items: flex-start;
}
.avatar-lg {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  flex: 0 0 auto;
  border: 1px solid var(--line);
}
.avatar-lg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-lg .ava-fallback {
  font-size: 30px;
}
.profile-main {
  min-width: 0;
  flex: 1 1 auto;
}
.profile-handle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
}
.profile-handle a {
  color: var(--fg);
  text-decoration: none;
}
.profile-handle a:hover {
  color: var(--accent);
}
.profile-full {
  margin: 2px 0 0;
  color: var(--muted);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 10px 0 0;
}
.stats {
  display: flex;
  gap: 28px;
  margin: 16px 0 0;
}
.stats div {
  display: flex;
  flex-direction: column;
}
.stats strong {
  font-size: 20px;
  font-variant-numeric: tabular-nums;
}
.stats span {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
}
.bio {
  margin: 16px 0 0;
  white-space: pre-line;
  word-break: break-word;
}
.ext {
  margin: 8px 0 0;
  word-break: break-all;
}
.ext a {
  color: var(--accent);
}
.detail.small {
  margin-top: 16px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

/* Account list (followers, following, similar accounts, likers …) */
.account-list {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  display: grid;
  gap: 2px;
}
.account-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  border-radius: 12px;
}
.account-list li:hover {
  background: var(--chip);
}
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex: 0 0 auto;
  border: 1px solid var(--line);
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.acct-main {
  min-width: 0;
  flex: 1 1 auto;
}
.acct-handle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}
.acct-handle a {
  color: var(--fg);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.acct-handle a:hover {
  color: var(--accent);
}
.acct-name {
  color: var(--muted);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.acct-stats {
  display: flex;
  gap: 20px;
  flex: 0 0 auto;
  text-align: right;
}
.acct-stats div {
  display: flex;
  flex-direction: column;
}
.acct-stats strong {
  font-variant-numeric: tabular-nums;
}
.acct-stats span {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
}
@media (max-width: 640px) {
  .runner {
    padding: 16px;
    border-radius: 12px;
  }
  /* Stack the form and let the primary action span the width — easier to hit
     with a thumb than a small auto-width button beside a wrapped field. */
  form {
    gap: 12px;
  }
  .field,
  .field:has(input[type='number']),
  .field:has(select) {
    flex: 1 1 100%;
  }
  form button {
    width: 100%;
  }
  .results-head h2 {
    margin-right: 0;
  }
  th,
  td {
    padding: 8px 10px;
    max-width: 62vw;
  }
  /* Profile card: avatar over details, tighter stat row. */
  .profile-card {
    flex-direction: column;
    gap: 14px;
    align-items: center;
    text-align: center;
  }
  .profile-handle,
  .chips {
    justify-content: center;
  }
  .stats {
    gap: 22px;
    justify-content: center;
  }
  .bio,
  .ext {
    text-align: left;
  }
  .acct-stats {
    gap: 12px;
  }
}
.ext-card {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 12px 0 0;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--line));
  background: linear-gradient(120deg, color-mix(in srgb, var(--accent) 8%, var(--card)), var(--card));
  color: inherit;
  text-decoration: none;
  transition: transform 0.15s, box-shadow 0.15s;
}
.ext-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 22px rgba(180, 35, 111, 0.12);
}
.ext-icon {
  font-size: 28px;
}
.ext-text {
  flex: 1;
  font-size: 14.5px;
  color: var(--muted);
}
.ext-text b {
  display: block;
  color: var(--fg);
  margin-bottom: 2px;
}
.ext-go {
  white-space: nowrap;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  border-radius: 999px;
  padding: 9px 16px;
}
@media (max-width: 640px) {
  .ext-card {
    flex-wrap: wrap;
  }
  .ext-go {
    width: 100%;
    text-align: center;
  }
}
.senti {
  margin: 14px 0 4px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--card);
}
.senti-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 15px;
}
.senti-top .pos { color: #16a34a; }
.senti-top .neg { color: #dc2626; }
.senti-bar {
  display: flex;
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--chip);
}
.senti-bar span { transition: width 0.6s ease; }
.senti .p { background: #22c55e; }
.senti .n { background: #a1a1aa; }
.senti .x { background: #ef4444; }
.senti-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin-top: 10px;
  font-size: 13.5px;
  color: var(--muted);
}
.senti-legend i {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
  margin-right: 6px;
  vertical-align: -1px;
}
.cr-back { position: fixed; inset: 0; z-index: 70; background: rgba(0, 0, 0, 0.45); display: grid; place-items: center; padding: 16px; }
.cr { position: relative; width: min(440px, 100%); background: var(--card); color: var(--fg); border-radius: 20px; padding: 24px 22px 18px; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3); }
.cr-x { position: absolute; top: 10px; right: 12px; border: 0; background: none; font-size: 24px; color: var(--muted); cursor: pointer; }
.cr-t { margin: 0 0 6px; font-size: 21px; font-weight: 800; }
.cr-s { margin: 8px 0; color: var(--muted); font-size: 14.5px; }
.cr-s a { color: var(--accent); font-weight: 600; }
.cr-bal { margin: 12px 0; font-size: 15px; }
.cr-main { display: block; width: 100%; margin: 10px 0 4px; padding: 13px; border: 0; border-radius: 999px; text-align: center; text-decoration: none;
  font: inherit; font-weight: 800; color: #fff; cursor: pointer; background: linear-gradient(135deg, #f58529, #dd2a7b 55%, #8134af); }
.cr-packs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 6px 0 4px; }
.cr-packs button { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 12px 6px; border: 1.5px solid var(--line); border-radius: 14px;
  background: var(--bg); color: var(--fg); font: inherit; font-size: 13px; cursor: pointer; }
.cr-packs button:hover { border-color: var(--accent); }
.cr-packs button b { font-size: 20px; }
.cr-packs button span { color: var(--accent); font-weight: 700; }
.cr-packs button:disabled { opacity: 0.5; cursor: wait; }
.cr-err { color: #dc2626; font-size: 13.5px; margin: 6px 0 0; }
.cr-f { margin: 12px 0 0; color: var(--muted); font-size: 12.5px; text-align: center; }
</style>
