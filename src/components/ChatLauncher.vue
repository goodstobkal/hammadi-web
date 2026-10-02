<script setup lang="ts">
/** Floating "Chat with us" box. Messages go to the team's Telegram (a human,
 * not an AI) and replies appear here; if the visitor leaves an email, replies
 * are emailed too. The conversation token lives in localStorage. */
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { API_BASE } from '../lib/site'
import { PRODUCTS } from '../lib/products'
import { track } from '../lib/analytics'

type Msg = { from: 'visitor' | 'owner'; text: string; at: string }
const KEY = 'support_chat_token'
const open = ref(false)
const msgs = ref<Msg[]>([])
const text = ref('')
const email = ref('')
const hp = ref('')
const sending = ref(false)
const err = ref('')
const list = ref<HTMLElement | null>(null)
let timer: ReturnType<typeof setInterval> | undefined

// Small UI sounds, synthesised with Web Audio (no files). Only after the
// visitor has interacted (opening the chat), as browsers require.
let ctx: AudioContext | null = null
function tone(freqs: number[], dur = 0.12, gap = 0.09, vol = 0.07) {
  try {
    ctx = ctx || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    freqs.forEach((f, i) => {
      const o = ctx!.createOscillator()
      const g = ctx!.createGain()
      const t = ctx!.currentTime + i * gap
      o.type = 'sine'
      o.frequency.value = f
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(vol, t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      o.connect(g).connect(ctx!.destination)
      o.start(t)
      o.stop(t + dur + 0.02)
    })
  } catch {
    /* no audio support */
  }
}
const chime = () => tone([880, 1320], 0.18, 0.11)   // a reply arrived
const tick = () => tone([660], 0.06, 0, 0.05)          // message sent
const pop = () => tone([520, 780], 0.08, 0.06, 0.05)  // chat opened

// Turn URLs in a message into links; our own product pages become buttons.
type Part = { t: 'text' | 'link' | 'button'; v: string; href?: string }
const LABELS: Record<string, string> = {
  '/services/influencer-lists': '🎯 Order an influencer list',
  '/services/profile-pack': '📦 Order a profile pack',
  '/services/reel-analysis': '🎬 Order a reel analysis',
}
// Stripe Payment Links -> "💳 Pay $99 · 500 influencers + emails" buttons.
const PAY: Record<string, string> = {}
for (const p of PRODUCTS) for (const k of p.packs) PAY[k.url] = `💳 Pay $${k.price} · ${k.name}${k.note.startsWith('+') ? ' ' + k.note.replace('+ public ', '+ ').split(' · ')[0] : ''}`
function parts(text: string): Part[] {
  const out: Part[] = []
  let last = 0
  for (const m of text.matchAll(/https?:\/\/[^\s<>"]+[^\s<>".,;:!?)]/g)) {
    const url = m[0]
    if (m.index! > last) out.push({ t: 'text', v: text.slice(last, m.index) })
    let path = ''
    try {
      const u = new URL(url)
      if (u.hostname.endsWith('hammadi.dev')) path = u.pathname.replace(/\/$/, '')
    } catch {
      /* not a URL after all */
    }
    if (PAY[url]) out.push({ t: 'button', v: PAY[url], href: url })
    else out.push(LABELS[path] ? { t: 'button', v: LABELS[path], href: path } : { t: 'link', v: url, href: url })
    last = m.index! + url.length
  }
  if (last < text.length) out.push({ t: 'text', v: text.slice(last) })
  return out
}

function token(): string {
  try {
    return localStorage.getItem(KEY) || ''
  } catch {
    return ''
  }
}

async function scrollDown() {
  await nextTick()
  if (list.value) list.value.scrollTop = list.value.scrollHeight
}

async function refresh() {
  const t = token()
  if (!t) return
  try {
    const r = await fetch(`${API_BASE}/public/v1/support-chat/messages?token=${encodeURIComponent(t)}`)
    if (r.ok) {
      const d = await r.json()
      if (d.messages.length !== msgs.value.length) {
        const gotReply = d.messages.length > msgs.value.length && d.messages[d.messages.length - 1].from === 'owner'
        if (gotReply && msgs.value.length) chime()
        msgs.value = d.messages
        scrollDown()
      }
    }
  } catch {
    /* offline; try again next tick */
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) {
    pop()
    track('chat_launcher', { meta: { from: 'button' } })
    refresh()
    timer = setInterval(refresh, 5000)
  } else if (timer) clearInterval(timer)
}

async function send() {
  const t = text.value.trim()
  if (!t || sending.value) return
  if (!msgs.value.length && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    err.value = 'Please add your email first, so we can reply to you.'
    return
  }
  sending.value = true
  err.value = ''
  try {
    const r = await fetch(`${API_BASE}/public/v1/support-chat/send`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: t, token: token(), email: email.value, page: location.pathname, website: hp.value }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(typeof d.detail === 'string' ? d.detail : 'Could not send. Please try again.')
    try {
      localStorage.setItem(KEY, d.token)
    } catch {
      /* storage blocked: the chat still works this session */
    }
    tick()
    const autoReplied = d.messages.length && d.messages[d.messages.length - 1].from === 'owner'
    msgs.value = d.messages
    text.value = ''
    scrollDown()
    if (autoReplied) setTimeout(chime, 450)
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Could not send.'
  } finally {
    sending.value = false
  }
}

onBeforeUnmount(() => timer && clearInterval(timer))
</script>

