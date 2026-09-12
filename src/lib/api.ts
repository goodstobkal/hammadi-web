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
    // FastAPI wraps HTTPException payloads in `detail`; our ScrapeError
    // handler returns the same fields at the top level.
    const err = (body.detail && typeof body.detail === 'object' ? body.detail : body) as {
      error?: string
      code?: string
    }
    throw new ApiError(
      err.error || 'That lookup failed. Try again in a moment.',
      err.code || 'error',
      res.status,
    )
  }
  return body as RunResult
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
