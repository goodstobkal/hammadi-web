/** The three done-for-you products sold on hammadi.dev. Each pack's `url` is
 * a live Stripe Payment Link; the checkout asks for what we need (niche,
 * profile or reel links) and the API fulfils the order automatically. */
export type Pack = { name: string; note: string; price: number; url: string; best?: boolean }
export type Product = {
  slug: string
  icon: string
  name: string
  tagline: string
  seoTitle: string
  seoDescription: string
  intro: string
  delivery: string
  youGet: string[]
  steps: string[]
  sample: { label: string; value: string }[]
  packs: Pack[]
  faq: [string, string][]
}

export const PRODUCTS: Product[] = [
  {
    slug: 'influencer-lists',
    icon: '🎯',
    name: 'Influencer lists',
    tagline: 'A ready-to-use list of influencers in your niche, with their public emails.',
    seoTitle: 'Buy a Targeted Influencer List with Emails - Instagram, TikTok & YouTube',
    seoDescription:
      'Get a custom list of 100 to 20,000 Instagram, TikTok or YouTube influencers in your niche and country, with followers, engagement and public contact emails, delivered as Excel within 24 hours. From $29.',
    intro:
      'Tell us the platform, niche, country and follower size. We build the list from our creator database and send you an Excel file you can start outreach from the same day.',
    delivery: 'Within 24 hours',
    youGet: [
      'Instagram, TikTok or YouTube creators that match your niche and country',
      'Handle, profile link, followers, engagement rate and bio',
      'Public contact email for every creator that lists one',
      'Filtered by follower size: nano, micro, macro or mega',
      'An Excel file you can sort, filter and import into any CRM',
    ],
    steps: [
      'Pick a pack and pay securely with Stripe',
      'Describe the influencers you want at checkout: platform, niche, country, size, anything else',
      'Get your Excel list by email within 24 hours',
    ],
    sample: [
      { label: 'Handle', value: '@greenkitchen.lena' },
      { label: 'Followers', value: '48,200' },
      { label: 'Engagement', value: '4.1%' },
      { label: 'Niche', value: 'Vegan recipes' },
      { label: 'Email', value: 'hello@…(public)' },
    ],
    packs: [
      { name: '100 influencers', note: '+ public emails', price: 29, url: 'https://buy.stripe.com/28EdR24gAeurbDdgF9cbC02' },
      { name: '500 influencers', note: 'List only, no emails', price: 49, url: 'https://buy.stripe.com/bJe3co6oI0DBfTtdsXcbC03' },
      { name: '500 influencers', note: '+ public emails', price: 99, url: 'https://buy.stripe.com/cNi7sE00k0DB6iT0GbcbC04', best: true },
      { name: '1,000 influencers', note: '+ public emails', price: 179, url: 'https://buy.stripe.com/8x2eV65kE5XV4aL74zcbC05' },
      { name: '20,000 influencers', note: '+ country & public emails · full details', price: 200, url: 'https://buy.stripe.com/8x28wIbJ25XV4aLex1cbC0a' },
    ],
    faq: [
      ['Which platforms do you cover?', 'Instagram, TikTok and YouTube. Just say which one in your description at checkout, for example "TikTok vegan food creators in the US, 10k-100k followers".'],
      ['Where do the emails come from?', 'They are the contact emails creators publish on their own profiles. Not every creator lists one, so the email column is filled where an address is public.'],
      ['Can I target a specific country or size?', 'Yes. Put it in your description: country, follower range (nano 1k-10k, micro 10k-100k, macro 100k-1M, mega 1M+), language, gender, content style.'],
      ["What if the list doesn't fit?", "Reply to the delivery email and we'll adjust it. You're never stuck with a list you can't use."],
    ],
  },
  {
    slug: 'profile-pack',
    icon: '📦',
    name: 'Full profile pack',
    tagline: 'Every post, photo and video of a profile, plus all its comments analysed by AI.',
    seoTitle: 'Full Instagram Profile Analysis & Download - Posts, Comments & AI Report',
    seoDescription:
      'Download every photo and video of an Instagram profile as a ZIP, get all comments with AI sentiment, and a report on engagement, posting rhythm and what fans love, ask and complain about. $49, delivered by email.',
    intro:
      'Send us any public Instagram profile. We download every post, collect the comments, score the sentiment of each one and send you a clear report on how the account performs and what its audience says.',
    delivery: 'Usually within 1 hour, always within 24 hours',
    youGet: [
      'ZIP of every photo and video (up to 500 posts), one file per carousel slide',
      'Excel with every post: date, type, likes, comments, views and caption',
      'All comments from the latest 20 posts (50 on Deep) with AI sentiment',
      'Report: engagement rate, average likes and comments, posts per week, content mix, top hashtags',
      'What fans love, their complaints, their top questions and what they talk about most',
    ],
    steps: [
      'Pick a pack and pay securely with Stripe',
      'Enter the Instagram profile (@username or link) at checkout',
      'Get the report, Excel file and ZIP link by email',
    ],
    sample: [
      { label: 'Posts', value: '312' },
      { label: 'Engagement', value: '3.4%' },
      { label: 'Sentiment', value: '68% positive' },
      { label: 'Fans love', value: 'Before/after edits' },
      { label: 'Top question', value: 'Which camera?' },
    ],
    packs: [
      { name: 'Profile pack', note: 'Comments from latest 20 posts', price: 49, url: 'https://buy.stripe.com/cNi7sE8wQ8636iTcoTcbC06', best: true },
      { name: 'Deep pack', note: 'Comments from latest 50 posts', price: 99, url: 'https://buy.stripe.com/9B6aEQ28s71ZcHh0GbcbC07' },
    ],
    faq: [
      ['Does it work on any account?', 'Any public Instagram profile. Private accounts cannot be read.'],
      ['How is sentiment measured?', 'Each comment is scored positive, neutral or negative by a multilingual AI model trained on social media, so emoji and slang are understood.'],
      ['Who is it for?', 'Influencers checking their own audience, brands vetting a creator before a deal, and marketers studying competitors.'],
      ['How long is the ZIP link valid?', '3 days. The Excel report is attached to the email, so you keep it forever.'],
    ],
  },
  {
    slug: 'reel-analysis',
    icon: '🎬',
    name: 'Reel analysis',
    tagline: 'Transcript, every comment and a clear report on how your reel landed.',
    seoTitle: 'Instagram Reel Analysis - AI Transcript, Comments & Report',
    seoDescription:
      'Get a report on any Instagram reel: full transcript, all comments with sentiment, what viewers love, ask and complain about. $19 per reel, delivered by email.',
    intro:
      'Send us a reel link. We transcribe what is said, collect every comment, score the sentiment and show you what viewers love, ask and complain about.',
    delivery: 'Usually within 30 minutes',
    youGet: [
      'Full transcript of what is said in the reel',
      'Every comment (up to 5,000) with AI sentiment',
      'The hook: the first words viewers hear',
      'What viewers love, their complaints and their top questions',
      'The words and emoji viewers use most',
    ],
    steps: [
      'Pick a pack and pay securely with Stripe',
      'Paste the reel link (or up to 5 links) at checkout',
      'Get the report and Excel file by email',
    ],
    sample: [
      { label: 'Views', value: '182,400' },
      { label: 'Sentiment', value: '74% positive' },
      { label: 'Hook', value: '"Wait for the end…"' },
      { label: 'Top question', value: 'Where to buy?' },
      { label: 'Top emoji', value: '😍 ×212' },
    ],
    packs: [
      { name: '1 reel', note: 'Transcript + comments + AI report', price: 19, url: 'https://buy.stripe.com/bJe6oA00k0DB22DagLcbC08', best: true },
      { name: '5 reels', note: 'Compare what works across reels', price: 69, url: 'https://buy.stripe.com/28EfZadRafyv22Dex1cbC09' },
    ],
    faq: [
      ['Can I analyse someone else’s reel?', 'Yes, any public reel. It works for competitor research as well as your own content.'],
      ['What languages are supported?', 'Transcription and sentiment work in most major languages, including English, Spanish, French, Arabic and Hindi.'],
      ['What if comments are turned off?', 'You still get the transcript and the AI read on the content. The comment sections will be empty.'],
      ['How do I send 5 reels?', 'Paste all 5 links in the box at checkout, separated by spaces.'],
    ],
  },
]

export const productBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug)
