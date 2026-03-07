import dotenv from "dotenv";
import {
  buildDashboardData,
  getDashboardBootstrap,
  getHydratedSubscriptions,
} from "../services/_dashboardBootstrapService.js";

dotenv.config();

const parsedDaysAgo = Number.parseInt(process.env.NOTIFICATION_DAYS_AGO, 10);
const notificationDelayDays = Number.isFinite(parsedDaysAgo) ? parsedDaysAgo : 7;

/**
 * Returns consolidated dashboard data
 */
export async function getDashboardData(req, res, next) {
  const { userId } = req.auth;

  console.info(
    new Date().toISOString(),
    "getDashboardData, request for user",
    userId,
  );

  const subscriptions = await getHydratedSubscriptions(userId);
  const dashboardData = buildDashboardData(subscriptions);

  res.status(200).json(dashboardData);
}

/**
 * Return the users most used subscription
 */
export async function getMostUsedSubscription(req, res, next) {
  const { userId } = req.auth;

  console.info(
    new Date().toISOString(),
    "getMostUsedSubscription, request for user",
    userId,
  );

  const subscriptions = await getHydratedSubscriptions(userId);
  const { mostUsed: result } = buildDashboardData(subscriptions);

  res.status(200).json(result);
}

/**
 * Returns the users potential montyly savings
 */
export async function getPotentialMonthlySavings(req, res, next) {
  const { userId } = req.auth;

  console.info(
    new Date().toISOString(),
    "getPotentialMonthlySavings, request for user",
    userId,
  );

  const subscriptions = await getHydratedSubscriptions(userId);
  const { potentialMonthlySavings } = buildDashboardData(subscriptions);
  const result = { potentialMonthlySavings };

  res.status(200).json(result);
}

/**
 * Returns total monthly cost of all subscriptions
 */
export async function getTotalMonthlyCost(req, res, next) {
  const { userId } = req.auth;

  console.info(
    new Date().toISOString(),
    "getTotalMonthlyCost, request for user",
    userId,
  );

  const subscriptions = await getHydratedSubscriptions(userId);
  const { totalCostPerMonth } = buildDashboardData(subscriptions);
  const result = { totalCostPerMonth };

  res.status(200).json(result);
}

/**
 * Returns the full dashboard bootstrap payload in one response
 */
export async function getDashboardBootstrapData(req, res, next) {
  const { userId } = req.auth;

  console.info(
    new Date().toISOString(),
    "getDashboardBootstrapData, request for user",
    userId,
  );

  const bootstrapData = await getDashboardBootstrap(
    userId,
    notificationDelayDays,
  );

  res.status(200).json(bootstrapData);
}
