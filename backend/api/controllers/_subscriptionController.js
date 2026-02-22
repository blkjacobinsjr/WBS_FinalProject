import Subscription from "../models/_subscriptionSchema.js";
import Notification from "../models/_notificatonSchema.js";
import Usage from "../models/_usageSchema.js";
import { fullSubscriptionData } from "../data/_aggregates.js";
import { startSession } from "mongoose";

// ---- GET /api/subscriptions ----
export async function getAllSubscriptions(req, res, next) {
  // NOTE: Let's assume for now that users don't have more than a hundred
  // subscriptions, so we can rather safely forgoe pagination
  const { userId } = req.auth;

  console.info(
    new Date().toISOString(),
    "getAllSubscriptions, request for user",
    userId,
  );

  // NOTE: We will rarely if ever need to only get subscription data, so let's
  // always fetch 'supscription data plus'
  const fullDataAggregate = fullSubscriptionData(userId);

  const subscriptions = await Subscription.aggregate(fullDataAggregate);

  // const subscriptions = await Subscription.find({ userId }).populate(
  //   "category",
  // );

  res.status(200).json(subscriptions);
}

// ---- POST /api/subscriptions ----
export async function postSubscription(req, res, next) {
  const {
    body,
    auth: { userId },
  } = req;

  console.info(
    new Date().toISOString(),
    "postSubscription, request for user",
    userId,
    "with body",
    body,
  );

  let categoryId = body.category;

  // If category is missing or the old placeholder "None" ID, auto-categorize via OpenRouter
  if (!categoryId || categoryId === "65085704f18207c1481e6642") {
    try {
      const Category = (await import("../models/_categorySchema.js")).default;
      const categories = await Category.find({});

      if (categories.length > 0) {
        // Fast local keyword fallback first
        const KEYWORD_MAP = {
          Streaming: ["netflix", "hulu", "disney", "hbo", "max", "peacock", "paramount", "apple tv", "prime video", "crunchyroll"],
          Music: ["spotify", "apple music", "tidal", "deezer", "youtube music", "amazon music", "soundcloud"],
          Gaming: ["xbox", "playstation", "psn", "nintendo", "steam", "ea play", "ubisoft", "game pass"],
          Productivity: ["notion", "slack", "monday", "asana", "trello", "zoom", "microsoft 365", "office 365", "google workspace", "dropbox", "evernote"],
          "Cloud & Storage": ["icloud", "onedrive", "google one", "backblaze", "aws", "azure", "digitalocean", "vercel"],
          "AI & Software": ["openai", "chatgpt", "claude", "midjourney", "adobe", "figma", "canva", "github", "gitlab", "1password", "grammarly"],
          Entertainment: ["audible", "kindle", "scribd", "medium", "substack", "youtube premium", "patreon", "duolingo", "masterclass"],
          Health: ["peloton", "headspace", "calm", "strava", "whoop", "fitbit", "myfitnesspal", "weight watchers"],
          Finance: ["robinhood", "coinbase", "quickbooks", "freshbooks", "xero", "ynab"],
          eCommerce: ["amazon", "prime", "ebay", "shopify", "etsy"],
          VPN: ["nordvpn", "expressvpn", "surfshark", "protonvpn", "vpn"],
          News: ["new york times", "nyt", "washington post", "bloomberg", "wsj", "economist"],
        };
        const lower = (body.name || "").toLowerCase();
        for (const [catName, keywords] of Object.entries(KEYWORD_MAP)) {
          if (keywords.some((kw) => lower.includes(kw))) {
            const match = categories.find((c) => c.name === catName);
            if (match) { categoryId = match._id; break; }
          }
        }

        // If still not matched, try OpenRouter
        if (!categoryId && process.env.OPENROUTER_API_KEY) {
          const categoryList = categories.map((c) => `ID: ${c._id}, Name: ${c.name}`).join("\n");
          const prompt = `You are a subscription categorizer. Given subscription name "${body.name}", pick the SINGLE best category ID from this list:\n\n${categoryList}\n\nReturn ONLY the ID, nothing else.`;
          const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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

          if (aiResponse.ok) {
            const data = await aiResponse.json();
            const predictedId = data.choices?.[0]?.message?.content?.trim();
            if (predictedId && categories.find((c) => c._id.toString() === predictedId)) {
              categoryId = predictedId;
            }
          }
        }

        // Last resort: first category
        if (!categoryId) categoryId = categories[0]._id;
      }
    } catch (err) {
      console.error("Auto-categorization failed:", err);
    }
  }

  const postThis = { ...body, userId, category: categoryId };

  const { _id: newSubId } = await Subscription.create(postThis);

  if (!newSubId) {
    return res.status(500).send("Something went wrong. Please try later.");
  }

  const location = `${req.protocol}://${req.get(
    "host",
  )}/api/subscriptions/${newSubId}`;

  // Create notification today + 1 week for usage
  const { _id: newNotificationId } = await Notification.create({
    userId,
    type: "usage",
    subscriptionId: newSubId,
  });

  if (!newNotificationId) {
    console.warn(`Unable to create notification for subscription ${newSubId}`);
  }

  res.status(201).location(location).end();
}

