const LEGACY_COMPLETED_KEY = "subzro:onboarding:completedAt";
const COMPLETED_PREFIX = "subzro:onboarding:completedAt:";
const FORCE_FRESH_OVERRIDES_KEY = "subzro:onboarding:forceFreshEmails:v1";

export const FORCE_FRESH_EMAIL_DEFAULTS = ["lil.dippel@gmail.com"];

function normalizeEmail(email) {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

function uniqueEmails(emails) {
  const seen = new Set();
  const result = [];

  emails.forEach((email) => {
    const normalized = normalizeEmail(email);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(normalized);
  });

  return result;
}

function safeParseList(raw) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getOnboardingCompletedKey(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return LEGACY_COMPLETED_KEY;
  return `${COMPLETED_PREFIX}${normalized}`;
}

export function readOnboardingCompletedAt(email) {
  if (typeof window === "undefined") return null;
  const key = getOnboardingCompletedKey(email);
  return window.localStorage.getItem(key);
}

export function markOnboardingCompletedAt(email, completedAt) {
  if (typeof window === "undefined") return;
  const key = getOnboardingCompletedKey(email);
  window.localStorage.setItem(key, completedAt || new Date().toISOString());
}

export function clearOnboardingCompletedAt(email) {
  if (typeof window === "undefined") return;
  const key = getOnboardingCompletedKey(email);
  window.localStorage.removeItem(key);
}

function readForceFreshEmailOverrides() {
  if (typeof window === "undefined") return [];
  return safeParseList(window.localStorage.getItem(FORCE_FRESH_OVERRIDES_KEY));
}

function writeForceFreshEmailOverrides(emails) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    FORCE_FRESH_OVERRIDES_KEY,
    JSON.stringify(uniqueEmails(emails)),
  );
}

export function readForceFreshEmails() {
  return uniqueEmails([
    ...FORCE_FRESH_EMAIL_DEFAULTS,
    ...readForceFreshEmailOverrides(),
  ]);
}

export function isForceFreshOnboardingEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return readForceFreshEmails().includes(normalized);
}

export function addForceFreshOnboardingEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return;

  const currentOverrides = readForceFreshEmailOverrides();
  writeForceFreshEmailOverrides([...currentOverrides, normalized]);
}

export function removeForceFreshOnboardingEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return;

  const currentOverrides = readForceFreshEmailOverrides();
  const nextOverrides = currentOverrides.filter(
    (value) => normalizeEmail(value) !== normalized,
  );
  writeForceFreshEmailOverrides(nextOverrides);
}

export function listOnboardingCompletionEntries() {
  if (typeof window === "undefined") return [];

  const entries = [];
  const keys = Object.keys(window.localStorage);

  keys.forEach((key) => {
    if (!key.startsWith(COMPLETED_PREFIX)) return;
    const email = key.slice(COMPLETED_PREFIX.length);
    const completedAt = window.localStorage.getItem(key);

    entries.push({
      email,
      completedAt,
      storageKey: key,
    });
  });

  return entries.sort((a, b) => {
    if (!a.completedAt && !b.completedAt) return 0;
    if (!a.completedAt) return 1;
    if (!b.completedAt) return -1;
    return b.completedAt.localeCompare(a.completedAt);
  });
}

export function normalizeOnboardingEmail(email) {
  return normalizeEmail(email);
}
