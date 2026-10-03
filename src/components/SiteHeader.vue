<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BrandLogo from './BrandLogo.vue'
import { API_BASE, SITE_NAME } from '../lib/site'

const open = ref(false)
// Auth state, resolved client-side from the session cookie. null = signed out,
// undefined = still loading (so the nav doesn't flash "Log in" for a logged-in
// visitor on first paint).
const me = ref<{ username: string | null; email: string } | undefined>(undefined)

onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'same-origin' })
    const data = await res.json()
    me.value = data.user ? { username: data.user.username, email: data.user.email } : null
  } catch {
    me.value = null
  }
})
</script>

<template>
  <header class="site-header">
    <div class="wrap">
      <RouterLink to="/" class="brand"><BrandLogo /> {{ SITE_NAME }}</RouterLink>
      <button class="burger" type="button" aria-label="Menu" @click="open = !open">☰</button>
      <nav :class="{ open }" @click="open = false">
        <RouterLink to="/services/influencer-lists">Influencer lists</RouterLink>
        <RouterLink to="/services/profile-pack">Profile pack</RouterLink>
        <RouterLink to="/services/reel-analysis">Reel analysis</RouterLink>
        <RouterLink to="/tools">Cheap tools</RouterLink>
        <RouterLink to="/shop">Shop</RouterLink>
        <a href="/trending">Trending</a>
        <RouterLink to="/orders">My orders</RouterLink>
        <RouterLink class="cta" to="/home#services">Order a report</RouterLink>
        <!-- Auth-aware: username when signed in, else Log in. -->
        <a v-if="me" href="/account" class="account">
          <span class="uname">{{ me.username || me.email }}</span>
        </a>
        <a v-else-if="me === null" href="/login">Log in</a>
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
