<script setup lang="ts">
/** Browser extension: install, what it does, 1 free export, Pro $3/month. */
import { onMounted, ref } from 'vue'
import { API_BASE, SITE_NAME, SITE_URL, breadcrumbs, useSeo } from '../lib/site'

const STORE = 'https://chromewebstore.google.com/detail/instagram-comment-post-ex/ejjfocklfpidcfenanddaedohidmmjba'
const FAQ: [string, string][] = [
  ['Is my data sent to a server?', 'No. The extension reads comments and posts inside your own Instagram or YouTube tab and builds the file in your browser. Only your plan (free or Pro) is checked with hammadi.dev.'],
  ['Is it free?', 'Your first export is free with a hammadi.dev account. Pro is $3 a month for unlimited exports, cancel any time.'],
  ['Which sites does it support?', 'Instagram (comments, profile posts, likers, followers, following, suggested accounts, photos and videos) and YouTube (comments of videos and Shorts, search results).'],
  ['Is it safe for my Instagram account?', 'It reads at a human pace (about one request a second) through your normal logged-in session, like scrolling the comments yourself.'],
]
const VIDEOS = [
  { src: '/videos/extension-profile.mp4', title: 'Export a whole Instagram profile', sub: 'One button next to Follow: every post with likes, comments and views.' },
  { src: '/videos/extension-youtube.mp4', title: 'YouTube comments in one click', sub: '500 comments of a video, straight from the page.' },
  { src: '/videos/extension-plans.mp4', title: 'Comments of any reel', sub: 'First export free, then unlimited with Pro.' },
]
const FEATS = [
  { i: '💬', t: 'Instagram comments', d: 'Every comment and reply of a post or reel: author, likes, date, profile link.' },
  { i: '🖼', t: 'Profile posts', d: 'All posts of a profile with likes, comments, views and captions.' },
  { i: '❤️', t: 'Likers', d: 'The accounts that liked a post.' },
  { i: '👥', t: 'Followers & following', d: 'Follower and following lists (Instagram limits other accounts to ~50 followers).' },
  { i: '✨', t: 'Suggested accounts', d: 'Accounts Instagram suggests as similar: great for finding competitors.' },
  { i: '⬇', t: 'Photos & videos', d: 'Download every photo and video of a post or carousel.' },
  { i: '▶', t: 'YouTube comments', d: 'Every comment of a video or Short with likes and replies.' },
  { i: '🔎', t: 'YouTube search', d: 'All videos of a search: title, channel, views, date, link.' },
  { i: '🤖', t: 'AI replies', d: 'Use your own OpenAI or Claude key to draft replies and ask questions about the comments.' },
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
    <p class="kicker">Chrome extension · Instagram & YouTube</p>
    <h1>Export comments, posts and followers in one click</h1>
    <p class="lede">A pink Export button right on Instagram and YouTube. Every comment, post, liker, follower or video into CSV or JSON. It runs in your own tab, so nothing goes through a server.</p>
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

    <h2>See it in action</h2>
    <div class="vids">
      <figure v-for="v in VIDEOS" :key="v.src" class="vid">
        <video :src="v.src" :poster="v.src.replace('.mp4', '.jpg')" autoplay muted loop playsinline preload="metadata"></video>
        <figcaption><b>{{ v.title }}</b>{{ v.sub }}</figcaption>
      </figure>
    </div>

    <h2>Everything it exports</h2>
    <div class="feats">
      <div v-for="f in FEATS" :key="f.t" class="ft"><span class="fi">{{ f.i }}</span><b>{{ f.t }}</b><p>{{ f.d }}</p></div>
    </div>

    <h2>How it works</h2>
    <ol class="steps">
      <li><b>Add to Chrome</b><span>Install from the Chrome Web Store and pin it.</span></li>
      <li><b>Open a post, reel, profile or video</b><span>A pink Export button appears right on the page.</span></li>
      <li><b>Click Export</b><span>Get a CSV or JSON in seconds. Your first export is free.</span></li>
    </ol>

    <h2>Frequently asked questions</h2>
    <div v-for="[q, a] in FAQ" :key="q"><h3>{{ q }}</h3><p>{{ a }}</p></div>
    <p class="fb">Ideas or problems? <a href="/feedback?from=extension">Share feedback →</a></p>
  </article>
</template>

<style scoped>
.kicker { margin: 0 0 8px; font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--accent); }
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
.vids { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
.vid { margin: 0; border: 1px solid var(--line); border-radius: 16px; overflow: hidden; background: var(--card); }
.vid video { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; object-position: top; background: #111; }
.vid figcaption { padding: 10px 14px 14px; color: var(--muted); font-size: 14px; }
.vid figcaption b { display: block; color: var(--fg); font-size: 15.5px; margin-bottom: 2px; }
.feats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.ft { border: 1px solid var(--line); border-radius: 14px; background: var(--card); padding: 14px 16px; transition: transform .15s, border-color .15s; }
.ft:hover { transform: translateY(-2px); border-color: var(--accent); }
.fi { font-size: 22px; display: block; margin-bottom: 6px; } .ft b { display: block; } .ft p { margin: 4px 0 0; color: var(--muted); font-size: 14px; }
.steps { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; counter-reset: s; }
.steps li { border: 1px solid var(--line); border-radius: 14px; background: var(--card); padding: 14px 16px; counter-increment: s; }
.steps li::before { content: counter(s); display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--accent); color: #fff; font-weight: 800; font-size: 13px; margin-bottom: 6px; }
.steps b { display: block; } .steps span { color: var(--muted); font-size: 14px; }
.fb { margin-top: 30px; }
</style>
