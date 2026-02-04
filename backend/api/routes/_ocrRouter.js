import { Router } from "express";
import { processOcr } from "../controllers/_ocrController.js";

const ocrRouter = Router();

ocrRouter.post("/", processOcr);

export default ocrRouter;
