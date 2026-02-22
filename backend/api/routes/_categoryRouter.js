import { Router } from "express";
import {
  getAllCategories,
  getCategoryById,
  getUsedCategories,
  seedCategories,
} from "../controllers/_categoryController.js";
import { checkParamForId } from "../middleware/_requestChecker.js";
import asyncWrap from "../utils/_asyncWrapper.js";

const categoryRouter = Router();

// ---- ROUTE: /api/categories ----
categoryRouter.route("/").get(asyncWrap(getAllCategories));

// ---- ROUTE: /api/categories/used ----
categoryRouter.route("/used").get(asyncWrap(getUsedCategories));

// ---- ROUTE: /api/categories/seed ----
categoryRouter.route("/seed").post(asyncWrap(seedCategories));

// ---- ROUTE: /api/categories/:id ----
categoryRouter.route("/:id").get(checkParamForId, asyncWrap(getCategoryById));

export default categoryRouter;
