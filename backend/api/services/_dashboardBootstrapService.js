import Category from "../models/_categorySchema.js";
import Notification from "../models/_notificatonSchema.js";
import Subscription from "../models/_subscriptionSchema.js";
import { fullSubscriptionData } from "../data/_aggregates.js";

const CATEGORY_CACHE_TTL_MS = 5 * 60 * 1000;
const FALLBACK_CATEGORY_ICON = {
  path: "M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z",
};

let cachedCategories = null;
let cachedCategoriesExpiresAt = 0;
let cachedCategoriesPromise = null;

function toNumber(value) {
  return Number.isFinite(value) ? value : Number(value) || 0;
}

function isYearlyInterval(interval = "") {
  return /^year/i.test(interval);
}

function getMonthlyPrice(subscription = {}) {
  const price = toNumber(subscription.price);
  return isYearlyInterval(subscription.interval) ? price / 12 : price;
}

function getSubscriptionScore(subscription = {}) {
  return toNumber(subscription.score);
}

function hasValidScore(subscription = {}) {
  return Boolean(subscription.validScore);
}

function normalizeCategory(category) {
  if (category?._id) {
    return category;
  }

  return {
    _id: "uncategorized",
    name: "Uncategorized",
    icon: FALLBACK_CATEGORY_ICON,
    selectable: false,
  };
}

function sortByScoreThenPrice(left, right, direction) {
  const scoreDelta =
    (getSubscriptionScore(right) - getSubscriptionScore(left)) * direction;

  if (scoreDelta !== 0) {
    return scoreDelta;
  }

  return getMonthlyPrice(right) - getMonthlyPrice(left);
}

export async function getHydratedSubscriptions(userId) {
  return Subscription.aggregate(fullSubscriptionData(userId));
}

export async function getCachedCategories() {
  const now = Date.now();

  if (cachedCategories && cachedCategoriesExpiresAt > now) {
    return cachedCategories;
  }

  if (!cachedCategoriesPromise) {
    cachedCategoriesPromise = Category.find({}).lean().then((categories) => {
      cachedCategories = categories;
      cachedCategoriesExpiresAt = Date.now() + CATEGORY_CACHE_TTL_MS;
      cachedCategoriesPromise = null;
      return categories;
    }).catch((error) => {
      cachedCategoriesPromise = null;
      throw error;
    });
  }

  return cachedCategoriesPromise;
}

export function invalidateCachedCategories() {
  cachedCategories = null;
  cachedCategoriesExpiresAt = 0;
  cachedCategoriesPromise = null;
}

export function buildDashboardData(subscriptions = []) {
  const ratedSubscriptions = subscriptions.filter(hasValidScore);
  const mostUsed = [...ratedSubscriptions].sort((left, right) =>
    sortByScoreThenPrice(left, right, 1),
  )[0] ?? {};
  const leastUsed = [...ratedSubscriptions].sort((left, right) =>
    sortByScoreThenPrice(left, right, -1),
  )[0] ?? {};
  const barelyUsedMostExpensive = [...ratedSubscriptions].sort((left, right) => {
    const scoreDelta = getSubscriptionScore(left) - getSubscriptionScore(right);

    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    return getMonthlyPrice(right) - getMonthlyPrice(left);
  })[0] ?? {};

  const totalCostPerMonth = subscriptions.reduce((total, subscription) => {
    return total + toNumber(subscription.monthlyPrice ?? getMonthlyPrice(subscription));
  }, 0);

  const potentialMonthlySavings = subscriptions.reduce((total, subscription) => {
    if (!hasValidScore(subscription)) {
      return total;
    }

    return total + toNumber(subscription.monthlyPrice ?? getMonthlyPrice(subscription));
  }, 0);

  return {
    mostUsed,
    leastUsed,
    barelyUsedMostExpensive,
    totalCostPerMonth,
    potentialMonthlySavings,
  };
}

export function buildUsedCategories(subscriptions = []) {
  const groupedCategories = new Map();

  for (const subscription of subscriptions) {
    const category = normalizeCategory(subscription.category);
    const categoryKey = category._id.toString();
    const monthlyPrice = toNumber(
      subscription.monthlyPrice ?? getMonthlyPrice(subscription),
    );

    if (!groupedCategories.has(categoryKey)) {
      groupedCategories.set(categoryKey, {
        _id: category._id,
        name: category.name,
        icon: category.icon ?? FALLBACK_CATEGORY_ICON,
        subscriptionCount: 0,
        totalCost: 0,
        averagePrice: 0,
        potentialSavings: 0,
        categoryScore: 0,
        validSubscriptionScores: [],
      });
    }

    const currentCategory = groupedCategories.get(categoryKey);
    currentCategory.subscriptionCount += 1;
    currentCategory.totalCost += monthlyPrice;

    if (hasValidScore(subscription)) {
      currentCategory.potentialSavings += monthlyPrice;
    }

    if (hasValidScore(subscription)) {
      currentCategory.validSubscriptionScores.push(getSubscriptionScore(subscription));
    }
  }

  return [...groupedCategories.values()]
    .map((category) => {
      const validScoresCount = category.validSubscriptionScores.length;

      return {
        _id: category._id,
        name: category.name,
        icon: category.icon,
        subscriptionCount: category.subscriptionCount,
        totalCost: category.totalCost,
        averagePrice:
          category.subscriptionCount > 0
            ? category.totalCost / category.subscriptionCount
            : 0,
        potentialSavings: category.potentialSavings,
        categoryScore:
          validScoresCount > 0
            ? category.validSubscriptionScores.reduce((total, score) => total + score, 0) /
              validScoresCount
            : 0,
      };
    })
    .sort((left, right) => right.totalCost - left.totalCost);
}

export async function getPendingNotifications(userId, daysAgoEnv) {
  const daysAgo = new Date(Date.now() - daysAgoEnv * 24 * 60 * 60 * 1000);

  return Notification.find({
    userId,
    active: true,
    createdAt: {
      $lte: daysAgo,
    },
  })
    .populate({
      path: "subscriptionId",
      select: "name price interval category billing_date active",
    })
    .sort({
      createdAt: -1,
    })
    .lean();
}

export async function getDashboardBootstrap(userId, daysAgoEnv) {
  const [subscriptions, allCategories, notifications] = await Promise.all([
    getHydratedSubscriptions(userId),
    getCachedCategories(),
    getPendingNotifications(userId, daysAgoEnv),
  ]);

  return {
    subscriptions,
    allCategories,
    usedCategories: buildUsedCategories(subscriptions),
    dashboardData: buildDashboardData(subscriptions),
    notifications,
  };
}
