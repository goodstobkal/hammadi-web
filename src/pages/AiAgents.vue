<script setup lang="ts">
import SupportBox from '../components/SupportBox.vue'
import { LISTING_URL, SITE_NAME, SITE_URL, breadcrumbs, useSeo } from '../lib/site'

const path = '/ai-agents-for-instagram'

const faq = [
  {
    q: 'Can ChatGPT read Instagram data?',
    a: "Not on its own - it has no access to Instagram's data and can't log in. It can, however, call a tool that does. Point an agent at an Instagram scraping API and the model handles the reasoning while the API handles the fetching.",
  },
  {
    q: 'What is an AI agent for Instagram?',
    a: 'A language model plus tools it can call, running on a loop: you describe the outcome ("shortlist ten skincare nano-influencers in Canada and draft outreach"), the model decides which lookups to run, runs them, reads the results and keeps going until it is done.',
  },
  {
    q: 'How do I give an LLM live Instagram data today?',
    a: 'Expose the API endpoints as tools in your agent framework - function calling in the OpenAI SDK, tool use in the Anthropic SDK, or a tool in LangChain or LlamaIndex. Each endpoint returns plain JSON, which is already the shape models handle best. You can build this now without waiting for anything from us.',
  },
  {
    q: 'What stage is the hosted agent at?',
    a: "Early access, and not generally available. We're taking a small number of teams through it one at a time so the workflows get built around real use cases. Request access below and you'll hear when a slot opens.",
  },
  {
    q: 'What does it cost?',
    a: "Pricing isn't set yet - that's part of what the early access group is helping shape. The underlying API is priced publicly on RapidAPI today.",
  },
]

useSeo({
  title: `AI Agents for Instagram - Give ChatGPT & Claude Live Instagram Data | ${SITE_NAME}`,
  description:
    'Build LLM agents that read live Instagram data: profiles, reels, comments, followers and influencer search as callable tools for ChatGPT, Claude, LangChain or your own stack. Request early access to the hosted agent.',
  path,
  jsonld: [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
    breadcrumbs([{ name: 'AI agents for Instagram', path }]),
  ],
})
</script>

<template>
  <article class="agents">
    <p class="eyebrow">Early access</p>
    <h1>AI agents for Instagram</h1>
    <p class="lede">
      Language models are good at deciding what to look up and terrible at looking it up. Give an
      agent the Instagram half — profiles, reels, comments, followers, influencer search — and it
      can research a niche, vet a creator or summarise a comment section on its own.
    </p>

    <section class="callout">
      <h2>Build it yourself today</h2>
      <p>
        You don't need anything from us to start. Every endpoint on the
        <a :href="LISTING_URL" rel="noopener">Instagram Scraper API</a> returns plain JSON, which is
        exactly what a model's tool-calling interface wants. Register the endpoints you need as
        tools in the OpenAI or Anthropic SDK, LangChain, LlamaIndex or your own loop, and the model
        handles the rest.
      </p>
      <pre><code>tools = [{
    "name": "instagram_profile_reels",
    "description": "Every reel on a public Instagram profile, with view counts.",
    "input_schema": {
        "type": "object",
        "properties": {
            "channel_url": {"type": "string", "description": "@handle or profile URL"},
            "count": {"type": "integer", "description": "How many reels, up to 1000"},
        },
        "required": ["channel_url"],
    },
}]</code></pre>
      <p class="note">
        The <a href="/spotlights">guides</a> have working Python for each endpoint — an agent tool
        is that code with a schema wrapped around it.
      </p>
    </section>

    <h2>What we're building on top</h2>
    <p>
      A hosted agent, so you don't have to assemble the loop, the retries and the rate limits
      yourself. You describe an outcome; it plans the lookups, runs them against the same
      infrastructure behind the free tools, and hands back a finished artefact — a shortlist, a
      comment digest, a competitor brief.
    </p>
    <ul class="uses">
      <li>
        <strong>Creator sourcing.</strong> "Twenty fitness nano-influencers in Canada, 1k–10k
        followers, engagement above 3%, with contact emails where public."
      </li>
      <li>
        <strong>Comment digests.</strong> "Read every comment on these six reels and tell me the
        three complaints that keep coming up."
      </li>
      <li>
        <strong>Competitor briefs.</strong> "Watch these four brands' reels and tell me on Monday
        what changed and which post broke out."
      </li>
    </ul>

    <section class="access">
      <h2>Request early access</h2>
      <p class="muted">
        It isn't open to everyone yet — we're onboarding a few teams at a time so the workflows get
        built around real problems. Tell us what you'd point it at and we'll be in touch when
        there's a slot.
      </p>
      <SupportBox
        inline
        topic="AI agents early access"
        title="Request early access"
        blurb="Leave your email and what you'd use it for. No spam, and nothing is charged."
        message-label="What would you point an agent at? (optional)"
        :message-required="false"
      />
    </section>

    <h2>Frequently asked questions</h2>
    <div v-for="item in faq" :key="item.q">
      <h3>{{ item.q }}</h3>
      <p>{{ item.a }}</p>
    </div>

    <p class="outro">
      In the meantime, the <RouterLink to="/tools">free tools</RouterLink> do the individual lookups
      in your browser, and the <a :href="LISTING_URL" rel="noopener">API</a> does them in your code.
    </p>
  </article>
</template>

<style scoped>
.eyebrow {
  display: inline-block;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  color: #fff;
  background: var(--accent);
  border-radius: 999px;
  padding: 4px 12px;
  margin: 0 0 14px;
}
h1 {
  font-size: clamp(30px, 5vw, 44px);
  line-height: 1.12;
  letter-spacing: -0.025em;
  margin: 0 0 14px;
}
.lede {
  font-size: 19px;
  color: var(--muted);
  max-width: 46em;
  margin: 0 0 8px;
}
h2 {
  font-size: 21px;
  margin: 40px 0 8px;
}
h3 {
  font-size: 17px;
  margin: 22px 0 4px;
}
.callout,
.access {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 4px 24px 24px;
  margin: 32px 0;
}
.access {
  border-color: var(--accent);
}
pre {
  background: #16171b;
  color: #e8e6e3;
  padding: 18px;
  border-radius: 12px;
  overflow-x: auto;
  font: 13px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace;
}
.note,
.muted {
  color: var(--muted);
  font-size: 15px;
}
.uses {
  padding-left: 20px;
}
.uses li {
  margin: 10px 0;
}
.outro {
  margin-top: 44px;
  color: var(--muted);
}
</style>
