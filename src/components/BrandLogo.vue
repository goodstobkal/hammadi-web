<script setup lang="ts">
/**
 * The site mark: a rounded square with an inner ring and a dot high-right -
 * an aperture read at a glance, without borrowing Instagram's own gradient
 * camera (which we can't use and shouldn't imitate).
 *
 * Inline rather than an <img> so it inherits currentColor, needs no request,
 * and survives being prerendered.
 */
withDefaults(defineProps<{ size?: number }>(), { size: 26 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 48 48"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <rect x="3" y="3" width="42" height="42" rx="12" stroke="var(--accent)" stroke-width="5" />
    <circle cx="24" cy="24" r="10.5" stroke="currentColor" stroke-width="4.5" />
    <circle cx="35.5" cy="12.5" r="3.6" fill="var(--accent)" />
  </svg>
</template>
