<script setup lang="ts">
import catalog from '../catalog.json'
import type { Tool } from '../lib/api'
import { LISTING_URL, SITE_NAME, SITE_URL, breadcrumbs, useSeo } from '../lib/site'

const tools = catalog.tools as Tool[]
const pinned = tools.filter((t) => t.pinned)
const categories = [...new Set(tools.map((t) => t.category))]

useSeo({
  title: `All Free Instagram Tools - ${tools.length} Viewers & Exporters | ${SITE_NAME}`,
  description: `${tools.length} cheap tools for public Instagram data: posts, reels, tagged posts, stories, followers, comments, likers, media URLs, keyword and place search. CSV export, no login.`,
  path: '/tools',
  jsonld: [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Cheap Instagram tools',
      numberOfItems: tools.length,
      itemListElement: tools.map((tool, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: tool.title,
        url: `${SITE_URL}/tools/${tool.slug}`,
      })),
    },
    breadcrumbs([{ name: 'Cheap tools', path: '/tools' }]),
  ],
})
</script>

<template>
  <div>
    <h1>Cheap Instagram tools</h1>
    <p class="lede">
      {{ tools.length }} browser tools for public Instagram data — each one runs live, shows a
      sortable table and exports to Excel, CSV or JSON. A free account gets you 10 lookups a month, no card needed.
    </p>

    <section v-if="pinned.length">
      <h2>Most used</h2>
      <ul class="list">
        <li v-for="tool in pinned" :key="tool.slug">
          <RouterLink :to="`/tools/${tool.slug}`">{{ tool.title }}</RouterLink>
          <span> — {{ tool.tagline }}</span>
        </li>
      </ul>
    </section>

    <section>
      <h2>Bulk</h2>
      <ul class="list">
        <li>
          <RouterLink to="/tools/bulk-profile-lookup">Bulk Instagram profile lookup</RouterLink>
          <span> — upload a list of profiles, get followers, bio, category and country for each as Excel</span>
        </li>
        <li>
          <RouterLink to="/tools/download-instagram-profile">Download a full Instagram profile as ZIP</RouterLink>
          <span> — every photo and video from a profile, plus captions and likes, emailed as a ZIP</span>
        </li>
      </ul>
    </section>

    <section v-for="category in categories" :key="category">
      <h2>{{ category }}</h2>
      <ul class="list">
        <li v-for="tool in tools.filter((t) => t.category === category)" :key="tool.slug">
          <RouterLink :to="`/tools/${tool.slug}`">{{ tool.title }}</RouterLink>
          <span> — {{ tool.tagline }}</span>
        </li>
      </ul>
    </section>

    <p class="outro">
      Need any of this inside your own app, on a schedule or at volume? It's all one API call away
      on the <a :href="LISTING_URL" rel="noopener">Instagram Scraper API</a>.
    </p>
  </div>
</template>

<style scoped>
h1 {
  font-size: clamp(28px, 5vw, 40px);
  letter-spacing: -0.02em;
  margin: 0 0 12px;
}
.lede {
  font-size: 19px;
  color: var(--muted);
  max-width: 46em;
}
h2 {
  font-size: 20px;
  margin: 40px 0 10px;
}
.list {
  padding-left: 20px;
}
.list li {
  margin: 10px 0;
}
.list span {
  color: var(--muted);
}
.outro {
  margin-top: 48px;
  color: var(--muted);
}
</style>