<template>
  <div class="launcher">
    <Transition name="pop">
      <div v-if="open" class="panel" role="dialog" aria-label="Chat with us">
        <div class="head">
          <div><b>Chat with us</b><small>Usually replies within a few hours</small></div>
          <button class="x" aria-label="Close" @click="toggle">×</button>
        </div>
        <div ref="list" class="msgs">
          <p class="m owner">👋 Hi! Questions about a report, a custom influencer list, or something else? Write us here.</p>
          <p v-for="(m, i) in msgs" :key="i" class="m" :class="m.from">
            <template v-for="(p, j) in parts(m.text)" :key="j">
              <a v-if="p.t === 'button'" :href="p.href" class="mbtn">{{ p.v }} →</a>
              <a v-else-if="p.t === 'link'" :href="p.href" target="_blank" rel="noopener nofollow" class="mlink">{{ p.v }}</a>
              <template v-else-if="p.v.trim()">{{ p.v }}</template>
            </template>
          </p>
        </div>
        <form class="form" @submit.prevent="send">
          <input v-if="!msgs.length" v-model="email" type="email" required placeholder="Your email (required, for our reply)" autocomplete="email" />
          <input v-model="hp" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true" />
          <div class="row">
            <textarea v-model="text" rows="2" maxlength="2000" placeholder="Write a message…" @keydown.enter.exact.prevent="send"></textarea>
            <button type="submit" :disabled="sending || !text.trim() || (!msgs.length && !email.trim())" aria-label="Send">➤</button>
          </div>
          <p v-if="err" class="err">{{ err }}</p>
        </form>
      </div>
    </Transition>
    <button class="btn" :aria-label="open ? 'Close chat' : 'Chat with us'" @click="toggle">
      <span class="ring" aria-hidden="true"></span>
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <path fill="currentColor" d="M12 3c5 0 9 3.6 9 8s-4 8-9 8c-1 0-2-.1-2.9-.4L4.5 20.5l1.2-3.7C4 15.3 3 13.3 3 11c0-4.4 4-8 9-8z" />
      </svg>
      <span class="label">Chat with us</span>
    </button>
  </div>
</template>

<style scoped>
.launcher { position: fixed; right: 20px; bottom: 20px; z-index: 55; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
.btn {
  position: relative; display: inline-flex; align-items: center; gap: 8px; height: 54px; padding: 0 18px; border: 0;
  border-radius: 999px; color: #fff; font: inherit; font-weight: 700; font-size: 15px; cursor: pointer;
  background: linear-gradient(135deg, #f58529, #dd2a7b 45%, #8134af); background-size: 200% 200%; animation: shift 6s ease infinite;
  box-shadow: 0 10px 28px rgba(221, 42, 123, 0.35);
}
.btn:hover { transform: translateY(-2px); }
.ring { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; animation: pulse 2.4s ease-out infinite; }
.panel {
  width: min(360px, calc(100vw - 32px)); height: min(480px, calc(100vh - 120px)); display: flex; flex-direction: column;
  background: var(--card); color: var(--fg); border: 1px solid var(--line); border-radius: 18px; overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}
.head { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; color: #fff; background: linear-gradient(135deg, #dd2a7b, #8134af); }
.head small { display: block; font-size: 12px; opacity: 0.85; }
.x { border: 0; background: none; color: #fff; font-size: 24px; cursor: pointer; line-height: 1; }
.msgs { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.m { margin: 0; max-width: 85%; padding: 9px 12px; border-radius: 14px; font-size: 14.5px; white-space: pre-line; word-break: break-word; }
.m.owner { align-self: flex-start; background: var(--chip); border-bottom-left-radius: 4px; }
.m.visitor { align-self: flex-end; background: var(--accent); color: #fff; border-bottom-right-radius: 4px; }
.mbtn { display: block; margin: 6px 0 2px; padding: 8px 12px; border-radius: 999px; background: var(--accent); color: #fff !important; font-weight: 700; font-size: 13.5px; text-align: center; text-decoration: none; }
.mbtn:hover { filter: brightness(1.08); }
.mlink { color: inherit; text-decoration: underline; word-break: break-all; }
.m.visitor .mlink { color: #fff; }
.form { border-top: 1px solid var(--line); padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.form input, .form textarea { width: 100%; border: 1px solid var(--line); border-radius: 10px; padding: 9px 10px; background: var(--bg); color: var(--fg); font: inherit; font-size: 14px; }
.form textarea { resize: none; }
.hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
.row { display: flex; gap: 8px; align-items: flex-end; }
.row button { flex: none; width: 42px; height: 42px; border: 0; border-radius: 50%; background: var(--accent); color: #fff; font-size: 16px; cursor: pointer; }
.row button:disabled { opacity: 0.5; cursor: not-allowed; }
.err { margin: 0; color: #dc2626; font-size: 13px; }
.pop-enter-active, .pop-leave-active { transition: opacity 0.2s, transform 0.2s; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(10px) scale(0.98); }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(221, 42, 123, 0.45); } 70%, 100% { box-shadow: 0 0 0 14px rgba(221, 42, 123, 0); } }
@keyframes shift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@media (prefers-reduced-motion: reduce) { .btn, .ring { animation: none; } }
@media (max-width: 640px) { .launcher { right: 16px; bottom: 16px; } .label { display: none; } .btn { width: 54px; padding: 0; justify-content: center; } }
</style>
