import { useMemo, useState } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useDataContext } from "../contexts/dataContext";
import useSubscription from "../hooks/useSubscription";
import { createSubscriptionBody } from "../utils/schemaBuilder";
import { resolveCancelLink } from "../utils/cancelProviders";
import eventEmitter from "../utils/EventEmitter";

const DEFAULT_CATEGORY_ID = "65085704f18207c1481e6642";

GlobalWorkerOptions.workerSrc = workerUrl;

function normalizeName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseAmount(value) {
  if (!value) return null;
  const cleaned = value
    .replace(/[^0-9,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(/,/, ".");

  const amount = Number.parseFloat(cleaned);
  if (!Number.isFinite(amount)) return null;
  return Math.abs(amount);
}

function detectFromPdfText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const candidates = [];

  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].toLowerCase() === "beschreibung") {
      const name = lines[i + 1];
      if (!name) continue;

      const windowLines = lines.slice(i, i + 20).join(" ");
      const windowLower = windowLines.toLowerCase();
      if (!windowLower.includes("lastschriften") && !windowLower.includes("iban")) {
        continue;
      }

      const eurMatch = windowLines.match(/(\d+[.,]\d+)\s*EUR/i);
      const euroMatch = windowLines.match(/-?\d+[.,]\d+\s*€/i);
      const amount = parseAmount(eurMatch?.[1] || euroMatch?.[0]);

      if (!amount) continue;

      candidates.push({
        name,
        amount,
        interval: "month",
        source: "pdf",
      });
    }
  }

  return candidates;
}

function detectFromCsvText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const header = lines[0];
  const commaCount = (header.match(/,/g) || []).length;
  const semicolonCount = (header.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ";" : ",";

  const headers = header.split(delimiter).map((h) => h.trim().toLowerCase());
  const getIndex = (keys) =>
    headers.findIndex((h) => keys.some((key) => h.includes(key)));

  const descIndex = getIndex(["description", "merchant", "name", "details"]);
  const amountIndex = getIndex(["amount", "value", "debit", "betrag"]);

  if (descIndex === -1 || amountIndex === -1) return [];

  const transactions = lines.slice(1).map((line) => {
    const parts = line.split(delimiter).map((part) => part.trim());
    return {
      name: parts[descIndex],
      amount: parseAmount(parts[amountIndex]),
    };
  });

  const candidates = [];
  const seen = new Set();

  for (const tx of transactions) {
    if (!tx.name || !tx.amount) continue;
    const key = normalizeName(tx.name);
    if (seen.has(key)) continue;

    seen.add(key);
    candidates.push({
      name: tx.name,
      amount: tx.amount,
      interval: "month",
      source: "csv",
    });
  }

  return candidates;
}

