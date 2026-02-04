const OCR_ENDPOINT = "https://www.mistralocr.app/api/ocr/process";

export async function processOcr(req, res, next) {
  const { base64, imageUrl } = req.body || {};

  if (!base64 && !imageUrl) {
    return res.status(400).json({ error: "Missing OCR input" });
  }

  const apiKey =
    process.env.MISTRAL_OCR_KEY || "38pT6SB268XUET225fvWEfsNjJIBy8Zu";

  try {
    const payload = base64
      ? { image: base64, options: { format: "text" } }
      : { imageUrl, options: { format: "text" } };

    const response = await fetch(OCR_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.message || "OCR failed",
      });
    }

    return res.status(200).json({
      extractedText: data?.extractedText || data?.text || "",
      confidence: data?.confidence,
      creditsUsed: data?.creditsUsed,
      inputSource: data?.inputSource,
    });
  } catch (error) {
    return next(error);
  }
}
