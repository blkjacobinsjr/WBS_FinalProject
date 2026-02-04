import { useMemo, useRef, useState } from "react";
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
import { resolveCancelLink } from "../utils/cancelProviders";
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
    if (
      DATE_DMY.test(token) ||
      DATE_DMY_SHORT.test(token) ||
      DATE_DMY_NOYEAR.test(token)
    ) {
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
const DATE_DMY_NOYEAR = /\b\d{2}[./-]\d{2}\b/;
const DATE_RANGE =
  /\b\d{2}[./-]\d{2}[./-]\d{2,4}\s*[-–]\s*\d{2}[./-]\d{2}[./-]\d{2,4}\b/;

function detectInterval(line) {
  if (!line) return "month";
  if (/annual|yearly|per year|year\s+plan|jahr/i.test(line)) return "year";
  if (/monthly|per month|monat/i.test(line)) return "month";
  return "month";
}

const AMOUNT_TOKEN_REGEX =
  /\(?[-–—]?\$?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}\)?-?/g;

const EURO_AMOUNT_REGEX =
  /(?:€\s*[-–—]?\s*\d{1,3}(?:[.,]\d{3})*[.,]\d{2})|(?:[-–—]?\s*\d{1,3}(?:[.,]\d{3})*[.,]\d{2}\s*(?:€|eur)\b)/gi;

