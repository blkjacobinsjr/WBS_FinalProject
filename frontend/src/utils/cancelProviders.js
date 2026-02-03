export const CANCEL_PROVIDERS = [
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
    pattern: /amazon prime|prime video/i,
    url: "https://www.amazon.com/primecentral",
  },
  {
    name: "Apple",
    pattern: /apple|itunes|icloud/i,
    url: "https://apps.apple.com/account/subscriptions",
  },
  {
    name: "Google",
    pattern: /google|youtube|yt/i,
    url: "https://play.google.com/store/account/subscriptions",
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
