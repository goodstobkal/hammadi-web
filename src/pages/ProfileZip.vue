<script setup lang="ts">
/** Full profile download: every photo and video of a public Instagram profile,
 * zipped with a posts.csv index and emailed. Runs as a background job on the
 * API; 1 lookup per 10 posts. */
import { computed, onMounted, ref } from 'vue'
import { ApiError, jobStatus } from '../lib/api'
import { askFeedbackOnce } from '../lib/feedback'
import { API_BASE, SITE_NAME, breadcrumbs, useSeo } from '../lib/site'

const path = '/tools/download-instagram-profile'
useSeo({
  title: `Download a Full Instagram Profile as ZIP - All Photos & Videos | ${SITE_NAME}`,
  description:
    'Download every photo, video and carousel slide from a public Instagram profile in one ZIP file, with a spreadsheet of captions, likes and dates — emailed to you.',
  path,
  jsonld: [breadcrumbs([{ name: 'Cheap tools', path: '/tools' }, { name: 'Download Instagram profile', path }])],
})

const COUNTS = [12, 50, 100, 250, 500]
const profile = ref('')
const count = ref(50)
const busy = ref(false)
const err = ref<{ message: string; code: string } | null>(null)
const job = ref<{ progress: number; total: number } | null>(null)
const done = ref<{ username: string; posts: number; files: number; mb: number; url: string } | null>(null)
const me = ref<{ email: string } | null>(null)
const lookups = computed(() => Math.max(1, Math.ceil(count.value / 10)))

onMounted(async () => {
  const q = new URLSearchParams(window.location.search).get('q')
  if (q) profile.value = q
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

async function start() {
  err.value = null
  done.value = null
  busy.value = true
  try {
    const r = await fetch(`${API_BASE}/public/v1/profile-zip`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ profile: profile.value, count: count.value }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) {
      const det = (d.detail && typeof d.detail === 'object' ? d.detail : {}) as { error?: string; code?: string }
      throw new ApiError(det.error || d.error || (typeof d.detail === 'string' ? d.detail : 'Could not start the download.'), det.code || d.code || 'error', r.status)
    }
    job.value = { progress: 0, total: count.value }
    for (;;) {
      await new Promise((res) => setTimeout(res, 3000))
      let st
      try {
        st = await jobStatus(d.job)
      } catch {
        continue
      }
      job.value = { progress: st.progress, total: st.total }
      if (st.status === 'done') {
        const s = (st.data || {}) as { username: string; posts: number; files: number; bytes: number; download_url: string }
        done.value = { username: s.username, posts: s.posts, files: s.files, mb: s.bytes / 1048576, url: s.download_url }
        askFeedbackOnce('download-instagram-profile')
        break
      }
      if (st.status === 'error') throw new ApiError(st.error || 'That download failed.', 'job_failed', 500)
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
    <h1>Download a full Instagram profile as ZIP</h1>
    <p class="lede">
      Every photo, video and carousel slide from a public profile in one ZIP file, plus a spreadsheet of captions,
      likes and dates. We email it to you when it's ready. 🗜
    </p>

    <section class="card">
      <label for="pz-in" class="lbl">Instagram profile — username or link</label>
      <input id="pz-in" v-model="profile" class="inp" spellcheck="false" autocomplete="off"
        placeholder="@nasa or https://www.instagram.com/nasa/" @keyup.enter="profile.trim() && !busy && start()" />

      <div class="row">
        <span class="lbl" style="margin:0">Latest posts</span>
        <label v-for="c in COUNTS" :key="c" class="chip-opt" :class="{ on: count === c }">
          <input v-model="count" type="radio" :value="c" hidden />{{ c }}
        </label>
      </div>

      <div class="quote">
        Uses <b>{{ lookups }}</b> lookup{{ lookups === 1 ? '' : 's' }} from your plan · 1 lookup per 10 posts
      </div>

      <button class="go" :disabled="busy || !profile.trim()" @click="start">
        <span v-if="busy" class="spinner" aria-hidden="true"></span>
        {{ busy ? 'Working…' : 'Download as ZIP →' }}
      </button>
      <p class="note">
        <template v-if="me">We'll email the ZIP to <b>{{ me.email }}</b>. You can close this tab.</template>
        <template v-else><a href="/login?next=/tools/download-instagram-profile">Log in</a> or <a href="/signup">create a free account</a>. We email the ZIP to you.</template>
        Plans start at <a href="/pricing">$2 a month</a>.
      </p>

      <div v-if="job" class="job" role="status" aria-live="polite">
        <div class="job-top"><span class="spinner" aria-hidden="true"></span><b>Downloading photos &amp; videos…</b>
          <span class="n">{{ job.progress.toLocaleString() }} / {{ job.total.toLocaleString() }}</span></div>
        <div class="bar"><div class="fill" :style="{ width: pct + '%' }"></div></div>
        <p>💌 We'll email the ZIP when it's done. You can close this tab.</p>
      </div>

      <div v-if="done" class="ok">
        ✨ Done! {{ done.posts.toLocaleString() }} posts from @{{ done.username }} ({{ done.files.toLocaleString() }} files,
        {{ done.mb.toFixed(1) }} MB). <a :href="done.url">Download the ZIP</a>. We've emailed you the link too.
      </div>

      <p v-if="err" class="error">
        {{ err.message }}
        <a v-if="err.code === 'login_required'" href="/signup">Create a free account →</a>
        <a v-else-if="err.code === 'quota_exceeded'" href="/pricing">Upgrade your plan →</a>
      </p>
    </section>

    <h2>What's in the ZIP</h2>
    <p>A <b>posts/</b> folder with every photo and video, named by date and post code. Carousels are split into one file
      per slide. You also get <b>posts.csv</b> with each post's link, type, caption, likes, comments and views,
      plus the profile picture and a <b>profile.txt</b> with the bio and follower counts.</p>

    <h2>How much does it cost?</h2>
    <p>One lookup per 10 posts, so the latest 50 posts cost 5 lookups. Free accounts get 10 lookups a month.
      Paid plans start at $2 a month for 500 lookups. Download links work for 3 days.</p>

    <h2>Is it allowed?</h2>
    <p>This only works on public profiles. The content still belongs to its creator, so use it to back up your own
      account or for research, and ask before you repost anyone else's work.</p>
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
textarea, .inp {
  width: 100%; border: 1.5px solid var(--line); border-radius: 14px; padding: 14px 16px; background: var(--bg);
  color: var(--fg); font: 15px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; resize: vertical;
}
textarea:focus, .inp:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent); }
.row { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; margin: 14px 0; }
.upload { border: 1px dashed color-mix(in srgb, var(--accent) 50%, var(--line)); border-radius: 999px; padding: 8px 16px; cursor: pointer; font-weight: 600; font-size: 14px; }
.upload:hover { background: color-mix(in srgb, var(--accent) 8%, transparent); }
.inp { font-family: inherit; font-size: 16px; }
.chip-opt { border: 1.5px solid var(--line); border-radius: 999px; padding: 6px 14px; cursor: pointer; font-weight: 600; font-size: 14px; font-variant-numeric: tabular-nums; }
.chip-opt.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); }
.ok a { color: var(--accent); }
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
