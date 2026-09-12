/**
 * Reddit advertising pixel.
 *
 * Unlike `analytics.ts`, this is a third-party tracker: it loads a script
 * from Reddit, sets its own cookies and reports the visit back to Reddit so
 * campaign conversions can be attributed. That is exactly the kind of
 * processing that needs an opt-in under GDPR/ePrivacy, so nothing here runs
 * until the visitor accepts — and nothing runs at all unless a pixel id is
 * configured, so the site carries no ad tracking while no campaign exists.
 *
 * Set the id at build time:
 *
 *     VITE_REDDIT_PIXEL_ID=a2_xxxxxxxxxxxx npm run build
 */
const PIXEL_ID = import.meta.env.VITE_REDDIT_PIXEL_ID || ''
const CONSENT_KEY = 'hammadi.ads-consent'

/**
 * Where an opt-in is legally required before an advertising cookie.
 *
 * Inferred from the browser's own timezone: it needs no geo-IP lookup, no
 * third-party service and no extra request, and the browser already knows.
 * It is a heuristic - someone in the EU travelling with a foreign timezone
 * is misread - so it is deliberately generous, and anyone can still decline
 * from the privacy page.
 *
 * Outside those regions the pixel loads on arrival, which is also what lets
 * Reddit's own "is the pixel installed" check see it.
 */
const CONSENT_REGIONS = /^(Europe\/|Atlantic\/(Canary|Azores|Madeira|Faroe|Reykjavik)|Asia\/(Nicosia|Famagusta))/

export function consentRequired(): boolean {
  try {
    return CONSENT_REGIONS.test(Intl.DateTimeFormat().resolvedOptions().timeZone || '')
  } catch {
    // Can't tell - assume the stricter rule applies.
    return true
  }
}

declare global {
  interface Window {
    rdt?: ((...args: unknown[]) => void) & { callQueue?: unknown[]; sendEvent?: unknown }
  }
}

/** True when a campaign is actually configured; without one there is nothing
 *  to track and nothing to ask about. */
export function adsConfigured(): boolean {
  return Boolean(PIXEL_ID)
}

/** Whether to show the cookie choice: only where consent is required. */
export function shouldAskConsent(): boolean {
  return adsConfigured() && consentRequired() && consentState() === 'unset'
}

export function consentState(): 'granted' | 'denied' | 'unset' {
  try {
    const v = localStorage.getItem(CONSENT_KEY)
    return v === 'granted' || v === 'denied' ? v : 'unset'
  } catch {
    // Private window or blocked storage: treat as undecided and, since we
    // can't remember a yes, never load the pixel.
    return 'unset'
  }
}

export function setConsent(state: 'granted' | 'denied') {
  try {
    localStorage.setItem(CONSENT_KEY, state)
  } catch {
    /* ignore */
  }
  if (state === 'granted') loadPixel()
}

let loaded = false

/** Reddit's own snippet, transcribed rather than eval'd from a string. */
function loadPixel() {
  if (loaded || !PIXEL_ID || typeof window === 'undefined') return
  loaded = true
  if (!window.rdt) {
    const rdt = function (...args: unknown[]) {
      // eslint-disable-next-line prefer-spread
      if (rdt.sendEvent) (rdt.sendEvent as (...a: unknown[]) => void)(...args)
      else rdt.callQueue!.push(args)
    } as NonNullable<Window['rdt']>
    rdt.callQueue = []
    window.rdt = rdt
  }
  const script = document.createElement('script')
  script.async = true
  // Reddit's own snippet puts the id on the script URL as well as in
  // init(), and marks it do-not-modify - match it exactly.
  script.src = `https://www.redditstatic.com/ads/pixel.js?pixel_id=${encodeURIComponent(PIXEL_ID)}`
  document.head.appendChild(script)
  window.rdt!('init', PIXEL_ID)
  window.rdt!('track', 'PageVisit')
}

/**
 * Decide on boot whether the pixel may load: an explicit yes always counts,
 * an explicit no always wins, and everyone outside a consent region loads by
 * default.
 */
export function initAds() {
  if (!adsConfigured()) return
  const state = consentState()
  if (state === 'denied') return
  if (state === 'granted' || !consentRequired()) loadPixel()
}

/**
 * Report a conversion to Reddit. Silently does nothing without consent or a
 * configured pixel, so callers never have to check first.
 *
 * Reddit's standard events include 'Lead', 'SignUp', 'Search', 'ViewContent'
 * and 'Custom' - map ours onto those so the campaign dashboard can optimise.
 */
export function trackAd(event: string, meta: Record<string, unknown> = {}, conversionId?: string) {
  if (!loaded || !window.rdt) return
  try {
    // A unique id per conversion: Reddit uses it to drop duplicates (a
    // double-click, a retry), and it is the key that lets a server-side
    // Conversions API event be matched to this one rather than counted twice.
    window.rdt('track', event, { conversionId: conversionId || newConversionId(), ...meta })
  } catch {
    /* ignore */
  }
}

/** True when ad reporting is permitted right now - the same rule the pixel
 *  uses, so the server-side copy can't track someone who opted out. */
export function adsAllowed(): boolean {
  if (!adsConfigured()) return false
  const state = consentState()
  if (state === 'denied') return false
  return state === 'granted' || !consentRequired()
}

export function conversionId(): string {
  return newConversionId()
}

function newConversionId(): string {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID()
  } catch {
    /* older browser */
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
