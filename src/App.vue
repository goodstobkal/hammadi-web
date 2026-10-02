<script setup lang="ts">
import SiteFooter from './components/SiteFooter.vue'
import SiteHeader from './components/SiteHeader.vue'
import ConsentBanner from './components/ConsentBanner.vue'
import FeedbackPopup from './components/FeedbackPopup.vue'
import ChatLauncher from './components/ChatLauncher.vue'
</script>

<template>
  <SiteHeader />
  <main>
    <RouterView />
  </main>
  <SiteFooter />
  <ConsentBanner />
  <FeedbackPopup />
  <ChatLauncher />
</template>

<style scoped>
main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}
@media (max-width: 640px) {
  main {
    padding: 16px 16px 32px;
  }
}
</style>
