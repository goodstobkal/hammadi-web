<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { WAITLIST } from '../lib/site'

const props = defineProps<{ slug: string; extName: string }>()

const email = ref('')
const state = ref<'idle' | 'sending' | 'done' | 'error'>('idle')

onMounted(() => {
  try {
    if (localStorage.getItem('wl:' + props.slug)) state.value = 'done'
  } catch {
    /* ignore storage errors (private mode etc.) */
  }
})

function valid(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

async function submit() {
  if (state.value === 'sending') return
  if (!valid(email.value)) {
    state.value = 'error'
    return
  }
  state.value = 'sending'
  try {
    if (WAITLIST.accessKey) {
      const res = await fetch(WAITLIST.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WAITLIST.accessKey,
          subject: `Waitlist: ${props.extName}`,
          from_name: 'Hammadi.dev waitlist',
          email: email.value,
          extension: props.slug,
        }),
      })
      if (!res.ok) throw new Error('bad status')
    }
    try {
      localStorage.setItem('wl:' + props.slug, email.value)
    } catch {
      /* ignore */
    }
    state.value = 'done'
  } catch {
    state.value = 'error'
  }
}
</script>

<template>
  <div class="waitlist">
    <template v-if="state === 'done'">
      <p class="ok">✓ You're on the list — we'll email you the moment it's live.</p>
    </template>
    <template v-else>
      <form @submit.prevent="submit">
        <input
          v-model="email"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder="you@email.com"
          aria-label="Your email"
          required
        />
        <button type="submit" :disabled="state === 'sending'">
          {{ state === 'sending' ? 'Joining…' : 'Join the waitlist' }}
        </button>
      </form>
      <p v-if="state === 'error'" class="err">Please enter a valid email and try again.</p>
      <p class="note">No spam — one email when {{ extName }} launches.</p>
    </template>
  </div>
</template>

<style scoped>
.waitlist {
  margin-top: auto;
}
form {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
input {
  flex: 1 1 180px;
  min-width: 0;
  padding: 11px 14px;
  border: 1px solid var(--line, #eadfe6);
  border-radius: 999px;
  font-size: 15px;
  background: var(--card, #fff);
  color: var(--fg, #2a1a24);
}
input:focus {
  outline: none;
  border-color: #dd2a7b;
}
button {
  background: linear-gradient(135deg, #f58529, #dd2a7b 60%, #8134af);
  color: #fff;
  border: 0;
  font-weight: 800;
  padding: 11px 18px;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
}
button:disabled {
  opacity: 0.6;
  cursor: default;
}
.ok {
  color: #1a7f45;
  font-weight: 700;
  margin: 0;
}
.err {
  color: #c62828;
  font-size: 13px;
  margin: 8px 0 0;
}
.note {
  color: var(--muted, #9a7f90);
  font-size: 12.5px;
  margin: 8px 0 0;
}
</style>
