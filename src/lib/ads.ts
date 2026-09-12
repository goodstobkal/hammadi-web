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

declare global {
  interface Window {
    rdt?: ((...args: unknown[]) => void) & { callQueue?: unknown[]; sendEvent?: unknown }
  }
}

/** True when a campaign is actually configured; the banner only shows then. */
export function adsConfigured(): boolean {
  return Boolean(PIXEL_ID)
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

/** Load the pixel on boot if the visitor already said yes on a previous visit. */
export function initAds() {
  if (adsConfigured() && consentState() === 'granted') loadPixel()
}

/**
 * Report a conversion to Reddit. Silently does nothing without consent or a
 * configured pixel, so callers never have to check first.
 *
 * Reddit's standard events include 'Lead', 'SignUp', 'Search', 'ViewContent'
 * and 'Custom' - map ours onto those so the campaign dashboard can optimise.
 */
export function trackAd(event: string, meta: Record<string, unknown> = {}) {
  if (!loaded || !window.rdt) return
  try {
    window.rdt('track', event, meta)
  } catch {
    /* ignore */
  }
}
