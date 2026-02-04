import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import * as XLSX from "xlsx";
import { useDataContext } from "../contexts/dataContext";
import useSubscription from "../hooks/useSubscription";
import useDashboard from "../hooks/useDashboard";
import useCategory from "../hooks/useCategory";
import useOcr from "../hooks/useOcr";
import useAiCleaner from "../hooks/useAiCleaner";
import { createSubscriptionBody } from "../utils/schemaBuilder";
import { resolveCancelLink, isLikelySubscription } from "../utils/cancelProviders";
import eventEmitter from "../utils/EventEmitter";
import LoadingButton from "../components/LoadingButton";

const DEFAULT_CATEGORY_ID = "65085704f18207c1481e6642";
const FORCED_MERCHANTS = [
  { pattern: /rsg group|john reed/i, name: "John Reed" },
];
const BLOCKLIST = [
  /saldo|kontostand|guthaben|gesamt|summe|total|endabrechnung/i,
  /kontoauszug|kontoumsatz|auszug|buchung|umsatz|valuta/i,
  /iban|bic|swift|kontonr|kontonummer/i,
  /kartennr|kartennummer|karte|kartenzahlung/i,
  /lastschrift|sepa|dauerauftrag|ueberweisung|überweisung/i,
  /bargeld|atm|cash|withdrawal/i,
  /gebuhr|gebühr|fee|entgelt|zins|steuer|charge/i,
  /statement|balance|end of day balance|available balance/i,
  /payment|account payment|credit account|cashback|deposit|refund|reversal/i,
  /transfer|wire|ach|payout|interest|fee|fees|chargeback/i,
  /credit\s+card|card\s+payment|card\s+purchase/i,
  /erstellt\s+am/i,
  /wertstellung/i,
  /ausgehende\s+transaktionen/i,
  /einkommende\s+transaktionen/i,
  /transaktionen/i,
];

GlobalWorkerOptions.workerSrc = workerUrl;

function normalizeName(value) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\b\d{2,4}\b$/g, "")
    .trim();
}

