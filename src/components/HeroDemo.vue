<script setup lang="ts">
/** Decorative hero animation showing how the AI works: comments scroll past on
 * an Instagram-style phone, land in a table where each one gets a sentiment
 * label, and an "AI insight" line types out what they add up to. Below, a
 * "Suggested for you" row drifts sideways. The suggested accounts are real
 * brands; the commenters are made up. */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import demoProfiles from '../demo-profiles.json'

type Mood = 'pos' | 'neu' | 'neg'
const COMMENTS: { u: string; t: string; l: number; s: Mood }[] = [
  { u: 'lena.travels', t: 'Where was this taken?? 😍', l: 128, s: 'pos' },
  { u: 'mike_fit', t: 'Need this in my life', l: 64, s: 'pos' },
  { u: 'studio.nord', t: 'The colours are unreal 🔥', l: 211, s: 'pos' },
  { u: 'sara.cooks', t: 'Shipping took 3 weeks 😡', l: 37, s: 'neg' },
  { u: 'dev.jules', t: 'How do you edit your reels?', l: 92, s: 'neu' },
  { u: 'amir.photo', t: 'Collab? DM me 🙌', l: 18, s: 'neu' },
  { u: 'noa.style', t: 'Obsessed with this look', l: 156, s: 'pos' },
  { u: 'kai_runs', t: 'Goals 💪', l: 45, s: 'pos' },
]
const MOOD = { pos: '😊 Positive', neu: '😐 Neutral', neg: '😡 Negative' } as const

// "AI insight" lines, typed out one after another.
const INSIGHTS = [
  '72% positive. Fans love the colours, and 9 people ask where to buy.',
  '2 negative comments mention shipping delays. Worth a reply.',
  'Profile report: travel niche, 4.1% engagement. A strong fit for outdoor brands.',
]
const typed = ref(INSIGHTS[0])
let timer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  let line = 0
  let pos = 0
  const tick = () => {
    const full = INSIGHTS[line]
    if (pos <= full.length) {
      typed.value = full.slice(0, pos++)
      timer = setTimeout(tick, 32)
    } else {
      timer = setTimeout(() => {
        line = (line + 1) % INSIGHTS.length
        pos = 0
        tick()
      }, 2600)
    }
  }
  tick()
})
onBeforeUnmount(() => timer && clearTimeout(timer))
// Real public brand accounts: pictures and follower counts pulled from our own
// API into public/demo (Instagram's CDN links expire). Refresh by re-running
// the fetch in the instagram repo's notes.
const PROFILES = (demoProfiles as { u: string; followers: number; verified: boolean }[]).map((p) => ({
  ...p,
  n: new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(p.followers),
}))
// Commenters are made up, so they get illustrated faces (DiceBear "Lorelei", CC0).
const face = (u: string) => `/demo/c-${u}.svg`
</script>

<template>
  <div class="demo" aria-hidden="true">
    <div class="stage">
      <div class="phone">
        <div class="ph-top"><span class="dot"></span><b>Comments</b><span class="n">1,284</span></div>
        <div class="ph-feed">
          <ul class="scroll-y">
            <li v-for="(c, i) in [...COMMENTS, ...COMMENTS]" :key="i">
              <img class="av" :src="face(c.u)" alt="" width="30" height="30" loading="lazy" />
              <div><b>{{ c.u }}</b> {{ c.t }}<small>♥ {{ c.l }}</small></div>
            </li>
          </ul>
        </div>
      </div>

      <div class="arrow"><span></span></div>

      <div class="sheet">
        <div class="sh-top">✨ AI sentiment · comments.xlsx <span class="live">● analysing</span></div>
        <div class="mood-bar"><span class="pos"></span><span class="neu"></span><span class="neg"></span></div>
        <div class="sh-head"><span>Username</span><span>Comment</span><span>Sentiment</span></div>
        <div class="sh-body">
          <ul class="scroll-y slow">
            <li v-for="(c, i) in [...COMMENTS, ...COMMENTS]" :key="i">
              <span>@{{ c.u }}</span><span>{{ c.t }}</span><span><em :class="['pill', c.s]">{{ MOOD[c.s] }}</em></span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="insight">
      <span class="ai-badge">✨ AI insight</span>
      <span class="typed">{{ typed }}<i class="caret"></i></span>
    </div>

    <div class="suggest">
      <p class="sg-title">Suggested for you</p>
      <div class="sg-track">
        <ul class="scroll-x">
          <li v-for="(p, i) in [...PROFILES, ...PROFILES]" :key="i">
            <img class="av big ring" :src="`/demo/${p.u}.jpg`" alt="" width="52" height="52" loading="lazy" />
            <b>{{ p.u }}<span v-if="p.verified" class="tick" title="Verified">✓</span></b>
            <small>{{ p.n }} followers</small>
            <span class="follow">Follow</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo { margin: 40px auto 0; max-width: 860px; }
