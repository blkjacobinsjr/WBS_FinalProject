import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import Grainient from "../components/ui/Grainient";

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
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10">
        <Grainient />
      </div>
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/20 bg-white/40 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/subzero_logo_icon.png" alt="Subzro" className="h-7 w-7" />
            <span className="text-lg font-semibold text-black/80">subzro</span>
          </Link>
          <div className="flex items-center gap-3">
            <SignedOut>
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-black/70 hover:text-black">Sign in</Link>
              <Link to="/signup" className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">Get Started</Link>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard" className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">Dashboard</Link>
              <UserButton afterSignOutUrl={window.location.origin} />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex min-h-[85vh] flex-col items-center justify-center px-4 pt-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-4 py-1.5 backdrop-blur-sm">
            <span className="text-xs">❄️</span>
            <span className="text-xs font-medium text-purple-900">Smart women know where their money goes</span>
          </div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight text-black/90 sm:text-5xl md:text-6xl">
            Zero in on What Matters
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-lg text-black/70">
            Elevate essentials. Freeze out the waste.<br className="hidden sm:block" />
            Take control of every subscription in one beautiful dashboard.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/signup" className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-purple-500/25">
              Start Free — No Card Needed
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-6 py-3 text-sm font-medium text-black/70 backdrop-blur-sm">
              I have an account →
            </Link>
          </div>

          <div className="relative mt-12">
            <div className="overflow-hidden rounded-2xl border border-white/30 bg-white/30 p-2 shadow-2xl backdrop-blur-sm">
              <img src="/Dashboardbgbrowsertilt.png" alt="Subzro Dashboard" className="w-full rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <div key={i} className="rounded-2xl border border-white/30 bg-white/40 p-6 text-center backdrop-blur-sm">
              <p className="text-3xl font-bold text-black/90">{stat.value}</p>
              <p className="mt-1 text-sm text-black/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-3 text-center text-3xl font-bold text-black/90">Your Money, Your Rules</h2>
          <p className="mb-12 text-center text-black/60">The average person has 12 subscriptions. How many of yours truly spark joy?</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="rounded-2xl border border-white/30 bg-white/40 p-6 backdrop-blur-sm">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/60 text-2xl">{f.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-black/90">{f.title}</h3>
                <p className="text-sm text-black/60">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nudge */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-purple-800">The Gentle Nudge</p>
          <h2 className="text-4xl font-bold text-black/90 sm:text-5xl">"Are you still using this?"</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-black/60">
            Inspired by Netflix's "still watching?" prompt, Subzro gently checks in on your subscriptions.
          </p>
          <div className="mx-auto mt-12 max-w-sm overflow-hidden rounded-2xl border border-white/30 bg-white/40 p-1 shadow-xl backdrop-blur-sm">
            <img src="/ReminderModalplain.png" alt="Usage reminder" className="w-full rounded-xl" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="rounded-3xl border border-white/30 bg-white/40 p-8 sm:p-12 backdrop-blur-sm">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-purple-800">Free forever for personal use</span>
            </div>
            <h2 className="text-3xl font-bold text-black/90">Your future self will thank you</h2>
            <p className="mx-auto mt-4 max-w-md text-black/60">See your full picture in under 3 minutes.</p>
            <div className="mt-8">
              <Link to="/signup" className="inline-flex items-center rounded-full bg-black px-8 py-4 text-base font-semibold text-white shadow-lg">
                Get Started Free →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/20 py-8 px-4">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/subzero_logo_icon.png" alt="Subzro" className="h-5 w-5 opacity-60" />
            <span className="text-sm text-black/50">© 2025 Subzro</span>
          </div>
          <p className="text-xs text-black/50">Made with 💜 for women who know their worth</p>
        </div>
      </footer>
    </div>
  );
}
