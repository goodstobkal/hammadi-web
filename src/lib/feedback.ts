/** First-run feedback pop-up: after a visitor's first successful tool run we
 * ask once for stars + a note, which the API emails to the owner. */
import { reactive } from 'vue'

const KEY = 'fb_popup_asked'

export const feedbackPopup = reactive({ open: false, tool: '' })

export function askFeedbackOnce(tool: string): void {
  if (typeof window === 'undefined') return
  try {
    if (localStorage.getItem(KEY)) return
    localStorage.setItem(KEY, String(Date.now()))
  } catch {
    return // storage blocked: don't nag on every run
  }
  // Let the results render first.
  setTimeout(() => Object.assign(feedbackPopup, { open: true, tool }), 1500)
}
