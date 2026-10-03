<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolRunner from '../components/ToolRunner.vue'
import InfluencerOrder from '../components/InfluencerOrder.vue'
import catalog from '../catalog.json'
import type { Tool } from '../lib/api'
import { GUIDES_URL, KEPT_TOOLS, LISTING_URL, SITE_NAME, SITE_URL, breadcrumbs, useSeo } from '../lib/site'

const route = useRoute()
const tools = catalog.tools as Tool[]
const limits = catalog.limits as { per_hour: number; per_day: number; max_count: number }

// A slug that isn't in the catalog can only be reached by client-side
// navigation (nginx 404s the URL), but the page must not blow up on it.
const tool = computed(() => tools.find((t) => t.slug === route.params.slug) as Tool | undefined)
const PAY_SLUGS = new Set(['export-instagram-comments', 'export-instagram-reels', 'instagram-likers', 'instagram-influencer-search', 'instagram-posts', 'instagram-profile-info', 'instagram-following', 'instagram-followers'])
const related = computed(() =>
  tools.filter((t) => t.slug !== tool.value?.slug && KEPT_TOOLS.has(t.slug)).slice(0, 4),
)
const path = computed(() => `/tools/${route.params.slug}`)

// Tool-specific questions first (they carry the long-tail search intent),
// then the ones every tool shares.
const faq = computed(() => [
  // Paid pages skip the old free-tool FAQ (it talked about running the form).
  ...(tool.value && PAY_SLUGS.has(tool.value.slug) ? [] : ((tool.value?.faq || []) as { q: string; a: string }[])),
  ...(tool.value && PAY_SLUGS.has(tool.value.slug) ? [
    { q: 'What exactly do I get?', a: 'An Excel file with every row we can read from Instagram, not a sample: all the columns shown above, ready for Excel or Google Sheets.' },
    { q: 'Can I see a competitor\'s data?', a: 'Yes, for any public account. Nothing is asked of your Instagram login, and the account is never notified.' },
  ] : []),
  {
    q: 'How much does it cost?',
    a: tool.value?.slug === 'instagram-influencer-search'
      ? 'It depends on how many creators you take: 25 for $1, 100 for $3, 500 for $9, 1,000 for $15, 5,000 for $39. Paid once with Stripe, Excel by email, no subscription.'
      : 'One flat price per export ($1 for comments, posts, reels or likers), paid once with Stripe. You get the full result as an Excel file by email. No subscription.',
  },
  {
    q: 'Do I need to log in to Instagram?',
    a: 'No. Nothing is asked of your Instagram account, and nothing you do here is visible to the account you look up.',
  },
  {
    q: 'How fast do I get it?',
    a: 'Usually within minutes of paying. Very large posts or profiles can take up to an hour. If anything goes wrong, reply to the email and we fix it or refund you.',
  },
  {
    q: 'Does it work on private accounts?',
    a: 'No. Only public profiles and posts can be read - private accounts return an error.',
  },
])

