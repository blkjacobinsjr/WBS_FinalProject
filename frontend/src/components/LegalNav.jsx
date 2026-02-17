import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const labels = {
  en: {
    imprint: "Imprint",
    terms: "Terms",
    privacy: "Privacy",
    refund: "Refunds",
    signIn: "Sign in",
    getStarted: "Get Started",
    dashboard: "Dashboard",
    menu: "Menu",
    close: "Close menu",
  },
  de: {
    imprint: "Impressum",
    terms: "AGB",
    privacy: "Datenschutz",
    refund: "Erstattung",
    signIn: "Anmelden",
    getStarted: "Starten",
    dashboard: "Dashboard",
    menu: "Menue",
    close: "Menue schliessen",
  },
};

export default function LegalNav({ lang = "en", onLangChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const t = labels[lang] ?? labels.en;

  const legalLinks = useMemo(
    () => [
      { to: "/impressum", label: t.imprint },
      { to: "/terms", label: t.terms },
      { to: "/privacy", label: t.privacy },
      { to: "/refund", label: t.refund },
    ],
    [t],
  );

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function langButton(code, label) {
    const active = lang === code;
    return (
      <button
        type="button"
        onClick={() => onLangChange(code)}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
          active
            ? "bg-black text-white"
            : "bg-white/50 text-black/70 hover:bg-white/70"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/20 bg-white/40 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/subzero_logo_icon.png" alt="Subzro" className="h-7 w-7" />
          <span className="text-lg font-semibold text-black/80">subzro</span>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          {legalLinks.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`text-sm font-medium transition ${
                  active ? "text-black" : "text-black/70 hover:text-black"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {langButton("en", "EN")}
          {langButton("de", "DE")}
          <SignedOut>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-black/70 transition hover:text-black"
            >
              {t.signIn}
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              {t.getStarted}
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              to="/dashboard"
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              {t.dashboard}
            </Link>
            <UserButton afterSignOutUrl={window.location.origin} />
          </SignedIn>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {langButton("en", "EN")}
          {langButton("de", "DE")}
          <button
            type="button"
            aria-label={menuOpen ? t.close : t.menu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="grid h-9 w-9 place-content-center rounded-full bg-white/60 transition hover:bg-white/80"
          >
            <span
              className={`block h-[2px] w-4 bg-black transition duration-200 ${
                menuOpen ? "translate-y-[4px] rotate-45" : ""
              }`}
            />
            <span
              className={`mt-[4px] block h-[2px] w-4 bg-black transition duration-200 ${
                menuOpen ? "-translate-y-[2px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      <div
        className={`mx-4 overflow-hidden rounded-b-2xl border border-white/20 bg-white/65 backdrop-blur-md transition-all duration-200 md:hidden ${
          menuOpen ? "max-h-80 py-3 opacity-100" : "max-h-0 py-0 opacity-0"
        }`}
      >
        <div className="space-y-1 px-3">
          {legalLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="block rounded-xl px-3 py-2 text-sm font-medium text-black/80 transition hover:bg-white/60"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="mt-2 border-t border-white/30 px-3 pt-2">
          <SignedOut>
            <Link
              to="/login"
              className="block rounded-xl px-3 py-2 text-sm font-medium text-black/80 transition hover:bg-white/60"
            >
              {t.signIn}
            </Link>
            <Link
              to="/signup"
              className="mt-1 block rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white"
            >
              {t.getStarted}
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              to="/dashboard"
              className="block rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white"
            >
              {t.dashboard}
            </Link>
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
