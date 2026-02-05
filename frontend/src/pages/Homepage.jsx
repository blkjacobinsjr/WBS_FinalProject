import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

export default function Homepage() {
  const features = [
    { icon: "✨", title: "Reclaim Your Money", description: "Discover subscriptions silently draining your account." },
    { icon: "🎯", title: "Crystal Clear Overview", description: "Every subscription, one beautiful dashboard." },
    { icon: "💜", title: "Insights That Empower", description: "Keep what sparks joy, release what doesn't." },
  ];

  const stats = [
    { value: "€2,400", label: "spent yearly on subscriptions" },
    { value: "40%", label: "goes to forgotten services" },
    { value: "3 min", label: "to see your full picture" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/subzero_logo_icon.png" alt="Subzro" className="h-7 w-7" />
            <span className="text-lg font-semibold text-black/80 dark:text-white/80">subzro</span>
          </Link>
          <div className="flex items-center gap-3">
            <SignedOut>
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-black/70 hover:text-black dark:text-white/70">Sign in</Link>
              <Link to="/signup" className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black">Get Started</Link>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard" className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black">Dashboard</Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex min-h-[85vh] flex-col items-center justify-center px-4 pt-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/60 px-4 py-1.5 dark:border-purple-800 dark:bg-white/5">
            <span className="text-xs">❄️</span>
            <span className="text-xs font-medium text-purple-900/80 dark:text-purple-200">Smart women know where their money goes</span>
          </div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight text-black/90 sm:text-5xl md:text-6xl dark:text-white">
            Zero in on What Matters
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-lg text-black/60 dark:text-white/60">
            Elevate essentials. Freeze out the waste.<br className="hidden sm:block" />
            Take control of every subscription in one beautiful dashboard.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/signup" className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-purple-500/25">
              Start Free — No Card Needed
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-6 py-3 text-sm font-medium text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
              I have an account →
            </Link>
          </div>

          <div className="relative mt-12">
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white/40 p-2 shadow-2xl dark:border-white/10 dark:bg-black/20">
              <img src="/Dashboardbgbrowsertilt.png" alt="Subzro Dashboard" className="w-full rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <div key={i} className="rounded-2xl border border-black/5 bg-white/50 p-6 text-center dark:border-white/10 dark:bg-white/5">
              <p className="text-3xl font-bold text-black/90 dark:text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-black/50 dark:text-white/50">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-3 text-center text-3xl font-bold text-black/90 dark:text-white">Your Money, Your Rules</h2>
          <p className="mb-12 text-center text-black/60 dark:text-white/60">The average person has 12 subscriptions. How many of yours truly spark joy?</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="rounded-2xl border border-black/5 bg-white/50 p-6 dark:border-white/10 dark:bg-white/5">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 text-2xl dark:from-purple-900/50 dark:to-pink-900/50">{f.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-black/90 dark:text-white">{f.title}</h3>
                <p className="text-sm text-black/60 dark:text-white/60">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nudge */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-purple-600/80 dark:text-purple-400">The Gentle Nudge</p>
          <h2 className="text-4xl font-bold text-black/90 sm:text-5xl dark:text-white">"Are you still using this?"</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-black/60 dark:text-white/60">
            Inspired by Netflix's "still watching?" prompt, Subzro gently checks in on your subscriptions.
          </p>
          <div className="mx-auto mt-12 max-w-sm overflow-hidden rounded-2xl border border-black/10 bg-white/60 p-1 shadow-xl dark:border-white/10 dark:bg-white/5">
            <img src="/ReminderModalplain.png" alt="Usage reminder" className="w-full rounded-xl" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="rounded-3xl border border-purple-200/50 bg-gradient-to-br from-purple-50 to-pink-50 p-8 sm:p-12 dark:border-purple-800/30 dark:from-purple-950/50 dark:to-pink-950/50">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 dark:bg-purple-900/50">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Free forever for personal use</span>
            </div>
            <h2 className="text-3xl font-bold text-black/90 dark:text-white">Your future self will thank you</h2>
            <p className="mx-auto mt-4 max-w-md text-black/60 dark:text-white/60">See your full picture in under 3 minutes.</p>
            <div className="mt-8">
              <Link to="/signup" className="inline-flex items-center rounded-full bg-black px-8 py-4 text-base font-semibold text-white shadow-lg dark:bg-white dark:text-black">
                Get Started Free →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 py-8 px-4 dark:border-white/10">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/subzero_logo_icon.png" alt="Subzro" className="h-5 w-5 opacity-60" />
            <span className="text-sm text-black/40 dark:text-white/40">© 2025 Subzro</span>
          </div>
          <p className="text-xs text-black/40 dark:text-white/40">Made with 💜 for women who know their worth</p>
        </div>
      </footer>
    </div>
  );
}
