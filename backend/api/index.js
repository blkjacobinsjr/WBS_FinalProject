import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { connectToDatabase } from "./data/_mongodb.js";

import apiRouter from "./routes/_apiRouter.js";
import paddleWebhookRouter from "./routes/_paddleWebhookRouter.js";

import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import errorHandler from "./middleware/_errorHandler.js";
import { checkUserId } from "./middleware/_requestChecker.js";

dotenv.config();

const server = express();

// Paddle signature verification requires raw request bytes.
server.use(
  "/webhooks/paddle",
  express.raw({ type: "application/json" }),
  paddleWebhookRouter,
);

server.use(express.json());
server.use(
  cors({
    exposedHeaders: ["Location"],
  }),
);

server.get("/healthz", (req, res) => {
  res.status(200).json({ ok: true });
});

// ---- LOGGING ----
// server.use((req, res, next) => {
//   console.info("============================================");
//   console.info(`${req.method} ${req.path}`);
//   if (req.body && Object.keys(req.body).length > 0) {
//     console.info(`Body: ${req.body}`);
//   }
//   next();
// });

// ---- AUTHENTICATION ----
server.use(ClerkExpressRequireAuth());
server.use(checkUserId);

// ---- ROUTE: /api ----
server.use("/api", apiRouter);

// ---- ERROR HANDLING ----
server.use(errorHandler);

// ---- RUN SERVER ----
const port = process.env.PORT;

async function startServer() {
  const maxRetries = 5;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await connectToDatabase();
      server.listen(port, () => {
        console.info(`Server running on port ${port}`);
      });
      return;
    } catch (error) {
      console.error(
        `MongoDB connection failed on attempt ${attempt}/${maxRetries}`,
        error,
      );

      if (attempt === maxRetries) {
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

startServer();
