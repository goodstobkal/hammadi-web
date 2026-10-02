<script setup lang="ts">
import { computed, ref } from 'vue'
import { API_BASE } from '../lib/site'
import { feedbackPopup } from '../lib/feedback'
import { track } from '../lib/analytics'

const rating = ref(0)
const hover = ref(0)
const comment = ref('')
const sending = ref(false)
const sent = ref(false)

const prompt = computed(() =>
  rating.value >= 4
    ? 'Glad it helped! What did you like, or what should we add next?'
    : rating.value
      ? 'Sorry it fell short. What went wrong or was missing?'
      : 'What would make it better?',
)

function close() {
  feedbackPopup.open = false
}

async function send() {
  if (!rating.value && !comment.value.trim()) return
  sending.value = true
  try {
    await fetch(`${API_BASE}/feedback/quick`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rating: rating.value || null, comment: comment.value, tool: feedbackPopup.tool }),
    })
    track('feedback', { tool: feedbackPopup.tool, meta: { rating: rating.value } })
  } catch {
    /* best effort */
  }
  sending.value = false
  sent.value = true
  setTimeout(close, 1800)
}
</script>

<template>
  <Transition name="fb">
    <div v-if="feedbackPopup.open" class="fb" role="dialog" aria-labelledby="fb-title">
      <button class="x" aria-label="Close" @click="close">×</button>
      <template v-if="!sent">
        <p id="fb-title" class="t">How was your first run?</p>
        <div class="stars" @mouseleave="hover = 0">
          <button v-for="n in 5" :key="n" class="star" :class="{ on: n <= (hover || rating) }"
            :aria-label="`${n} star${n > 1 ? 's' : ''}`" @mouseenter="hover = n" @click="rating = n">★</button>
        </div>
        <textarea v-model="comment" rows="3" maxlength="4000" :placeholder="prompt"></textarea>
        <button class="go" :disabled="sending || (!rating && !comment.trim())" @click="send">
          {{ sending ? 'Sending…' : 'Send feedback' }}
        </button>
      </template>
      <p v-else class="t thanks">Thank you! 💌 We read every message.</p>
    </div>
  </Transition>
</template>

<style scoped>
.fb {
  position: fixed; right: 20px; bottom: 90px; z-index: 60; width: min(360px, calc(100vw - 32px));
  background: var(--card); color: var(--fg); border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line));
  border-radius: 18px; padding: 18px 18px 16px; box-shadow: 0 18px 50px rgba(0, 0, 0, 0.18);
}
.x { position: absolute; top: 8px; right: 10px; border: 0; background: none; color: var(--muted); font-size: 22px; cursor: pointer; line-height: 1; padding: 4px; }
.t { margin: 0 0 10px; font-weight: 700; font-size: 16px; padding-right: 20px; }
.thanks { margin: 4px 0; }
.stars { display: flex; gap: 4px; margin: 0 0 12px; }
.star { border: 0; background: none; font-size: 30px; line-height: 1; cursor: pointer; color: var(--line); padding: 0 2px; transition: transform 0.1s, color 0.1s; }
.star.on { color: #f5a623; }
.star:hover { transform: scale(1.12); }
textarea {
  width: 100%; border: 1.5px solid var(--line); border-radius: 12px; padding: 10px 12px; background: var(--bg);
  color: var(--fg); font: inherit; font-size: 14.5px; resize: vertical;
}
textarea:focus { outline: none; border-color: var(--accent); }
.go {
  margin-top: 10px; width: 100%; height: 42px; border: 0; border-radius: 999px; background: var(--accent); color: #fff;
  font: inherit; font-weight: 700; cursor: pointer;
}
.go:disabled { opacity: 0.5; cursor: not-allowed; }
.fb-enter-active, .fb-leave-active { transition: opacity 0.25s, transform 0.25s; }
.fb-enter-from, .fb-leave-to { opacity: 0; transform: translateY(16px); }
@media (max-width: 640px) { .fb { right: 16px; bottom: 82px; } }
</style>
