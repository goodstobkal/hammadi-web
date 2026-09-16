/** Calls to the free-tool endpoints. */
import { API_BASE } from './site'

export type Field = {
  name: string
  label: string
  type: 'text' | 'number' | 'select'
  placeholder?: string
  help?: string
  required?: boolean
  default?: string | number
  min?: number
  max?: number
  options?: { value: string; label: string }[]
}

export type Column = {
  key: string
  label: string
  type?: 'link' | 'image' | 'number' | 'bool' | 'text' | 'timestamp' | 'profile'
}

export type Tool = {
  slug: string
  title: string
  tagline: string
  description: string
  category: string
  /** Leads the home page and the index - the jobs people arrive for. */
  pinned?: boolean
  /** Slug of the guide that covers the same job in code, if there is one. */
  guide?: string | null
  faq?: { q: string; a: string }[]
  fields: Field[]
  result_key: string | null
  columns: Column[]
}

export type RunResult = {
  tool: string
  params: Record<string, string | number>
  data: Record<string, unknown>
  cached: boolean
  quota_remaining: number
}

export class ApiError extends Error {
  code: string
  status: number
  constructor(message: string, code: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

/**
 * Read an error out of a failed response body. Our ScrapeError handler returns
 * `{ error, code, detail }` at the TOP level (where `detail` is the exception's
 * extra data, e.g. `{ username }` - a truthy object that must NOT be mistaken
 * for the payload). A raw FastAPI HTTPException instead returns only `detail`
 * (a string, or an object). Prefer the top-level fields, then fall back.
 */
function errorFrom(body: unknown, status: number, fallback: string): ApiError {
  const b = (body || {}) as { error?: string; code?: string; detail?: unknown }
  const nested = (b.detail && typeof b.detail === 'object' ? b.detail : {}) as {
    error?: string
    code?: string
  }
  const message =
    b.error || nested.error || (typeof b.detail === 'string' ? b.detail : '') || fallback
  return new ApiError(message, b.code || nested.code || 'error', status)
}

export async function runTool(
  slug: string,
  params: Record<string, string | number>,
): Promise<RunResult> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value != null) query.set(key, String(value))
  }
  const res = await fetch(`${API_BASE}/public/v1/run/${slug}?${query}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw errorFrom(body, res.status, 'That lookup failed. Try again in a moment.')
  }
  return body as RunResult
}

export type Match = { slug: string; score: number; title: string; tagline: string }

/** Ask the API which tool fits a described use case (embedding similarity). */
export async function recommendTools(q: string): Promise<Match[]> {
  const res = await fetch(`${API_BASE}/public/v1/recommend?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new ApiError('Could not match that right now.', 'recommend_failed', res.status)
  return ((await res.json()).matches || []) as Match[]
}

export type SupportPayload = {
  name: string
  email: string
  message?: string
  /** Labels the Telegram message: '' for support, e.g. 'Tool request' otherwise. */
  topic?: string
  page?: string
  /** Honeypot - hidden in the form, so anything here means a bot filled it. */
  website?: string
}

/** Deliver a message to the site owner. Resolves only once it's actually sent. */
export async function sendSupport(payload: SupportPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/public/v1/support`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ page: location.pathname, ...payload }),
  })
  if (res.ok) return
  const body = await res.json().catch(() => ({}))
  throw errorFrom(body, res.status, "That didn't send. Try again in a moment.")
}

/** Pull `a.b.c` out of a nested result row. */
export function pick(row: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined), row)
}

/** The rows a tool's table shows: a list result, or the object itself. */
export function rowsOf(tool: Tool, result: RunResult): Record<string, unknown>[] {
  if (!tool.result_key) return []
  const value = result.data?.[tool.result_key]
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : []
}
