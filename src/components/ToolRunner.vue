<script setup lang="ts">
/** The interactive half of a tool page: the form, the results table and the
 * export buttons. Everything above it on the page is static HTML so the page
 * still says something useful before any JavaScript runs. */
import { computed, reactive, ref } from 'vue'
import { ApiError, pick, rowsOf, runTool, type RunResult, type Tool } from '../lib/api'
import { download, stamp, toCsv, toGrid } from '../lib/export'
import { toXlsx } from '../lib/xlsx'
import { LISTING_URL } from '../lib/site'
import { track } from '../lib/analytics'
import { conversionId, trackAd } from '../lib/ads'

const props = defineProps<{ tool: Tool; limits: { per_hour: number; per_day: number } }>()

const form = reactive<Record<string, string | number>>({})
for (const field of props.tool.fields) form[field.name] = field.default ?? ''

const result = ref<RunResult | null>(null)
const error = ref<{ message: string; code: string } | null>(null)
const loading = ref(false)

const rows = computed(() => (result.value ? rowsOf(props.tool, result.value) : []))
/** Tools without a list (a profile lookup) render their object as key/value. */
const detail = computed(() => {
  if (!result.value || props.tool.result_key) return []
  return Object.entries(result.value.data)
    .filter(([, v]) => v != null && typeof v !== 'object')
    .map(([key, value]) => [key.replace(/_/g, ' '), value] as const)
})
const subject = computed(() =>
  String(form.channel_url || form.post_url || form.q || 'results').replace(/^https?:\/\/\S+?\/([^/?]+).*/, '$1'),
)
const notice = computed(() => {
  const meta = result.value?.data?.meta as { notice?: string } | undefined
  return meta?.notice || ''
})

async function submit() {
  loading.value = true
  error.value = null
  const started = Date.now()
  try {
    result.value = await runTool(props.tool.slug, { ...form })
    const convId = conversionId()
    track('tool_run', {
      tool: props.tool.slug,
      conversionId: convId,
      meta: {
        rows: rows.value.length,
        cached: result.value.cached,
        seconds: Math.round((Date.now() - started) / 1000),
      },
    })
    // A completed lookup is the conversion worth optimising an ad campaign
    // against - it means the visitor got something, not just landed.
    trackAd('Search', { itemCount: rows.value.length }, convId)
  } catch (err) {
    result.value = null
    error.value =
      err instanceof ApiError
        ? { message: err.message, code: err.code }
        : { message: 'Network error - please try again.', code: 'network' }
    track('tool_error', { tool: props.tool.slug, meta: { code: error.value.code } })
  } finally {
    loading.value = false
  }
}

function exportCsv() {
  track('export', { tool: props.tool.slug, meta: { format: 'csv', rows: rows.value.length } })
  download(stamp(props.tool.slug, subject.value, 'csv'), toCsv(props.tool.columns, rows.value), 'text/csv')
}

function exportExcel() {
  track('export', { tool: props.tool.slug, meta: { format: 'xlsx', rows: rows.value.length } })
  download(
    stamp(props.tool.slug, subject.value, 'xlsx'),
    toXlsx(toGrid(props.tool.columns, rows.value), props.tool.category),
  )
}

function exportJson() {
  track('export', { tool: props.tool.slug, meta: { format: 'json', rows: rows.value.length } })
  download(
    stamp(props.tool.slug, subject.value, 'json'),
    JSON.stringify(result.value?.data ?? {}, null, 2),
    'application/json',
  )
}

function cell(row: Record<string, unknown>, key: string) {
  return pick(row, key)
}

function formatNumber(value: unknown) {
  return typeof value === 'number' ? value.toLocaleString() : (value ?? '')
}

function formatTime(value: unknown) {
  if (!value) return ''
  const ms = typeof value === 'number' ? value * 1000 : Date.parse(String(value))
  return Number.isNaN(ms) ? String(value) : new Date(ms).toISOString().slice(0, 16).replace('T', ' ')
}

function shortText(value: unknown) {
  const text = String(value ?? '')
  return text.length > 140 ? `${text.slice(0, 140)}…` : text
}
</script>