// ---- POST /api/subscriptions/dummy ----
export async function postDummySubscriptions(req, res, next) {
  const {
    auth: { userId },
  } = req;

  console.info(
    new Date().toISOString(),
    "postDummySubscriptions, request for user",
    userId,
  );

  try {
    const Category = (await import("../models/_categorySchema.js")).default;
    const categoriesDb = await Category.find({});

    // Fallback if no category found
    const defaultCat = "65085704f18207c1481e6642";

    const requiredCategoryNames = ["Streaming", "Music", "Games", "eCommerce"];
    const requiredCategories = [];

    // Make sure we have the exact categories they want to show in the Pie Chart
    for (const catName of requiredCategoryNames) {
      let existing = categoriesDb.find(c => c.name.toLowerCase() === catName.toLowerCase());
      if (!existing) {
        // Create it
        const newCat = await Category.create({
          name: catName,
          icon: {
            path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
          },
          selectable: true
        });
        requiredCategories.push(newCat);
        categoriesDb.push(newCat);
      } else {
        requiredCategories.push(existing);
      }
    }

    const popularSubs = [
      { name: "Netflix", price: 15.49, interval: "monthly" },
      { name: "Spotify Premium", price: 10.99, interval: "monthly" },
      { name: "Amazon Prime", price: 139.00, interval: "yearly" },
      { name: "Hulu", price: 7.99, interval: "monthly" },
      { name: "Disney+", price: 10.99, interval: "monthly" },
      { name: "Apple Music", price: 10.99, interval: "monthly" },
      { name: "YouTube Premium", price: 13.99, interval: "monthly" },
      { name: "Xbox Game Pass", price: 16.99, interval: "monthly" },
      { name: "PlayStation Plus", price: 79.99, interval: "yearly" },
      { name: "Steam", price: 29.99, interval: "monthly" }
    ];

    const categoryMap = {
      "Netflix": "Streaming",
      "Hulu": "Streaming",
      "Disney+": "Streaming",
      "YouTube Premium": "Streaming",
      "Spotify Premium": "Music",
      "Apple Music": "Music",
      "Amazon Prime": "eCommerce",
      "Xbox Game Pass": "Games",
      "PlayStation Plus": "Games",
      "Steam": "Games"
    };

    const subsToCreate = popularSubs.map(sub => {
      const daysAgo = Math.floor(Math.random() * 28);
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);

      const targetCategoryName = categoryMap[sub.name];
      const foundCategory = requiredCategories.find(
        (c) => c.name.toLowerCase() === targetCategoryName.toLowerCase()
      );

      return {
        userId,
        name: sub.name,
        price: sub.price,
        interval: sub.interval,
        category: foundCategory ? foundCategory._id : defaultCat,
        billing_date: d,
        active: true,
      };
    });

    const createdSubs = await Subscription.insertMany(subsToCreate);

    const usagesToCreate = [];
    createdSubs.forEach(sub => {
      // Create some random usage records for the past few months
      const usageCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < usageCount; i++) {
        usagesToCreate.push({
          userId,
          subscriptionId: sub._id,
          score: Math.floor(Math.random() * 100) + 1, // 1 to 100
        });
      }
    });

    if (usagesToCreate.length > 0) {
      await Usage.insertMany(usagesToCreate);
    }

    return res.status(201).json({ success: true, count: createdSubs.length });
  } catch (error) {
    console.error("Error generating dummy subscriptions:", error);
    return res.status(500).json({ error: "Failed to generate dummy subscriptions" });
  }
}

// ---- GET /api/subscriptions/:id ----
export async function getSubscriptionById(req, res, next) {
  const { userId } = req.auth;
  const { id } = req.params;

  console.info(
    new Date().toISOString(),
    "getSubscriptionById, request for user",
    userId,
    "with id",
    id,
  );

  const subscription = await Subscription.findOne({ _id: id, userId }).populate(
    "category",
  );

  if (!subscription) {
    return res.status(404).send(`Subscription ${id} not found.`);
  }

  res.status(200).json(subscription);
}

// ---- PUT /api/subscriptions/:id ----
export async function putSubscriptionById(req, res, next) {
  const { id } = req.params;
  const {
    body,
    auth: { userId },
  } = req;

  console.info(
    new Date().toISOString(),
    "putSubscriptionById, request for user",
    userId,
    "with id",
    id,
    "and body",
    body,
  );

  const putThis = { ...body };

  if (Object.hasOwn(putThis, "userId")) {
    putThis.userId = userId;
  }

  const updatedSub = await Subscription.findOneAndUpdate(
    { _id: id, userId },
    putThis,
    { new: true },
  );

  if (!updatedSub) {
    return res.status(404).send(`Subscription ${id} not found.`);
  }

  res.status(200).json(updatedSub);
}

// ---- DELETE /api/subscriptions/:id ----
export async function deleteSubscriptionById(req, res, next) {
  const { userId } = req.auth;
  const { id } = req.params;

  console.info(
    new Date().toISOString(),
    "deleteSubscriptionById, request for user",
    userId,
    "with id",
    id,
  );

  const result = await Subscription.deleteOne({ _id: id, userId });

  if (result.deletedCount === 0) {
    return res.status(404).send(`Subscription ${id} not found.`);
  }

  if (result.acknowledged) {
    // if deleted successfully, we also need to delete all related information:
    // Usages
    // Notifications
    const deleteSession = await startSession();
    deleteSession.startTransaction();

    try {
      await Usage.deleteMany({ subscriptionId: id, userId }, { deleteSession });
      await Notification.deleteMany(
        { subscriptionId: id, userId },
        { deleteSession },
      );

      await deleteSession.commitTransaction();
      deleteSession.endSession();
    } catch (error) {
      await deleteSession.abortTransaction();
      deleteSession.endSession();

      console.error(
        `Error during deletion of related information for subscription ${id}`,
        error,
      );
    }

    return res.status(204).end();
  }
}
