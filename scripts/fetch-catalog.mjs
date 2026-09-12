/**
 * Refresh src/catalog.json from the API's tool registry.
 *
 * The API owns what each tool takes and returns (app/public_tools.py); this
 * pulls that in at build time so the static pages match the live behaviour.
 * The committed snapshot is the fallback, so a build still works when the API
 * is unreachable (CI, a cold machine) - it just describes the tools as of the
 * last refresh.
 */
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// Build-time only, so it needs the API's own absolute URL - unlike the
// runtime VITE_API_BASE, which is empty because Caddy proxies /public/v1.
const API = process.env.CATALOG_API || 'https://api.akamisushiwok.com'
const OUT = fileURLToPath(new URL('../src/catalog.json', import.meta.url))

try {
  const res = await fetch(`${API}/public/v1/tools`, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const catalog = await res.json()
  if (!Array.isArray(catalog.tools) || catalog.tools.length === 0) throw new Error('empty catalog')
  await writeFile(OUT, `${JSON.stringify(catalog, null, 2)}\n`)
  console.log(`catalog: ${catalog.tools.length} tools from ${API}`)
} catch (err) {
  console.warn(`catalog: keeping the committed snapshot (${API} unavailable: ${err.message})`)
}
