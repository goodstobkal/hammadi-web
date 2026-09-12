<script setup lang="ts">
import SiteFooter from './components/SiteFooter.vue'
import SiteHeader from './components/SiteHeader.vue'
import ConsentBanner from './components/ConsentBanner.vue'
import SupportBox from './components/SupportBox.vue'
</script>

<template>
  <SiteHeader />
  <main>
    <RouterView />
  </main>
  <SiteFooter />
  <SupportBox />
  <ConsentBanner />
</template>

<style scoped>
main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}
</style>
