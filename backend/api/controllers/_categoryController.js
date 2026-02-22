import Category from "../models/_categorySchema.js";
import Subscription from "../models/_subscriptionSchema.js";
import { usedCategoryFullDataAggregate } from "../data/_aggregates.js";

// Comprehensive keyword → category mapping (fast local fallback)
const KEYWORD_MAP = {
  Streaming: ["netflix", "hulu", "disney", "hbo", "max", "peacock", "paramount", "apple tv", "prime video", "crunchyroll", "funimation", "dazn", "mubi", "discovery", "showtime"],
  Music: ["spotify", "apple music", "tidal", "deezer", "youtube music", "amazon music", "napster", "qobuz", "soundcloud"],
  Gaming: ["xbox", "playstation", "psn", "nintendo", "steam", "ea play", "ubisoft", "epic", "humble", "game pass", "geforce", "stadia", "twitch"],
  Productivity: ["notion", "slack", "monday", "asana", "trello", "basecamp", "todoist", "airtable", "clickup", "linear", "jira", "confluence", "zoom", "microsoft 365", "office 365", "google workspace", "dropbox", "box", "evernote"],
  "Cloud & Storage": ["icloud", "one drive", "onedrive", "google one", "dropbox", "backblaze", "aws", "azure", "gcp", "digitalocean", "heroku", "vercel", "netlify"],
  "AI & Software": ["openai", "chatgpt", "claude", "anthropic", "midjourney", "adobe", "figma", "sketch", "canva", "github", "gitlab", "jetbrains", "1password", "lastpass", "grammarly"],
  Entertainment: ["audible", "kindle", "scribd", "medium", "substack", "youtube premium", "twitch", "patreon", "duolingo", "masterclass", "curiositystream"],
  Health: ["peloton", "headspace", "calm", "noom", "strava", "whoop", "fitbit", "gymshark", "planet fitness", "my fitness", "myfitnesspal", "ww ", "weight watchers"],
  Finance: ["robinhood", "coinbase", "binance", "mint", "quickbooks", "freshbooks", "xero", "ynab", "personal capital", "credit karma"],
  eCommerce: ["amazon", "prime", "ebay", "shopify", "etsy", "alibaba"],
  VPN: ["nordvpn", "expressvpn", "surfshark", "protonvpn", "mullvad", "cyberghost", "vpn"],
  News: ["new york times", "nyt", "washington post", "the atlantic", "wired", "bloomberg", "wsj", "wall street journal", "economist", "guardian"],
};

