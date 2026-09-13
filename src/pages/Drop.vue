<script setup lang="ts">
/**
 * Paste a screenshot, get back a path.
 *
 * The clipboard hands over an image as bytes with no filename, so the blob
 * is POSTed raw rather than wrapped in a form. The response carries the
 * path the file landed on server-side, which is the whole point: it can be
 * opened there directly instead of being described second-hand.
 *
 * Not in the nav, not in the sitemap, and robots disallows it - this is a
 * utility, not a page anyone should find by searching.
 */
import { ref } from 'vue'
import { API_BASE, SITE_NAME, useSeo } from '../lib/site'

type Drop = { name: string; url: string; path: string; bytes: number; type: string }

/** The Reddit ad checklist, kept here so it's readable next to Ads Manager
 *  rather than scrolled back to in a chat log. */
const SITE = 'https://hammadi.dev'
const ads = [
  {
    id: 'A',
    name: 'nano-influencer finder',
    image: '/drop/ad-a-free-tools.png',
    headline: '16 free Instagram tools — no login, no signup',
    dest: `${SITE}/tools?utm_source=reddit&utm_medium=cpc&utm_campaign=nano-influencers&utm_content=ad-a`,
  },
  {
    id: 'B',
    name: 'comments exporter',
    image: '/drop/ad-b-comments.png',
    headline: 'Get every comment on an Instagram post, not just the first 25',
    dest: `${SITE}/tools/export-instagram-comments?utm_source=reddit&utm_medium=cpc&utm_campaign=nano-influencers&utm_content=ad-b`,
  },
  {
    id: 'C',
    name: 'reels finder',
    image: '/drop/ad-c-reels.png',
    headline: "Instagram's reel search is useless. This one works.",
    dest: `${SITE}/tools/instagram-reels-search?utm_source=reddit&utm_medium=cpc&utm_campaign=nano-influencers&utm_content=ad-c`,
  },
]

const drops = ref<Drop[]>([])
const error = ref('')
const busy = ref(false)
const dragging = ref(false)

useSeo({
  title: `Drop an image | ${SITE_NAME}`,
  description: 'Paste a screenshot and get a path back.',
  path: '/drop',
})

async function upload(blob: Blob) {
  if (!blob.type.startsWith('image/')) {
    error.value = 'That is not an image.'
    return
  }
  busy.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE}/public/v1/drop`, {
      method: 'POST',
      headers: { 'content-type': blob.type },
      body: blob,
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      const d = (body.detail && typeof body.detail === 'object' ? body.detail : body) as {
        error?: string
      }
      throw new Error(d.error || `Upload failed (${res.status})`)
    }
    drops.value.unshift(body as Drop)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Upload failed.'
  } finally {
    busy.value = false
  }
}

function onPaste(e: ClipboardEvent) {
  const items = Array.from(e.clipboardData?.items || [])
  for (const item of items) {
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file) {
        e.preventDefault()
        void upload(file)
        return
      }
    }
  }
}

function onDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) void upload(file)
}

function copy(text: string) {
  void navigator.clipboard?.writeText(text)
}

function kb(n: number) {
  return n > 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.round(n / 1000)} KB`
}
</script>

<template>
  <div class="drop" @paste="onPaste">
    <h1>Drop an image</h1>
    <p class="lede">
      Paste a screenshot anywhere on this page (<kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>V</kbd>), or drop
      a file below. You get back a path on the server.
    </p>

    <div
      :class="['zone', { dragging, busy }]"
      tabindex="0"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <span v-if="busy">Uploading…</span>
      <span v-else>Paste or drop an image here</span>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <section class="ads">
      <h2>Reddit ad checklist</h2>
      <p class="dim">
        Four changes per ad in Ads Manager. The destination URL is the one that matters — without
        it nothing can be attributed. Also tick <strong>Add source parameter</strong> on each.
      </p>

      <article v-for="ad in ads" :key="ad.id" class="ad">
        <img :src="ad.image" :alt="`Ad ${ad.id} creative`" />
        <dl>
          <dt>Ad</dt>
          <dd>{{ ad.id }} — {{ ad.name }}</dd>
          <dt>Headline</dt>
          <dd>
            {{ ad.headline }}
            <button type="button" @click="copy(ad.headline)">Copy</button>
          </dd>
          <dt>Destination URL</dt>
          <dd>
            <code>{{ ad.dest }}</code>
            <button type="button" @click="copy(ad.dest)">Copy</button>
          </dd>
          <dt>Image</dt>
          <dd>
            <a :href="ad.image" download>Download creative</a>
            <span class="dim"> · 1200×628</span>
          </dd>
        </dl>
      </article>
    </section>

    <ul v-if="drops.length" class="list">
      <li v-for="d in drops" :key="d.name">
        <a :href="d.url" target="_blank" rel="noopener"><img :src="d.url" :alt="d.name" /></a>
        <div class="meta">
          <code>{{ d.path }}</code>
          <button type="button" @click="copy(d.path)">Copy path</button>
          <span class="dim">{{ d.type }} · {{ kb(d.bytes) }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.drop {
  max-width: 46em;
}
h1 {
  font-size: clamp(26px, 4vw, 34px);
  margin: 0 0 10px;
}
.lede {
  color: var(--muted);
  margin: 0 0 20px;
}
kbd {
  background: var(--chip);
  border: 1px solid var(--line);
  border-radius: 5px;
  padding: 1px 6px;
  font-size: 13px;
}
.zone {
  border: 2px dashed var(--line);
  border-radius: 14px;
  padding: 56px 20px;
  text-align: center;
  color: var(--muted);
  background: var(--card);
}
.zone.dragging {
  border-color: var(--accent);
  color: var(--fg);
}
.zone.busy {
  opacity: 0.6;
}
.list {
  list-style: none;
  padding: 0;
  margin: 26px 0 0;
  display: grid;
  gap: 18px;
}
.list li {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 14px;
  background: var(--card);
}
.list img {
  max-height: 260px;
  border-radius: 8px;
  display: block;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
}
.meta code {
  font-size: 13px;
  word-break: break-all;
}
.meta button {
  background: var(--accent);
  color: #fff;
  border: 0;
  border-radius: 7px;
  padding: 5px 12px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.dim {
  color: var(--muted);
  font-size: 13px;
}
.error {
  color: #d33;
}
.ads {
  margin-top: 44px;
}
.ads h2 {
  font-size: 20px;
  margin: 0 0 6px;
}
.ad {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  background: var(--card);
}
.ad img {
  width: 100%;
  max-width: 420px;
  border-radius: 8px;
  display: block;
  margin-bottom: 12px;
}
.ad dl {
  margin: 0;
  display: grid;
  grid-template-columns: minmax(120px, auto) 1fr;
  gap: 8px 14px;
  align-items: baseline;
}
.ad dt {
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}
.ad dd {
  margin: 0;
  font-size: 15px;
}
.ad code {
  font-size: 12px;
  word-break: break-all;
}
.ad button {
  background: var(--accent);
  color: #fff;
  border: 0;
  border-radius: 6px;
  padding: 3px 10px;
  margin-left: 8px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
@media (max-width: 640px) {
  .ad dl {
    grid-template-columns: 1fr;
  }
}
</style>
