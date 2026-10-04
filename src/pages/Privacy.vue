<script setup lang="ts">
import { SITE_NAME, useSeo } from '../lib/site'

const path = '/privacy'
const updated = '4 October 2026'

useSeo({
  title: `Privacy & Terms | ${SITE_NAME}`,
  description:
    'What our Chrome extensions collect, what they do not, and the terms for using them. No accounts, no servers, no tracking — everything runs in your own browser.',
  path,
})
</script>

<template>
  <article class="legal">
    <h1>Privacy &amp; terms</h1>
    <p class="lede">
      The short version: there are no accounts, no servers and no tracking. Our extensions run
      entirely in your own browser, and this website is a set of static pages. The detail is below.
    </p>
    <p class="updated">Last updated {{ updated }}</p>

    <h2>The extensions</h2>
    <p>
      Each extension runs locally in your browser tab. It reads the page you are already looking at
      (for example, your Google Maps search results or an Instagram post's comments) and turns it
      into a file you can download. The data it reads stays on your device — it is not sent to us or
      to any server we control.
    </p>
    <p>
      Some extensions can draft AI replies using your own OpenAI or Claude API key. That key is
      stored locally in your browser (via the browser's extension storage) and is sent only to the
      AI provider you chose, directly from your browser, when you ask for a suggestion. We never see
      it.
    </p>

    <h2>This website</h2>
    <p>
      hammadi.dev is a static site. There is no account system, no analytics cookie and no
      third-party tracker. Nothing about your visit is stored.
    </p>

    <h2>The waitlist</h2>
    <p>
      If you enter your email on a waitlist, it is sent to a form-processing service purely so we can
      email you once that extension launches. We use it for that one notification and nothing else —
      no newsletter, no list, no resale. Ask us and we'll delete it.
    </p>

    <h2>What we don't collect</h2>
    <ul>
      <li>No account, so no password and no profile.</li>
      <li>No Instagram, Google or Etsy login — we never ask for one, and you shouldn't give one to a site that does.</li>
      <li>No analytics cookies, and no fingerprinting.</li>
      <li>No selling of personal data, ever.</li>
    </ul>

    <h2>About the data the extensions read</h2>
    <p>
      Everything the extensions read is public information already shown on the page you have open —
      what any visitor could see. Use what you export for research, analysis and outreach; not to
      republish someone's work as your own, not to harass anyone, and not for anything the site's
      terms or your local law forbid. You are responsible for what you do with it.
    </p>

    <h2>Terms of use</h2>
    <ul>
      <li>The extensions are provided as-is, with no guarantee of availability or accuracy. The
        sites they read change constantly, so a run can fail or come back short.</li>
      <li>We may change or withdraw an extension at any time, and we'll update this page when what we
        collect changes.</li>
    </ul>

    <h2>Not affiliated</h2>
    <p>
      Instagram and Meta are trademarks of Meta Platforms, Inc.; Google Maps is a trademark of
      Google LLC; Etsy is a trademark of Etsy, Inc. This site and its extensions are independent and
      not affiliated with, endorsed by, or connected to any of them.
    </p>
  </article>
</template>

<style scoped>
.legal { max-width: 44em; }
h1 { font-size: clamp(28px, 4.5vw, 38px); letter-spacing: -0.02em; margin: 0 0 12px; }
.lede { font-size: 18px; color: var(--muted); margin: 0 0 6px; }
.updated { font-size: 14px; color: var(--muted); margin: 0 0 8px; }
h2 { font-size: 21px; margin: 40px 0 8px; }
ul { padding-left: 20px; }
li { margin: 8px 0; }
</style>
