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