// Paid one-off exports: Stripe Payment Link, link entered at checkout, Excel by email.
type Pay = { title: string; sub: string; url: string; btn?: string; h1?: string; price?: string; input?: string; cols?: string[]; rows?: string[][] }
const PAY: Record<string, Pay> = {
  'export-instagram-comments': {
    input: "the post or reel link",
    cols: ["Username", "Comment", "Likes", "Date", "Reply to", "Sentiment"],
    rows: [["@ana.style", "Love this colour! 😍", "214", "2026-09-28", "", "positive"], ["@mike_r", "Where can I buy it?", "37", "2026-09-28", "", "neutral"], ["@brand", "Link in bio 💛", "12", "2026-09-28", "@mike_r", "positive"]],
    h1: 'Get all comments of any Instagram post for $1',
    title: 'Get every comment by email · $1',
    sub: 'All comments and replies (up to 5,000) with usernames, likes, dates and sentiment, as Excel. Paste the post link at checkout.',
    url: 'https://buy.stripe.com/00w5kwcN6aebgXx9cHcbC0b',
  },
  'export-instagram-reels': {
    input: "the profile username or link",
    cols: ["Date", "Plays", "Likes", "Comments", "Caption", "Link"],
    rows: [["2026-09-27", "1,204,880", "88,412", "1,903", "Morning routine ☀️", "instagram.com/reel/…"], ["2026-09-21", "356,019", "21,077", "644", "3 tips for…", "instagram.com/reel/…"]],
    h1: 'Get all reels of any Instagram profile for $1',
    title: 'Get every reel by email · $1',
    sub: 'All reels of a profile (up to 500) with play counts, likes, comments and captions, as Excel. Enter the profile at checkout.',
    url: 'https://buy.stripe.com/00wcMYaEY5XVgXxex1cbC0d',
  },
  'instagram-likers': {
    input: "the post or reel link",
    cols: ["Username", "Full name", "Verified", "Private", "Profile link"],
    rows: [["@sara.k", "Sara K.", "no", "no", "instagram.com/sara.k"], ["@fitwithjo", "Jo Martin", "yes", "no", "instagram.com/fitwithjo"]],
    h1: 'Get all likers of any Instagram post for $1',
    title: 'Get every liker by email · $1',
    sub: 'The accounts that liked a post (up to 1,000) with names and profile links, as Excel. Paste the post link at checkout.',
    url: 'https://buy.stripe.com/4gM00cbJ20DB7mX74zcbC0e',
  },
  'instagram-influencer-search': {
    input: "your filters and how many creators you want",
    cols: ["Username", "Name", "Platform", "Country", "Followers", "Avg views", "Engagement %"],
    rows: [["@glowbyleah", "Leah M.", "instagram", "US", "48,200", "12,400", "4.1"], ["@homewithnina", "Nina R.", "instagram", "US", "112,900", "30,150", "2.7"]],
    h1: 'Find Instagram influencers by niche, country and size, from $1',
    title: 'Influencer list from your filters',
    sub: 'Pick a niche, country and follower range, see how many creators match, and choose how many you want.',
    url: 'https://buy.stripe.com/28EdR24gAeurbDdgF9cbC02',
    price: '$1',
  },
  'instagram-profile-info': {
    h1: 'Get the full profile of any Instagram account for $1',
    title: 'Full profile export by email · $1',
    sub: 'Bio, followers, following, category, website, account country and date joined, engagement rate, plus every post (up to 500) with likes, comments and views, in Excel.',
    url: 'https://buy.stripe.com/cNi5kw9AU5XV8r14WrcbC0l',
    input: 'the username or profile link',
    cols: ['Field', 'Value'],
    rows: [['Followers', '48,200'], ['Engagement rate', '3.4%'], ['Account based in', 'United States'], ['Posts per week', '4.5'], ['Top hashtags', '#skincare #glow']],
  },
  'instagram-following': {
    h1: 'See everyone an Instagram account follows, for $1',
    title: 'Following list by email · $1',
    sub: 'Every account a public profile follows (up to 2,000) with username, name, verified and private flags and profile link, in Excel.',
    url: 'https://buy.stripe.com/9B6bIU8wQgCz8r1ex1cbC0m',
    input: 'the username or profile link',
    cols: ['Username', 'Name', 'Verified', 'Private', 'Profile'],
    rows: [['@glowbyleah', 'Leah M.', 'no', 'no', 'instagram.com/glowbyleah'], ['@brandofficial', 'Brand', 'yes', 'no', 'instagram.com/brandofficial']],
  },
  'instagram-followers': {
    h1: 'Export the followers of any Instagram account for $1',
    title: 'Followers list by email · $1',
    sub: 'Followers of a public profile (up to 2,000, as many as Instagram exposes) with username, name and profile link, in Excel.',
    url: 'https://buy.stripe.com/6oU28keVebif5eP2OjcbC0n',
    input: 'the username or profile link',
    cols: ['Username', 'Name', 'Verified', 'Private', 'Profile'],
    rows: [['@sara.k', 'Sara K.', 'no', 'no', 'instagram.com/sara.k'], ['@fitwithjo', 'Jo Martin', 'yes', 'no', 'instagram.com/fitwithjo']],
  },
  'instagram-posts': {
    input: "the profile username or link",
    cols: ["Date", "Type", "Likes", "Comments", "Views", "Caption", "Link"],
    rows: [["2026-09-29", "carousel", "12,480", "318", "", "New drop 🔥", "instagram.com/p/…"], ["2026-09-25", "video", "8,902", "140", "96,550", "Behind the scenes", "instagram.com/p/…"]],
    h1: 'Get all posts of any Instagram profile for $1',
    title: 'Get every post by email · $1',
    sub: 'All posts of a profile (up to 500) with likes, comments, views and captions, as Excel. Enter the profile at checkout.',
    url: 'https://buy.stripe.com/9B6cMY7sM9a7fTtex1cbC0c',
  },
}

const pay = computed(() => (tool.value ? PAY[tool.value.slug] : undefined))

