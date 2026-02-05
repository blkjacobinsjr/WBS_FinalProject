import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BackgroundGradientAnimation } from "../components/ui/background-gradient-animation";
import BlurText from "../components/ui/BlurText";
import FadeIn from "../components/ui/FadeIn";

export default function Homepage() {
  const [isDark, setIsDark] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  useEffect(() => {
    // Check system preference
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(darkQuery.matches);

    const handler = (e) => setIsDark(e.matches);
    darkQuery.addEventListener("change", handler);
    return () => darkQuery.removeEventListener("change", handler);
  }, []);

  const gradientColors = isDark
    ? {
        start: "rgb(15, 23, 42)",
        end: "rgb(30, 27, 75)",
        c1: "88, 28, 135",
        c2: "67, 56, 202",
        c3: "79, 70, 229",
        c4: "109, 40, 217",
        c5: "99, 102, 241",
      }
    : {
        start: "rgb(250, 245, 255)",
        end: "rgb(239, 246, 255)",
        c1: "168, 85, 247",
        c2: "236, 72, 153",
        c3: "96, 165, 250",
        c4: "192, 132, 252",
        c5: "244, 114, 182",
      };

  const features = [
    {
      icon: "✨",
      title: "Reclaim Your Money",
      description: "Discover subscriptions silently draining your account — and take back what's yours.",
    },
    {
      icon: "🎯",
      title: "Crystal Clear Overview",
      description: "Every subscription, one beautiful dashboard. Finally, the full picture.",
    },
    {
      icon: "💜",
      title: "Insights That Empower",
      description: "Smart recommendations tailored to your life — keep what sparks joy, release what doesn't.",
    },
  ];

  const stats = [
    { value: "€2,400", label: "spent yearly on subscriptions", subtext: "That's a weekend getaway" },
    { value: "40%", label: "goes to forgotten services", subtext: "Money you deserve back" },
    { value: "3 min", label: "to see your full picture", subtext: "Start now, thank yourself later" },
  ];

  return (
    <BackgroundGradientAnimation
      gradientBackgroundStart={gradientColors.start}
      gradientBackgroundEnd={gradientColors.end}
      firstColor={gradientColors.c1}
      secondColor={gradientColors.c2}
      thirdColor={gradientColors.c3}
      fourthColor={gradientColors.c4}
      fifthColor={gradientColors.c5}
      pointerColor={gradientColors.c1}
      interactive={true}
      containerClassName="!fixed !inset-0"
    >
      <div className="relative z-10 min-h-screen">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/60 backdrop-blur-xl dark:bg-black/40">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/subzero_logo_icon.png" alt="Subzro" className="h-7 w-7" />
              <span className="text-lg font-semibold text-black/80 dark:text-white/80">
                subzro
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <SignedOut>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-black/70 transition-colors hover:text-black dark:text-white/70 dark:hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-all hover:bg-black/80 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  Get Started
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  to="/dashboard"
                  className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-all hover:bg-black/80 active:scale-95 dark:bg-white dark:text-black"
                >
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <motion.section
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="flex min-h-screen flex-col items-center justify-center px-4 pt-14"
        >
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <FadeIn delay={0}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-200/50 bg-white/60 px-4 py-1.5 backdrop-blur-sm dark:border-purple-500/30 dark:bg-white/10">
                <span className="text-xs">❄️</span>
                <span className="text-xs font-medium text-purple-900/80 dark:text-purple-200">
                  Smart women know where their money goes
                </span>
              </div>
            </FadeIn>

            {/* Main Headline */}
            <BlurText
              text="Zero in on What Matters"
              delay={80}
              className="mb-4 justify-center text-4xl font-bold tracking-tight text-black/90 sm:text-5xl md:text-6xl dark:text-white"
              animateBy="words"
            />

            {/* Subheadline */}
            <FadeIn delay={0.4}>
              <p className="mx-auto mb-8 max-w-xl text-lg text-black/60 dark:text-white/60">
                Elevate essentials. Freeze out the waste.
                <br className="hidden sm:block" />
                Take control of every subscription in one beautiful dashboard.
              </p>
            </FadeIn>

            {/* CTA Buttons */}
            <FadeIn delay={0.6}>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  to="/signup"
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-purple-500/25 active:scale-95"
                >
                  <span className="relative z-10">Start Free — No Card Needed</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-6 py-3 text-sm font-medium text-black/70 backdrop-blur-sm transition-all hover:bg-white/80 active:scale-95 dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                >
                  <span>I have an account</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </FadeIn>

            {/* Hero Image */}
            <FadeIn delay={0.8} direction="up" distance={40}>
              <motion.div
                className="relative mt-12"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-2xl" />
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-xl" />
                <div className="relative overflow-hidden rounded-2xl border border-white/30 bg-white/60 p-2 shadow-2xl shadow-purple-500/20 backdrop-blur-sm dark:border-white/20 dark:bg-black/40">
                  <img
                    src="/Dashboardbgbrowsertilt.png"
                    alt="Subzro Dashboard"
                    className="w-full rounded-xl"
                  />
                </div>
              </motion.div>
            </FadeIn>

            {/* Scroll Indicator */}
            <FadeIn delay={1.2}>
              <motion.div
                className="mt-12 flex flex-col items-center gap-2"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-xs text-black/40 dark:text-white/40">Scroll to explore</span>
                <svg className="h-5 w-5 text-black/30 dark:text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </motion.div>
            </FadeIn>
          </div>
        </motion.section>

        {/* Stats Section */}
        <section className="py-20 px-4">
          <div className="mx-auto max-w-4xl">
            <FadeIn>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="rounded-2xl border border-white/30 bg-white/50 p-6 text-center shadow-lg shadow-purple-500/5 backdrop-blur-sm transition-all hover:shadow-xl hover:shadow-purple-500/10 dark:border-white/20 dark:bg-white/10"
                  >
                    <p className="text-3xl font-bold text-black/90 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-xs font-medium text-purple-600/80 dark:text-purple-400/80">
                      {stat.subtext}
                    </p>
                  </motion.div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="mx-auto max-w-4xl">
            <FadeIn>
              <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold text-black/90 dark:text-white">
                  Your Money, Your Rules
                </h2>
                <p className="mt-3 text-black/60 dark:text-white/60">
                  The average person has 12 subscriptions. How many of yours truly spark joy?
                </p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
                  className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/50 p-6 shadow-lg shadow-purple-500/5 backdrop-blur-sm transition-all hover:border-purple-300/40 hover:shadow-xl hover:shadow-purple-500/10 dark:border-white/20 dark:bg-white/10 dark:hover:border-purple-500/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 text-2xl dark:from-purple-900/50 dark:to-pink-900/50">
                      {feature.icon}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-black/90 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-black/60 dark:text-white/60">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Question Section */}
        <section className="py-20 px-4">
          <div className="mx-auto max-w-3xl text-center">
            <FadeIn>
              <p className="mb-4 text-sm font-medium uppercase tracking-wider text-purple-600/80 dark:text-purple-400">
                The Gentle Nudge
              </p>
              <h2 className="text-4xl font-bold text-black/90 sm:text-5xl dark:text-white">
                "Are you still using this?"
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg text-black/60 dark:text-white/60">
                Inspired by Netflix's "still watching?" prompt, Subzro gently checks in
                on your subscriptions. Sometimes, a simple question is all it takes to
                reclaim hundreds.
              </p>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="relative mt-12">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl" />
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-lg" />
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="relative mx-auto max-w-sm overflow-hidden rounded-2xl border border-white/30 bg-white/70 p-1 shadow-2xl shadow-purple-500/20 backdrop-blur-sm dark:border-white/20 dark:bg-white/10"
                >
                  <img
                    src="/ReminderModalplain.png"
                    alt="Usage reminder"
                    className="w-full rounded-xl"
                  />
                </motion.div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 px-4">
          <div className="mx-auto max-w-2xl text-center">
            <FadeIn>
              <div className="rounded-3xl border border-white/30 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-purple-500/10 p-8 shadow-xl shadow-purple-500/10 backdrop-blur-sm sm:p-12">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Free forever for personal use</span>
                </div>
                <h2 className="text-3xl font-bold text-black/90 dark:text-white">
                  Your future self will thank you
                </h2>
                <p className="mx-auto mt-4 max-w-md text-black/60 dark:text-white/60">
                  Every day you wait is another day of silent charges.
                  <br />See your full picture in under 3 minutes.
                </p>
                <div className="mt-8">
                  <Link
                    to="/signup"
                    className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-black px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-95 dark:bg-white dark:text-black"
                  >
                    <span>Get Started Free</span>
                    <motion.svg
                      className="ml-2 h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      initial={{ x: 0 }}
                      whileHover={{ x: 4 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </motion.svg>
                  </Link>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12 px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <p className="text-sm font-medium text-black/60 dark:text-white/60">
                Trusted by women who value financial clarity
              </p>
              <div className="mt-4 flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-2 text-sm text-black/50 dark:text-white/50">
                  4.9/5 from early users
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
              <div className="flex items-center gap-2">
                <img src="/subzero_logo_icon.png" alt="Subzro" className="h-5 w-5 opacity-60" />
                <span className="text-sm text-black/40 dark:text-white/40">
                  © 2025 Subzro
                </span>
              </div>
              <p className="text-xs text-black/40 dark:text-white/40">
                Made with 💜 for women who know their worth
              </p>
            </div>
          </div>
        </footer>
      </div>
    </BackgroundGradientAnimation>
  );
}
