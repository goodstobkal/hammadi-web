<script setup lang="ts">
/** Line icons for the three products, so they render the same on every
 * device (emoji fonts are missing on some systems). */
defineProps<{ slug: string; size?: number }>()
</script>

<template>
  <span class="pi" :style="{ width: (size || 44) + 'px', height: (size || 44) + 'px' }" aria-hidden="true">
    <svg v-if="slug === 'influencer-lists'" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" /><circle cx="17" cy="9" r="2.4" /><path d="M15.8 14.2c2.3.2 3.9 1.8 4.4 4.8" /></svg>
    <svg v-else-if="slug === 'profile-pack'" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="16.8" cy="7.2" r=".9" /></svg>
    <svg v-else viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="3" /><path d="M10.5 9.3v5.4l4.5-2.7z" /><path d="M4 9h16" /></svg>
  </span>
</template>

<style scoped>
.pi { display: inline-grid; place-items: center; border-radius: 14px; background: linear-gradient(135deg, #f58529, #dd2a7b 50%, #8134af); }
.pi svg { width: 58%; height: 58%; fill: none; stroke: #fff; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
</style>
