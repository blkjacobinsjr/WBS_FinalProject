import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import FadeIn from "../components/ui/FadeIn";
import Grainient from "../components/ui/Grainient";
import { logOnboardingEvent } from "../utils/onboardingDebug";

const PADDLE_SCRIPT_ID = "paddle-js-v2";
let paddleBootPromise = null;
let paddleInitialized = false;

function MatchaCupIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path
        d="M16 20H44V38C44 45.732 37.732 52 30 52C22.268 52 16 45.732 16 38V20Z"
        fill="#A7FFD6"
        stroke="#315C4B"
        strokeWidth="2"
      />
      <path
        d="M44 24H49C53.418 24 57 27.582 57 32C57 36.418 53.418 40 49 40H44"
        stroke="#315C4B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 16C20 16 22 14 24 16C26 18 28 18 30 16"
        stroke="#315C4B"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function loadPaddleScript() {
  if (window.Paddle) return Promise.resolve(window.Paddle);

  if (paddleBootPromise) return paddleBootPromise;

  paddleBootPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(PADDLE_SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Paddle), {
        once: true,
      });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Paddle script")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = PADDLE_SCRIPT_ID;
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => resolve(window.Paddle);
    script.onerror = () => reject(new Error("Failed to load Paddle script"));
    document.head.appendChild(script);
  });

  return paddleBootPromise;
}

async function initializePaddle(clientToken, environment, eventCallback) {
  if (!clientToken) {
    throw new Error("Missing VITE_PADDLE_CLIENT_TOKEN");
  }

  await loadPaddleScript();

  if (!window.Paddle) {
    throw new Error("Paddle is unavailable");
  }

  if (environment === "sandbox") {
    window.Paddle.Environment.set("sandbox");
  }

  if (!paddleInitialized) {
    window.Paddle.Initialize({
      token: clientToken,
      eventCallback,
    });
    paddleInitialized = true;
  }
}

