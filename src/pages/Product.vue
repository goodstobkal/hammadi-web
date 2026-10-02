<script setup lang="ts">
/** One done-for-you product (see lib/products.ts): what you get, a sample,
 * packs with Stripe checkout links, how it works and FAQ. Prerendered per
 * slug for search engines. */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ProductIcon from '../components/ProductIcon.vue'
import { PRODUCTS, productBySlug } from '../lib/products'
import { SITE_NAME, SITE_URL, breadcrumbs, useSeo } from '../lib/site'

const route = useRoute()
const p = computed(() => productBySlug(String(route.params.slug))!)
const others = computed(() => PRODUCTS.filter((x) => x.slug !== p.value.slug))
const path = computed(() => `/services/${p.value.slug}`)

useSeo({
  title: `${p.value.seoTitle} | ${SITE_NAME}`,
  description: p.value.seoDescription,
  path: path.value,
  jsonld: [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.value.name,
      description: p.value.seoDescription,
      brand: { '@type': 'Brand', name: SITE_NAME },
      url: `${SITE_URL}${path.value}`,
      offers: p.value.packs.map((k) => ({
        '@type': 'Offer',
        name: `${k.name} (${k.note})`,
        price: String(k.price),
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}${path.value}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: p.value.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
    breadcrumbs([{ name: 'Services', path: '/' }, { name: p.value.name, path: path.value }]),
  ],
})
</script>

<template>
  <article class="prod">
    <p class="crumb"><RouterLink to="/">Services</RouterLink> · {{ p.name }}</p>
    <header class="hero">
      <div>
        <ProductIcon :slug="p.slug" :size="52" />
        <h1>{{ p.name }}</h1>
        <p class="tag">{{ p.tagline }}</p>
        <p class="intro">{{ p.intro }}</p>
        <div class="meta"><span>⏱ {{ p.delivery }}</span><span>🔒 Secure checkout by Stripe</span><span>📧 Delivered by email</span></div>
        <div class="ctas">
          <a class="cta" href="#packs">See prices from ${{ Math.min(...p.packs.map((k) => k.price)) }} →</a>
          <a v-if="p.slug === 'reel-analysis'" class="sample-dl" href="/report/examples">📊 See real example reports</a>
          <a v-if="p.sampleFile" class="sample-dl" :href="p.sampleFile" download>⬇ Download a sample report</a>
        </div>
      </div>
      <div class="sample" aria-label="Sample of what you receive">
        <p class="sample-h">Sample from a report</p>
        <dl>
          <div v-for="r in p.sample" :key="r.label"><dt>{{ r.label }}</dt><dd>{{ r.value }}</dd></div>
        </dl>
        <p v-if="p.sampleFile" class="sample-f">Illustrative example. <a :href="p.sampleFile" download>Download a real sample (Excel)</a>, made from a public brand account.</p>
      </div>
    </header>

    <section>
      <h2>What you get</h2>
      <ul class="get"><li v-for="g in p.youGet" :key="g"><span>✓</span>{{ g }}</li></ul>
    </section>

    <section id="packs">
      <h2>Pick your pack</h2>
      <div class="packs">
        <a v-for="k in p.packs" :key="k.url" :href="k.url" class="pack" :class="{ best: k.best }" rel="noopener">
          <span v-if="k.best" class="badge">Most popular</span>
          <b>{{ k.name }}</b>
          <span class="note">{{ k.note }}</span>
          <span class="price">${{ k.price }}</span>
          <span class="once">one-time payment</span>
          <span class="buy">Order now →</span>
        </a>
      </div>
    </section>

    <section>
      <h2>How it works</h2>
      <ol class="steps"><li v-for="(s, i) in p.steps" :key="s"><span>{{ i + 1 }}</span>{{ s }}</li></ol>
    </section>

    <section class="faq">
      <h2>Questions</h2>
      <details v-for="([q, a], i) in p.faq" :key="q" :open="i === 0"><summary>{{ q }}</summary><p>{{ a }}</p></details>
      <details><summary>Something else?</summary><p>Email <a href="mailto:hello@hammadi.dev">hello@hammadi.dev</a> and we'll answer within a day.</p></details>
    </section>

    <section class="more">
      <h2>Our other services</h2>
      <div class="others">
        <RouterLink v-for="o in others" :key="o.slug" :to="`/services/${o.slug}`" class="other">
          <ProductIcon :slug="o.slug" :size="38" /><div><b>{{ o.name }}</b><p>{{ o.tagline }}</p></div>
        </RouterLink>
      </div>
    </section>
  </article>
</template>

<style scoped>
.crumb { font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); margin: 8px 0 18px; }
.crumb a { color: inherit; }
.hero { display: grid; grid-template-columns: 1.3fr 1fr; gap: 28px; align-items: center; }
.icon { font-size: 40px; }
h1 { font-size: clamp(30px, 5vw, 46px); line-height: 1.08; letter-spacing: -0.03em; margin: 8px 0 10px; }
.tag { font-size: 19px; font-weight: 600; margin: 0 0 10px; }
.intro { color: var(--muted); font-size: 16.5px; margin: 0 0 16px; }
.meta { display: flex; flex-wrap: wrap; gap: 8px 18px; color: var(--muted); font-size: 14px; margin: 0 0 20px; }
.cta { display: inline-block; background: var(--accent); color: #fff; border-radius: 999px; padding: 14px 26px; text-decoration: none; font-weight: 700; box-shadow: 0 8px 22px color-mix(in srgb, var(--accent) 30%, transparent); }
.ctas { display: flex; flex-wrap: wrap; gap: 12px 18px; align-items: center; }
.sample-dl { color: var(--accent); font-weight: 700; text-decoration: none; border: 1.5px solid var(--accent); border-radius: 999px; padding: 12px 20px; }
.sample-dl:hover { background: color-mix(in srgb, var(--accent) 8%, transparent); }
.sample-f a { color: var(--accent); }
.sample { background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 20px; box-shadow: 0 16px 40px rgba(180, 35, 111, 0.08); }
.sample-h { margin: 0 0 10px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); }
.sample dl { margin: 0; }
.sample dl div { display: flex; justify-content: space-between; gap: 12px; padding: 9px 0; border-top: 1px solid var(--line); }
.sample dt { color: var(--muted); }
.sample dd { margin: 0; font-weight: 600; text-align: right; }
.sample-f { margin: 10px 0 0; font-size: 12px; color: var(--muted); }
h2 { font-size: 24px; margin: 48px 0 14px; }
.get { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px; }
.get li { display: flex; gap: 10px; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; }
.get span { color: #16a34a; font-weight: 800; }
.packs { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; }
.pack { position: relative; display: flex; flex-direction: column; gap: 4px; padding: 22px 18px 18px; border: 1px solid var(--line); border-radius: 16px; background: var(--card); color: inherit; text-decoration: none; transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s; }
.pack:hover { transform: translateY(-3px); border-color: var(--accent); box-shadow: 0 12px 28px rgba(180, 35, 111, 0.1); }
.pack.best { border: 2px solid var(--accent); }
.badge { position: absolute; top: -11px; left: 16px; background: var(--accent); color: #fff; font-size: 11.5px; font-weight: 800; border-radius: 999px; padding: 3px 10px; }
.note { color: var(--muted); font-size: 14px; }
.price { font-size: 36px; font-weight: 800; letter-spacing: -0.02em; margin-top: 8px; }
.once { color: var(--muted); font-size: 12.5px; }
.buy { margin-top: 14px; text-align: center; background: var(--accent); color: #fff; font-weight: 700; border-radius: 999px; padding: 10px; }
.pack:not(.best) .buy { background: var(--chip); color: var(--accent); }
.steps { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.steps li { display: flex; gap: 12px; align-items: flex-start; background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px; }
.steps span { flex: none; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--accent); color: #fff; font-weight: 800; font-size: 13px; }
.faq details { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 14px 18px; margin: 0 0 10px; }
.faq summary { cursor: pointer; font-weight: 700; }
.faq p { color: var(--muted); margin: 10px 0 2px; }
.faq a, .more a { color: var(--accent); }
.others { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
.other { display: flex; gap: 12px; align-items: flex-start; padding: 16px; border: 1px solid var(--line); border-radius: 14px; background: var(--card); color: inherit; text-decoration: none; }
.other:hover { border-color: var(--accent); }
.other span { font-size: 26px; }
.other p { margin: 4px 0 0; color: var(--muted); font-size: 14px; }
@media (max-width: 760px) { .hero { grid-template-columns: 1fr; } .cta { width: 100%; text-align: center; } }
</style>
