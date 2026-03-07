import { Router } from "express";
import {
  getDashboardData,
  getDashboardBootstrapData,
  getTotalMonthlyCost,
  getPotentialMonthlySavings,
  getMostUsedSubscription,
} from "../controllers/_dashboardDataController.js";
import asyncWrap from "../utils/_asyncWrapper.js";

const dashboardDataRouter = Router();

// ---- ROUTE: /api/dashboard ----
dashboardDataRouter.route("/").get(asyncWrap(getDashboardData));

// ---- ROUTE: /api/dashboard/bootstrap ----
dashboardDataRouter.route("/bootstrap").get(asyncWrap(getDashboardBootstrapData));

// ---- ROUTE: /api/dashboard/mostUsed ----
dashboardDataRouter.route("/mostUsed").get(asyncWrap(getMostUsedSubscription));

// ---- ROUTE: /api/dashboard/savings ----
dashboardDataRouter
  .route("/savings")
  .get(asyncWrap(getPotentialMonthlySavings));

// ---- ROUTE: /api/dashboard/totalCost ----
dashboardDataRouter.route("/totalCost").get(asyncWrap(getTotalMonthlyCost));

export default dashboardDataRouter;
