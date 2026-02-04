import categoryRouter from "./_categoryRouter.js";
import subscriptionRouter from "./_subscriptionRouter.js";
import subscriptionUsageRouter from "./_subscriptionUsageRouter.js";
import usageRouter from "./_usageRouter.js";
import dashboardDataRouter from "./_dashboardDataRouter.js";
import searchRouter from "./_searchRouter.js";
import notificationRouter from "./_notificatonRouter.js";
import ocrRouter from "./_ocrRouter.js";

import { Router } from "express";

const apiRouter = Router();

// ---- ROUTE: /api/subscriptions ----
apiRouter.use("/subscriptions", subscriptionRouter);

// ROUTE: /api/subscriptionUsage ----
apiRouter.use("/subscriptionUsage", subscriptionUsageRouter);

// ---- ROUTE: /api/categories ----
apiRouter.use("/categories", categoryRouter);

// ---- ROUTE: /api/usages ----
apiRouter.use("/usages", usageRouter);

// ---- ROUTE: /api/dashboard
apiRouter.use("/dashboard", dashboardDataRouter);

// ---- ROUTE: /api/search
apiRouter.use("/search", searchRouter);

// ---- ROUTE: /notifications
apiRouter.use("/notifications", notificationRouter);

// ---- ROUTE: /ocr
apiRouter.use("/ocr", ocrRouter);

export default apiRouter;
