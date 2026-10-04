<script setup lang="ts">
import { ref } from 'vue'
import BrandLogo from './BrandLogo.vue'
import { SITE_NAME } from '../lib/site'

const open = ref(false)
</script>

<template>
  <header class="site-header">
    <div class="wrap">
      <RouterLink to="/" class="brand"><BrandLogo /> {{ SITE_NAME }}</RouterLink>
      <button class="burger" type="button" aria-label="Menu" @click="open = !open">☰</button>
      <nav :class="{ open }" @click="open = false">
        <a class="cta" href="https://chromewebstore.google.com/detail/instagram-comment-post-ex/ejjfocklfpidcfenanddaedohidmmjba" target="_blank" rel="noopener">Add to Chrome</a>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  border-bottom: 1px solid var(--line);
  background: var(--card);
  position: sticky;
  top: 0;
  z-index: 10;
}
.wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 18px;
  text-decoration: none;
  color: var(--fg);
  margin-right: auto;
}
nav {
  display: flex;
  align-items: center;
  gap: 18px;
}
nav a {
  color: var(--muted);
  text-decoration: none;
  font-size: 15px;
}
nav a:hover,
nav a.router-link-active {
  color: var(--fg);
}
nav .cta {
  background: var(--accent);
  color: #fff;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 600;
}
nav .account {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--fg);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 5px 6px 5px 12px;
}
nav .account:hover {
  border-color: var(--accent);
}
nav .account .uname {
  font-weight: 600;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.burger {
  display: none;
  background: none;
  border: 0;
  font-size: 22px;
  color: var(--fg);
  cursor: pointer;
}
@media (max-width: 640px) {
  .burger {
    display: block;
  }
  nav {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 20px;
    background: var(--card);
    border-bottom: 1px solid var(--line);
  }
  nav.open {
    display: flex;
  }
}
</style>
