import { Router } from "express";
import { cleanTransactions } from "../controllers/_aiController.js";

const aiRouter = Router();

aiRouter.post("/clean-transactions", cleanTransactions);

export default aiRouter;
