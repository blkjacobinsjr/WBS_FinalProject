import { useState, useEffect, useMemo } from "react";
import { UserButton, useUser, useAuth } from "@clerk/clerk-react";
import { hasConfiguredAdminEmails, isAdminEmail } from "../utils/adminAccess";
import {
  clearOnboardingEvents,
  readOnboardingEvents,
} from "../utils/onboardingDebug";
import ApiEndpoints from "../utils/ApiEndpoints";
import {
  FORCE_FRESH_EMAIL_DEFAULTS,
  addForceFreshOnboardingEmail,
  clearOnboardingCompletedAt,
  isForceFreshOnboardingEmail,
  listOnboardingCompletionEntries,
  markOnboardingCompletedAt,
  normalizeOnboardingEmail,
  readForceFreshEmails,
  readOnboardingCompletedAt,
  removeForceFreshOnboardingEmail,
} from "../utils/onboardingState";

export default function SettingsTab({ onResetData, isResettingData }) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [adminEvents, setAdminEvents] = useState([]);
  const [adminTab, setAdminTab] = useState("runs");
  const [targetEmail, setTargetEmail] = useState("lil.dippel@gmail.com");
  const [statusNote, setStatusNote] = useState("");
  const [forceFreshEmails, setForceFreshEmails] = useState([]);
  const [completionEntries, setCompletionEntries] = useState([]);

  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const hasAdminConfig = hasConfiguredAdminEmails();
  const isAdmin = useMemo(() => isAdminEmail(userEmail), [userEmail]);

  function loadAdminEvents() {
    const events = readOnboardingEvents()
      .slice()
      .reverse()
      .slice(0, 12);
    setAdminEvents(events);
  }

  function refreshAdminState() {
    setForceFreshEmails(readForceFreshEmails());
    setCompletionEntries(listOnboardingCompletionEntries().slice(0, 24));
  }

  function resolveTargetEmail() {
    return normalizeOnboardingEmail(targetEmail);
  }

  function note(message) {
    setStatusNote(message);
  }

  function addTargetForceFresh() {
    const email = resolveTargetEmail();
    if (!email) {
      note("Enter a valid email.");
      return;
    }

    addForceFreshOnboardingEmail(email);
    refreshAdminState();
    note(`Force-fresh onboarding enabled for ${email}.`);
  }

  function removeTargetForceFresh() {
    const email = resolveTargetEmail();
    if (!email) {
      note("Enter a valid email.");
      return;
    }

    if (FORCE_FRESH_EMAIL_DEFAULTS.includes(email)) {
      note(`${email} is in code defaults. Remove it in onboardingState.js.`);
      return;
    }

    removeForceFreshOnboardingEmail(email);
    refreshAdminState();
    note(`Force-fresh onboarding removed for ${email}.`);
  }

  function clearTargetCompletion() {
    const email = resolveTargetEmail();
    if (!email) {
      note("Enter a valid email.");
      return;
    }

    clearOnboardingCompletedAt(email);
    refreshAdminState();
    note(`Completion state cleared for ${email}.`);
  }

  function markTargetCompletedNow() {
    const email = resolveTargetEmail();
    if (!email) {
      note("Enter a valid email.");
      return;
    }

    markOnboardingCompletedAt(email, new Date().toISOString());
    refreshAdminState();
    note(`Completion state set for ${email}.`);
  }

  function targetSummary() {
    const email = resolveTargetEmail();
    if (!email) return null;

    const completedAt = readOnboardingCompletedAt(email);
    const forceFresh = isForceFreshOnboardingEmail(email);

    return {
      email,
      completedAt,
      forceFresh,
    };
  }

  // Check system preference and localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored) {
      setIsDark(stored === "dark");
    } else {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    if (!isAdmin) return;
    loadAdminEvents();
    refreshAdminState();
  }, [isAdmin]);

  const adminStatus = useMemo(() => {
    const hasOnboardingOpen = adminEvents.some(
      (event) => event.type === "onboarding_opened",
    );
    const hasAutoCheckoutTrigger = adminEvents.some(
      (event) => event.type === "pricing_auto_checkout_triggered",
    );
    const hasCheckoutCompleted = adminEvents.some(
      (event) =>
        event.type === "pricing_checkout_event" &&
        event?.payload?.name === "checkout.completed",
    );

    return {
      hasOnboardingOpen,
      hasAutoCheckoutTrigger,
      hasCheckoutCompleted,
    };
  }, [adminEvents]);

  const selectedTarget = useMemo(
    () => targetSummary(),
    [targetEmail, forceFreshEmails, completionEntries],
  );

  function clearAdminEvents() {
    clearOnboardingEvents();
    setAdminEvents([]);
  }

  function openForcedOnboarding() {
    window.location.assign("/onboarding?force=1&source=admin");
  }

  function openForcedPaywall() {
    const returnTo = encodeURIComponent(
      "/dashboard?checkout=success&from=admin-panel",
    );
    window.location.assign(
      `/pricing?autoCheckout=1&source=admin_panel&returnTo=${returnTo}`,
    );
  }

  function openForcedOnboardingPaywallStep() {
    window.location.assign("/onboarding?force=1&source=admin&step=10");
  }

  function formatEventTime(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Account Section */}
      <div className="rounded-2xl bg-white/40 p-5 backdrop-blur-sm dark:bg-white/10">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
          Account
        </p>
        <div className="flex items-center gap-4">
          <UserButton
            afterSignOutUrl={window.location.origin}
            appearance={{
              elements: {
                avatarBox: "w-14 h-14",
              },
            }}
          />
          <div className="flex-1">
            <p className="font-semibold text-black/80 dark:text-white/80">
              {user?.fullName || "User"}
            </p>
            <p className="text-sm text-black/50 dark:text-white/50">
              {user?.primaryEmailAddress?.emailAddress || ""}
            </p>
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="rounded-2xl bg-white/40 p-5 backdrop-blur-sm dark:bg-white/10">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
          Appearance
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-black/5 p-2 dark:bg-white/10">
              {isDark ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5 text-black/60 dark:text-white/60"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5 text-black/60 dark:text-white/60"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                  />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-black/80 dark:text-white/80">
                Dark Mode
              </p>
              <p className="text-xs text-black/40 dark:text-white/40">
                {isDark ? "On" : "Off"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            className={`relative h-7 w-12 rounded-full transition-colors ${isDark ? "bg-green-600" : "bg-black/20 dark:bg-white/20"
              }`}
          >
            <div
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isDark ? "left-6" : "left-1"
                }`}
            />
          </button>
        </div>
      </div>

      {/* Data Section */}
      <div className="rounded-2xl bg-white/40 p-5 backdrop-blur-sm dark:bg-white/10">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
          Data
        </p>
        <button
          onClick={onResetData}
          disabled={isResettingData}
          className="flex w-full items-center justify-between rounded-xl bg-red-50 px-4 py-3 transition-all active:scale-[0.98] disabled:opacity-50 dark:bg-red-900/20"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-2 dark:bg-red-800/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5 text-red-600 dark:text-red-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {isResettingData ? "Resetting..." : "Reset All Data"}
              </p>
              <p className="text-xs text-red-600/60 dark:text-red-400/60">
                Delete all subscriptions
              </p>
            </div>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5 text-red-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>

      {/* About Section */}
      <div className="rounded-2xl bg-white/40 p-5 backdrop-blur-sm dark:bg-white/10">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
          About
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-black/60 dark:text-white/60">Version</p>
            <p className="text-sm font-medium text-black/80 dark:text-white/80">
              1.0.0
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-black/60 dark:text-white/60">
              Made with
            </p>
            <p className="text-sm text-black/80 dark:text-white/80">
              React + Tailwind
            </p>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="rounded-2xl border border-[#d4edff] bg-[#eef8ff]/80 p-5 backdrop-blur-sm dark:border-[#335a75] dark:bg-[#153246]/35">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-black/50 dark:text-white/45">
              Admin Onboarding Control
            </p>
            <img
              src="/mascot-subzro/mascotwinksmile.webp"
              alt="Subzro mascot"
              className="h-8 w-8 rounded-lg bg-white/70 p-1"
            />
          </div>

          <div className="mb-3 grid grid-cols-3 gap-2 rounded-xl bg-white/60 p-1">
            {[
              { id: "runs", label: "Runs" },
              { id: "users", label: "Users" },
              { id: "events", label: "Events" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAdminTab(tab.id)}
                className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${adminTab === tab.id
                  ? "bg-black text-white"
                  : "bg-white/70 text-black/70"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {statusNote && (
            <div className="mb-3 rounded-lg border border-[#cce2f5] bg-white/80 px-3 py-2 text-xs text-black/70">
              {statusNote}
            </div>
          )}

          {adminTab === "runs" && (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={openForcedOnboarding}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black/80 transition hover:bg-white/90"
                >
                  Force onboarding
                </button>
                <button
                  type="button"
                  onClick={openForcedOnboardingPaywallStep}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black/80 transition hover:bg-white/90"
                >
                  Force final step
                </button>
                <button
                  type="button"
                  onClick={openForcedPaywall}
                  className="rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  Force paywall
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setStatusNote("Generating dummy data...");
                      const token = await getToken();
                      const res = await fetch(ApiEndpoints.subscriptions + "/dummy", {
                        method: "POST",
                        headers: {
                          "Authorization": `Bearer ${token}`
                        }
                      });
                      if (res.ok) {
                        setStatusNote("Sexy marketing data generated!");
                        setTimeout(() => window.location.reload(), 1500);
                      } else {
                        setStatusNote("Failed to generate data");
                      }
                    } catch (err) {
                      setStatusNote("Error generating data: " + err.message);
                    }
                  }}
                  className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 shadow-sm"
                >
                  🔥 Populate Sexy Data
                </button>
              </div>

              <div className="rounded-xl border border-white/60 bg-white/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  Smoke Test Status
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-medium ${adminStatus.hasOnboardingOpen
                      ? "bg-green-100 text-green-700"
                      : "bg-black/10 text-black/50"
                      }`}
                  >
                    1. Onboarding opened
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-medium ${adminStatus.hasAutoCheckoutTrigger
                      ? "bg-green-100 text-green-700"
                      : "bg-black/10 text-black/50"
                      }`}
                  >
                    2. Auto checkout triggered
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-medium ${adminStatus.hasCheckoutCompleted
                      ? "bg-green-100 text-green-700"
                      : "bg-black/10 text-black/50"
                      }`}
                  >
                    3. Checkout completed
                  </span>
                </div>
              </div>
            </div>
          )}

          {adminTab === "users" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/60 bg-white/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  Target Email
                </p>
                <div className="mt-2 flex gap-2">
                  <input
                    value={targetEmail}
                    onChange={(event) => setTargetEmail(event.target.value)}
                    placeholder="user@email.com"
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black/80 outline-none focus:border-black/30"
                  />
                  <button
                    type="button"
                    onClick={refreshAdminState}
                    className="rounded-lg bg-black/10 px-3 py-2 text-xs font-semibold text-black/70"
                  >
                    Refresh
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetEmail("lil.dippel@gmail.com")}
                    className="rounded-full border border-black/10 bg-white px-2 py-1 text-[11px] text-black/70"
                  >
                    lil.dippel@gmail.com
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetEmail(userEmail)}
                    className="rounded-full border border-black/10 bg-white px-2 py-1 text-[11px] text-black/70"
                  >
                    current user
                  </button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={addTargetForceFresh}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black/80"
                >
                  Enable fresh onboarding
                </button>
                <button
                  type="button"
                  onClick={removeTargetForceFresh}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black/80"
                >
                  Disable fresh onboarding
                </button>
                <button
                  type="button"
                  onClick={clearTargetCompletion}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black/80"
                >
                  Clear completion state
                </button>
                <button
                  type="button"
                  onClick={markTargetCompletedNow}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black/80"
                >
                  Mark as completed now
                </button>
              </div>

              <div className="rounded-xl border border-white/60 bg-white/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  Target Status
                </p>
                {!selectedTarget ? (
                  <p className="mt-2 text-xs text-black/45">Enter an email to inspect status.</p>
                ) : (
                  <div className="mt-2 space-y-1 text-xs text-black/65">
                    <p>
                      Email: <span className="font-semibold text-black/80">{selectedTarget.email}</span>
                    </p>
                    <p>
                      Force fresh:{" "}
                      <span className="font-semibold text-black/80">
                        {selectedTarget.forceFresh ? "Enabled" : "Disabled"}
                      </span>
                    </p>
                    <p>
                      Completed at:{" "}
                      <span className="font-semibold text-black/80">
                        {selectedTarget.completedAt || "No completion stored"}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/60 bg-white/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  Fresh Onboarding Emails
                </p>
                <div className="mt-2 flex max-h-28 flex-wrap gap-2 overflow-auto">
                  {forceFreshEmails.length === 0 && (
                    <p className="text-xs text-black/45">No overrides configured.</p>
                  )}
                  {forceFreshEmails.map((email) => (
                    <span
                      key={email}
                      className="rounded-full border border-black/10 bg-white px-2 py-1 text-[11px] text-black/70"
                    >
                      {email}
                      {FORCE_FRESH_EMAIL_DEFAULTS.includes(email) ? " (default)" : ""}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/60 bg-white/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  Recent Completion States
                </p>
                <div className="mt-2 max-h-28 space-y-1 overflow-auto">
                  {completionEntries.length === 0 && (
                    <p className="text-xs text-black/45">No completion entries stored.</p>
                  )}
                  {completionEntries.slice(0, 8).map((entry) => (
                    <div
                      key={entry.storageKey}
                      className="rounded-lg border border-black/10 bg-white px-2 py-1 text-[11px] text-black/65"
                    >
                      <span className="font-semibold text-black/80">{entry.email}</span>
                      <span className="ml-2">{entry.completedAt || "No timestamp"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {adminTab === "events" && (
            <div className="rounded-xl border border-white/60 bg-white/70 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  Recent Events
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={loadAdminEvents}
                    className="rounded-md bg-black/10 px-2 py-1 text-[11px] font-semibold text-black/70"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={clearAdminEvents}
                    className="rounded-md bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="max-h-44 space-y-2 overflow-auto">
                {adminEvents.length === 0 && (
                  <p className="text-xs text-black/45">
                    No events yet. Run Force onboarding, then Refresh.
                  </p>
                )}
                {adminEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-lg border border-black/10 bg-white/75 px-2 py-2"
                  >
                    <p className="text-xs font-semibold text-black/75">
                      {event.type}
                    </p>
                    <p className="text-[11px] text-black/45">
                      {formatEventTime(event.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!isAdmin && !hasAdminConfig && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300">
          Admin panel is disabled. Set <code>VITE_ADMIN_EMAILS</code> in
          your Vite env file (for example <code>.env.local</code>) with your
          email.
        </div>
      )}
    </div>
  );
}
