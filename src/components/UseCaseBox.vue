<script setup lang="ts">
/**
 * "Describe what you need" → the right tool. Sixteen tools is more than a
 * visitor wants to read through, and people arrive with a job ("every comment
 * on a competitor's reel"), not a tool name. The API embeds both sides with a
 * sentence-transformer and ranks by cosine similarity, so the phrasing doesn't
 * have to match our wording.
 *
 * When nothing scores well enough, that's a signal worth capturing: the box
 * turns into a tool request that reaches the owner directly.
 */
import { ref } from 'vue'
import { ApiError, recommendTools, type Match } from '../lib/api'
import SupportBox from './SupportBox.vue'

const q = ref('')
const matches = ref<Match[]>([])
const searched = ref(false)
const busy = ref(false)
const error = ref('')
const askAnyway = ref(false)

const examples = [
  'every comment on a competitor reel',
  'find skincare nano influencers in the US',
  'export all reels from a profile',
  'find a reel I saw but did not save',
]

async function match(text?: string) {
  if (text) q.value = text
  const query = q.value.trim()
  if (query.length < 3) return
  busy.value = true
  error.value = ''
  askAnyway.value = false
  try {
    matches.value = await recommendTools(query)
    searched.value = true
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Could not match that right now.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="matcher">
    <h2>Not sure which tool you need?</h2>
    <p class="muted">Describe the job in your own words and we'll point you at the right one.</p>

    <form @submit.prevent="match()">
      <input
        v-model="q"
        type="text"
        maxlength="300"
        placeholder="e.g. I need every comment on a competitor's reel"
        aria-label="Describe what you need"
      />
      <button type="submit" :disabled="busy || q.trim().length < 3">
        {{ busy ? 'Matching…' : 'Find the tool' }}
      </button>
    </form>

    <p class="examples">
      Try:
      <button v-for="ex in examples" :key="ex" class="chip" type="button" @click="match(ex)">
        {{ ex }}
      </button>
    </p>

    <p v-if="error" class="error">{{ error }}</p>

    <template v-if="searched && !busy">
      <ul v-if="matches.length" class="hits">
        <li v-for="(m, i) in matches" :key="m.slug">
          <RouterLink :to="`/tools/${m.slug}`">
            <strong>{{ m.title }}</strong>
            <span v-if="i === 0" class="best">best match</span>
            <span class="tagline">{{ m.tagline }}</span>
          </RouterLink>
        </li>
      </ul>
      <p v-else class="muted">
        Nothing here matches that yet.
        <button class="link" type="button" @click="askAnyway = !askAnyway">
          Request it as a tool
        </button>
        and it goes straight to the person who builds them.
      </p>

      <p v-if="matches.length" class="muted small">
        Not it?
        <button class="link" type="button" @click="askAnyway = !askAnyway">
          Request a tool for it
        </button>
        .
      </p>

      <SupportBox
        v-if="askAnyway"
        inline
        topic="Tool request"
        title="Request an Instagram tool"
        blurb="Tell us what you'd want it to do. If it's something we can scrape, it usually shows up here."
        message-label="What should the tool do?"
      />
    </template>
  </section>
</template>

<style scoped>
.matcher {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 24px;
  margin: 40px 0;
}
h2 {
  margin: 0 0 4px;
  font-size: 20px;
}
.muted {
  color: var(--muted);
  margin: 0 0 14px;
}
.small {
  font-size: 14px;
  margin-top: 14px;
}
form {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
input {
  flex: 1 1 260px;
  padding: 11px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--bg);
  color: var(--fg);
  font: inherit;
  font-size: 16px;
}
form button {
  background: var(--accent);
  color: #fff;
  border: 0;
  border-radius: 10px;
  padding: 11px 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
form button:disabled {
  opacity: 0.55;
  cursor: default;
}
.examples {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--muted);
}
.chip {
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px 11px;
  margin: 4px 4px 0 0;
  font: inherit;
  font-size: 13px;
  color: var(--muted);
  cursor: pointer;
}
.chip:hover {
  color: var(--fg);
  border-color: var(--accent);
}
.hits {
  list-style: none;
  padding: 0;
  margin: 18px 0 0;
  display: grid;
  gap: 10px;
}
.hits a {
  display: block;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  background: var(--bg);
}
.hits a:hover {
  border-color: var(--accent);
}
.hits .tagline {
  display: block;
  color: var(--muted);
  font-size: 14px;
  margin-top: 3px;
}
.best {
  background: var(--accent);
  color: #fff;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  margin-left: 8px;
  vertical-align: middle;
}
.link {
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  color: var(--accent);
  text-decoration: underline;
  cursor: pointer;
}
.error {
  color: #d33;
  margin: 12px 0 0;
}
</style>