function strictMerchantName(value) {
  if (!value) return "";
  let cleaned = cleanMerchant(value);
  cleaned = cleaned.replace(/[^\p{L}\s]+/gu, " ");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

function normalizeKey(name, amount) {
  const safeAmount = Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
  return `${normalizeName(name)}|${safeAmount}`;
}

async function hashBuffer(buffer) {
  if (!window.crypto?.subtle) return null;
  const hash = await window.crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function loadFingerprints() {
  try {
    const raw = localStorage.getItem("bulkImport:fingerprints");
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function clearFingerprints() {
  try {
    localStorage.removeItem("bulkImport:fingerprints");
  } catch (error) {
    // ignore storage errors
  }
}

function storeFingerprint(hash) {
  if (!hash) return;
  const existing = loadFingerprints();
  if (existing.includes(hash)) return;
  const updated = [hash, ...existing].slice(0, 5);
  localStorage.setItem("bulkImport:fingerprints", JSON.stringify(updated));
}

function parseAmount(value) {
  if (!value) return null;

  const trimmed = value.trim();

  // Reject full date patterns (DD.MM.YYYY or DD.MM.YY)
  if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(trimmed)) {
    return null;
  }

  // For short patterns like DD.MM (could be date or amount), apply heuristics:
  // - Dates use dots (01.01), amounts in European format use commas (23,90)
  // - If it uses a dot and looks like a valid date (day 01-31, month 01-12), reject it
  const shortPattern = trimmed.match(/^(\d{1,2})\.(\d{1,2})$/);
  if (shortPattern) {
    const first = parseInt(shortPattern[1], 10);
    const second = parseInt(shortPattern[2], 10);
    // If both parts are in valid day/month range, likely a date
    if (first >= 1 && first <= 31 && second >= 1 && second <= 12) {
      return null;
    }
  }

  const cleaned = value
    .replace(/[^0-9,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(/,/, ".");

  const amount = Number.parseFloat(cleaned);
  if (!Number.isFinite(amount)) return null;
  return Math.abs(amount);
}

function extractAmount(line) {
  if (!line) return null;
  const withCurrency = line.match(
    /([\-–—]?\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*(EUR|€)\b/i,
  );
  if (withCurrency) {
    return parseAmount(withCurrency[1] || withCurrency[0]);
  }

  const fallbackMatches = Array.from(
    line.matchAll(/[-–—]?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}\b/g),
  );
  for (const match of fallbackMatches) {
    const token = match[0];
    if (DATE_DMY.test(token) || DATE_DMY_SHORT.test(token)) {
      continue;
    }
    return parseAmount(token);
  }

  return null;
}

function isBlockedLine(line) {
  return BLOCKLIST.some((pattern) => pattern.test(line));
}

function cleanMerchant(line) {
  if (!line) return "";
  let cleaned = line;
  cleaned = cleaned.replace(
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}\b/i,
    "",
  );
  cleaned = cleaned.replace(/\b\d{2}[./-]\d{2}[./-]\d{2,4}\b/g, "");
  cleaned = cleaned.replace(/\b\d{4}-\d{2}-\d{2}\b/g, "");
  cleaned = cleaned.replace(/\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g, "");
  cleaned = cleaned.replace(/•+\s*\d{2,4}/g, "");
  cleaned = cleaned.replace(/\b(EUR|€)\b/gi, "");
  cleaned = cleaned.replace(/-?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}/g, "");
  cleaned = cleaned.replace(/[|•]/g, " ");
  cleaned = cleaned.replace(/\b\d{2,4}\b$/g, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

function hasLetters(line) {
  return /[a-zA-Z]/.test(line || "");
}

function isLikelyMerchant(name) {
  if (!hasLetters(name)) return false;
  if (isBlockedLine(name)) return false;
  const cleaned = name.trim();
  if (cleaned.length < 3 || cleaned.length > 60) return false;
  const wordCount = cleaned.split(/\s+/).length;
  if (wordCount > 6) return false;
  return true;
}

const MONTH_PREFIX =
  /^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s+\d{1,2}\b/i;
const SUBSCRIPTION_HINTS =
  /subscription|membership|member|plan|premium|pro|plus|monthly|annual|yearly|renewal|recurring|billing/i;

const DATE_DMY = /\b\d{2}[./-]\d{2}[./-]\d{4}\b/;
const DATE_DMY_SHORT = /\b\d{2}[./-]\d{2}[./-]\d{2}\b/;

function detectInterval(line) {
  if (!line) return "month";
  if (/annual|yearly|per year|year\s+plan|jahr/i.test(line)) return "year";
  if (/monthly|per month|monat/i.test(line)) return "month";
  return "month";
}

const AMOUNT_TOKEN_REGEX =
  /\(?[-–—]?\$?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}\)?-?/g;

const EURO_AMOUNT_REGEX =
  /(?:€\s*[-–—]?\s*\d{1,3}(?:[.,]\d{3})*[.,]\d{2})|(?:[-–—]?\s*\d{1,3}(?:[.,]\d{3})*[.,]\d{2}\s*(?:€|eur\b))/gi;

function parseSignedAmountToken(token) {
  if (!token) return null;
  let negative = false;
  let cleaned = token.trim();

  // Strict date rejection - check before any processing
  if (DATE_DMY.test(cleaned) || DATE_DMY_SHORT.test(cleaned)) {
    return null;
  }

  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    negative = true;
    cleaned = cleaned.slice(1, -1);
  }
  if (cleaned.endsWith("-")) {
    negative = true;
    cleaned = cleaned.slice(0, -1);
  }
  if (/^[-–—]/.test(cleaned)) {
    negative = true;
    cleaned = cleaned.replace(/^[-–—]\s*/, "");
  }

  const amount = parseAmount(cleaned);
  if (!Number.isFinite(amount)) return null;
  return { amount, negative };
}

function parseEuroAmountToken(token) {
  if (!token) return null;
  let cleaned = token.trim();
  cleaned = cleaned.replace(/€/g, "").replace(/eur/gi, "").trim();
  const parsed = parseSignedAmountToken(cleaned);
  return parsed;
}

function extractSignedAmount(line) {
  if (!line) return null;
  const matches = Array.from(line.matchAll(AMOUNT_TOKEN_REGEX));
  if (matches.length === 0) return null;

  for (const match of matches) {
    const token = match[0];
    const parsed = parseSignedAmountToken(token);
    if (parsed?.negative) {
      return {
        amount: parsed.amount,
        index: match.index ?? 0,
      };
    }
  }

  return null;
}

function extractEuroAmount(line) {
  if (!line) return null;
  const matches = Array.from(line.matchAll(EURO_AMOUNT_REGEX));
  if (matches.length === 0) return null;

  for (const match of matches) {
    const token = match[0];
    const parsed = parseEuroAmountToken(token);
    if (parsed?.negative) {
      return {
        amount: parsed.amount,
        index: match.index ?? 0,
      };
    }
  }

  return null;
}

function isStatementHeader(line) {
  return (
    /date\s*\(utc\)/i.test(line) ||
    /description/i.test(line) ||
    /end of day balance/i.test(line) ||
    /erstellt\s+am/i.test(line) ||
    /wertstellung/i.test(line) ||
    /ausgehende\s+transaktionen/i.test(line) ||
    /einkommende\s+transaktionen/i.test(line)
  );
}

function parseStatementLine(line) {
  if (!line || !MONTH_PREFIX.test(line)) return null;
  if (isStatementHeader(line)) return null;

  const rest = line.replace(MONTH_PREFIX, "").trim();
  const signedAmount = extractSignedAmount(rest);
  if (!signedAmount) return null;

  const amount = signedAmount.amount;
  if (!amount) return null;

  const merchantRaw = rest.slice(0, signedAmount.index).trim();
  const cleaned = strictMerchantName(merchantRaw);
  if (!isLikelyMerchant(cleaned)) return null;
  if (isBlockedLine(cleaned) || isBlockedLine(line)) return null;

  const interval = detectInterval(line);

  return {
    name: cleaned,
    amount,
    interval,
    source: "statement",
    rawLine: line,
  };
}

function parseEuroStatementLine(line) {
  if (!line) return null;
  if (isStatementHeader(line)) return null;
  if (isBlockedLine(line)) return null;
  if (!DATE_DMY.test(line) && !DATE_DMY_SHORT.test(line)) return null;
  if (!/€|eur/i.test(line)) return null;

  const amount = extractEuroAmount(line);
  if (!amount) return null;

  const dateMatch = line.match(DATE_DMY) || line.match(DATE_DMY_SHORT);
  const dateIndex = dateMatch?.index ?? -1;
  const dateLength = dateMatch?.[0]?.length ?? 0;

  let merchantRaw = "";
  if (dateIndex > 0) {
    merchantRaw = line.slice(0, dateIndex).trim();
  } else if (dateIndex === 0) {
    const afterDate = line.slice(dateLength).trim();
    merchantRaw = afterDate.slice(0, amount.index - dateLength).trim();
  } else {
    merchantRaw = line.slice(0, amount.index).trim();
  }

  const cleaned = strictMerchantName(merchantRaw);
  if (!isLikelyMerchant(cleaned)) return null;
  if (isBlockedLine(cleaned)) return null;

  return {
    name: cleaned,
    amount: amount.amount,
    interval: detectInterval(line),
    source: "statement",
    rawLine: line,
  };
}

function detectFromStatementLines(lines) {
  const candidates = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    // Try standard parsing first
    let parsed = parseStatementLine(line) || parseEuroStatementLine(line);

    // N26 format: date+amount on one line, merchant on previous lines
    // Line format: "01.01.2026 -91,45€" (date at position 0)
    if (!parsed && DATE_DMY.test(line) && /€/i.test(line)) {
      console.log("[DEBUG N26] Potential N26 line:", line);
      const dateMatch = line.match(DATE_DMY);
      if (dateMatch?.index === 0) {
        console.log("[DEBUG N26] Date at position 0, extracting amount...");
        const amount = extractEuroAmount(line);
        console.log("[DEBUG N26] Extracted amount:", amount);
        if (amount) {
          // Look back up to 4 lines for merchant name
          let merchantName = null;
          for (let back = 1; back <= 4 && i - back >= 0; back += 1) {
            const prevLine = lines[i - back];
            console.log("[DEBUG N26] Looking back", back, ":", prevLine);
            if (!prevLine) continue;
            if (isStatementHeader(prevLine) || isBlockedLine(prevLine)) { console.log("[DEBUG N26] Skipped: header/blocked"); continue; }
            if (DATE_DMY.test(prevLine) || DATE_DMY_SHORT.test(prevLine)) { console.log("[DEBUG N26] Skipped: date"); continue; }
            if (/wertstellung/i.test(prevLine)) { console.log("[DEBUG N26] Skipped: wertstellung"); continue; }
            if (/mastercard|visa|iban|bic/i.test(prevLine)) { console.log("[DEBUG N26] Skipped: card/iban"); continue; }
            if (extractEuroAmount(prevLine)) { console.log("[DEBUG N26] Skipped: has amount"); continue; }

            const candidate = strictMerchantName(prevLine);
            console.log("[DEBUG N26] Candidate merchant:", candidate, "isLikely:", isLikelyMerchant(candidate));
            if (isLikelyMerchant(candidate)) {
              merchantName = candidate;
              break;
            }
          }

          if (merchantName) {
            console.log("[DEBUG N26] Found merchant:", merchantName, "amount:", amount.amount);
            parsed = {
              name: merchantName,
              amount: amount.amount,
              interval: detectInterval(line),
              source: "statement",
              rawLine: line,
            };
          } else {
            console.log("[DEBUG N26] No merchant found for line:", line);
          }
        }
      }
    }

    if (parsed) candidates.push(parsed);
  }
  return candidates;
}

function pickMostCommon(map) {
  let bestKey = null;
  let bestCount = -1;
  for (const [key, count] of map.entries()) {
    if (count > bestCount) {
      bestKey = key;
      bestCount = count;
    }
  }
  return bestKey;
}

function summarizeCandidates(candidates) {
  const groups = new Map();

  for (const candidate of candidates) {
    if (!candidate?.name || !candidate?.amount) continue;
    const key = normalizeName(candidate.name);
    if (!key) continue;

    if (!groups.has(key)) {
      groups.set(key, {
        names: new Map(),
        amounts: new Map(),
        amountList: [],
        rawLines: [],
        sources: new Set(),
        count: 0,
      });
    }

    const group = groups.get(key);
    group.count += 1;
    group.sources.add(candidate.source);
    group.rawLines.push(candidate.rawLine || candidate.name);

    const nameCount = group.names.get(candidate.name) || 0;
    group.names.set(candidate.name, nameCount + 1);

    const amountKey = candidate.amount.toFixed(2);
    const amountCount = group.amounts.get(amountKey) || 0;
    group.amounts.set(amountKey, amountCount + 1);
    group.amountList.push(candidate.amount);
  }

  const results = [];

  for (const [key, group] of groups.entries()) {
    const bestName = strictMerchantName(pickMostCommon(group.names) || key);
    if (!bestName) continue;
    const bestAmount = pickMostCommon(group.amounts);
    const hasHint = group.rawLines.some((line) => SUBSCRIPTION_HINTS.test(line));
    const cancel = resolveCancelLink(bestName);
    const shouldKeep = group.count >= 2 || hasHint || cancel?.url;

    if (group.count >= 2 && !hasHint && !cancel?.url) {
      const avg =
        group.amountList.reduce((sum, value) => sum + value, 0) /
        group.amountList.length;
      const variance =
        group.amountList.reduce(
          (sum, value) => sum + Math.pow(value - avg, 2),
          0,
        ) / group.amountList.length;
      const std = Math.sqrt(variance);
      if (avg > 0 && std / avg > 0.15) {
        continue;
      }
    }

    if (!shouldKeep || !bestAmount) continue;

    results.push({
      name: bestName,
      amount: Number.parseFloat(bestAmount),
      interval: "month",
      source: Array.from(group.sources).join(","),
    });
  }

  return results;
}

function resolveForcedMerchant(line) {
  const match = FORCED_MERCHANTS.find((item) => item.pattern.test(line));
  return match?.name;
}

function collectForcedCandidates(lines) {
  const forced = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const forcedName = resolveForcedMerchant(line);
    if (!forcedName) continue;

    const forcedAmount =
      extractAmount(line) ||
      extractAmount(lines[i + 1]) ||
      extractAmount(lines[i + 2]) ||
      extractAmount(lines[i - 1]);

    if (!forcedAmount) continue;

    forced.push({
      name: forcedName,
      amount: forcedAmount,
      interval: "month",
      source: "pdf",
      rawLine: line,
    });
  }

  return forced;
}

function dedupeCandidates(candidates) {
  const seen = new Set();
  const deduped = [];
  for (const candidate of candidates) {
    const key = normalizeKey(candidate.name, candidate.amount);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(candidate);
  }
  return deduped;
}

function detectFromPdfText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const statementMode = lines.some(
    (line) =>
      MONTH_PREFIX.test(line) ||
      (DATE_DMY.test(line) && /€|eur/i.test(line)),
  );
  const forcedCandidates = dedupeCandidates(collectForcedCandidates(lines));
  const statementCandidates = detectFromStatementLines(lines);

  if (statementMode) {
    return summarizeCandidates([...forcedCandidates, ...statementCandidates]);
  }

  const candidates = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (isBlockedLine(line)) continue;

    const amount = extractAmount(line);
    if (!amount) continue;

    let name = strictMerchantName(line);
    if (!isLikelyMerchant(name)) {
      const prev = lines[i - 1];
      const next = lines[i + 1];
      const prevClean = strictMerchantName(prev);
      const nextClean = strictMerchantName(next);

      if (isLikelyMerchant(prevClean)) {
        name = prevClean;
      } else if (isLikelyMerchant(nextClean)) {
        name = nextClean;
      }
    }

    if (!isLikelyMerchant(name)) continue;

    const override = resolveForcedMerchant(name);
    candidates.push({
      name: override || name,
      amount,
      interval: detectInterval(line),
      source: "pdf",
      rawLine: line,
    });
  }

  const merged = [...forcedCandidates, ...dedupeCandidates(candidates)];

  return summarizeCandidates(merged);
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
      name: strictMerchantName(parts[descIndex]),
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

