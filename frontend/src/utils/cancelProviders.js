export const CANCEL_PROVIDERS = [
  // Streaming
  {
    name: "Netflix",
    pattern: /netflix/i,
    url: "https://www.netflix.com/cancelplan",
  },
  {
    name: "Spotify",
    pattern: /spotify/i,
    url: "https://www.spotify.com/account/subscription/",
  },
  {
    name: "Disney Plus",
    pattern: /disney\+|disney plus|disneyplus/i,
    url: "https://www.disneyplus.com/account",
  },
  {
    name: "Hulu",
    pattern: /hulu/i,
    url: "https://secure.hulu.com/account",
  },
  {
    name: "Max",
    pattern: /hbo|max/i,
    url: "https://www.max.com/account",
  },
  {
    name: "Amazon Prime",
    pattern: /amazon prime|prime video|amazon\.de|amazon\.com/i,
    url: "https://www.amazon.com/primecentral",
  },
  {
    name: "Paramount Plus",
    pattern: /paramount/i,
    url: "https://www.paramountplus.com/account/",
  },
  {
    name: "Peacock",
    pattern: /peacock/i,
    url: "https://www.peacocktv.com/account/subscription",
  },
  {
    name: "Crunchyroll",
    pattern: /crunchyroll/i,
    url: "https://www.crunchyroll.com/account/subscription",
  },
  {
    name: "DAZN",
    pattern: /dazn/i,
    url: "https://www.dazn.com/account",
  },
  // Tech
  {
    name: "Apple",
    pattern: /apple|itunes|icloud/i,
    url: "https://apps.apple.com/account/subscriptions",
  },
  {
    name: "Google",
    pattern: /google|youtube|yt premium/i,
    url: "https://play.google.com/store/account/subscriptions",
  },
  {
    name: "Microsoft",
    pattern: /microsoft|office 365|xbox|game pass/i,
    url: "https://account.microsoft.com/services",
  },
  {
    name: "Adobe",
    pattern: /adobe/i,
    url: "https://account.adobe.com/plans",
  },
  {
    name: "Dropbox",
    pattern: /dropbox/i,
    url: "https://www.dropbox.com/account/billing",
  },
  {
    name: "Notion",
    pattern: /notion/i,
    url: "https://www.notion.so/my-account",
  },
  {
    name: "Figma",
    pattern: /figma/i,
    url: "https://www.figma.com/settings/billing",
  },
  {
    name: "Slack",
    pattern: /slack/i,
    url: "https://slack.com/account/billing",
  },
  {
    name: "Zoom",
    pattern: /zoom/i,
    url: "https://zoom.us/account",
  },
  {
    name: "GitHub",
    pattern: /github/i,
    url: "https://github.com/settings/billing",
  },
  {
    name: "ChatGPT",
    pattern: /chatgpt|openai/i,
    url: "https://chat.openai.com/settings/subscription",
  },
  {
    name: "Claude",
    pattern: /claude|anthropic/i,
    url: "https://claude.ai/settings/billing",
  },
  // Fitness & Lifestyle
  {
    name: "John Reed",
    pattern: /john reed|rsg group/i,
    url: "https://www.johnreed.fitness/mitgliedschaft",
  },
  {
    name: "McFit",
    pattern: /mcfit|mc fit/i,
    url: "https://www.mcfit.com/mitgliedschaft",
  },
  {
    name: "Peloton",
    pattern: /peloton/i,
    url: "https://members.onepeloton.com/settings/subscription",
  },
  {
    name: "Headspace",
    pattern: /headspace/i,
    url: "https://www.headspace.com/account/manage",
  },
  {
    name: "Calm",
    pattern: /calm/i,
    url: "https://www.calm.com/account",
  },
  // Food & Delivery
  {
    name: "Uber Eats",
    pattern: /uber eats|uber/i,
    url: "https://www.uber.com/account",
  },
  {
    name: "Lieferando",
    pattern: /lieferando/i,
    url: "https://www.lieferando.de/account",
  },
  {
    name: "HelloFresh",
    pattern: /hellofresh/i,
    url: "https://www.hellofresh.de/account/subscription",
  },
  // Finance & News
  {
    name: "PayPal",
    pattern: /paypal/i,
    url: "https://www.paypal.com/myaccount/autopay/",
  },
  {
    name: "LinkedIn",
    pattern: /linkedin/i,
    url: "https://www.linkedin.com/mypreferences/d/subscription",
  },
  {
    name: "Medium",
    pattern: /medium/i,
    url: "https://medium.com/me/settings/membership",
  },
  {
    name: "Audible",
    pattern: /audible/i,
    url: "https://www.audible.com/account/overview",
  },
  {
    name: "Kindle",
    pattern: /kindle/i,
    url: "https://www.amazon.com/hz/mycd/myx",
  },
];