export default function PricingPage() {
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const [isPaddleReady, setIsPaddleReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const autoCheckoutRef = useRef(false);

  const paddleClientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
  const paddlePriceId = import.meta.env.VITE_PADDLE_PRICE_ID_MATCHA_MONTHLY;
  const paddleEnvironment = import.meta.env.VITE_PADDLE_ENV || "sandbox";
  const autoCheckout = searchParams.get("autoCheckout") === "1";
  const checkoutSource = searchParams.get("source") || "subzro_pricing";
  const returnTo = searchParams.get("returnTo");
  const successPath =
    returnTo && returnTo.startsWith("/")
      ? returnTo
      : "/dashboard?checkout=success";
  const checkoutSuccessUrl = `${window.location.origin}${successPath}`;

  useEffect(() => {
    let cancelled = false;

    logOnboardingEvent("pricing_opened", {
      autoCheckout,
      source: checkoutSource,
    });

    initializePaddle(paddleClientToken, paddleEnvironment, (event) => {
      if (cancelled) return;
      if (
        event?.name === "checkout.closed" ||
        event?.name === "checkout.completed" ||
        event?.name === "checkout.payment.failed"
      ) {
        setIsLoading(false);
        logOnboardingEvent("pricing_checkout_event", {
          name: event?.name,
          source: checkoutSource,
        });
      }
    })
      .then(() => {
        if (!cancelled) setIsPaddleReady(true);
        logOnboardingEvent("pricing_paddle_ready", { source: checkoutSource });
      })
      .catch((error) => {
        console.error("[PADDLE_INIT_ERROR]", error);
        if (!cancelled) setIsPaddleReady(false);
        logOnboardingEvent("pricing_paddle_init_failed", {
          source: checkoutSource,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [autoCheckout, checkoutSource, paddleClientToken, paddleEnvironment]);

  const openCheckout = useCallback(() => {
    if (!paddlePriceId) {
      toast.error("Pricing is not configured yet.");
      return;
    }

    if (!window.Paddle || !isPaddleReady) {
      toast.error("Checkout is still loading. Try again.");
      return;
    }

    setIsLoading(true);
    logOnboardingEvent("pricing_checkout_open_attempt", {
      source: checkoutSource,
      autoCheckout,
    });

    try {
      const email = user?.primaryEmailAddress?.emailAddress;

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: email ? { email } : undefined,
        customData: {
          source: checkoutSource,
          userId: user?.id ?? null,
        },
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: "en",
          successUrl: checkoutSuccessUrl,
        },
      });
    } catch (error) {
      console.error("[PADDLE_CHECKOUT_ERROR]", error);
      setIsLoading(false);
      toast.error("Could not start checkout.");
    }
  }, [
    checkoutSource,
    checkoutSuccessUrl,
    isPaddleReady,
    paddlePriceId,
    user?.id,
    user?.primaryEmailAddress?.emailAddress,
  ]);

  useEffect(() => {
    if (!autoCheckout) return;
    if (!isPaddleReady) return;
    if (isLoading) return;
    if (autoCheckoutRef.current) return;
    autoCheckoutRef.current = true;
    logOnboardingEvent("pricing_auto_checkout_triggered", {
      source: checkoutSource,
    });
    openCheckout();
  }, [autoCheckout, isLoading, isPaddleReady, openCheckout]);

  return (
    <div className="relative min-h-screen bg-[#edf6ff]">
      <div className="fixed inset-0 -z-20">
        <Grainient />
      </div>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#8dd7ff]/45 blur-3xl" />
        <div className="absolute bottom-8 right-0 h-56 w-56 rounded-full bg-[#9dffb2]/35 blur-3xl" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/30 bg-white/45 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/subzero_logo_icon.png" alt="Subzro" className="h-7 w-7" />
            <span className="text-lg font-semibold text-black/80">subzro</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/pricing"
              className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-black/70"
            >
              Matcha Plan
            </Link>
            <SignedOut>
              <Link to="/login" className="px-3 py-2 text-sm font-medium text-black/70 hover:text-black">
                Sign in
              </Link>
              <Link to="/signup" className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
                Get Started
              </Link>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard" className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
                Dashboard
              </Link>
              <UserButton afterSignOutUrl={window.location.origin} />
            </SignedIn>
          </div>
        </div>
      </nav>

      <main className="px-4 pb-16 pt-8">
        <div className="mx-auto max-w-2xl">
          <FadeIn delay={0}>
            <div className="mb-5 inline-flex items-center rounded-full border border-white/60 bg-white/55 px-4 py-1.5 text-xs font-semibold text-black/70 backdrop-blur-sm">
              Simple monthly pricing
            </div>
          </FadeIn>

          <FadeIn delay={0.08}>
            <section className="overflow-hidden rounded-3xl border border-white/45 bg-white/60 p-6 shadow-xl backdrop-blur-md sm:p-8">
              <div className="mb-5">
                <h1 className="text-3xl font-bold tracking-tight text-black/90 sm:text-4xl">
                  Matcha Plan
                </h1>
                <p className="mt-2 text-sm text-black/65 sm:text-base">
                  One clean subscription for full access. No setup complexity.
                </p>
                {checkoutSource === "subzro_onboarding" && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#d7f0ff] bg-[#eef9ff] px-3 py-1.5 text-xs font-semibold text-black/70">
                    <img
                      src="/mascot-subzro/mascotwink.webp"
                      alt="Subzro mascot"
                      className="mascot-blink h-5 w-5"
                    />
                    Final onboarding step
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/55 bg-white/70 p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-black/55">
                      Monthly
                    </p>
                    <p className="mt-1 text-4xl font-bold text-black/90">$4.99</p>
                    <p className="text-sm text-black/60">per month</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#a7ffd6] to-[#ffe8b6] px-3 py-1.5 text-xs font-semibold text-black/70">
                    <img
                      src="/mascot-subzro/mascotmove7.webp"
                      alt=""
                      className="mascot-slide h-5 w-5"
                    />
                    Matcha money
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-[#d6f5e5] bg-[#f6fff9] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <MatchaCupIcon className="h-6 w-6 transition-transform duration-200 hover:scale-110" />
                      <MatchaCupIcon className="h-6 w-6 opacity-75 transition-transform duration-200 hover:scale-110" />
                      <MatchaCupIcon className="h-6 w-6 opacity-60 transition-transform duration-200 hover:scale-110" />
                    </div>
                    <p className="text-xs font-medium text-black/70 sm:text-sm">
                      About the price of one cafe matcha each month.
                    </p>
                  </div>
                </div>

                <ul className="mt-4 space-y-2 text-sm text-black/75">
                  <li>Unlimited subscription tracking</li>
                  <li>Usage insights and savings prompts</li>
                  <li>Cancel-link helper and reminders</li>
                  <li>Export and clean import support</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={openCheckout}
                disabled={isLoading || !isPaddleReady}
                className="mt-6 w-full rounded-full bg-gradient-to-r from-[#42d587] via-[#6ce0b8] to-[#ffbd67] px-6 py-4 text-base font-semibold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {isLoading && (
                    <img
                      src="/mascot-subzro/mascotmove3.webp"
                      alt=""
                      className="mascot-slide h-6 w-6"
                    />
                  )}
                  {isLoading
                    ? "Opening checkout..."
                    : "Subscribe for $4.99/month"}
                </span>
              </button>

              <p className="mt-3 text-center text-xs text-black/55">
                Secure checkout powered by Paddle.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-black/55">
                <Link to="/impressum" className="hover:text-black/80">Impressum</Link>
                <Link to="/terms" className="hover:text-black/80">Terms</Link>
                <Link to="/privacy" className="hover:text-black/80">Privacy</Link>
                <Link to="/refund" className="hover:text-black/80">Refunds</Link>
              </div>
            </section>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
