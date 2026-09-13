/**
 * vite-ssg entry: the same app renders to static HTML at build time (one file
 * per route, so search engines and social cards see real content) and hydrates
 * in the browser for the interactive tool forms.
 */
import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import catalog from './catalog.json'
import './style.css'
import { initAnalytics, track } from './lib/analytics'
import { initAds } from './lib/ads'

const routes = [
  { path: '/', name: 'home', component: () => import('./pages/Home.vue') },
  { path: '/tools', name: 'tools', component: () => import('./pages/Tools.vue') },
  { path: '/tools/:slug', name: 'tool', component: () => import('./pages/Tool.vue') },
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
  initAds()
  router.afterEach((to) => {
    window.scrollTo(0, 0)
    track('pageview', { path: to.path })
  })
})

/** Which paths vite-ssg prerenders - every tool gets its own HTML file. */
export function includedRoutes(): string[] {
  const slugs = (catalog.tools as { slug: string }[]).map((t) => `/tools/${t.slug}`)
  // '/404' becomes dist/404.html, which nginx serves with a 404 status.
  return ['/', '/tools', '/ai-agents-for-instagram', '/privacy', '/drop', '/404', ...slugs]
}