// Additional subscription patterns (no cancel URL needed, just detection)
const SUBSCRIPTION_PATTERNS = [
  // Dev tools & SaaS
  /cursor/i,
  /vercel/i,
  /netlify/i,
  /heroku/i,
  /railway/i,
  /render\b/i,
  /supabase/i,
  /planetscale/i,
  /mongodb/i,
  /redis/i,
  /twilio/i,
  /sendgrid/i,
  /mailchimp/i,
  /postmark/i,
  /sentry/i,
  /posthog/i,
  /amplitude/i,
  /mixpanel/i,
  /datadog/i,
  /newrelic/i,
  /logrocket/i,
  /hotjar/i,
  /ahrefs/i,
  /semrush/i,
  /moz\b/i,
  /setapp/i,
  /1password/i,
  /lastpass/i,
  /bitwarden/i,
  /dashlane/i,
  /nordvpn/i,
  /expressvpn/i,
  /surfshark/i,
  /proton/i,
  /grammarly/i,
  /canva/i,
  /loom/i,
  /miro/i,
  /linear/i,
  /asana/i,
  /monday\.com/i,
  /clickup/i,
  /todoist/i,
  /evernote/i,
  /roam/i,
  /obsidian/i,
  /craft\b/i,
  /bear\b/i,
  /ulysses/i,
  /superhuman/i,
  /front\b/i,
  /intercom/i,
  /zendesk/i,
  /freshdesk/i,
  /hubspot/i,
  /salesforce/i,
  /pipedrive/i,
  /stripe/i,
  /square/i,
  /shopify/i,
  /wix/i,
  /squarespace/i,
  /webflow/i,
  /framer/i,
  /bubble/i,
  /retool/i,
  /zapier/i,
  /make\.com|integromat/i,
  /ifttt/i,
  /n8n/i,
  /openrouter/i,
  /replicate/i,
  /runway/i,
  /midjourney/i,
  /stability|stable\b/i,
  /elevenlabs/i,
  /synthesia/i,
  /descript/i,
  /otter\.ai/i,
  /xai\b/i,
  /perplexity/i,
  /cohere/i,
  /huggingface|hugging face/i,
  /deepl/i,
  /aws|amazon web services/i,
  /azure/i,
  /digitalocean/i,
  /linode/i,
  /vultr/i,
  /cloudflare/i,
  /fastly/i,
  /bunny/i,
  /expo|650 industries/i,
  /openphone/i,
  /dialpad/i,
  /grasshopper/i,
  /tiktok/i,
  /meta\b|facebook/i,
  /twitter|x\.com/i,
  /snap(chat)?/i,
  /pinterest/i,
  /reddit/i,
  /discord/i,
  /patreon/i,
  /substack/i,
  /gumroad/i,
  /teachable/i,
  /kajabi/i,
  /skillshare/i,
  /masterclass/i,
  /coursera/i,
  /udemy/i,
  /pluralsight/i,
  /treehouse/i,
  /codecademy/i,
  /brilliant/i,
  /duolingo/i,
  /babbel/i,
  /rosetta/i,
  /nytimes|new york times/i,
  /wsj|wall street journal/i,
  /economist/i,
  /bloomberg/i,
  /reuters/i,
  /washington post/i,
  /guardian/i,
  /spiegel/i,
  /zeit\b/i,
  /klarna/i,
  /afterpay/i,
  /affirm/i,
  /robinhood/i,
  /revolut/i,
  /wise\b/i,
  /n26\b/i,
  /monzo/i,
  /chime/i,
  /mercury/i,
  /brex/i,
  /ramp\b/i,
];

// Exclusion patterns - definitely NOT subscriptions
const EXCLUSION_PATTERNS = [
  /transaction fee/i,
  /intl\.? ?(transaction )?fee/i,
  /wire (payment|transfer)/i,
  /atm/i,
  /withdrawal/i,
  /deposit/i,
  /transfer to|transfer from/i,
  /sent from n26/i,
  // Groceries (DE)
  /\blidl\b/i,
  /\brewe\b/i,
  /\bedeka\b/i,
  /\baldi\b/i,
  /\bnetto\b/i,
  /\bpenny\b/i,
  /\bkaufland\b/i,
  /\brossmann\b/i,
  /\bdm[- ]drogerie/i,
  // Groceries (US)
  /\bwalmart\b/i,
  /\btarget\b/i,
  /\bcostco\b/i,
  /\bkroger\b/i,
  /\bwhole foods\b/i,
  /\btrader joe/i,
  /\bsafeway\b/i,
  /\bpublix\b/i,
  /\bcvs\b/i,
  /\bwalgreens\b/i,
  // Gas stations
  /\bshell\b/i,
  /\bbp\b/i,
  /\bchevron\b/i,
  /\bexxon\b/i,
  /\baral\b/i,
  /\bjet\b/i,
  /\btotal\b/i,
  // Restaurants/Fast food
  /\bmcdonald/i,
  /\bburger king/i,
  /\bstarbucks/i,
  /\bsubway\b/i,
  /\bkfc\b/i,
  /\bchipotle/i,
  /\bdomino/i,
  /\bpizza hut/i,
  // Government/Taxes
  /zollzahlstelle/i,
  /finanzamt/i,
  /\btax\b/i,
  /\birs\b/i,
  // Legal
  /rechtsanw[aä]lt/i,
  /\battorney\b/i,
  /\blawyer\b/i,
  // Generic
  /wertstellung/i,
  /kontostand/i,
  /beginning balance/i,
  /ending balance/i,
  /statement balance/i,
];

export function isLikelySubscription(name) {
  if (!name) return false;
  const normalized = name.trim();

  // Check exclusions first
  if (EXCLUSION_PATTERNS.some((p) => p.test(normalized))) {
    return false;
  }

  // Check known cancel providers
  if (CANCEL_PROVIDERS.some((p) => p.pattern.test(normalized))) {
    return true;
  }

  // Check additional subscription patterns
  if (SUBSCRIPTION_PATTERNS.some((p) => p.test(normalized))) {
    return true;
  }

  return false;
}

export function resolveCancelLink(name) {
  const provider = CANCEL_PROVIDERS.find((item) => item.pattern.test(name));

  if (provider) {
    return { url: provider.url, label: provider.name, type: "direct" };
  }

  const query = encodeURIComponent(`cancel ${name} subscription`);
  return {
    url: `https://www.google.com/search?q=${query}`,
    label: "Search",
    type: "search",
  };
}
