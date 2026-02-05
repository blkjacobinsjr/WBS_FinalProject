import { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/clerk-react";
import eventEmitter from "../utils/EventEmitter";

const COLOR_PRESETS = [
  { id: "rose", color: "#fb7185", label: "Rose" },
  { id: "lavender", color: "#a78bfa", label: "Lavender" },
  { id: "sage", color: "#6ee7b7", label: "Sage" },
  { id: "peach", color: "#fdba74", label: "Peach" },
  { id: "ocean", color: "#38bdf8", label: "Ocean" },
];

export default function SettingsTab({ onResetData, isResettingData }) {
  const { user } = useUser();
  const [isDark, setIsDark] = useState(false);
  const [colorPreset, setColorPreset] = useState("lavender");
  const [grainEnabled, setGrainEnabled] = useState(true);

  // Check system preference and localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored) {
      setIsDark(stored === "dark");
    } else {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    setColorPreset(localStorage.getItem("colorPreset") || "lavender");
    setGrainEnabled(localStorage.getItem("grain") !== "false");
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
    eventEmitter.emit("themeChanged");
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem("colorPreset", colorPreset);
    eventEmitter.emit("themeChanged");
  }, [colorPreset]);

  useEffect(() => {
    localStorage.setItem("grain", grainEnabled);
    eventEmitter.emit("themeChanged");
  }, [grainEnabled]);

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Account Section */}
      <div className="rounded-2xl bg-white/40 p-5 backdrop-blur-sm dark:bg-white/10">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
          Account
        </p>
        <div className="flex items-center gap-4">
          <UserButton
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

        {/* Color Preset Swatches */}
        <div className="mb-5">
          <p className="mb-3 text-sm font-medium text-black/80 dark:text-white/80">
            Theme Color
          </p>
          <div className="flex gap-3">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setColorPreset(preset.id)}
                className={`h-10 w-10 rounded-full transition-all ${
                  colorPreset === preset.id
                    ? "ring-2 ring-offset-2 ring-black/30 dark:ring-white/50 scale-110"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: preset.color }}
                aria-label={preset.label}
              />
            ))}
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between mb-4">
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
            <p className="text-sm font-medium text-black/80 dark:text-white/80">
              Dark Mode
            </p>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              isDark ? "bg-green-600" : "bg-black/20 dark:bg-white/20"
            }`}
          >
            <div
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                isDark ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Grain Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-black/5 p-2 dark:bg-white/10">
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
                  d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-black/80 dark:text-white/80">
              Texture
            </p>
          </div>
          <button
            onClick={() => setGrainEnabled(!grainEnabled)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              grainEnabled ? "bg-green-600" : "bg-black/20 dark:bg-white/20"
            }`}
          >
            <div
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                grainEnabled ? "left-6" : "left-1"
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
    </div>
  );
}
