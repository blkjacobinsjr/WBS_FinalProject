const PRIMARY_MODEL = "gemini-1.5-flash";
const FALLBACK_MODEL = "gemini-1.5-flash-latest";
const BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

async function callGemini({ model, apiKey, lines }) {
  const endpoint = `${BASE_URL}/${model}:generateContent`;
  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Extract recurring subscription charges from these statement lines.
Return JSON array only with objects: { "name": string, "amount": number, "interval": "month" | "year" }.
Ignore balances, payments, cashback, deposits, transfers, refunds, fees, interest.
Strip dates, card suffixes, and reference numbers from names.
Use interval "year" only if the line indicates annual or yearly.
Lines:
${lines.join("\n")}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 512,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return { response, data };
}

function parseJsonArray(text) {
  if (!text) return [];
  try {
    return JSON.parse(text);
  } catch (error) {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start === -1 || end === -1) return [];
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch (innerError) {
      return [];
    }
  }
}

export async function cleanTransactions(req, res, next) {
  const { lines } = req.body || {};

  if (!Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ error: "Missing lines" });
  }

  const apiKey =
    process.env.GEMINI_API_KEY || "AIzaSyBhtrBvQ82XJlAYLnxjS1qq_yboSObmylQ";

  try {
    let { response, data } = await callGemini({
      model: PRIMARY_MODEL,
      apiKey,
      lines,
    });

    if (!response.ok) {
      ({ response, data } = await callGemini({
        model: FALLBACK_MODEL,
        apiKey,
        lines,
      }));
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "AI cleanup failed",
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.[0];

    const items = parseJsonArray(text);

    return res.status(200).json({ items });
  } catch (error) {
    return next(error);
  }
}
