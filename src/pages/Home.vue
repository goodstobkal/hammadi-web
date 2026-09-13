<script setup lang="ts">
import UseCaseBox from '../components/UseCaseBox.vue'
import catalog from '../catalog.json'
import type { Tool } from '../lib/api'
import { GUIDES_URL, LISTING_URL, SITE_NAME, SITE_URL, useSeo } from '../lib/site'

const tools = catalog.tools as Tool[]
const limits = catalog.limits as { per_hour: number }
const pinned = tools.filter((t) => t.pinned)
const categories = [...new Set(tools.map((t) => t.category))]

useSeo({
  title: `Free Instagram Data Tools - Posts, Reels, Comments & Followers | ${SITE_NAME}`,
  description:
    'Free browser tools to view and export public Instagram data: profile posts, reels with view counts, comments, tagged posts, followers, stories and keyword search. No login, instant results, Excel and CSV export.',
  path: '/',
  jsonld: [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description: 'Free Instagram data tools and API guides.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Free Instagram tools',
      itemListElement: tools.map((tool, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: tool.title,
        url: `${SITE_URL}/tools/${tool.slug}`,
      })),
    },
  ],
})
</script>

<template>
  <div class="home">
    <section class="hero">
      <h1>Free Instagram data tools</h1>
      <p class="lede">
        Look up any public Instagram profile, post or keyword and get the data as a table you can
        sort and export. No login, no sign-up, no browser extension — {{ limits.per_hour }} free
        lookups an hour.
      </p>
      <p>
        <RouterLink class="cta" to="/tools">Browse the tools</RouterLink>
        <a class="ghost" :href="LISTING_URL" rel="noopener">Or get the API →</a>
      </p>
    </section>

    <section class="featured">
      <h2>New tools</h2>
      <ul class="cards">
        <li>
          <a href="/engagement-rate-calculator">
            <h3>📊 Engagement rate calculator</h3>
            <p>Any account's real engagement rate from recent posts, plus a sponsored-post price estimate.</p>
          </a>
        </li>
        <li>
          <a href="/profile-analyzer">
            <h3>🔬 Profile analyzer</h3>
            <p>Average likes, comments and views, posting cadence, best day &amp; hour, and content mix.</p>
          </a>
        </li>
        <li>
          <a href="/reels-finder">
            <h3>🎬 Reels finder + player</h3>
            <p>Search reels by keyword, then play and download any result in Instagram's own player.</p>
          </a>
        </li>
        <li>
          <a href="/giveaway-winner-picker">
            <h3>🎁 Giveaway winner picker</h3>
            <p>Paste a post or reel and draw a fair, random comment winner — dedupe, keyword and tag rules.</p>
          </a>
        </li>
        <li>
          <a href="/fake-follower-check">
            <h3>🕵️ Fake follower check</h3>
            <p>Sample an account's followers for a quick audience-quality score.</p>
          </a>
        </li>
        <li>
          <a href="/hashtag-generator">
            <h3># Hashtag generator</h3>
            <p>The hashtags creators actually use on reels for your topic, ranked by frequency.</p>
          </a>
        </li>
        <li>
          <a href="/instagram-video-downloader">
            <h3>⬇ Video downloader</h3>
            <p>Play any public reel or post in Instagram's player and download the video.</p>
          </a>
        </li>
        <li>
          <a href="/instagram-email-finder">
            <h3>📧 Email finder</h3>
            <p>Get a creator's public contact email from their profile URL.</p>
          </a>
        </li>
        <li>
          <a href="/instagram-audience-checker">
            <h3>👥 Audience checker</h3>
            <p>Sample an account's followers — verified/private breakdown and notable followers.</p>
          </a>
        </li>
        <li>
          <a href="/instagram-profile-viewer">
            <h3>🖼️ Profile viewer</h3>
            <p>Open any public profile full-screen — bio, stats and a grid of recent posts.</p>
          </a>
        </li>
        <li>
          <a href="/lookalike-audience-finder">
            <h3>🎯 Lookalike audience finder</h3>
            <p>Find the accounts that share a profile's audience — your best targets for outreach and collabs.</p>
          </a>
        </li>
        <li>
          <a href="/chrome-extension">
            <h3>🧩 Chrome extension</h3>
            <p>Export all comments from a post/reel, or all posts from a profile, to CSV — right in your browser.</p>
          </a>
        </li>
        <li>
          <a href="/deep-search/influencers">
            <h3>🔎 Deep influencer search</h3>
            <p>Search millions of creators by niche, country, size and engagement. Request early access.</p>
          </a>
        </li>
        <li>
          <a href="/deep-search/videos">
            <h3>🎥 Deep video search</h3>
            <p>Find top reels by keyword, newest-first, ranked by views. Request early access.</p>
          </a>
        </li>
      </ul>
    </section>

    <section v-if="pinned.length" class="pinned">
      <h2>Most used</h2>
      <ul class="cards">
        <li v-for="tool in pinned" :key="tool.slug">
          <RouterLink :to="`/tools/${tool.slug}`">
            <h3>{{ tool.title }}</h3>
            <p>{{ tool.tagline }}</p>
          </RouterLink>
        </li>
      </ul>
    </section>

    <UseCaseBox />

    <section v-for="category in categories" :key="category">
      <h2>{{ category }} tools</h2>
      <ul class="cards">
        <li v-for="tool in tools.filter((t) => t.category === category)" :key="tool.slug">
          <RouterLink :to="`/tools/${tool.slug}`">
            <h3>{{ tool.title }}</h3>
            <p>{{ tool.tagline }}</p>
          </RouterLink>
        </li>
      </ul>
    </section>

    <section>
      <h2>Why these are free</h2>
      <p>
        They run on the same scraping infrastructure as the
        <a :href="LISTING_URL" rel="noopener">Instagram Scraper API</a>, a paid API for developers.
        The tools here are the free way to try that data before you write any code — and often all
        you need for a one-off lookup. When you want it in your own app, on a schedule, or at
        volume, the API is the same data as JSON without the hourly limit.
      </p>
      <p>
        The <a :href="GUIDES_URL">guides</a> walk through the common jobs with copy-paste Python:
        tracking reels performance, finding UGC, vetting influencers, exporting comments for
        analysis and monitoring competitors.
      </p>
    </section>

    <section>
      <h2>Common questions</h2>
      <h3>Do I need an Instagram account?</h3>
      <p>No. Nothing here asks you to log in, and the account you look up is never notified.</p>
      <h3>Can I export what I find?</h3>
      <p>Yes — every result table exports to Excel (.xlsx), CSV or JSON.</p>
      <h3>Does it work on private accounts?</h3>
      <p>No. Only public profiles and posts are readable; private accounts return an error.</p>
      <h3>Is there a limit?</h3>
      <p>
        {{ limits.per_hour }} lookups an hour per visitor, which is plenty for research and
        one-offs. Use the API when you need more.
      </p>
    </section>
  </div>
</template>

<style scoped>
.hero {
  padding: 40px 0 8px;
}
h1 {
  font-size: clamp(32px, 6vw, 48px);
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin: 0 0 14px;
}
.lede {
  font-size: 19px;
  color: var(--muted);
  max-width: 46em;
  margin: 0 0 24px;
}
.cta {
  display: inline-block;
  background: var(--accent);
  color: #fff;
  border-radius: 10px;
  padding: 12px 22px;
  text-decoration: none;
  font-weight: 600;
}
.ghost {
  margin-left: 16px;
  color: var(--muted);
  text-decoration: none;
}
.ghost:hover {
  color: var(--fg);
}
h2 {
  font-size: 22px;
  margin: 48px 0 14px;
}
h3 {
  font-size: 17px;
  margin: 22px 0 4px;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.cards a {
  display: block;
  height: 100%;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 20px;
  text-decoration: none;
  color: inherit;
}
.cards a:hover {
  border-color: var(--accent);
}
.pinned .cards a {
  border-color: var(--accent);
  border-width: 2px;
}
.cards h3 {
  margin: 0 0 6px;
  font-size: 17px;
}
.cards p {
  margin: 0;
  color: var(--muted);
  font-size: 15px;
}
</style>
