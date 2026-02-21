import { SignedIn, UserButton, useUser } from "@clerk/clerk-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ShieldCheckIcon, SparklesIcon, StarIcon, BanknotesIcon } from '@heroicons/react/24/solid';
import Grainient from "../components/ui/Grainient";
import { logOnboardingEvent } from "../utils/onboardingDebug";

const PADDLE_SCRIPT_ID = "paddle-js-v2";
let paddleBootPromise = null;
let paddleInitialized = false;

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
        if (error.message.includes("Missing VITE_PADDLE")) {
          console.warn("Payment disabled (Missing VITE_PADDLE_CLIENT_TOKEN). Add this to your .env to test checkout locally.");
        } else {
          console.error("[PADDLE_INIT_ERROR]", error);
        }
        if (!cancelled) setIsPaddleReady(false);
        logOnboardingEvent("pricing_paddle_init_failed", {
          source: checkoutSource,
          reason: error.message
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
    autoCheckout,
    checkoutSource,
    checkoutSuccessUrl,
    isPaddleReady,
    paddlePriceId,
    user?.id,
    user?.primaryEmailAddress?.emailAddress,
  ]);

  return (
    <div className="relative min-h-[100dvh] bg-[#F4F6F9] overflow-x-hidden selection:bg-[#007AFF]/20 pb-[140px] flex flex-col items-center">
      <div className="fixed inset-0 pointer-events-none">
        <Grainient />
      </div>
      <div className="fixed inset-0 -z-10 bg-white/40" />
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[#8dd7ff]/40 blur-[80px]" />
        <div className="absolute top-40 -left-20 h-64 w-64 rounded-full bg-[#007AFF]/20 blur-[90px]" />
        <div className="absolute top-1/2 right-[-20%] h-80 w-80 rounded-full bg-[#42D587]/30 blur-[100px]" />
      </div>

      <nav className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-white/50 hidden md:block px-4">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/subzero_logo_icon.png" alt="Subzro" className="h-7 w-7" />
            <span className="text-lg font-semibold text-black/80">subzro</span>
          </Link>
          <div className="flex items-center gap-3">
            <SignedIn>
              <Link to="/dashboard" className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
                Dashboard
              </Link>
              <UserButton afterSignOutUrl={window.location.origin} />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Main minimal mobile topbar for context returning */}
      <div className="md:hidden flex h-14 px-6 items-center justify-between w-full z-40 relative mt-2">
        <Link to="/" className="flex items-center gap-2">
          <img src="/subzero_logo_icon.png" alt="Subzro" className="h-6 w-6" />
          <span className="text-[17px] font-semibold tracking-tight text-black flex items-center gap-2">
            subzro
            <span className="inline-flex items-center gap-1 rounded bg-[#f4fbf7] border border-[#42D587]/20 px-1.5 py-0.5 text-[9px] uppercase tracking-widest font-bold text-[#2e945c] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              Matcha Plan
            </span>
          </span>
        </Link>
      </div>

      <main className="mx-auto w-full max-w-[420px] px-4 pt-4 sm:pt-14 flex flex-col items-center animate-in fade-in duration-500">
        {/* Before & After Split Chart Card */}
        <div className="relative z-10 w-full max-w-[360px] overflow-visible rounded-[28px] border border-white/80 bg-white/60 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.06),0_0_20px_rgba(255,255,255,0.7)] backdrop-blur-[24px] mb-8">

          {/* Mascot in the middle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none drop-shadow-lg flex items-center justify-center bg-white/60 backdrop-blur-xl rounded-[16px] w-[56px] h-[56px] border border-white shadow-lg overflow-hidden">
            <img src="/mascot-subzro/mascotlaugh.webp" alt="Subzro Mascot" className="w-[48px] h-[48px] object-cover drop-shadow-sm scale-110 mt-1" />
          </div>

          <div className="flex w-full">
            {/* Before Section */}
            <div className="flex flex-1 flex-col pt-7 pb-6 pl-5 pr-4 border-r border-[#0000000A]">
              <div className="mb-6 flex flex-col justify-center text-center items-center">
                <span className="text-[17px] leading-none font-normal text-black/50 tracking-tight">Before</span>
                <div className="flex items-center mt-1">
                  <span className="text-[20px] font-semibold tracking-tight text-black opacity-90">Subzro</span>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="relative w-full rounded-[16px] bg-black/[0.025] border border-black/[0.04] p-2.5 pb-2 shadow-inner">
                <div className="mb-[18px]">
                  <p className="text-[8.5px] font-bold tracking-[0.06em] uppercase text-black/40 mb-[-2px]">Monthly Spends</p>
                  <div className="flex items-baseline gap-[1px]">
                    <span className="text-[22px] font-bold text-black/85 tracking-tighter leading-none">$239</span><span className="text-[11px] font-bold text-black/40">.00</span>
                  </div>
                </div>

                {/* Bars */}
                <div className="relative flex h-[78px] w-full items-end justify-between px-1 gap-[2px]">
                  {/* dashed line */}
                  <div className="absolute bottom-[20%] left-0 right-0 border-t border-dashed border-black/10 z-0"></div>

                  <div className="relative z-10 flex h-[85%] w-[18%] flex-col justify-end gap-[1px]">
                    <div className="h-[25%] w-full rounded-t-[2px] bg-[#FF7F7F]"></div>
                    <div className="h-[35%] w-full bg-[#FFBC6B]"></div>
                    <div className="h-[20%] w-full rounded-b-[2px] bg-[#A4A4A4]"></div>
                  </div>
                  <div className="relative z-10 flex h-[95%] w-[18%] flex-col justify-end gap-[1px]">
                    <div className="h-[30%] w-full rounded-t-[2px] bg-[#FF7F7F]"></div>
                    <div className="h-[45%] w-full bg-[#FFBC6B]"></div>
                    <div className="h-[20%] w-full rounded-b-[2px] bg-[#A4A4A4]"></div>
                  </div>
                  <div className="relative z-10 flex h-[75%] w-[18%] flex-col justify-end gap-[1px]">
                    <div className="h-[40%] w-full rounded-t-[2px] bg-[#FFBC6B]"></div>
                    <div className="h-[40%] w-full bg-[#FF7F7F]"></div>
                    <div className="h-[20%] w-full rounded-b-[2px] bg-[#A4A4A4]"></div>
                  </div>
                  <div className="relative z-10 flex h-[65%] w-[18%] flex-col justify-end gap-[1px]">
                    <div className="h-[25%] w-full rounded-t-[2px] bg-[#FF7F7F]"></div>
                    <div className="h-[55%] w-full bg-[#FFBC6B]"></div>
                    <div className="h-[20%] w-full rounded-b-[2px] bg-[#A4A4A4]"></div>
                  </div>
                </div>

                <div className="mt-2 flex w-full justify-between px-1 text-[8px] font-bold tracking-wider text-black/25">
                  <span>W1</span><span>W2</span><span>W3</span><span>W4</span>
                </div>
              </div>
            </div>

            {/* After Section */}
            <div className="flex flex-1 flex-col pt-7 pb-6 pr-5 pl-4 relative overflow-hidden bg-white/30 rounded-r-[28px]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#cff2e1]/30 to-[#dff9e8]/50 blur-xl pointer-events-none" />

              <div className="mb-6 flex flex-col justify-center text-center items-center relative z-10">
                <span className="text-[17px] leading-none font-normal text-black/50 tracking-tight">After</span>
                <div className="flex items-center mt-1">
                  <span className="text-[20px] font-semibold tracking-tight text-black opacity-90">Subzro</span>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="relative z-10 w-full rounded-[16px] bg-white border border-[#42D587]/40 p-2.5 pb-2 shadow-[0_8px_20px_0_rgba(66,213,135,0.15)] overflow-hidden scale-105 transform origin-center">
                <div className="absolute inset-0 bg-gradient-to-t from-[#42D587]/[0.05] to-transparent pointer-events-none" />

                <div className="mb-[18px]">
                  <p className="text-[8.5px] font-bold tracking-[0.06em] uppercase text-black/40 mb-[-2px]">Monthly Spends</p>
                  <div className="flex items-baseline gap-[1px]">
                    <span className="text-[22px] font-bold text-[#2e945c] tracking-tighter leading-none">$32</span><span className="text-[11px] font-bold text-[#2e945c]/60">.00</span>
                  </div>
                </div>

                {/* Bars */}
                <div className="relative flex h-[78px] w-full items-end justify-between px-1 gap-[2px]">
                  <div className="absolute bottom-[20%] left-0 right-0 border-t border-dashed border-[#42D587]/30 z-0"></div>

                  <div className="relative z-10 flex h-[20%] w-[18%] flex-col justify-end gap-[1px]">
                    <div className="h-[100%] w-full rounded-[2px] bg-[#42D587] shadow-[0_2px_6px_rgba(66,213,135,0.4)]"></div>
                  </div>
                  <div className="relative z-10 flex h-[20%] w-[18%] flex-col justify-end gap-[1px]">
                    <div className="h-[100%] w-full rounded-[2px] bg-[#42D587] shadow-[0_2px_6px_rgba(66,213,135,0.4)]"></div>
                  </div>
                  <div className="relative z-10 flex h-[20%] w-[18%] flex-col justify-end gap-[1px]">
                    <div className="h-[100%] w-full rounded-[2px] bg-[#42D587] shadow-[0_2px_6px_rgba(66,213,135,0.4)]"></div>
                  </div>
                  <div className="relative z-10 flex h-[20%] w-[18%] flex-col justify-end gap-[1px]">
                    <div className="h-[100%] w-full rounded-[2px] bg-[#42D587] shadow-[0_2px_6px_rgba(66,213,135,0.4)]"></div>
                  </div>
                </div>

                <div className="mt-2 flex w-full justify-between px-1 text-[8px] font-bold tracking-wider text-black/25">
                  <span>W1</span><span>W2</span><span>W3</span><span>W4</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 flex flex-col items-center gap-1.5 z-10 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100 fill-mode-both px-2">
          <h1 className="text-[29px] leading-[1.12] font-bold tracking-tight text-black text-center">
            Start your clean slate.<br />
            <span className="bg-gradient-to-r from-[#42d587] via-[#3eb475] to-[#2e945c] bg-clip-text text-transparent">Gain $500+ back</span>
          </h1>
        </div>

        {/* Replaced FadeIn directly with classes so they don't hide */}
        <div className="w-full max-w-[320px] mx-auto flex flex-col gap-[26px] animate-in slide-in-from-bottom-4 fade-in duration-700 delay-200 fill-mode-both">
          <div className="flex items-start gap-4">
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-white border border-black/10 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#E8FAF0] to-transparent opacity-80"></div>
              <ShieldCheckIcon className="h-5 w-5 text-[#2e945c] z-10" />
            </div>
            <div className="mt-[2px]">
              <p className="text-[15px] leading-[1.35] text-black">
                <span className="font-bold block tracking-tight">Total clarity. </span>
                <span className="text-black/60 font-medium tracking-tight">Find sneaky charges before they hit your bank.</span>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-white border border-black/10 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#E8FAF0] to-transparent opacity-80"></div>
              <BanknotesIcon className="h-5 w-5 text-[#2e945c] z-10" />
            </div>
            <div className="mt-[2px]">
              <p className="text-[15px] leading-[1.35] text-black">
                <span className="font-bold block tracking-tight">Own your money. </span>
                <span className="text-black/60 font-medium tracking-tight">Only pay for the exact subscriptions you truly need.</span>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-white border border-black/10 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#E8FAF0] to-transparent opacity-80"></div>
              <SparklesIcon className="h-5 w-5 text-[#2e945c] z-10" />
            </div>
            <div className="mt-[2px]">
              <p className="text-[15px] leading-[1.35] text-black">
                <span className="font-bold block tracking-tight">Cancel painlessly. </span>
                <span className="text-black/60 font-medium tracking-tight">We make ditching awful subscription services effortless.</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center pb-8 animate-in fade-in duration-700 delay-300 fill-mode-both">
          <div className="flex items-center gap-1 mb-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <StarIcon key={i} className="h-4 w-4 text-[#FFD60A]" />
            ))}
          </div>
          <p className="text-[14px] font-bold text-black/80 tracking-tight">
            4.8 Stars
          </p>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center bg-white/70 px-5 pb-[34px] xl:pb-8 pt-5 backdrop-blur-[48px] border-t border-black/[0.04]">
        <button
          type="button"
          onClick={openCheckout}
          disabled={isLoading}
          className="relative w-full max-w-[360px] rounded-full bg-gradient-to-r from-[#42d587] via-[#6ce0b8] to-[#ffbd67] py-[17px] text-center shadow-[0_8px_24px_-6px_rgba(66,213,135,0.4)] transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 disabled:scale-100 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[100%] animate-[shimmer_2.5s_infinite]"></div>
          <p className="text-[17px] font-bold tracking-wide text-black/90">
            {isLoading ? "Opening checkout..." : "Continue"}
          </p>
        </button>
        <div className="mt-4 flex gap-[18px] text-[11px] font-semibold text-black/30 tracking-wide uppercase">
          <Link to="/impressum" className="hover:text-black/60 transition-colors">Impressum</Link>
          <Link to="/terms" className="hover:text-black/60 transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-black/60 transition-colors">Privacy</Link>
        </div>
      </div>
    </div>
  );
}
