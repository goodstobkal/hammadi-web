<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolRunner from '../components/ToolRunner.vue'
import catalog from '../catalog.json'
import type { Tool } from '../lib/api'
import { GUIDES_URL, LISTING_URL, SITE_NAME, SITE_URL, breadcrumbs, useSeo } from '../lib/site'

const route = useRoute()
const tools = catalog.tools as Tool[]
const limits = catalog.limits as { per_hour: number; per_day: number; max_count: number }

// A slug that isn't in the catalog can only be reached by client-side
// navigation (nginx 404s the URL), but the page must not blow up on it.
const tool = computed(() => tools.find((t) => t.slug === route.params.slug) as Tool | undefined)
const related = computed(() =>
  tools.filter((t) => t.slug !== tool.value?.slug && t.category === tool.value?.category).slice(0, 4),
)
const path = computed(() => `/tools/${route.params.slug}`)

// Tool-specific questions first (they carry the long-tail search intent),
// then the ones every tool shares.
const faq = computed(() => [
  ...((tool.value?.faq || []) as { q: string; a: string }[]),
  {
    q: `Is the ${(tool.value?.title || 'tool').toLowerCase()} free?`,
    a: `Yes. Create a free account and you get 10 lookups a month, no card needed. Paid plans start at $2 a month, and the API is there for higher volume or your own code.`,
  },
  {
    q: 'Do I need to log in to Instagram?',
    a: 'No. Nothing is asked of your Instagram account, and nothing you do here is visible to the account you look up.',
  },
  {
    q: 'Can I export the results?',
    a: 'Yes. Every result table exports to Excel (.xlsx), CSV for Google Sheets, or JSON for code.',
  },
  {
    q: 'Does it work on private accounts?',
    a: 'No. Only public profiles and posts can be read - private accounts return an error.',
  },
])

useSeo({
  title: tool.value ? `${tool.value.title} - Free, No Login | ${SITE_NAME}` : 'Tool not found',
  description: tool.value?.description || 'That tool does not exist.',
  path: path.value,
  jsonld: [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.value?.title,
      url: `${SITE_URL}${path.value}`,
      description: tool.value?.description,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
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

// Paid one-off exports: Stripe Payment Link, link entered at checkout, Excel by email.
const PAY: Record<string, { title: string; sub: string; url: string }> = {
  'export-instagram-comments': {
    title: 'Get every comment by email · $1',
    sub: 'All comments and replies (up to 5,000) with usernames, likes, dates and sentiment, as Excel. Paste the post link at checkout.',
    url: 'https://buy.stripe.com/00w5kwcN6aebgXx9cHcbC0b',
  },
  'instagram-posts': {
    title: 'Get every post by email · $1',
    sub: 'All posts of a profile (up to 500) with likes, comments, views and captions, as Excel. Enter the profile at checkout.',
    url: 'https://buy.stripe.com/9B6cMY7sM9a7fTtex1cbC0c',
  },
}
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
    <h1>{{ tool.title }}</h1>
    <p class="lede">{{ tool.tagline }}</p>

    <a v-if="PAY[tool.slug]" class="paybox" :href="PAY[tool.slug].url" rel="noopener">
      <span><b>{{ PAY[tool.slug].title }}</b>{{ PAY[tool.slug].sub }}</span>
      <span class="paybtn">Buy · $1 →</span>
    </a>
    <p v-if="PAY[tool.slug]" class="paynote">Or try a quick preview below.</p>
    <ToolRunner :tool="tool" :limits="limits" />

    <h2>What this tool does</h2>
    <p>{{ tool.description }}</p>

    <h2>How to use it</h2>
    <ol>
      <li v-for="field in tool.fields.filter((f) => f.required)" :key="field.name">
        Enter the {{ field.label.toLowerCase() }}<span v-if="field.help"> — {{ field.help.toLowerCase() }}</span>.
      </li>
      <li>Press <strong>Run it</strong> and wait a few seconds while the data is fetched live.</li>
      <li>Sort through the table, then export it to Excel, CSV or JSON.</li>
    </ol>

    <h2>Frequently asked questions</h2>
    <div v-for="item in faq" :key="item.q">
      <h3>{{ item.q }}</h3>
      <p>{{ item.a }}</p>
    </div>

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
.paybox { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 20px; margin: 18px 0 6px; padding: 18px 20px;
  border-radius: 18px; text-decoration: none; color: inherit; border: 2px solid var(--accent);
  background: linear-gradient(120deg, color-mix(in srgb, var(--accent) 10%, var(--card)), var(--card)); }
.paybox b { display: block; font-size: 19px; margin-bottom: 4px; }
.paybox span:first-child { flex: 1 1 320px; color: var(--muted); font-size: 14.5px; }
.paybox b { color: var(--fg); }
.paybtn { white-space: nowrap; background: linear-gradient(135deg, #f58529, #dd2a7b 55%, #8134af); color: #fff; font-weight: 800; border-radius: 999px; padding: 12px 22px; }
.paynote { margin: 4px 0 14px; color: var(--muted); font-size: 13.5px; }
</style>