function parseSignedAmountToken(token) {
  if (!token) return null;
  let negative = false;
  let cleaned = token.trim();
  if (
    DATE_DMY.test(cleaned) ||
    DATE_DMY_SHORT.test(cleaned) ||
    DATE_DMY_NOYEAR.test(cleaned)
  ) {
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

function extractEuroAmount(line, allowPositive = false) {
  if (!line) return null;
  const matches = Array.from(line.matchAll(EURO_AMOUNT_REGEX));
  if (matches.length === 0) return null;

  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const match = matches[i];
    const token = match[0];
    const parsed = parseEuroAmountToken(token);
    if (!parsed) continue;
    if (parsed.negative || allowPositive) {
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
  if (
    !DATE_DMY.test(line) &&
    !DATE_DMY_SHORT.test(line) &&
    !DATE_DMY_NOYEAR.test(line)
  )
    return null;
  if (!/€|eur/i.test(line) && !DATE_RANGE.test(line)) return null;

  const allowPositive = DATE_RANGE.test(line) || /lastschrift/i.test(line);
  const amount = extractEuroAmount(line, allowPositive);
  if (!amount) return null;

  const dateMatch =
    line.match(DATE_DMY) ||
    line.match(DATE_DMY_SHORT) ||
    line.match(DATE_DMY_NOYEAR);
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

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    let parsed = null;

    if (MONTH_PREFIX.test(line)) {
      parsed = parseStatementLine(line);
    } else if (
      DATE_DMY.test(line) ||
      DATE_DMY_SHORT.test(line) ||
      DATE_DMY_NOYEAR.test(line)
    ) {
      parsed = parseEuroStatementLine(line);
    }

    if (parsed && parsed.name) {
      candidates.push(parsed);
      continue;
    }

    if (
      DATE_DMY.test(line) ||
      DATE_DMY_SHORT.test(line) ||
      DATE_DMY_NOYEAR.test(line) ||
      DATE_RANGE.test(line)
    ) {
      const amount = extractEuroAmount(line, true);
      if (!amount) continue;

      let merchantLine = null;
      for (let back = 1; back <= 3; back += 1) {
        const prev = lines[index - back];
        if (!prev) continue;
        if (isStatementHeader(prev) || isBlockedLine(prev)) continue;
        if (
          DATE_DMY.test(prev) ||
          DATE_DMY_SHORT.test(prev) ||
          DATE_DMY_NOYEAR.test(prev)
        )
          continue;
        if (extractEuroAmount(prev) || extractSignedAmount(prev)) continue;

        const candidate = strictMerchantName(prev);
        if (isLikelyMerchant(candidate)) {
          merchantLine = candidate;
          break;
        }
      }

      if (!merchantLine) continue;

      candidates.push({
        name: merchantLine,
        amount: amount.amount,
        interval: detectInterval(line),
        source: "statement",
        rawLine: line,
      });
    }
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
      DATE_DMY.test(line) ||
      DATE_DMY_SHORT.test(line) ||
      DATE_DMY_NOYEAR.test(line),
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
  const navigate = useNavigate();

  const current = detected[currentIndex];

  const progress = useMemo(() => {
    if (detected.length === 0) return 0;
    return Math.min(100, Math.round((currentIndex / detected.length) * 100));
  }, [currentIndex, detected.length]);

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
                  DATE_DMY.test(line) ||
                  DATE_DMY_SHORT.test(line) ||
                  DATE_DMY_NOYEAR.test(line),
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
                      DATE_DMY.test(line) ||
                      DATE_DMY_SHORT.test(line) ||
                      DATE_DMY_NOYEAR.test(line),
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

    if (onComplete) {
      onComplete({
        created: createdCount,
        skipped: skippedCount,
        detected: enriched,
      });
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

  return (
    <div
      className={`flex w-full flex-col gap-4 ${
        embedded ? "max-w-none" : ""
      }`}
    >
      <div className="rounded-lg border border-black/10 bg-white/60 p-4">
        <h2 className="text-lg font-semibold">Bulk Import and Cancel</h2>
        <p className="text-sm text-gray-600">
          Upload PDF, CSV, or Excel files. Subscriptions are auto added. Then
          decide keep or cancel.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <label className="flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-black"
              checked={replaceExisting}
              onChange={(event) => setReplaceExisting(event.target.checked)}
            />
            Replace existing on import
          </label>
          <span className="text-xs text-gray-500">
            Wipes current subscriptions before adding new ones.
          </span>
          <LoadingButton
            onClick={() => wipeAllSubscriptions()}
            isLoading={wipeLoading}
            className="rounded-full border border-black/20 px-3 py-2 text-xs font-semibold"
          >
            Wipe all subscriptions
          </LoadingButton>
        </div>

        <div
          className={`mt-4 rounded-xl border-2 border-dashed px-4 py-4 text-sm transition ${
            dragActive
              ? "border-black bg-black/5"
              : "border-black/20 bg-white/60"
          }`}
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
              <div className="text-sm font-semibold">
                Drop files here or select
              </div>
              <div className="text-xs text-gray-600">
                PDF, CSV, XLSX, XLS
              </div>
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-black/20 bg-white px-4 py-2 text-xs font-semibold">
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
            <div className="mt-3 flex flex-col gap-1 text-xs text-gray-600">
              <div>
                Selected: {files.length} file{files.length > 1 ? "s" : ""}
              </div>
              <div className="flex flex-wrap gap-2">
                {files.map((item) => (
                  <span
                    key={fileKey(item)}
                    className="rounded-full border border-black/10 bg-white/80 px-3 py-1"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={clearFiles}
                className="mt-1 text-left text-xs font-semibold text-black/70"
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
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Process files
          </LoadingButton>
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
                <LoadingButton
                  onClick={() => handleDecision("keep")}
                  isLoading={decisionLoading === "keep"}
                  className="rounded-lg border border-black/20 px-3 py-2 text-sm font-semibold"
                >
                  Keep
                </LoadingButton>
                <LoadingButton
                  onClick={() => handleDecision("cancel")}
                  isLoading={decisionLoading === "cancel"}
                  className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white"
                >
                  Cancel
                </LoadingButton>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-center text-sm text-gray-600">
              Done.
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <LoadingButton
              onClick={handleCancelAll}
              isLoading={cancelAllLoading}
              className="rounded-lg border border-black/20 px-3 py-2 text-xs font-semibold"
            >
              Cancel All
            </LoadingButton>
          </div>
        </div>
      )}
    </div>
  );
}
