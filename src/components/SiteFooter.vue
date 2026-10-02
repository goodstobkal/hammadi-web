<script setup lang="ts">
import { GUIDES_URL, SITE_NAME } from '../lib/site'
import catalog from '../catalog.json'

const tools = (catalog.tools as { slug: string; title: string }[]).slice(0, 8)
</script>

<template>
  <footer class="site-footer">
    <div class="wrap">
      <div class="cols">
        <div>
          <h3>Cheap tools</h3>
          <ul>
            <li v-for="tool in tools" :key="tool.slug">
              <RouterLink :to="`/tools/${tool.slug}`">{{ tool.title }}</RouterLink>
            </li>
            <li><RouterLink to="/tools">All tools →</RouterLink></li>
          </ul>
        </div>
        <div>
          <h3>Services</h3>
          <ul>
            <li><RouterLink to="/services/influencer-lists">Influencer lists</RouterLink></li>
            <li><RouterLink to="/services/profile-pack">Full profile pack</RouterLink></li>
            <li><RouterLink to="/services/reel-analysis">Reel analysis</RouterLink></li>
            <li><a :href="GUIDES_URL">Guides</a></li>
            <li><RouterLink to="/privacy">Privacy &amp; terms</RouterLink></li>
          </ul>
        </div>
        <div>
          <h3>Contact</h3>
          <ul>
            <li>Questions or an issue?</li>
            <li><a href="mailto:hello@hammadi.dev">hello@hammadi.dev</a></li>
          </ul>
        </div>
      </div>
      <p class="small">
        Public data only. Instagram is a trademark of Meta Platforms, Inc. {{ SITE_NAME }} is not
        affiliated with or endorsed by Meta or Instagram. Respect creators' rights and the law in
        your jurisdiction when you use what you collect here.
      </p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  border-top: 1px solid var(--line);
  margin-top: 72px;
  background: var(--card);
}
.wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding: 36px 20px 48px;
}
.cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 28px;
}
h3 {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin: 0 0 10px;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
li {
  margin: 6px 0;
}
a {
  color: var(--fg);
  text-decoration: none;
  font-size: 15px;
}
a:hover {
  color: var(--accent);
}
.small {
  margin: 28px 0 0;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.6;
}
</style>