export default function BulkImport() {
  const { subscriptions } = useDataContext();
  const { createSubscription, updateSubscription, getAllSubscriptions } =
    useSubscription();

  const [file, setFile] = useState(null);
  const [stage, setStage] = useState("idle");
  const [detected, setDetected] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [summary, setSummary] = useState({ created: 0, skipped: 0 });

  const current = detected[currentIndex];

  const progress = useMemo(() => {
    if (detected.length === 0) return 0;
    return Math.min(100, Math.round((currentIndex / detected.length) * 100));
  }, [currentIndex, detected.length]);

  async function extractPdfText(targetFile) {
    const buffer = await targetFile.arrayBuffer();
    const pdf = await getDocument({ data: buffer }).promise;

    let combinedText = "";
    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
      const page = await pdf.getPage(pageIndex);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(" ");
      combinedText += `${pageText}\n`;
    }

    return combinedText;
  }

  async function handleProcessFile() {
    if (!file) return;

    setStage("parsing");
    setDetected([]);
    setCurrentIndex(0);

    let candidates = [];

    if (file.name.toLowerCase().endsWith(".pdf")) {
      const text = await extractPdfText(file);
      candidates = detectFromPdfText(text);
    } else if (file.name.toLowerCase().endsWith(".csv")) {
      const text = await file.text();
      candidates = detectFromCsvText(text);
    }

    if (candidates.length === 0) {
      setStage("idle");
      return;
    }

    const deduped = [];
    const seen = new Set();
    for (const candidate of candidates) {
      const key = normalizeName(candidate.name);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(candidate);
    }

    candidates = deduped;

    const existingKeys = new Set(
      (subscriptions || []).map((sub) => normalizeName(sub.name)),
    );

    let createdCount = 0;
    let skippedCount = 0;

    setStage("creating");

    for (const candidate of candidates) {
      const key = normalizeName(candidate.name);
      if (existingKeys.has(key)) {
        skippedCount += 1;
        continue;
      }

      const body = createSubscriptionBody(
        candidate.name,
        candidate.amount,
        DEFAULT_CATEGORY_ID,
        candidate.interval,
      );

      try {
        const abortController = new AbortController();
        await createSubscription(body, abortController);
        createdCount += 1;
      } catch (error) {
        skippedCount += 1;
      }
    }

    const refreshed = await getAllSubscriptions(new AbortController());
    const enriched = candidates.map((candidate) => {
      const key = normalizeName(candidate.name);
      const match = refreshed?.find(
        (sub) =>
          normalizeName(sub.name) === key &&
          Math.abs(sub.price - candidate.amount) < 0.01,
      );

      const cancel = resolveCancelLink(candidate.name);
      return {
        ...candidate,
        subscriptionId: match?._id,
        cancel,
      };
    });

    setSummary({ created: createdCount, skipped: skippedCount });
    setDetected(enriched);
    setCurrentIndex(0);
    setStage("ready");
    eventEmitter.emit("refetchData");
  }

  async function handleDecision(action) {
    if (!current) return;

    if (action === "cancel") {
      if (current.cancel?.url) {
        window.open(current.cancel.url, "_blank", "noopener,noreferrer");
      }

      if (current.subscriptionId) {
        try {
          await updateSubscription(
            { _id: current.subscriptionId, active: false },
            new AbortController(),
          );
        } catch (error) {
          // swallow errors for fast flow
        }
      }
    }

    setCurrentIndex((prev) => prev + 1);
  }

  async function handleCancelAll() {
    for (const item of detected) {
      if (!item.subscriptionId) continue;
      try {
        await updateSubscription(
          { _id: item.subscriptionId, active: false },
          new AbortController(),
        );
      } catch (error) {
        // ignore
      }
    }

    setCurrentIndex(detected.length);
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="rounded-lg border border-black/10 bg-white/60 p-4">
        <h2 className="text-lg font-semibold">Bulk Import and Cancel</h2>
        <p className="text-sm text-gray-600">
          Upload a PDF or CSV. Subscriptions are auto added. Then decide keep or
          cancel.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="file"
            accept=".pdf,.csv"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-sm"
          />
          <button
            onClick={handleProcessFile}
            disabled={!file || stage === "parsing" || stage === "creating"}
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {stage === "creating" ? "Creating..." : "Process"}
          </button>
        </div>

        {summary.created + summary.skipped > 0 && (
          <div className="mt-3 text-xs text-gray-600">
            Created: {summary.created} | Skipped: {summary.skipped}
          </div>
        )}
      </div>

      {detected.length > 0 && (
        <div className="rounded-lg border border-black/10 bg-white/60 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {Math.min(currentIndex + 1, detected.length)} of {detected.length}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-black"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {current ? (
            <div className="mt-4 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="text-lg font-semibold">{current.name}</div>
              <div className="text-sm text-gray-600">
                {current.amount.toFixed(2)} EUR per {current.interval}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Source: {current.source}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Cancel: {current.cancel.label}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleDecision("keep")}
                  className="rounded-lg border border-black/20 px-3 py-2 text-sm font-semibold"
                >
                  Keep
                </button>
                <button
                  onClick={() => handleDecision("cancel")}
                  className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-center text-sm text-gray-600">
              Done.
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleCancelAll}
              className="rounded-lg border border-black/20 px-3 py-2 text-xs font-semibold"
            >
              Cancel All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
