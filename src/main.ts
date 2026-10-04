/**
 * vite-ssg entry: the same app renders to static HTML at build time (one file
 * per route, so search engines and social cards see real content) and hydrates
 * in the browser for the interactive tool forms.
 */
import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { KEPT_TOOLS } from './lib/site'
import catalog from './catalog.json'
import './style.css'
import { initAnalytics, track , initEngagement, startPage} from './lib/analytics'
import { initAds } from './lib/ads'

// Static marketing site (no backend): a landing page for the extensions + privacy.
const routes = [
  { path: '/', name: 'landing', component: () => import('./pages/Landing.vue') },
  { path: '/extension', redirect: '/' },
  { path: '/home', redirect: '/' },
  { path: '/privacy', name: 'privacy', component: () => import('./pages/Privacy.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./pages/NotFound.vue') },
]

export const createApp = ViteSSG(App, { routes }, ({ router, isClient }) => {
  if (!isClient) return
  initAnalytics()
  initEngagement()
  initAds()
  router.afterEach((to) => {
    window.scrollTo(0, 0)
    startPage(to.path)
    track('pageview', { path: to.path })
  })
})

/** Which paths vite-ssg prerenders - every tool gets its own HTML file. */
export function includedRoutes(): string[] {
  return ['/', '/privacy', '/404']
}
