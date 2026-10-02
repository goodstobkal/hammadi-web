<script setup lang="ts">
import { ref } from 'vue'
import { setConsent } from '../lib/ads'
import { LISTING_URL, SITE_NAME, breadcrumbs, useSeo } from '../lib/site'

const path = '/privacy'
const updated = '12 September 2026'

const optedOut = ref(false)
function optOut() {
  setConsent('denied')
  optedOut.value = true
}

useSeo({
  title: `Privacy & Terms | ${SITE_NAME}`,
  description:
    'What hammadi.dev collects, what it does not, and the terms for using the free Instagram tools. No accounts, no cookies for analytics, no selling data.',
  path,
  jsonld: [breadcrumbs([{ name: 'Privacy & terms', path }])],
})
</script>

<template>
  <article class="legal">
    <h1>Privacy &amp; terms</h1>
    <p class="lede">
      The short version: there are no accounts here, we don't sell anything about you, and the
      visitor counts don't use cookies. The detail is below.
    </p>
    <p class="updated">Last updated {{ updated }}</p>

    <h2>What we collect</h2>

    <h3>Lookups you run</h3>
    <p>
      When you use a tool, the profile, post URL or search term you enter is sent to our API so it
      can be looked up, and the result is cached for about an hour so a repeat of the same lookup
      is instant. Your IP address is used to enforce the hourly rate limit and is stored only as a
      counter against that address for the current hour. We don't build a profile of you from what
      you look up, and we don't publish or sell it.
    </p>

    <h3>Visitor statistics</h3>
    <p>
      We count page views and which tools get used, so we know what's worth improving. This runs on
      our own servers — no Google Analytics, no third-party tracker, no cookie and nothing stored in
      your browser. To count returning visits within a day without identifying anyone, the server
      hashes your IP address and browser user-agent together with a random salt that it changes
      every day and never writes down. The result can't be reversed, and yesterday's cannot be
      matched to today's.
    </p>

    <h3>Advertising</h3>
    <p>
      When we're running an ad campaign we set one advertising cookie, via Reddit's conversion
      pixel, so we can tell which ads actually brought people here. That one
      <strong>does</strong> involve a third party.
    </p>
    <p>
      In the EU, the UK and the rest of the EEA we ask first: you'll see a banner, nothing loads
      until you choose, and declining changes nothing about how the site works. Elsewhere it loads
      on arrival, which is the normal practice in those regions. Either way you can turn it off
      below, on any visit.
    </p>
    <p>
      <button class="optout" type="button" @click="optOut">Turn off ad tracking on this device</button>
      <span v-if="optedOut" class="done">Done — no ad cookie will be set here.</span>
    </p>
    <p>
      We do not send Reddit your email address, phone number or any other identifier — Reddit's
      "advanced matching" is deliberately switched off. If no campaign is running, no ad tracking
      loads at all.
    </p>

    <h3>Messages you send us</h3>
    <p>
      The support box asks for your name, email and message so we can reply. That goes to us
      directly, along with your IP address for abuse prevention. It's used to answer you, and for
      nothing else — no newsletter, no list, no resale.
    </p>

    <h2>What we don't collect</h2>
    <ul>
      <li>No account, so no password and no profile.</li>
      <li>No Instagram login. We never ask for one, and you should never give one to a site that does.</li>
      <li>No cookies for analytics, and no fingerprinting.</li>
      <li>
        No selling of personal data, ever. The only third party that receives anything is
        Reddit's ad pixel, and only when a campaign is running and you haven't opted out —
        described under Advertising above.
      </li>
    </ul>

    <h2>About the Instagram data</h2>
    <p>
      Everything the tools return is public data — what any logged-out visitor could see on
      Instagram. Private accounts can't be read, and nothing here is visible to the account you look
      up: they are not notified and nothing appears in their story viewer list.
    </p>
    <p>
      Public doesn't mean unowned. Posts, photos and videos belong to the people who made them. Use
      what you export for research, analysis and outreach — not to republish someone's work as your
      own, not to harass anyone, and not for anything Instagram's terms or your local law forbid.
      You are responsible for what you do with it.
    </p>

    <h2>Terms of use</h2>
    <ul>
      <li>
        The cheap tools are provided as-is, with no guarantee of availability or accuracy. Instagram
        changes constantly and a lookup can fail or come back short; where it does, the result says
        so rather than pretending otherwise.
      </li>
      <li>
        There's an hourly limit per visitor to keep them free for everyone. Don't script against
        them — the <a :href="LISTING_URL" rel="noopener">API</a> exists for volume and is priced for
        it.
      </li>
      <li>
        We may change or withdraw a tool at any time, and we'll update this page when what we
        collect changes.
      </li>
    </ul>

    <h2>Your choices</h2>
    <p>
      Because there's no account, there's very little of yours to hold: rate-limit counters expire
      within a day, the visitor hash can't be traced back to you even by us, and cached results are
      keyed by the lookup rather than by who ran it. If you've sent us a message and want it
      deleted, ask through the support box and we'll remove it.
    </p>

    <h2>Not affiliated with Instagram</h2>
    <p>
      Instagram and Meta are trademarks of Meta Platforms, Inc. This site is not affiliated with,
      endorsed by, or connected to Meta or Instagram in any way.
    </p>
  </article>
</template>

<style scoped>
.legal {
  max-width: 44em;
}
h1 {
  font-size: clamp(28px, 4.5vw, 38px);
  letter-spacing: -0.02em;
  margin: 0 0 12px;
}
.lede {
  font-size: 18px;
  color: var(--muted);
  margin: 0 0 6px;
}
.updated {
  font-size: 14px;
  color: var(--muted);
  margin: 0 0 8px;
}
h2 {
  font-size: 21px;
  margin: 40px 0 8px;
}
h3 {
  font-size: 17px;
  margin: 24px 0 4px;
}
ul {
  padding-left: 20px;
}
.optout {
  background: none;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 16px;
  font: inherit;
  font-size: 15px;
  color: var(--fg);
  cursor: pointer;
}
.optout:hover {
  border-color: var(--accent);
}
.done {
  margin-left: 10px;
  color: var(--muted);
  font-size: 14px;
}
li {
  margin: 8px 0;
}
</style>