useSeo({
  title: tool.value ? `${PAY[tool.value.slug]?.h1 || tool.value.title} | ${SITE_NAME}` : 'Tool not found',
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
      offers: { '@type': 'Offer', price: '1', priceCurrency: 'USD' },
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
    <h1>{{ pay?.h1 || tool.title }}</h1>
    <p class="lede">{{ tool.tagline }}</p>

    <template v-if="pay">
      <InfluencerOrder v-if="tool.slug === 'instagram-influencer-search'" :tool="tool" />
      <div v-else class="buy">
        <div class="buy-l">
          <p class="buy-price">{{ pay.price || '$1' }} <small>one-time</small></p>
          <p class="buy-what"><b>{{ pay.title.replace(/ · \$\d+$/, '') }}</b>{{ pay.sub }}</p>
          <ul class="ticks">
            <li>Everything, not a preview</li>
            <li>Excel file in your inbox, usually within minutes</li>
            <li>No account, no subscription</li>
          </ul>
        </div>
        <a class="buy-btn" :href="pay.url" rel="noopener">{{ pay.btn || 'Buy now · $1' }} →</a>
      </div>
      <p v-if="tool.slug !== 'instagram-influencer-search'" class="secure">🔒 Secure checkout by Stripe · Full refund if we can't deliver · Need several? <RouterLink to="/services/bundle">5 exports for $4 →</RouterLink></p>
      <p v-else class="secure">25 for $1 · 100 for $3 · 500 for $9 · 1,000 for $15 · 5,000 for $39. Need their emails? <a href="/services/influencer-lists">Lists with emails →</a></p>

      <h2>What you get</h2>
      <div class="sheet" role="img" :aria-label="`Example of the Excel columns: ${pay.cols?.join(', ')}`">
        <div class="sheet-bar"><span></span><span></span><span></span><b>example.xlsx</b></div>
        <div class="sheet-scroll">
          <table>
            <thead><tr><th v-for="c in pay.cols" :key="c">{{ c }}</th></tr></thead>
            <tbody>
              <tr v-for="(r, i) in pay.rows" :key="i"><td v-for="(v, j) in r" :key="j">{{ v }}</td></tr>
              <tr class="fade"><td v-for="c in pay.cols" :key="c">…</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <h2>How it works</h2>
      <ol class="steps">
        <li v-if="tool.slug === 'instagram-influencer-search'"><b>Set filters, pay from $1</b><span>Choose {{ pay.input }}.</span></li>
        <li v-else><b>Pay {{ pay.price || '$1' }}</b><span>Enter {{ pay.input }} and your email at checkout.</span></li>
        <li><b>We fetch everything</b><span>Live from Instagram, public data only.</span></li>
        <li><b>Get your Excel</b><span>Emailed to you, ready for Excel or Google Sheets.</span></li>
      </ol>

      <h2>Frequently asked questions</h2>
      <div v-for="item in faq" :key="item.q">
        <h3>{{ item.q }}</h3>
        <p>{{ item.a }}</p>
      </div>

      <div v-if="tool.slug !== 'instagram-influencer-search'" class="buy buy-end">
        <p class="buy-what"><b>{{ pay.h1 || pay.title }}</b>Pay once, get the full file by email.</p>
        <a class="buy-btn" :href="pay.url" rel="noopener">{{ pay.btn || 'Buy now · $1' }} →</a>
      </div>
    </template>

    <template v-else>
      <ToolRunner :tool="tool" :limits="limits" />

      <h2>What this tool does</h2>
      <p>{{ tool.description }}</p>

      <h2>Frequently asked questions</h2>
      <div v-for="item in faq" :key="item.q">
        <h3>{{ item.q }}</h3>
        <p>{{ item.a }}</p>
      </div>
    </template>

    <template v-if="!pay">
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

    </template>

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
.buy { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px 24px; margin: 22px 0 8px; padding: 22px 24px;
  border-radius: 20px; border: 2px solid var(--accent);
  background: linear-gradient(120deg, color-mix(in srgb, var(--accent) 10%, var(--card)), var(--card)); }
.buy-l { flex: 1 1 320px; }
.buy-price { margin: 0 0 6px; font-size: 40px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
.buy-price small { font-size: 14px; font-weight: 600; color: var(--muted); letter-spacing: 0; }
.buy-what { margin: 0; color: var(--muted); font-size: 15px; flex: 1 1 300px; }
.buy-what b { display: block; color: var(--fg); font-size: 18px; margin-bottom: 4px; }
.ticks { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 14px; }
.ticks li { margin: 0; }
.ticks li::before { content: '✓ '; color: var(--accent); font-weight: 800; }
.buy-btn { white-space: nowrap; background: linear-gradient(135deg, #f58529, #dd2a7b 55%, #8134af); color: #fff; font-weight: 800; font-size: 17px;
  border-radius: 999px; padding: 15px 28px; text-decoration: none; box-shadow: 0 6px 18px color-mix(in srgb, #dd2a7b 30%, transparent); }
.buy-btn:hover { filter: brightness(1.06); }
.buy-end { margin-top: 40px; }
.secure { margin: 6px 0 0; color: var(--muted); font-size: 13.5px; }
.sheet { border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: var(--card); }
.sheet-bar { display: flex; align-items: center; gap: 6px; padding: 9px 12px; border-bottom: 1px solid var(--line); font-size: 12.5px; color: var(--muted); }
.sheet-bar span { width: 9px; height: 9px; border-radius: 50%; background: var(--line); }
.sheet-bar b { margin-left: 8px; font-weight: 600; }
.sheet-scroll { overflow-x: auto; }
.sheet table { border-collapse: collapse; width: 100%; font-size: 13.5px; }
.sheet th { text-align: left; background: color-mix(in srgb, #1d6f42 12%, var(--card)); color: var(--fg); font-weight: 700; }
.sheet th, .sheet td { padding: 8px 12px; border-bottom: 1px solid var(--line); white-space: nowrap; }
.sheet tr.fade td { color: var(--muted); border-bottom: 0; }
.steps { list-style: none; padding: 0; margin: 12px 0 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; counter-reset: s; }
.steps li { margin: 0; padding: 16px; border: 1px solid var(--line); border-radius: 14px; background: var(--card); counter-increment: s; }
.steps li::before { content: counter(s); display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--accent); color: #fff; font-weight: 800; font-size: 13px; margin-bottom: 8px; }
.steps b { display: block; margin-bottom: 2px; }
.steps span { color: var(--muted); font-size: 14px; }
.paybox { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 20px; margin: 18px 0 6px; padding: 18px 20px;
  border-radius: 18px; text-decoration: none; color: inherit; border: 2px solid var(--accent);
  background: linear-gradient(120deg, color-mix(in srgb, var(--accent) 10%, var(--card)), var(--card)); }
.paybox b { display: block; font-size: 19px; margin-bottom: 4px; }
.paybox span:first-child { flex: 1 1 320px; color: var(--muted); font-size: 14.5px; }
.paybox b { color: var(--fg); }
.paybtn { white-space: nowrap; background: linear-gradient(135deg, #f58529, #dd2a7b 55%, #8134af); color: #fff; font-weight: 800; border-radius: 999px; padding: 12px 22px; }
.paynote { margin: 4px 0 14px; color: var(--muted); font-size: 13.5px; }
/* Motion: card rises in, rows "type" into the sheet, button shines. */
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes rowin { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }
@keyframes shine { 0%, 70% { transform: translateX(-120%) skewX(-20deg); } 100% { transform: translateX(260%) skewX(-20deg); } }
@keyframes pop { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.035); } }
@keyframes blink { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
.buy { animation: rise 0.6s ease-out both; }
.buy-btn { position: relative; overflow: hidden; animation: pop 2.8s ease-in-out 1.2s infinite; }
.buy-btn::after { content: ''; position: absolute; inset: 0 auto 0 0; width: 40%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent); animation: shine 3.2s ease-in-out 0.8s infinite; }
.ticks li { animation: rise 0.5s ease-out both; }
.ticks li:nth-child(1) { animation-delay: 0.25s; } .ticks li:nth-child(2) { animation-delay: 0.4s; } .ticks li:nth-child(3) { animation-delay: 0.55s; }
.sheet { animation: rise 0.6s ease-out 0.2s both; }
.sheet tbody tr { animation: rowin 0.45s ease-out both; }
.sheet tbody tr:nth-child(1) { animation-delay: 0.7s; } .sheet tbody tr:nth-child(2) { animation-delay: 1.1s; }
.sheet tbody tr:nth-child(3) { animation-delay: 1.5s; } .sheet tbody tr:nth-child(4) { animation-delay: 1.9s; }
.sheet tr.fade td { animation: blink 1.4s ease-in-out 2.3s infinite; }
.steps li { animation: rise 0.55s ease-out both; transition: transform 0.2s, border-color 0.2s; }
.steps li:nth-child(2) { animation-delay: 0.12s; } .steps li:nth-child(3) { animation-delay: 0.24s; }
.steps li:hover { transform: translateY(-3px); border-color: var(--accent); }
@media (prefers-reduced-motion: reduce) {
  .buy, .buy-btn, .buy-btn::after, .ticks li, .sheet, .sheet tbody tr, .sheet tr.fade td, .steps li { animation: none !important; }
}
</style>
