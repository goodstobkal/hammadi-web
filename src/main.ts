/**
 * vite-ssg entry: the same app renders to static HTML at build time (one file
 * per route, so search engines and social cards see real content) and hydrates
 * in the browser. No backend — a static marketing site for the extensions.
 */
import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { EXTENSIONS } from './lib/extensions'
import './style.css'

const routes = [
  { path: '/', name: 'landing', component: () => import('./pages/Landing.vue') },
  {
    path: '/extensions/:slug',
    name: 'extension',
    component: () => import('./pages/ExtensionPage.vue'),
  },
  { path: '/privacy', name: 'privacy', component: () => import('./pages/Privacy.vue') },
  // Everything else (old tool/influencer/guide URLs) redirects to the home page.
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const createApp = ViteSSG(App, { routes }, ({ router, isClient }) => {
  if (!isClient) return
  router.afterEach(() => {
    window.scrollTo(0, 0)
  })
})

/** Which paths vite-ssg prerenders — home, privacy, and one page per extension. */
export function includedRoutes(): string[] {
  return ['/', '/privacy', ...EXTENSIONS.map((e) => `/extensions/${e.slug}`)]
}