function detectFromSpreadsheet(buffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const [sheetName] = workbook.SheetNames;
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const csv = XLSX.utils.sheet_to_csv(sheet);
  if (!csv) return [];
  return detectFromCsvText(csv);
}

function getExtension(fileName) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function readFileBuffer(file) {
  if (file?.arrayBuffer) {
    return file.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export default function BulkImport({
  embedded = false,
  redirectOnComplete = true,
  onComplete,
  deferCompleteUntilReview = false,
}) {
  const {
    subscriptions,
    setSubscriptions,
    setDashboardData,
    setUsedCategories,
  } = useDataContext();
  const {
    createSubscription,
    updateSubscription,
    getAllSubscriptions,
    deleteSubscription,
  } = useSubscription();
  const { getDashboardData } = useDashboard();
  const { getUsedCategories } = useCategory();
  const { processOcr } = useOcr();
  const { cleanTransactions } = useAiCleaner();

  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [stage, setStage] = useState("idle");
  const [detected, setDetected] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [summary, setSummary] = useState({ created: 0, skipped: 0 });
  const [decisionLoading, setDecisionLoading] = useState(null);
  const [cancelAllLoading, setCancelAllLoading] = useState(false);
  const [wipeLoading, setWipeLoading] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [pendingComplete, setPendingComplete] = useState(null);
  const navigate = useNavigate();

  const current = detected[currentIndex];

  const progress = useMemo(() => {
    if (detected.length === 0) return 0;
    return Math.min(100, Math.round((currentIndex / detected.length) * 100));
  }, [currentIndex, detected.length]);

  // Call onComplete when review is finished (all items reviewed)
  useEffect(() => {
    if (
      deferCompleteUntilReview &&
      pendingComplete &&
      detected.length > 0 &&
      currentIndex >= detected.length &&
      onComplete
    ) {
      onComplete(pendingComplete);
      setPendingComplete(null);
    }
  }, [currentIndex, detected.length, deferCompleteUntilReview, pendingComplete, onComplete]);

  function fileKey(file) {
    return `${file.name}|${file.size}|${file.lastModified}`;
  }

  function addFiles(newFiles) {
    const incoming = Array.from(newFiles || []);
    if (incoming.length === 0) return;
    setFiles((prev) => {
      const map = new Map(prev.map((item) => [fileKey(item), item]));
      for (const file of incoming) {
        map.set(fileKey(file), file);
      }
      return Array.from(map.values());
    });
  }

  function clearFiles() {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function extractPdfText(buffer) {
    const pdf = await getDocument({ data: buffer }).promise;

    let combinedText = "";
    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
      const page = await pdf.getPage(pageIndex);
      const content = await page.getTextContent();
      const lines = [];
      let currentLine = "";
      let lastY = null;

      for (const item of content.items) {
        const text = item.str || "";
        const y = item.transform?.[5] ?? null;

        if (lastY !== null && y !== null && Math.abs(y - lastY) > 6) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = "";
        }

        currentLine += `${text} `;

        if (item.hasEOL) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = "";
        }

        if (y !== null) {
          lastY = y;
        }
      }

      if (currentLine.trim()) lines.push(currentLine.trim());

      combinedText += `${lines.join("\n")}\n`;
    }

    return combinedText;
  }

  async function extractPdfTextWithOcr(buffer) {
    const maxSize = 6_000_000;
    if (buffer.byteLength > maxSize) return "";

    try {
      const base64 = bufferToBase64(buffer);
      const result = await processOcr({ base64 }, new AbortController());
      return result?.extractedText || result?.text || "";
    } catch (error) {
      return "";
    }
  }

  async function wipeAllSubscriptions({ silent = false } = {}) {
    setWipeLoading(true);
    let latest = [];

    try {
      const fetched = await getAllSubscriptions(new AbortController());
      latest = Array.isArray(fetched) ? fetched : [];
    } catch (error) {
      // ignore fetch errors
    }

    for (const subscription of latest) {
      if (!subscription?._id) continue;
      try {
        await deleteSubscription(subscription._id, new AbortController());
      } catch (error) {
        // ignore delete errors
      }
    }

    const refreshed = await getAllSubscriptions(new AbortController());
    const refreshedDashboard = await getDashboardData(new AbortController());
    const refreshedCategories = await getUsedCategories(new AbortController());

    setSubscriptions(refreshed || []);
    if (refreshedDashboard) setDashboardData(refreshedDashboard);
    if (refreshedCategories) setUsedCategories(refreshedCategories);
    eventEmitter.emit("refetchData");

    if (!silent) {
      toast.success("All subscriptions wiped");
    }

    setWipeLoading(false);
  }

  async function handleProcessFiles() {
    if (!files.length) {
      toast.error("Select a PDF, CSV, or Excel file");
      return;
    }

    setStage("parsing");
    setDetected([]);
    setCurrentIndex(0);

    let candidates = [];
    let baseSubscriptions = subscriptions || [];
    const fingerprintsToStore = [];
    const skippedFiles = [];
    const failedFiles = [];
    const aiLines = [];
    let statementModeDetected = false;

    try {
      const latestSubscriptions = await getAllSubscriptions(
        new AbortController(),
      );
      if (latestSubscriptions) {
        setSubscriptions(latestSubscriptions);
        baseSubscriptions = latestSubscriptions;
      }

      for (const file of files) {
        try {
          const extension = getExtension(file.name);
          if (!["pdf", "csv", "xlsx", "xls"].includes(extension)) {
            skippedFiles.push(file.name);
            continue;
          }

          const buffer = await readFileBuffer(file);
          if (!buffer) {
            failedFiles.push(file.name);
            continue;
          }

          if (!replaceExisting) {
            const fingerprint = await hashBuffer(buffer);
            if (fingerprint) {
              const seen = loadFingerprints();
              if (seen.includes(fingerprint)) {
                skippedFiles.push(file.name);
                continue;
              }
              fingerprintsToStore.push(fingerprint);
            }
          }

          if (extension === "pdf") {
            let text = "";
            try {
              text = await extractPdfText(buffer);
            } catch (error) {
              console.error("PDF parse failed", file.name, error);
            }

            const textLines = text
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter(Boolean);

            aiLines.push(...textLines);
            if (
              textLines.some(
                (line) =>
                  MONTH_PREFIX.test(line) ||
                  (DATE_DMY.test(line) && /€|eur/i.test(line)),
              )
            ) {
              statementModeDetected = true;
            }
            let pdfCandidates = detectFromPdfText(text);
            if (pdfCandidates.length === 0) {
              const ocrText = await extractPdfTextWithOcr(buffer);
              if (ocrText) {
                const ocrLines = ocrText
                  .split(/\r?\n/)
                  .map((line) => line.trim())
                  .filter(Boolean);
                aiLines.push(...ocrLines);
                if (
                  ocrLines.some(
                    (line) =>
                      MONTH_PREFIX.test(line) ||
                      (DATE_DMY.test(line) && /€|eur/i.test(line)),
                  )
                ) {
                  statementModeDetected = true;
                }
                pdfCandidates = detectFromPdfText(ocrText);
              }
            }
            candidates = candidates.concat(pdfCandidates);
          } else if (extension === "csv") {
            const text = new TextDecoder("utf-8").decode(buffer);
            candidates = candidates.concat(detectFromCsvText(text));
          } else {
            candidates = candidates.concat(detectFromSpreadsheet(buffer));
          }
        } catch (error) {
          console.error("File processing failed", file.name, error);
          failedFiles.push(file.name);
        }
      }
    } catch (error) {
      toast.error("Could not read files");
      setStage("idle");
      return;
    }

    if (failedFiles.length > 0) {
      const shortList = failedFiles.slice(0, 3).join(", ");
      const suffix =
        failedFiles.length > 3
          ? ` +${failedFiles.length - 3} more`
          : "";
      toast.error(`Failed to read: ${shortList}${suffix}`);
    }

    if (
      !statementModeDetected &&
      aiLines.length > 0 &&
      candidates.length === 0
    ) {
      const uniqueLines = Array.from(new Set(aiLines)).slice(0, 200);
      try {
        const aiResult = await cleanTransactions(
          uniqueLines,
          new AbortController(),
        );
        const aiItems = Array.isArray(aiResult?.items) ? aiResult.items : [];
        if (aiItems.length > 0) {
          candidates = aiItems
            .map((item) => ({
              name: strictMerchantName(item.name || ""),
              amount: Number.parseFloat(item.amount),
              interval: item.interval === "year" ? "year" : "month",
              source: "ai",
            }))
            .filter((item) => item.name && Number.isFinite(item.amount));
        }
      } catch (error) {
        // ignore AI failures
      }
    }

    if (candidates.length === 0) {
      toast.error("No subscriptions found");
      setStage("idle");
      return;
    }

    candidates = dedupeCandidates(candidates);

    // Filter to likely subscriptions only
    const allCandidates = candidates;
    candidates = candidates.filter((c) => isLikelySubscription(c.name));
    console.log(
      `[DEBUG] Filtered ${allCandidates.length} candidates to ${candidates.length} likely subscriptions`,
    );

    if (candidates.length === 0 && allCandidates.length > 0) {
      toast.error(
        `Found ${allCandidates.length} transactions but none matched known subscriptions`,
      );
      setStage("idle");
      return;
    }

    if (replaceExisting) {
      await wipeAllSubscriptions({ silent: true });
      clearFingerprints();
      baseSubscriptions = [];
    }

    const existingKeys = new Set(
      baseSubscriptions.map((sub) => normalizeName(sub.name)),
    );

    let createdCount = 0;
    let skippedCount = 0;

    setStage("creating");

    for (const candidate of candidates) {
      const candidateKey = normalizeName(candidate.name);
      if (existingKeys.has(candidateKey)) {
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
    const refreshedDashboard = await getDashboardData(new AbortController());
    const refreshedCategories = await getUsedCategories(new AbortController());
    const enriched = candidates.map((candidate) => {
      const candidateKey = normalizeName(candidate.name);
      const match = refreshed?.find(
        (sub) =>
          normalizeName(sub.name) === candidateKey &&
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
    setSubscriptions(refreshed);
    if (refreshedDashboard) setDashboardData(refreshedDashboard);
    if (refreshedCategories) setUsedCategories(refreshedCategories);
    eventEmitter.emit("refetchData");

    if (!replaceExisting && fingerprintsToStore.length > 0) {
      for (const fingerprint of fingerprintsToStore) {
        storeFingerprint(fingerprint);
      }
    }

    if (createdCount > 0) {
      const label =
        createdCount === 1
          ? "1 subscription added"
          : `${createdCount} subscriptions added`;
      toast.success(label);
    } else {
      toast.success("No new subscriptions added");
    }

    if (skippedFiles.length > 0) {
      toast.info(`Skipped ${skippedFiles.length} file(s).`);
    }

    localStorage.setItem(
      "bulkImport:justImported",
      JSON.stringify({ count: createdCount, ts: Date.now() }),
    );

    const completeData = {
      created: createdCount,
      skipped: skippedCount,
      detected: enriched,
    };

    if (onComplete && !deferCompleteUntilReview) {
      onComplete(completeData);
    } else if (deferCompleteUntilReview) {
      setPendingComplete(completeData);
    }

    if (redirectOnComplete) {
      navigate("/dashboard");
    }
  }

  async function handleDecision(action) {
    if (!current) return;

    setDecisionLoading(action);

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

    await new Promise((resolve) => setTimeout(resolve, 150));
    setDecisionLoading(null);
    setCurrentIndex((prev) => prev + 1);
  }

  async function handleCancelAll() {
    setCancelAllLoading(true);
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

    setCancelAllLoading(false);
    setCurrentIndex(detected.length);
    toast.success("Canceled all detected subscriptions");
  }

  // Theme-aware class names for embedded (dark) vs normal (light) mode
  const theme = {
    container: embedded
      ? "border-white/20 bg-transparent"
      : "border-black/10 bg-white/60",
    title: embedded ? "text-white" : "text-gray-900",
    subtitle: embedded ? "text-white/70" : "text-gray-600",
    checkbox: embedded
      ? "border-white/30 bg-white/10 text-white/80"
      : "border-black/10 bg-white/70",
    checkboxAccent: embedded ? "accent-white" : "accent-black",
    dropzone: dragActive
      ? embedded
        ? "border-white bg-white/10"
        : "border-black bg-black/5"
      : embedded
        ? "border-white/30 bg-white/5"
        : "border-black/20 bg-white/60",
    dropzoneText: embedded ? "text-white" : "text-gray-900",
    dropzoneSubtext: embedded ? "text-white/60" : "text-gray-600",
    fileChip: embedded
      ? "border-white/20 bg-white/10 text-white/80"
      : "border-black/10 bg-white/80",
    clearBtn: embedded ? "text-white/70" : "text-black/70",
    processBtn: embedded
      ? "bg-white text-black"
      : "bg-black text-white",
    wipeBtn: embedded
      ? "border-white/30 text-white/80"
      : "border-black/20",
    summaryText: embedded ? "text-white/60" : "text-gray-600",
    cardBg: embedded
      ? "border-white/20 bg-white/10"
      : "border-black/10 bg-white",
    cardTitle: embedded ? "text-white" : "text-gray-900",
    cardSubtitle: embedded ? "text-white/70" : "text-gray-600",
    cardMeta: embedded ? "text-white/50" : "text-gray-500",
    keepBtn: embedded
      ? "border-white/30 text-white"
      : "border-black/20",
    cancelBtn: embedded
      ? "bg-white text-black"
      : "bg-black text-white",
    progressBg: embedded ? "bg-white/20" : "bg-gray-200",
    progressFill: embedded ? "bg-white" : "bg-black",
  };

  return (
    <div
      className={`flex w-full flex-col gap-4 ${
        embedded ? "max-w-none" : ""
      }`}
    >
      <div className={`rounded-lg border p-4 ${theme.container}`}>
        <h2 className={`text-lg font-semibold ${theme.title}`}>Bulk Import and Cancel</h2>
        <p className={`text-sm ${theme.subtitle}`}>
          Upload PDF, CSV, or Excel files. Subscriptions are auto added. Then
          decide keep or cancel.
        </p>

        <div className={`mt-4 flex flex-wrap items-center gap-3 text-xs ${theme.subtitle}`}>
          <label className={`flex items-center gap-2 rounded-full border px-3 py-2 ${theme.checkbox}`}>
            <input
              type="checkbox"
              className={`h-4 w-4 ${theme.checkboxAccent}`}
              checked={replaceExisting}
              onChange={(event) => setReplaceExisting(event.target.checked)}
            />
            Replace existing on import
          </label>
          <span className={`text-xs ${theme.cardMeta}`}>
            Wipes current subscriptions before adding new ones.
          </span>
          <LoadingButton
            onClick={() => wipeAllSubscriptions()}
            isLoading={wipeLoading}
            className={`rounded-full border px-3 py-2 text-xs font-semibold ${theme.wipeBtn}`}
          >
            Wipe all subscriptions
          </LoadingButton>
        </div>

        <div
          className={`mt-4 rounded-xl border-2 border-dashed px-4 py-4 text-sm transition ${theme.dropzone}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            addFiles(event.dataTransfer.files);
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className={`text-sm font-semibold ${theme.dropzoneText}`}>
                Drop files here or select
              </div>
              <div className={`text-xs ${theme.dropzoneSubtext}`}>
                PDF, CSV, XLSX, XLS
              </div>
            </div>
            <label className={`inline-flex cursor-pointer items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold ${embedded ? "border-white/30 bg-white/10 text-white" : "border-black/20 bg-white"}`}>
              Choose files
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv,.xlsx,.xls"
                multiple
                onChange={(event) => {
                  addFiles(event.target.files);
                }}
                className="hidden"
              />
            </label>
          </div>

          {files.length > 0 && (
            <div className={`mt-3 flex flex-col gap-1 text-xs ${theme.dropzoneSubtext}`}>
              <div>
                Selected: {files.length} file{files.length > 1 ? "s" : ""}
              </div>
              <div className="flex flex-wrap gap-2">
                {files.map((item) => (
                  <span
                    key={fileKey(item)}
                    className={`rounded-full border px-3 py-1 ${theme.fileChip}`}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={clearFiles}
                className={`mt-1 text-left text-xs font-semibold ${theme.clearBtn}`}
              >
                Clear selection
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <LoadingButton
            onClick={handleProcessFiles}
            isLoading={stage === "parsing" || stage === "creating"}
            disabled={!files.length || stage === "parsing" || stage === "creating"}
            loadingText="Processing"
            className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${theme.processBtn}`}
          >
            Process files
          </LoadingButton>
        </div>

        {summary.created + summary.skipped > 0 && (
          <div className={`mt-3 text-xs ${theme.summaryText}`}>
            Created: {summary.created} | Skipped: {summary.skipped}
          </div>
        )}
      </div>

      {detected.length > 0 && (
        <div className={`rounded-lg border p-4 ${theme.container}`}>
          <div className={`flex items-center justify-between text-sm ${theme.subtitle}`}>
            <span>
              {Math.min(currentIndex + 1, detected.length)} of {detected.length}
            </span>
            <span>{progress}%</span>
          </div>
          <div className={`mt-2 h-2 w-full rounded-full ${theme.progressBg}`}>
            <div
              className={`h-2 rounded-full ${theme.progressFill}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {current ? (
            <div className={`mt-4 rounded-xl border p-4 shadow-sm ${theme.cardBg}`}>
              <div className={`text-lg font-semibold ${theme.cardTitle}`}>{current.name}</div>
              <div className={`text-sm ${theme.cardSubtitle}`}>
                {current.amount.toFixed(2)} EUR per {current.interval}
              </div>
              <div className={`mt-2 text-xs ${theme.cardMeta}`}>
                Source: {current.source}
              </div>
              <div className={`mt-2 text-xs ${theme.cardMeta}`}>
                Cancel: {current.cancel?.label || "Unknown"}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <LoadingButton
                  onClick={() => handleDecision("keep")}
                  isLoading={decisionLoading === "keep"}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${theme.keepBtn}`}
                >
                  Keep
                </LoadingButton>
                <LoadingButton
                  onClick={() => handleDecision("cancel")}
                  isLoading={decisionLoading === "cancel"}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${theme.cancelBtn}`}
                >
                  Cancel
                </LoadingButton>
              </div>
            </div>
          ) : (
            <div className={`mt-4 text-center text-sm ${theme.subtitle}`}>
              Done.
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <LoadingButton
              onClick={handleCancelAll}
              isLoading={cancelAllLoading}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold ${theme.wipeBtn}`}
            >
              Cancel All
            </LoadingButton>
          </div>
        </div>
      )}
    </div>
  );
}
