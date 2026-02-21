import { Router } from "express";
import {
  deleteSubscriptionById,
  getAllSubscriptions,
  getSubscriptionById,
  postSubscription,
  putSubscriptionById,
  postDummySubscriptions,
} from "../controllers/_subscriptionController.js";
import { checkBody, checkParamForId } from "../middleware/_requestChecker.js";
import asyncWrap from "../utils/_asyncWrapper.js";

const subscriptionRouter = Router();

// ---- ROUTE: /api/subscriptions ----
subscriptionRouter.route("/").get(asyncWrap(getAllSubscriptions));

subscriptionRouter.route("/").post(checkBody, asyncWrap(postSubscription));

// ---- ROUTE: /api/subscriptions/dummy ----
subscriptionRouter.route("/dummy").post(asyncWrap(postDummySubscriptions));

// ---- ROUTE: /api/subscriptions/:id ----
subscriptionRouter
  .route("/:id")
  .get(checkParamForId, asyncWrap(getSubscriptionById));

subscriptionRouter
  .route("/:id")
  .put(checkParamForId, checkBody, asyncWrap(putSubscriptionById));

subscriptionRouter
  .route("/:id")
  .delete(checkParamForId, asyncWrap(deleteSubscriptionById));

export default subscriptionRouter;
