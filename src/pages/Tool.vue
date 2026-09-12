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
    a: `Yes - ${limits.per_hour} lookups an hour with no account and no sign-up. For higher volume or to call it from your own code, use the API.`,
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
      { name: 'Free tools', path: '/tools' },
      { name: tool.value?.title || 'Not found', path: path.value },
    ]),
  ],
})
</script>

<template>
  <div v-if="!tool">
    <h1>Tool not found</h1>
    <p>That tool doesn't exist. See <RouterLink to="/tools">all free tools</RouterLink>.</p>
  </div>

  <article v-else class="tool">
    <p class="eyebrow">
      <RouterLink to="/tools">Free tools</RouterLink> · {{ tool.category }}
    </p>
    <h1>{{ tool.title }}</h1>
    <p class="lede">{{ tool.tagline }}</p>

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
      no hourly limit, higher counts and a response you can pipe straight into your code. The
      <a :href="GUIDES_URL">guides</a> have copy-paste Python for the common jobs.
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
</style>
