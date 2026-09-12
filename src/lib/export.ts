/** CSV/JSON export of a result table, straight from the browser. */
import type { Column } from './api'
import { pick } from './api'

function csvCell(value: unknown): string {
  if (value == null) return ''
  const text = String(value).replace(/\r?\n/g, ' ')
  return /[",;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(columns: Column[], rows: Record<string, unknown>[]): string {
  const header = columns.map((c) => csvCell(c.label)).join(',')
  const body = rows.map((row) => columns.map((c) => csvCell(pick(row, c.key))).join(','))
  return [header, ...body].join('\n')
}

export function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function stamp(slug: string, subject: string, extension: string): string {
  const safe = (subject || 'results').replace(/[^a-z0-9._-]+/gi, '-').replace(/^-|-$/g, '').slice(0, 40)
  const day = new Date().toISOString().slice(0, 10)
  return `${slug}-${safe || 'results'}-${day}.${extension}`
}