<template>
  <section class="runner" id="try">
    <form @submit.prevent="submit">
      <div v-for="field in tool.fields" :key="field.name" class="field">
        <label :for="`f-${field.name}`">{{ field.label }}</label>
        <select v-if="field.type === 'select'" :id="`f-${field.name}`" v-model="form[field.name]">
          <option v-for="option in field.options" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <input
          v-else
          :id="`f-${field.name}`"
          v-model="form[field.name]"
          :type="field.type"
          :placeholder="field.placeholder"
          :min="field.min"
          :max="field.max"
          :required="field.required"
        />
        <small v-if="field.help">{{ field.help }}</small>
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Working…' : 'Run it — free' }}
      </button>
    </form>

    <p class="hint">
      Free, no sign-up: {{ limits.per_hour }} lookups an hour. Need more, or in your own code?
      <a :href="LISTING_URL" rel="noopener">Use the API</a>.
    </p>

    <p v-if="loading" class="status">
      Scraping live — a big request can take a minute. Keep this tab open.
    </p>

    <p v-if="error" class="error">
      {{ error.message }}
      <a v-if="error.code === 'free_limit_reached'" :href="LISTING_URL" rel="noopener">
        Get unlimited access →
      </a>
    </p>

    <div v-if="result" class="results">
      <div class="results-head">
        <h2>
          {{ rows.length || detail.length }} result<span v-if="(rows.length || detail.length) !== 1">s</span>
          <span v-if="result.cached" class="tag">cached</span>
        </h2>
        <div class="exports" v-if="rows.length || detail.length">
          <button type="button" @click="exportExcel" v-if="rows.length">Export Excel</button>
          <button type="button" @click="exportCsv" v-if="rows.length">Export CSV</button>
          <button type="button" @click="exportJson">Export JSON</button>
        </div>
      </div>

      <p v-if="notice" class="notice">{{ notice }}</p>

      <dl v-if="detail.length" class="detail">
        <div v-for="[key, value] in detail" :key="key">
          <dt>{{ key }}</dt>
          <dd>{{ value }}</dd>
        </div>
      </dl>

      <div v-if="rows.length" class="table-scroll">
        <table>
          <thead>
            <tr>
              <th v-for="column in tool.columns" :key="column.key">{{ column.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in rows" :key="index">
              <td v-for="column in tool.columns" :key="column.key">
                <a
                  v-if="column.type === 'link' && cell(row, column.key)"
                  :href="String(cell(row, column.key))"
                  target="_blank"
                  rel="noopener nofollow"
                >open</a>
                <a
                  v-else-if="column.type === 'profile' && cell(row, column.key)"
                  :href="`https://www.instagram.com/${cell(row, column.key)}/`"
                  target="_blank"
                  rel="noopener nofollow"
                >@{{ cell(row, column.key) }}</a>
                <img
                  v-else-if="column.type === 'image' && cell(row, column.key)"
                  :src="String(cell(row, column.key))"
                  alt=""
                  loading="lazy"
                  referrerpolicy="no-referrer"
                />
                <span v-else-if="column.type === 'number'">{{ formatNumber(cell(row, column.key)) }}</span>
                <span v-else-if="column.type === 'timestamp'">{{ formatTime(cell(row, column.key)) }}</span>
                <span v-else-if="column.type === 'bool'">{{ cell(row, column.key) ? 'yes' : '' }}</span>
                <span v-else>{{ shortText(cell(row, column.key)) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="!rows.length && !detail.length" class="status">
        Nothing came back for that input. Check the profile is public and spelled right.
      </p>
    </div>
  </section>
</template>

<style scoped>
.runner {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 24px;
  margin: 28px 0 8px;
}
form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 260px;
}
.field:has(input[type='number']),
.field:has(select) {
  flex: 0 1 170px;
}
label {
  font-size: 14px;
  font-weight: 600;
}
input,
select {
  padding: 11px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--bg);
  color: var(--fg);
  font: inherit;
  width: 100%;
}
input:focus,
select:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
small {
  color: var(--muted);
  font-size: 12px;
}
form button {
  background: var(--accent);
  color: #fff;
  border: 0;
  border-radius: 10px;
  padding: 12px 22px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
form button:disabled {
  opacity: 0.6;
  cursor: progress;
}
.hint {
  font-size: 13px;
  color: var(--muted);
  margin: 14px 0 0;
}
.status {
  margin: 16px 0 0;
  color: var(--muted);
}
.error {
  margin: 16px 0 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--chip);
  color: var(--fg);
}
.results {
  margin-top: 28px;
  border-top: 1px solid var(--line);
  padding-top: 20px;
}
.results-head {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.results-head h2 {
  margin: 0;
  font-size: 18px;
  margin-right: auto;
}
.tag {
  font-size: 12px;
  background: var(--chip);
  color: var(--muted);
  border-radius: 999px;
  padding: 2px 8px;
  margin-left: 8px;
  vertical-align: middle;
}
.exports button {
  background: none;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 14px;
  font: inherit;
  color: var(--fg);
  cursor: pointer;
  margin-left: 8px;
}
.exports button:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.notice {
  font-size: 13px;
  color: var(--muted);
  background: var(--chip);
  border-radius: 10px;
  padding: 10px 12px;
}
.detail {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px 24px;
  margin: 16px 0 0;
}
.detail dt {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
}
.detail dd {
  margin: 2px 0 0;
  word-break: break-word;
}
.table-scroll {
  overflow-x: auto;
  margin-top: 16px;
}
table {
  border-collapse: collapse;
  width: 100%;
  font-size: 14px;
}
th,
td {
  text-align: left;
  padding: 9px 12px;
  border-bottom: 1px solid var(--line);
  vertical-align: top;
  max-width: 340px;
}
th {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  white-space: nowrap;
}
td img {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 8px;
}
</style>
