<script setup lang="ts">
/** Browser extension: install, what it does, 1 free export, Pro $3/month. */
import { onMounted, ref } from 'vue'
import { API_BASE, SITE_NAME, SITE_URL, breadcrumbs, useSeo } from '../lib/site'

const STORE = 'https://chromewebstore.google.com/detail/instagram-comment-post-ex/ejjfocklfpidcfenanddaedohidmmjba'
const FAQ: [string, string][] = [
  ['Is my data sent to a server?', 'No. The extension reads comments and posts inside your own Instagram or YouTube tab and builds the file in your browser. Only your plan (free or Pro) is checked with hammadi.dev.'],
  ['Is it free?', 'Your first export is free with a hammadi.dev account. Pro is $3 a month for unlimited exports, cancel any time.'],
  ['Which sites does it support?', 'Instagram (comments of posts and reels, all posts of a profile, photos and videos) and YouTube (comments of videos and Shorts).'],
  ['Is it safe for my Instagram account?', 'It reads at a human pace (about one request a second) through your normal logged-in session, like scrolling the comments yourself.'],
]
const path = '/extension'
useSeo({
  title: `Instagram & YouTube Comment Exporter - Chrome Extension | ${SITE_NAME}`,
  description: 'Export every comment of an Instagram post or reel or a YouTube video to CSV or JSON, right from your browser. First export free, Pro $3/month.',
  path,
  jsonld: [
    { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Instagram & YouTube Comment Exporter', applicationCategory: 'BrowserApplication',
      operatingSystem: 'Chrome', url: `${SITE_URL}${path}`, offers: [{ '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free export' },
        { '@type': 'Offer', price: '3', priceCurrency: 'USD', name: 'Pro (monthly)' }] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    breadcrumbs([{ name: 'Tools', path: '/tools' }, { name: 'Chrome extension', path }]),
  ],
})

type St = { logged_in: boolean; email?: string; pro: boolean; free_left: number }
const st = ref<St | null>(null)
const busy = ref(false)
const err = ref('')
const justPro = ref(false)
async function load() {
  try {
    const r = await fetch(`${API_BASE}/public/v1/ext/status`, { credentials: 'include' })
    st.value = await r.json()
  } catch { st.value = null }
}
async function goPro() {
  if (!st.value?.logged_in) { window.location.href = '/login?next=/extension'; return }
  busy.value = true
  err.value = ''
  try {
    const r = await fetch(`${API_BASE}/public/v1/ext/checkout`, { method: 'POST', credentials: 'include' })
    const d = await r.json()
    if (!d.url) throw new Error(d?.detail?.error || 'Checkout unavailable.')
    window.location.href = d.url
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e)
    busy.value = false
  }
}
onMounted(() => {
  justPro.value = new URLSearchParams(window.location.search).get('pro') === '1'
  load()
})
</script>

<template>
  <article class="ex">
    <div v-if="justPro" class="ok">✅ You're Pro: unlimited exports. Open the extension and export away.</div>
    <h1>Export comments from Instagram & YouTube, in one click</h1>
    <p class="lede">A Chrome extension that pulls every comment of a post, reel or video into CSV or JSON. It runs in your own tab, so nothing goes through a server.</p>
    <div class="cta">
      <a class="btn" :href="STORE" target="_blank" rel="noopener">Add to Chrome, it's free →</a>
      <span class="sub">First export free · Pro $3/month</span>
    </div>

    <div class="plans">
      <div class="plan">
        <b>Free</b><p class="price">$0</p>
        <ul><li>1 export with a free hammadi.dev account</li><li>Instagram & YouTube</li><li>CSV and JSON</li></ul>
        <a v-if="st && !st.logged_in" class="btn ghost" href="/signup?next=/extension">Create account</a>
        <p v-else-if="st && st.logged_in && !st.pro" class="state">{{ st.free_left ? '1 free export available' : 'Free export used' }}</p>
      </div>
      <div class="plan hot">
        <b>Pro</b><p class="price">$3<small>/month</small></p>
        <ul><li>Unlimited exports</li><li>Up to 5,000 comments per post</li><li>All profile posts, photos & videos</li><li>Cancel any time</li></ul>
        <p v-if="st?.pro" class="state">✓ You're Pro</p>
        <button v-else class="btn" type="button" :disabled="busy" @click="goPro">{{ busy ? 'Opening checkout…' : 'Go Pro · $3/month →' }}</button>
        <p v-if="err" class="err">{{ err }}</p>
      </div>
    </div>

    <h2>What it exports</h2>
    <ul class="feat">
      <li><b>Instagram comments</b>: every comment and reply of a post or reel, with author, likes, date and profile link.</li>
      <li><b>Instagram posts</b>: a profile's posts with likes, comments, views and captions.</li>
      <li><b>Instagram media</b>: the photos and videos of a post or carousel.</li>
      <li><b>YouTube comments</b>: every comment of a video or Short, with author, likes and replies.</li>
    </ul>

    <h2>Frequently asked questions</h2>
    <div v-for="[q, a] in FAQ" :key="q"><h3>{{ q }}</h3><p>{{ a }}</p></div>
    <p class="fb">Ideas or problems? <a href="/feedback?from=extension">Share feedback →</a></p>
  </article>
</template>

<style scoped>
h1 { font-size: clamp(28px, 4.5vw, 38px); line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 12px; }
.lede { font-size: 18px; color: var(--muted); margin: 0; }
h2 { font-size: 21px; margin: 40px 0 10px; } h3 { font-size: 17px; margin: 22px 0 4px; }
.ok { margin: 0 0 18px; padding: 14px 18px; border-radius: 14px; background: color-mix(in srgb, #16a34a 12%, var(--card)); border: 1px solid #16a34a; }
.cta { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin: 20px 0 0; }
.sub { color: var(--muted); font-size: 14px; }
.btn { display: inline-block; border: 0; cursor: pointer; font: inherit; font-weight: 800; color: #fff; border-radius: 999px; padding: 13px 24px; text-decoration: none;
  background: linear-gradient(135deg, #f58529, #dd2a7b 55%, #8134af); }
.btn:disabled { opacity: 0.6; }
.btn.ghost { background: none; color: var(--accent); border: 2px solid var(--accent); }
.plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-top: 26px; }
.plan { border: 1px solid var(--line); border-radius: 18px; background: var(--card); padding: 18px 20px; }
.plan.hot { border: 2px solid var(--accent); }
.plan b { font-size: 18px; } .price { font-size: 36px; font-weight: 800; margin: 4px 0; } .price small { font-size: 15px; color: var(--muted); }
.plan ul { padding-left: 18px; margin: 8px 0 14px; } .plan li { margin: 4px 0; }
.state { color: var(--muted); font-weight: 700; } .err { color: #c0392b; }
.feat { padding-left: 20px; } .feat li { margin: 8px 0; }
.fb { margin-top: 30px; }
</style>
