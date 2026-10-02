<script setup lang="ts">
import { useSeo } from '../lib/site'

useSeo({
  title: 'Page not found',
  description: 'That page does not exist.',
  path: '/404',
})
</script>

<template>
  <div>
    <h1>Page not found</h1>
    <p>
      That page doesn't exist. Try the <RouterLink to="/tools">cheap tools</RouterLink> instead.
    </p>
  </div>
</template>
