/**
 * First-party analytics.
 *
 * Everything here goes to our own API and nowhere else: no third-party
 * script, no cookie, no localStorage, no device fingerprint. The server
 * derives a visitor id by hashing IP + user-agent with a salt it rotates
 * daily and never stores, which is enough to count unique visitors and
 * follow one session through a funnel, and useless for identifying anyone
 * or for joining two days together. That is what keeps this out of
 * consent-banner territory — the Reddit pixel in `ads.ts` is a different
 * matter and is gated behind an explicit opt-in.
 *
 * Events are fire-and-forget. A blocked or failing beacon must never
 * interfere with the page.
 */
import { adsAllowed } from './ads'
import { API_BASE } from './site'

export type EventName = 'pageview' | 'tool_run' | 'tool_error' | 'export' | 'api_click' | 'recommend' | 'feedback' | 'chat_launcher' | 'extension_click'

type Payload = {
  path?: string
  tool?: string
  meta?: Record<string, unknown>
  /** Set on conversions so Reddit can match the server copy to the pixel's. */
  conversionId?: string
}

/** utm_* from the landing URL, kept for the session so a conversion three
 *  pages later is still attributed to the campaign that paid for the click. */
const campaign = {
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
}
let landingReferrer = ''
// Reddit appends rdt_cid to the landing URL; it is what ties a conversion
// back to the exact click that paid for it.
let clickId = ''
let started = false

export function initAnalytics() {
  if (started || typeof window === 'undefined') return
  started = true
  try {
    const params = new URLSearchParams(window.location.search)
    campaign.utm_source = params.get('utm_source') || ''
    campaign.utm_medium = params.get('utm_medium') || ''
    campaign.utm_campaign = params.get('utm_campaign') || ''
    clickId = params.get('rdt_cid') || ''
    // Only an external referrer is interesting; our own pages are noise.
    const ref = document.referrer || ''
    landingReferrer = ref && !ref.includes(window.location.host) ? ref : ''
  } catch {
    /* a locked-down browser is not a reason to break the page */
  }

  // The money conversion: a click through to the paid listing. Delegated from
  // the document so every link to it counts, on every page, without each one
  // having to remember a handler.
  document.addEventListener(
    'click',
    (e) => {
      const link = (e.target as HTMLElement | null)?.closest?.('a')
      if (!link) return
      const href = link.getAttribute('href') || ''
      if (!href.includes('rapidapi.com')) return
      void import('./ads').then((ads) => {
        const id = ads.conversionId()
        track('api_click', { meta: { href, from: window.location.pathname }, conversionId: id })
        ads.trackAd('SignUp', { itemCount: 1 }, id)
      })
    },
    { capture: true },
  )
}

export function track(name: EventName, payload: Payload = {}) {
  if (typeof window === 'undefined') return
  const body = JSON.stringify({
    name,
    path: payload.path ?? window.location.pathname,
    referrer: landingReferrer,
    ...campaign,
    tool: payload.tool ?? '',
    meta: payload.meta ?? {},
    conversion_id: payload.conversionId ?? '',
    // The server only reports to Reddit when this is true, so an opt-out is
    // honoured on both sides rather than only in the browser.
    ads_ok: adsAllowed(),
    screen_w: window.screen?.width ?? 0,
    screen_h: window.screen?.height ?? 0,
    click_id: clickId,
  })
  const url = `${API_BASE}/public/v1/event`
  try {
    // sendBeacon survives the page being closed, which a fetch() may not.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
      return
    }
    void fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* ignore */
  }
}