.stage { display: grid; grid-template-columns: 250px 60px 1fr; align-items: center; gap: 0; }
.phone {
  background: var(--card); border: 1px solid var(--line); border-radius: 30px; padding: 14px 12px;
  box-shadow: 0 20px 50px rgba(180, 35, 111, 0.12); height: 300px; display: flex; flex-direction: column;
}
.ph-top { display: flex; align-items: center; gap: 8px; font-size: 13px; padding: 0 6px 10px; border-bottom: 1px solid var(--line); }
.ph-top .dot { width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af); }
.ph-top .n { margin-left: auto; color: var(--muted); }
.ph-feed, .sh-body, .sg-track { overflow: hidden; position: relative; }
.ph-feed { flex: 1; mask-image: linear-gradient(transparent, #000 14%, #000 86%, transparent); }
.sh-body { height: 200px; mask-image: linear-gradient(transparent, #000 12%, #000 88%, transparent); }
ul { list-style: none; margin: 0; padding: 0; }
.scroll-y { animation: up 16s linear infinite; }
.scroll-y.slow { animation-duration: 20s; }
.ph-feed li { display: flex; gap: 9px; padding: 9px 4px; font-size: 12.5px; line-height: 1.35; text-align: left; }
.ph-feed li small { display: block; color: var(--muted); font-size: 11px; margin-top: 2px; }
.av { flex: none; width: 30px; height: 30px; border-radius: 50%; object-fit: cover; background: var(--chip); }
.av.big { width: 56px; height: 56px; }
/* Instagram story ring */
.av.ring { padding: 2px; border: 2px solid transparent; background: linear-gradient(var(--card), var(--card)) padding-box, linear-gradient(45deg, #f58529, #dd2a7b, #8134af) border-box; }
.tick { display: inline-grid; place-items: center; width: 13px; height: 13px; margin-left: 4px; border-radius: 50%; background: #0095f6; color: #fff; font-size: 8px; vertical-align: 1px; }
.arrow { display: grid; place-items: center; }
.arrow span {
  width: 36px; height: 2px; position: relative;
  background: repeating-linear-gradient(90deg, var(--accent) 0 6px, transparent 6px 10px);
  background-size: 20px 2px; animation: dash 0.8s linear infinite;
}
.arrow span::after {
  content: ''; position: absolute; right: -2px; top: -4px; border: 5px solid transparent; border-left-color: var(--accent);
}
.sheet {
  background: var(--card); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; text-align: left;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.06);
}
.sh-top { display: flex; justify-content: space-between; padding: 10px 14px; font-size: 13px; font-weight: 600; border-bottom: 1px solid var(--line); }
.live { color: #16a34a; font-weight: 600; font-size: 12px; animation: blink 1.6s ease-in-out infinite; }
.sh-head, .sh-body li { display: grid; grid-template-columns: 1fr 1.8fr 0.9fr; gap: 10px; padding: 7px 14px; font-size: 12.5px; }
.sh-head { background: var(--chip); color: var(--muted); font-weight: 700; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.04em; }
.sh-body li { border-bottom: 1px solid var(--line); }
.sh-body li span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sh-body li span:first-child { color: var(--accent); font-weight: 600; }
.sh-body li span:last-child { text-align: right; }
.pill { font-style: normal; font-size: 11.5px; font-weight: 700; border-radius: 999px; padding: 2px 8px; }
.pill.pos { background: color-mix(in srgb, #22c55e 16%, transparent); color: #15803d; }
.pill.neu { background: var(--chip); color: var(--muted); }
.pill.neg { background: color-mix(in srgb, #ef4444 15%, transparent); color: #b91c1c; }
.mood-bar { display: flex; height: 6px; margin: 0 14px 8px; border-radius: 999px; overflow: hidden; background: var(--chip); }
.mood-bar span { animation: grow 5s ease-in-out infinite alternate; }
.mood-bar .pos { background: #22c55e; --w: 72%; }
.mood-bar .neu { background: #a1a1aa; --w: 18%; }
.mood-bar .neg { background: #ef4444; --w: 10%; }
.insight {
  display: flex; align-items: center; gap: 12px; margin: 18px auto 0; max-width: 760px; padding: 12px 16px;
  border-radius: 14px; background: var(--card); border: 1px solid color-mix(in srgb, #8134af 30%, var(--line));
  box-shadow: 0 10px 30px rgba(129, 52, 175, 0.1); text-align: left; min-height: 48px;
}
.ai-badge {
  flex: none; font-size: 12px; font-weight: 800; color: #fff; border-radius: 999px; padding: 4px 10px;
  background: linear-gradient(135deg, #dd2a7b, #8134af);
}
.typed { font-size: 14.5px; }
.caret { display: inline-block; width: 2px; height: 1em; margin-left: 2px; vertical-align: -2px; background: currentColor; animation: blink 1s steps(1) infinite; }
.suggest { margin: 26px 0 0; text-align: left; }
.sg-title { margin: 0 0 10px; font-size: 14px; font-weight: 700; }
.sg-track { mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
.scroll-x { display: flex; gap: 12px; width: max-content; animation: left 30s linear infinite; }
.scroll-x li {
  width: 140px; flex: none; background: var(--card); border: 1px solid var(--line); border-radius: 14px;
  padding: 16px 10px 12px; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 13px;
}
.scroll-x li b { margin-top: 6px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.scroll-x li small { color: var(--muted); font-size: 11.5px; }
.follow { margin-top: 8px; width: 100%; text-align: center; background: #0095f6; color: #fff; font-weight: 700; font-size: 12.5px; border-radius: 8px; padding: 6px 0; }
.sg-track:hover .scroll-x { animation-play-state: paused; }

@keyframes up { to { transform: translateY(-50%); } }
@keyframes left { to { transform: translateX(calc(-50% - 6px)); } }
@keyframes dash { to { background-position: 20px 0; } }
@keyframes blink { 50% { opacity: 0.45; } }
@keyframes grow { from { width: calc(var(--w) * 0.6); } to { width: var(--w); } }
@media (prefers-reduced-motion: reduce) {
  .scroll-y, .scroll-x, .arrow span, .live, .mood-bar span, .caret { animation: none; }
  .mood-bar span { width: var(--w); }
}
@media (max-width: 720px) {
  .stage { grid-template-columns: 1fr; }
  .arrow, .sheet { display: none; }
  .phone { max-width: 320px; width: 100%; margin: 0 auto; height: 260px; }
}
</style>
