const STORAGE_KEY = "subzro:onboarding:events:v1";
const MAX_EVENTS = 50;

function safeParse(rawValue) {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readOnboardingEvents() {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function clearOnboardingEvents() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function logOnboardingEvent(type, payload = {}) {
  if (typeof window === "undefined") return;

  const event = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 9)}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
  };

  const current = readOnboardingEvents();
  const next = [...current, event].slice(-MAX_EVENTS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
