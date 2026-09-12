<script setup lang="ts">
/**
 * Only appears when an ad pixel is actually configured and the visitor
 * hasn't chosen yet. The site's own analytics need no consent (no cookies,
 * no third party, no stored identifier), so with no campaign running there
 * is nothing to ask about and no banner.
 */
import { ref } from 'vue'
import { setConsent, shouldAskConsent } from '../lib/ads'

const show = ref(false)
if (typeof window !== 'undefined' && shouldAskConsent()) {
  show.value = true
}

function choose(state: 'granted' | 'denied') {
  setConsent(state)
  show.value = false
}
</script>

<template>
  <div v-if="show" class="consent" role="dialog" aria-label="Cookie choice">
    <p>
      We'd like to set one advertising cookie so we can tell which ads actually bring people here.
      The site works exactly the same either way, and our own visitor counts don't use cookies at
      all. <RouterLink to="/privacy">What we collect</RouterLink>.
    </p>
    <div class="actions">
      <button class="ghost" type="button" @click="choose('denied')">No thanks</button>
      <button class="accept" type="button" @click="choose('granted')">Allow</button>
    </div>
  </div>
</template>

<style scoped>
.consent {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 16px;
  z-index: 60;
  max-width: 640px;
  margin: 0 auto;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 10px 40px rgb(0 0 0 / 20%);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
p {
  margin: 0;
  flex: 1 1 280px;
  font-size: 14px;
  color: var(--muted);
}
.actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
button {
  border-radius: 8px;
  padding: 8px 16px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.accept {
  background: var(--accent);
  color: #fff;
  border: 0;
}
.ghost {
  background: none;
  border: 1px solid var(--line);
  color: var(--muted);
}
@media (max-width: 640px) {
  .consent {
    bottom: 84px;
  }
}
</style>