// Standard categories with icons (SVG path data)
const STANDARD_CATEGORIES = [
  { name: "Streaming", icon: { path: "M4 8H2v12a2 2 0 002 2h12v-2H4V8zm16-4H8a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2zm-8 11v-6l5 3-5 3z" } },
  { name: "Music", icon: { path: "M12 3v10.55A4 4 0 1014 17V7h4V3h-6z" } },
  { name: "Gaming", icon: { path: "M21 6H3a1 1 0 00-1 1v10a1 1 0 001 1h18a1 1 0 001-1V7a1 1 0 00-1-1zm-10 7H9v2H7v-2H5v-2h2V9h2v2h2v2zm4.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3-3a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" } },
  { name: "Productivity", icon: { path: "M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 0a1 1 0 110 2 1 1 0 010-2zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" } },
  { name: "Cloud & Storage", icon: { path: "M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" } },
  { name: "AI & Software", icon: { path: "M12 2a10 10 0 100 20A10 10 0 0012 2zm1 17.93V18a1 1 0 00-2 0v1.93A8.001 8.001 0 014.07 13H6a1 1 0 000-2H4.07A8.001 8.001 0 0111 4.07V6a1 1 0 002 0V4.07A8.001 8.001 0 0119.93 11H18a1 1 0 000 2h1.93A8.001 8.001 0 0113 19.93z" } },
  { name: "Entertainment", icon: { path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" } },
  { name: "Health", icon: { path: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" } },
  { name: "Finance", icon: { path: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" } },
  { name: "eCommerce", icon: { path: "M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-8.9-5h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0019.96 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2z" } },
  { name: "VPN", icon: { path: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" } },
  { name: "News", icon: { path: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h12v2H6zm0 4h8v2H6z" } },
];

function localCategorize(subName) {
  const lower = subName.toLowerCase();
  for (const [catName, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some((kw) => lower.includes(kw))) return catName;
  }
  return null;
}

// ---- GET /api/categories ----
export async function getAllCategories(req, res, next) {
  console.info(new Date().toISOString(), "getAllCategories");

  const categories = await Category.find({});

  res.status(200).json(categories);
}

// ---- GET /api/categories/used ----
export async function getUsedCategories(req, res, next) {
  const { userId } = req.auth;

  console.info(
    new Date().toISOString(),
    "getUsedCategories for userId",
    userId,
  );

  const aggregate = usedCategoryFullDataAggregate(userId);
  const usedCategories = await Subscription.aggregate(aggregate);

  res.status(200).json(usedCategories);
}

// ---- GET /api/categories/:id ----
export async function getCategoryById(req, res, next) {
  const { id } = req.params;

  console.info(new Date().toISOString(), "getCategoryById, request for id", id);

  const category = await Category.findOne({ _id: id });

  if (!category) {
    return res.status(404).send(`Category ${id} not found.`);
  }

  res.status(200).json(category);
}

// ---- POST /api/categories/seed ----
export async function seedCategories(req, res, next) {
  console.info(new Date().toISOString(), "seedCategories");

  // 1. Upsert all standard categories
  const upserted = [];
  for (const cat of STANDARD_CATEGORIES) {
    let existing = await Category.findOne({ name: cat.name });
    if (!existing) {
      existing = await Category.create({ ...cat, selectable: true });
    }
    upserted.push(existing);
  }

  const catByName = Object.fromEntries(upserted.map((c) => [c.name, c]));

  // 2. Find ALL subscriptions that have no valid category (either null/undefined
  //    or a category ObjectId that doesn't exist in our categories collection)
  const validCatIds = upserted.map((c) => c._id);
  const subs = await Subscription.find({
    $or: [
      { category: { $exists: false } },
      { category: null },
      { category: { $nin: validCatIds } },
    ],
  });

  console.info(`seedCategories: categorizing ${subs.length} uncategorized subscriptions`);

  let categorized = 0;
  for (const sub of subs) {
    // First try the fast local keyword map
    const localHit = localCategorize(sub.name);
    if (localHit && catByName[localHit]) {
      await Subscription.updateOne({ _id: sub._id }, { category: catByName[localHit]._id });
      categorized++;
      continue;
    }

    // Fall back to OpenRouter AI
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const categoryList = upserted.map((c) => `ID: ${c._id}, Name: ${c.name}`).join("\n");
        const prompt = `You are a subscription categorizer. Given subscription name "${sub.name}", pick the SINGLE best category ID from this list:\n\n${categoryList}\n\nReturn ONLY the ID, nothing else.`;

        const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
          }),
        });

        if (aiRes.ok) {
          const data = await aiRes.json();
          const predictedId = data.choices?.[0]?.message?.content?.trim();
          const match = upserted.find((c) => c._id.toString() === predictedId);
          if (match) {
            await Subscription.updateOne({ _id: sub._id }, { category: match._id });
            categorized++;
            continue;
          }
        }
      } catch (err) {
        console.error("OpenRouter categorization error for", sub.name, err.message);
      }
    }

    // Last resort: assign to Entertainment
    const fallback = catByName["Entertainment"];
    if (fallback) {
      await Subscription.updateOne({ _id: sub._id }, { category: fallback._id });
      categorized++;
    }
  }

  return res.status(200).json({
    success: true,
    categoriesSeeded: upserted.length,
    subscriptionsCategorized: categorized,
  });
}
