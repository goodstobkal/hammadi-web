<script setup lang="ts">
import { SITE_NAME } from '../lib/site'
</script>
<template>
  <footer class="ft">
    <div class="in">
      <span>© {{ new Date().getFullYear() }} {{ SITE_NAME }}</span>
      <nav>
        <RouterLink to="/">Extensions</RouterLink>
        <RouterLink to="/privacy">Privacy</RouterLink>
      </nav>
    </div>
  </footer>
</template>
<style scoped>
.ft { border-top: 1px solid var(--line, #eadfe6); margin-top: 40px; }
.in { max-width: 1000px; margin: 0 auto; padding: 20px 18px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; color: var(--muted, #9a7f90); font-size: 14px; }
.in nav { display: flex; gap: 16px; }
.in a { color: inherit; text-decoration: none; }
.in a:hover { text-decoration: underline; }
</style>
