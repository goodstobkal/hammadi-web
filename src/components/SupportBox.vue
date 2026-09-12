<script setup lang="ts">
/**
 * The floating "Ask a question" box. Posts to the API, which relays to the
 * owner's Telegram - there's no inbox on this site, so the promise on the
 * button is a reply by email, and the form only reports success once the
 * server confirms it actually delivered.
 */
import { nextTick, ref } from 'vue'
import { ApiError, sendSupport } from '../lib/api'

const props = withDefaults(
  defineProps<{
    topic?: string
    title?: string
    blurb?: string
    /** Inline (inside a page) instead of the floating bubble. */
    inline?: boolean
    messageLabel?: string
    messageRequired?: boolean
  }>(),
  {
    topic: '',
    title: 'Ask a question',
    blurb: "Stuck, or need something the tools don't do? Send it over and you'll get a reply by email.",
    inline: false,
    messageLabel: 'Your question or issue',
    messageRequired: true,
  },
)

const open = ref(props.inline)
const name = ref('')
const email = ref('')
const message = ref('')
const website = ref('')
const sending = ref(false)
const sent = ref(false)
const error = ref('')
const messageEl = ref<HTMLTextAreaElement | null>(null)

async function toggle() {
  open.value = !open.value
  if (open.value) {
    await nextTick()
    messageEl.value?.focus()
  }
}

async function submit() {
  error.value = ''
  if (!name.value.trim() || !email.value.trim()) {
    error.value = 'Name and email, please - the reply has to go somewhere.'
    return
  }
  if (props.messageRequired && message.value.trim().length < 5) {
    error.value = 'Add a sentence or two about what you need.'
    return
  }
  sending.value = true
  try {
    await sendSupport({
      name: name.value,
      email: email.value,
      message: message.value,
      topic: props.topic,
      website: website.value,
    })
    sent.value = true
  } catch (err) {
    error.value =
      err instanceof ApiError ? err.message : "That didn't send. Try again in a moment."
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div :class="['support', { inline, floating: !inline }]">
    <button v-if="!inline" class="bubble" type="button" @click="toggle">
      <span v-if="!open">💬 Need help?</span>
      <span v-else>Close ✕</span>
    </button>

    <div v-if="open" class="panel">
      <template v-if="sent">
        <h3>Got it — thank you.</h3>
        <p class="muted">
          It's landed. You'll get a reply at <strong>{{ email }}</strong
          >, usually within a day.
        </p>
      </template>

      <template v-else>
        <h3>{{ title }}</h3>
        <p class="muted">{{ blurb }}</p>

        <form @submit.prevent="submit">
          <label>
            <span>Your name</span>
            <input v-model="name" type="text" autocomplete="name" maxlength="80" />
          </label>
          <label>
            <span>Email</span>
            <input v-model="email" type="email" autocomplete="email" maxlength="160" />
          </label>
          <label>
            <span>{{ messageLabel }}</span>
            <textarea ref="messageEl" v-model="message" rows="4" maxlength="4000"></textarea>
          </label>

          <!-- Honeypot: off-screen and never announced, so only bots fill it. -->
          <label class="trap" aria-hidden="true">
            Website<input v-model="website" type="text" tabindex="-1" autocomplete="off" />
          </label>

          <p v-if="error" class="error">{{ error }}</p>
          <button class="send" type="submit" :disabled="sending">
            {{ sending ? 'Sending…' : 'Send' }}
          </button>
        </form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.floating {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}
.bubble {
  order: 2;
  background: var(--accent);
  color: #fff;
  border: 0;
  border-radius: 999px;
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 24px rgb(0 0 0 / 18%);
}
.floating .panel {
  order: 1;
  width: min(360px, calc(100vw - 40px));
  max-height: min(560px, calc(100vh - 120px));
  overflow-y: auto;
  box-shadow: 0 12px 40px rgb(0 0 0 / 22%);
}
.panel {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 20px;
}
.inline .panel {
  padding: 24px;
}
h3 {
  margin: 0 0 6px;
  font-size: 18px;
}
.muted {
  color: var(--muted);
  font-size: 14px;
  margin: 0 0 14px;
}
label {
  display: block;
  margin-bottom: 12px;
}
label span {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}
input,
textarea {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--bg);
  color: var(--fg);
  font: inherit;
  font-size: 15px;
}
textarea {
  resize: vertical;
}
.trap {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
.send {
  background: var(--accent);
  color: #fff;
  border: 0;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.send:disabled {
  opacity: 0.6;
  cursor: default;
}
.error {
  color: #d33;
  font-size: 14px;
  margin: 0 0 10px;
}
@media (max-width: 640px) {
  .floating {
    right: 12px;
    bottom: 12px;
  }
}
</style>
