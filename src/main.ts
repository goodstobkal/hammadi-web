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

const routes = [
  { path: '/', name: 'home', component: () => import('./pages/Home.vue') },
  { path: '/tools', name: 'tools', component: () => import('./pages/Tools.vue') },
  { path: '/tools/bulk-profile-lookup', name: 'bulk', component: () => import('./pages/Bulk.vue') },
  { path: '/tools/download-instagram-profile', name: 'profile-zip', component: () => import('./pages/ProfileZip.vue') },
  { path: '/tools/:slug', name: 'tool', component: () => import('./pages/Tool.vue') },
  { path: '/extension', name: 'extension', component: () => import('./pages/Extension.vue') },
  { path: '/reel-comment-checker', name: 'reel-check', component: () => import('./pages/ReelCheck.vue') },
  { path: '/orders', name: 'orders', component: () => import('./pages/Orders.vue') },
  { path: '/services/bundle', name: 'bundle', component: () => import('./pages/Bundle.vue') },
  { path: '/services/country-check', name: 'country-check', component: () => import('./pages/CountryCheck.vue') },
  { path: '/services/:slug', name: 'product', component: () => import('./pages/Product.vue') },
  { path: '/privacy', name: 'privacy', component: () => import('./pages/Privacy.vue') },
  // A utility, not a landing page: prerendered so it loads, but kept out of
  // the nav and the sitemap, and robots disallows it.
  { path: '/drop', name: 'drop', component: () => import('./pages/Drop.vue') },
  {
    path: '/ai-agents-for-instagram',
    name: 'ai-agents',
    component: () => import('./pages/AiAgents.vue'),
  },
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
  const slugs = (catalog.tools as { slug: string }[]).filter((t) => KEPT_TOOLS.has(t.slug)).map((t) => `/tools/${t.slug}`)
  // '/404' becomes dist/404.html, which nginx serves with a 404 status.
  return ['/', '/services/influencer-lists', '/services/profile-pack', '/services/reel-analysis', '/services/country-check', '/services/bundle', '/orders', '/reel-comment-checker', '/extension', '/tools', '/ai-agents-for-instagram', '/privacy', '/drop', '/404', ...slugs]
}
