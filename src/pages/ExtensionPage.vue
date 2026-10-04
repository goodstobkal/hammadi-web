<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { SITE_NAME, SITE_URL, useSeo } from '../lib/site'
import { getExtension } from '../lib/extensions'
import WaitlistForm from '../components/WaitlistForm.vue'

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))
const ext = computed(() => getExtension(slug.value))

useSeo({
  title: ext.value
    ? `${ext.value.name} — ${SITE_NAME}`
    : `Extension — ${SITE_NAME}`,
  description: ext.value?.short || 'A free Chrome extension that runs in your own tab.',
  path: `/extensions/${slug.value}`,
  jsonld: ext.value
    ? [
        {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: ext.value.name,
          applicationCategory: 'BrowserApplication',
          operatingSystem: 'Chrome',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          url: `${SITE_URL}/extensions/${slug.value}`,
        },
      ]
    : [],
})
</script>

<template>
  <main class="wrap" v-if="ext">
    <RouterLink to="/" class="back">← All extensions</RouterLink>
    <header class="head">
      <div class="emoji">{{ ext.emoji }}</div>
      <h1>{{ ext.name }}</h1>
      <p class="tag">{{ ext.tagline }}</p>
    </header>

    <ul class="feat">
      <li v-for="b in ext.bullets" :key="b">{{ b }}</li>
    </ul>

    <section class="act">
      <a
        v-if="ext.status === 'live' && ext.storeUrl"
        class="cta"
        :href="ext.storeUrl"
        target="_blank"
        rel="noopener"
        >Add to Chrome — free →</a
      >
      <div v-else class="soon">
        <h2>Coming soon</h2>
        <p>We're gauging interest before we launch this one. Leave your email and you'll be
          first to know — and help it jump the queue.</p>
        <WaitlistForm :slug="ext.slug" :ext-name="ext.name" />
      </div>
    </section>

    <section class="why">
      <div><b>🔒 Private</b><span>Runs in your own browser. We don't see or store your data.</span></div>
      <div><b>⚡ Instant</b><span>One click, results in your tab, export to CSV/Excel.</span></div>
      <div><b>🆓 Free</b><span>No login, no payment. Install and go.</span></div>
    </section>
  </main>

  <main class="wrap missing" v-else>
    <h1>Extension not found</h1>
    <p>That extension doesn't exist (yet). <RouterLink to="/">See all extensions →</RouterLink></p>
  </main>
</template>

<style scoped>
.wrap { max-width: 760px; margin: 0 auto; padding: 24px 18px 64px; }
.back { color: var(--muted, #9a7f90); text-decoration: none; font-size: 14px; }
.back:hover { color: var(--fg, #2a1a24); }
.head { text-align: center; padding: 18px 0 6px; }
.emoji { font-size: 46px; }
.head h1 { font-size: clamp(26px, 4vw, 36px); margin: 8px 0; }
.tag { color: var(--muted, #6b5260); font-size: 17px; max-width: 560px; margin: 0 auto; }
.feat { max-width: 440px; margin: 24px auto; padding-left: 20px; line-height: 1.9; font-size: 15px; }
.act { margin: 8px auto 0; max-width: 520px; }
.cta { display: block; text-align: center; background: linear-gradient(135deg, #f58529, #dd2a7b 60%, #8134af); color: #fff; text-decoration: none; font-weight: 800; padding: 14px 20px; border-radius: 999px; }
.soon { border: 1px solid var(--line, #eadfe6); border-radius: 18px; padding: 22px; background: var(--card, #fff); display: flex; flex-direction: column; }
.soon h2 { margin: 0 0 6px; font-size: 20px; }
.soon p { color: var(--muted, #6b5260); font-size: 14.5px; margin: 0 0 16px; }
.why { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 36px; }
.why div { border: 1px solid var(--line, #eadfe6); border-radius: 14px; padding: 14px; }
.why b { display: block; margin-bottom: 4px; }
.why span { color: var(--muted, #6b5260); font-size: 13.5px; }
.missing { text-align: center; }
</style>
