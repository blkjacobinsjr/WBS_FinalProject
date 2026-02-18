import { createHmac, timingSafeEqual } from "crypto";
import { Router } from "express";

const paddleWebhookRouter = Router();

function parsePaddleSignature(headerValue) {
  if (!headerValue) return null;

  const pairs = headerValue.split(";").map((segment) => segment.trim());
  const signature = { ts: null, h1: [] };

  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (!key || !value) continue;
    if (key === "ts") signature.ts = value;
    if (key === "h1") signature.h1.push(value);
  }

  return signature;
}

function secureCompare(a, b) {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

function verifyPaddleWebhook(rawBody, headerValue, secret) {
  const parsed = parsePaddleSignature(headerValue);
  if (!parsed || !parsed.ts || parsed.h1.length === 0) return false;
  if (!secret) return false;

  const signedPayload = `${parsed.ts}:${rawBody.toString("utf8")}`;
  const expected = createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  return parsed.h1.some((candidate) => secureCompare(expected, candidate));
}

paddleWebhookRouter.post("/", (req, res) => {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  const signature = req.get("Paddle-Signature");

  if (!Buffer.isBuffer(req.body)) {
    return res.status(500).json({
      successful: false,
      message: "Webhook body is not raw bytes",
    });
  }

  const isVerified = verifyPaddleWebhook(req.body, signature, secret);
  if (!isVerified) {
    return res.status(401).json({ successful: false, message: "invalid_signature" });
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(400).json({ successful: false, message: "invalid_json" });
  }

  const eventType = payload?.event_type || "unknown_event";
  const dataId = payload?.data?.id || "";
  console.info(`[PADDLE_WEBHOOK] ${eventType} ${dataId}`);

  return res.status(200).json({ successful: true });
});

export default paddleWebhookRouter;
