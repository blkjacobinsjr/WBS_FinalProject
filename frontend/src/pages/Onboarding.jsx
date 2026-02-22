import { UserButton, useUser } from "@clerk/clerk-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { isAdminEmail } from "../utils/adminAccess";
import { logOnboardingEvent } from "../utils/onboardingDebug";
import {
  isForceFreshOnboardingEmail,
  markOnboardingCompletedAt,
  readOnboardingCompletedAt,
} from "../utils/onboardingState";

const TOTAL_STEPS = 12;
const PAYOFF_CARD_COUNT = 4;
const ENTER_EASE = [0.22, 1, 0.36, 1];
const LOGO_DEV_TOKEN = "pk_fg7nZQ2oQQK-tZnjxKWfPQ";
const SPLASH_LOGOS = [
  "netflix.com", "spotify.com", "amazon.com",
  "youtube.com", "disneyplus.com", "adobe.com",
];
const INTRO_FRAMES = [
  "/mascot-subzro/mascotmove10.webp",
  "/mascot-subzro/mascotmove12.webp",
  "/mascot-subzro/mascotwave.webp",
];
const STEP_BACKGROUNDS = [
  "from-[#071223] via-[#102039] to-[#1a3152]", // 0 intro
  "from-[#08152a] via-[#132644] to-[#213b5e]", // 1 greeting
  "from-[#09192f] via-[#172d4d] to-[#2b4a74]", // 2
  "from-[#0b1d37] via-[#1d3960] to-[#345b8a]", // 3
  "from-[#122744] via-[#24446d] to-[#3d6698]", // 4
  "from-[#173150] via-[#2a4b75] to-[#406c9c]", // 5
  "from-[#1b3554] via-[#2f4f79] to-[#4a77a5]", // 6
  "from-[#203a58] via-[#35567e] to-[#527faa]", // 7
  "from-[#24405f] via-[#395d86] to-[#5a88b1]", // 8
  "from-[#294565] via-[#3d6089] to-[#587fa8]", // 9
  "from-[#2f4c6d] via-[#446892] to-[#628bb3]", // 10
  "from-[#deeffc] via-[#edf7ff] to-[#f6fbff]", // 11
];
const EVIDENCE_STEPS = [
  {
    headline: "Savings pressure is real",
    quote: "53% of Americans cannot cover a $1,000 emergency from savings.",
    chips: [],
    logos: [
      { domain: "bankrate.com", label: "Bankrate" },
      { domain: "fred.stlouisfed.org", label: "FRED" },
    ],
    source: "Bankrate 2026, BEA/FRED Feb 2026",
    bridge: "",
  },
  {
    headline: "Subscription overpay is common",
    quote: "$204/year is wasted on unused subscriptions by the average US adult.",
    chips: [],
    logos: [{ domain: "cnet.com", label: "CNET" }],
    source: "CNET Subscription Survey 2025",
    bridge: "",
  },
];
const SAVINGS_GAP_STEP = {
  headline: "Emergency savings gap",
  quote: "24% of Americans have zero emergency savings.",
  logos: [{ domain: "bankrate.com", label: "Bankrate" }],
  source: "Bankrate 2026 Emergency Savings Report",
};
const AUDIT_OPTIONS = [
  { value: "monthly", label: "Every month" },
  { value: "quarterly", label: "Sometimes" },
  { value: "rarely", label: "Almost never" },
];

function formatMoney(value) {
  return value.toLocaleString("en-US");
}

function institutionLogoUrl(domain) {
  return `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&format=png&size=256&retina=true`;
}

function StepProgress({ step, total, dark }) {
  const visibleIndices = useMemo(() => {
    // Show window of 3: [prev, current, next]
    if (step === 0) return [0, 1, 2];
    if (step === total - 1) return [total - 3, total - 2, total - 1];
    return [step - 1, step, step + 1];
  }, [step, total]);

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="popLayout" initial={false}>
        {visibleIndices.map((index) => {
          const isActive = index === step;
          const isDone = index < step;

          return (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, scale: 0.8, width: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
                width: isActive ? 32 : 12,
              }}
              exit={{ opacity: 0, scale: 0.8, width: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
                mass: 0.8
              }}
              className={`h-1.5 rounded-full ${isDone
                ? "bg-[#26c06f]"
                : isActive
                  ? dark
                    ? "bg-[#7dc1ff] shadow-[0_0_15px_rgba(125,193,255,0.4)]"
                    : "bg-[#2b63a4] shadow-[0_0_15px_rgba(43,99,164,0.3)]"
                  : dark
                    ? "bg-white/20"
                    : "bg-black/15"
                }`}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function OptionCard({ title, subtitle, selected, onClick, mascot }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.6 }}
      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${selected
        ? "border-[#8ce0b5] bg-[#edfff6] shadow-[0_8px_24px_rgba(20,149,90,0.10)]"
        : "border-white/75 bg-white/80 hover:bg-white"
        }`}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[#eaf6ff] p-1.5">
          <img src={mascot} alt="" className="h-8 w-8" />
        </div>
        <div>
          <p className="text-base font-semibold text-black/90">{title}</p>
          <p className="mt-0.5 text-sm text-black/60">{subtitle}</p>
        </div>
      </div>
    </motion.button>
  );
}

function SlotDigit({ digit, muted = false }) {
  return (
    <div className="relative h-14 w-10 overflow-hidden rounded-lg border border-[#bcd7ec] bg-white/85 shadow-inner">
      <motion.div
        animate={{ y: `${digit * -36}px` }}
        transition={{ type: "spring", stiffness: 230, damping: 25, mass: 0.62 }}
        className="absolute left-0 top-0 w-full"
      >
        {Array.from({ length: 10 }).map((_, idx) => (
          <div
            key={idx}
            className={`flex h-9 items-center justify-center font-mono text-4xl font-extrabold ${muted && idx === 0 ? "text-black/25" : "text-black/90"
              }`}
          >
            {idx}
          </div>
        ))}
      </motion.div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-white to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}

function SlotCounter({ value }) {
  const digits = String(value).padStart(2, "0").split("").map(Number);

  return (
    <div className="flex items-center gap-1">
      <SlotDigit digit={digits[0]} muted={digits[0] === 0} />
      <SlotDigit digit={digits[1]} />
    </div>
  );
}

function getCountReaction(count) {
  if (count >= 20) return "zro looked away. too many open loops.";
  if (count >= 13) return "getting cold. hidden spend is likely.";
  if (count >= 6) return "zro is tracking patterns.";
  return "clean start. fewer loops, faster control.";
}

function getPrescreenSignal(auditCadence, surpriseRenewals) {
  const cadenceScore =
    auditCadence === "monthly" ? 0 : auditCadence === "quarterly" ? 1 : 2;
  const surpriseScore = surpriseRenewals >= 4 ? 2 : surpriseRenewals >= 2 ? 1 : 0;
  const total = cadenceScore + surpriseScore;

  if (total >= 3) {
    return {
      label: "High risk",
      message: "you likely have several charges worth canceling.",
    };
  }

  if (total >= 1) {
    return {
      label: "Medium risk",
      message: "you likely have a few charges worth canceling.",
    };
  }

  return {
    label: "Low risk",
    message: "your habits look clean, but we will still scan for hidden charges.",
  };
}

function AnimatedCurrency({ value, active, className, duration = 900 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setDisplayValue(0);
      return;
    }

    let frameId;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active, duration, value]);

  return <span className={className}>${formatMoney(displayValue)}</span>;
}

export default function Onboarding() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isForced = searchParams.get("force") === "1";
  const source = searchParams.get("source") || "default";

  const rawStep = searchParams.get("step");
  const parsedStep = rawStep === null ? null : Number(rawStep);
  const initialStep = Number.isFinite(parsedStep)
    ? Math.min(TOTAL_STEPS - 1, Math.max(0, parsedStep))
    : 0;

  const [step, setStep] = useState(initialStep);
  const [goal, setGoal] = useState(null);
  const [subscriptionCount, setSubscriptionCount] = useState(8);
  const [averagePrice, setAveragePrice] = useState(11);
  const [auditCadence, setAuditCadence] = useState("rarely");
  const [surpriseRenewals, setSurpriseRenewals] = useState(2);
  const [auditInteracted, setAuditInteracted] = useState(false);
  const [surpriseInteracted, setSurpriseInteracted] = useState(false);
  const [riskViewed, setRiskViewed] = useState(false);
  const [splashReady, setSplashReady] = useState(false);
  const [countInteracted, setCountInteracted] = useState(false);
  const [priceInteracted, setPriceInteracted] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [countdownDone, setCountdownDone] = useState(false);
  const [revealCount, setRevealCount] = useState(0);
  const [payoffTitle, setPayoffTitle] = useState("");
  const [payoffTransitioning, setPayoffTransitioning] = useState(false);

  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const isAdminUser = isAdminEmail(userEmail);
  const isDarkStep = step <= 8;

  const monthlyExposure = subscriptionCount * averagePrice;
  const yearlyExposure = monthlyExposure * 12;
  const yearlyRecoverable = Math.round(yearlyExposure * 0.28);
  const monthlyRecoverable = Math.max(1, Math.round(yearlyRecoverable / 12));
  const detectedSubscriptions = Math.min(42, subscriptionCount + surpriseRenewals);
  const cancelCandidates = Math.max(1, Math.round(detectedSubscriptions * 0.34));
  const snpRate = 0.1;
  const snpYears = 10;
  const snpMultiplier = ((1 + snpRate) ** snpYears - 1) / snpRate;
  const snpProjection = Math.round(yearlyExposure * snpMultiplier);

  const payoffHeadline =
    goal === "cut"
      ? "Potential yearly savings surfaced"
      : "Potential yearly spend clarity surfaced";
  const prescreenSignal = useMemo(
    () => getPrescreenSignal(auditCadence, surpriseRenewals),
    [auditCadence, surpriseRenewals],
  );

  const profileStrength = useMemo(() => {
    const completionScore = step === 0 ? 0 : (step / (TOTAL_STEPS - 1)) * 50;
    const goalScore = goal ? 20 : 0;
    const prescreenScore = riskViewed ? 10 : 0;
    const countScore = Math.min(15, Math.round(subscriptionCount / 2));
    const priceScore = Math.min(15, Math.round(averagePrice / 2));
    return Math.min(
      100,
      Math.round(
        completionScore + goalScore + prescreenScore + countScore + priceScore,
      ),
    );
  }, [averagePrice, goal, riskViewed, step, subscriptionCount]);

  const payoffCards = [
    {
      label: "Monthly spend",
      value: monthlyExposure,
      valueClassName: "text-black/90",
      className: "border-black/10 bg-white/88 text-black/90",
    },
    {
      label: "Annual exposure",
      value: yearlyExposure,
      valueClassName: "text-black/90",
      className: "border-black/10 bg-white/88 text-black/90",
    },
    {
      label: "Typical recoverable",
      value: yearlyRecoverable,
      valueClassName: "text-[#14955a]",
      className: "border-[#a7f0c9] bg-gradient-to-br from-[#ecfdf5] to-[#d1fae5] text-[#14955a]",
    },
    {
      label: "S&P 500 in 10y",
      value: snpProjection,
      valueClassName: "text-[#1167b4]",
      className: "border-[#b9dcff] bg-[#eef7ff] text-[#1167b4]",
    },
  ];

  const pricingReturnTo = encodeURIComponent(
    "/dashboard?checkout=success&from=onboarding",
  );

  useEffect(() => {
    const completedAt = readOnboardingCompletedAt(userEmail);
    const forceFresh = isForceFreshOnboardingEmail(userEmail);

    logOnboardingEvent("onboarding_opened", {
      forced: isForced,
      source,
      initialStep,
      completedAlready: Boolean(completedAt),
      forceFresh,
    });

    if (completedAt && !isForced && !forceFresh) {
      logOnboardingEvent("onboarding_redirected_completed", { source });
      navigate("/dashboard", { replace: true });
    }
  }, [initialStep, isForced, navigate, source, userEmail]);

  useEffect(() => {
    logOnboardingEvent("onboarding_step_changed", { step });
  }, [step]);

  useEffect(() => {
    if (step !== 0) return;
    setSplashReady(false);
    const t = setTimeout(() => setSplashReady(true), SPLASH_LOGOS.length * 220 + 400);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (step !== TOTAL_STEPS - 1) return;

    setRevealCount(0);
    setPayoffTitle("");
    setCountdownValue(3);
    setCountdownDone(false);

    let current = 3;
    const interval = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        setCountdownValue(0);
        setCountdownDone(true);
        clearInterval(interval);
        return;
      }

      setCountdownValue(current);
    }, 620);

    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step !== TOTAL_STEPS - 1 || !countdownDone) return;

    const titleText = "Instant payoff";
    let titleIndex = 0;
    let titleTimer;
    let current = 0;

    function typeTitle() {
      titleIndex += 1;
      setPayoffTitle(titleText.slice(0, titleIndex));
      if (titleIndex < titleText.length) {
        titleTimer = setTimeout(typeTitle, 34);
      }
    }

    titleTimer = setTimeout(typeTitle, 90);

    const interval = setInterval(() => {
      current += 1;
      setRevealCount(current);
      if (current >= PAYOFF_CARD_COUNT) clearInterval(interval);
    }, 260);

    return () => {
      clearTimeout(titleTimer);
      clearInterval(interval);
    };
  }, [countdownDone, step]);

  function markOnboardingCompleted(reason) {
    markOnboardingCompletedAt(userEmail, new Date().toISOString());
    logOnboardingEvent("onboarding_completed_marked", { reason });
  }

  function nextStep() {
    setStep((current) => Math.min(TOTAL_STEPS - 1, current + 1));
  }

  function previousStep() {
    setStep((current) => Math.max(0, current - 1));
  }

  function revealPayoffStep() {
    setPayoffTransitioning(true);
    setTimeout(() => {
      setStep(TOTAL_STEPS - 1);
      setPayoffTransitioning(false);
    }, 380);
  }

  function continueToCheckout() {
    markOnboardingCompleted("checkout_handoff");
    logOnboardingEvent("onboarding_continue_checkout_clicked", {
      source,
      forced: isForced,
      goal,
      subscriptionCount,
      averagePrice,
    });

    navigate(
      `/pricing?autoCheckout=1&source=subzro_onboarding&returnTo=${pricingReturnTo}`,
    );
  }

  function skipToApp() {
    markOnboardingCompleted("manual_skip");
    navigate("/dashboard");
  }

  function renderIntroStep() {
    // Spark-inspired full-screen peephole splash
    // Logos are massive blobs at viewport edges, creating a star-shaped opening
    // Progressive disclosure: nothing shown until the sequence finishes
    const LOGO_SIZE = 220; // massive, fills edges
    const COUNT = SPLASH_LOGOS.length;
    const STAGGER = 280; // ms between each logo
    const LOGO_PHASE = COUNT * STAGGER + 600; // total time for logos to settle
    const CENTER_DELAY = LOGO_PHASE; // mascot appears after logos
    const BUTTON_DELAY = CENTER_DELAY + 900; // button last

    // Positions: edge-anchored like Spark's colored blobs forming a star opening
    // Each logo sits at a viewport edge, partially off-screen
    const positions = [
      { top: '-6%', left: '-8%' },  // top-left
      { top: '-6%', right: '-8%' },  // top-right
      { top: '28%', left: '-12%' },  // mid-left
      { top: '28%', right: '-12%' },  // mid-right
      { bottom: '-4%', left: '-8%' }, // bottom-left
      { bottom: '-4%', right: '-8%' }, // bottom-right
    ];

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #071223 0%, #0e1e33 50%, #142a47 100%)' }}
      >
        <style>{`
          @keyframes splashBlobIn {
            0%   { opacity: 0; transform: scale(3.5) rotate(calc(var(--rot) - 180deg)); }
            40%  { opacity: 1; }
            70%  { transform: scale(1.06) rotate(calc(var(--rot) + 4deg)); }
            85%  { transform: scale(0.97) rotate(calc(var(--rot) - 2deg)); }
            100% { opacity: 1; transform: scale(1) rotate(var(--rot)); }
          }
          @keyframes splashCenterIn {
            0%   { opacity: 0; transform: scale(0.5); filter: blur(20px); }
            60%  { opacity: 1; filter: blur(2px); }
            80%  { transform: scale(1.04); filter: blur(0); }
            100% { opacity: 1; transform: scale(1); filter: blur(0); }
          }
          @keyframes splashPulse {
            0%,100% { text-shadow: 0 0 24px rgba(125,193,255,0.3); }
            50%     { text-shadow: 0 0 48px rgba(125,193,255,0.7), 0 0 80px rgba(90,220,180,0.3); }
          }
          @keyframes splashTagline {
            0%   { opacity: 0; transform: translateY(12px); filter: blur(8px); }
            100% { opacity: 1; transform: translateY(0); filter: blur(0); }
          }
          @keyframes splashBtnIn {
            0%   { opacity: 0; transform: translateY(24px) scale(0.9); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes splashColorShift {
            0%,100% { color: #e5f4ff; }
            25%     { color: #7dc1ff; }
            50%     { color: #5adcb4; }
            75%     { color: #f0b4ff; }
          }
          .splash-blob {
            position: absolute;
            width: ${LOGO_SIZE}px;
            height: ${LOGO_SIZE}px;
            border-radius: 48px;
            overflow: hidden;
            opacity: 0;
            animation: splashBlobIn 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            box-shadow:
              0 12px 48px rgba(0,0,0,0.4),
              0 0 0 1px rgba(255,255,255,0.08) inset,
              0 0 80px rgba(125,193,255,0.12);
          }
          .splash-blob img {
            width: 100%; height: 100%;
            object-fit: cover;
            border-radius: 48px;
          }
        `}</style>

        {/* Massive edge-anchored logo blobs */}
        {SPLASH_LOGOS.map((domain, i) => {
          const pos = positions[i] || positions[i % positions.length];
          const rotation = (i % 2 === 0 ? 8 : -8) + i * 3;
          return (
            <div
              key={domain}
              className="splash-blob"
              style={{
                ...pos,
                '--rot': `${rotation}deg`,
                animationDelay: `${i * STAGGER}ms`,
              }}
            >
              <img
                src={`https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&format=png&size=256&retina=true`}
                alt={domain.split('.')[0]}
                loading="eager"
              />
            </div>
          );
        })}

        {/* Center content: mascot + brand — appears after logos settle */}
        <div
          style={{
            opacity: 0,
            animation: `splashCenterIn 0.9s cubic-bezier(0.22,1,0.36,1) ${CENTER_DELAY}ms forwards`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
            position: 'relative',
          }}
        >
          <img
            src="/mascot-subzro/officiallogos/officialsubzromascot-removebg-preview.png"
            alt="Zro"
            style={{
              width: 88,
              height: 88,
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 24px rgba(125,193,255,0.5))',
            }}
          />
          <h1
            style={{
              marginTop: 12,
              fontSize: '3rem',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: '#fff',
              animation: `splashPulse 3s ease-in-out ${CENTER_DELAY + 400}ms infinite`,
            }}
          >
            subzro
          </h1>
          <p
            style={{
              marginTop: 8,
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: '0.06em',
              opacity: 0,
              animation: `splashTagline 0.6s ease-out ${CENTER_DELAY + 500}ms forwards`,
            }}
          >
            {'cold nose. hot savings.'.split('').map((ch, ci) => (
              <span
                key={ci}
                style={{
                  animation: `splashColorShift 2.8s ease-in-out ${ci * 0.08}s infinite`,
                }}
              >{ch}</span>
            ))}
          </p>
        </div>

        {/* Start button — only appears last, after everything */}
        <button
          type="button"
          onClick={nextStep}
          style={{
            position: 'absolute',
            bottom: 'max(env(safe-area-inset-bottom, 24px), 48px)',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: 0,
            animation: `splashBtnIn 0.5s cubic-bezier(0.22,1,0.36,1) ${BUTTON_DELAY}ms forwards`,
            borderRadius: 999,
            background: '#fff',
            padding: '14px 40px',
            fontSize: 16,
            fontWeight: 700,
            color: '#0f2039',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 0 60px rgba(125,193,255,0.15)',
            zIndex: 20,
          }}
        >
          Start
        </button>
      </div>
    );
  }

  function renderGreetingStep() {
    return (
      <div className="flex h-full flex-col">
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Hi, I'm Zro
        </h2>
        <p className="mt-1 text-sm text-[#cde7ff]">Your personal finance pet.</p>

        <div className="mt-12 flex flex-1 flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="mb-8"
          >
            <img
              src="/mascot-subzro/mascotsitsmile1.webp"
              alt="Zro"
              className="h-44 w-44 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
            />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center px-4"
          >
            <p className="text-2xl font-semibold leading-tight text-white">
              I'm here to help you <br />
              <span className="bg-gradient-to-r from-[#7dc1ff] to-[#5adcb4] bg-clip-text text-transparent">
                freeze wasteful spending
              </span>
            </p>
            <p className="mt-6 text-base leading-relaxed text-[#cde7ff]">
              Most people waste $2,400+ a year on recurring loops they don't even use.
              I help you find them and gain control.
            </p>
          </motion.div>
        </div>

        <div className="mt-auto flex items-center justify-end pt-6">
          <button
            type="button"
            onClick={nextStep}
            className="rounded-full bg-white px-8 py-3 text-sm font-bold text-[#10223e] shadow-xl transition hover:scale-105 active:scale-95"
          >
            Let's begin
          </button>
        </div>
      </div>
    );
  }

  function renderEvidenceStep(index) {
    const evidence = EVIDENCE_STEPS[index];

    return (
      <div className="flex h-full flex-col">
        <h2
          className="text-3xl font-extrabold tracking-tight text-white"
          style={{ textShadow: "0 -1px 0 rgba(0, 0, 0, 0.2)" }}
        >
          {evidence.headline}
        </h2>

        <div className="relative mt-4 p-1">
          <p className="pointer-events-none absolute -left-1 top-0 text-7xl font-semibold leading-none text-white/20">
            "
          </p>
          <p
            className="relative z-10 text-[2.05rem] leading-[1.16] text-white"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              textShadow: "0 -1px 0 rgba(0, 0, 0, 0.2)",
            }}
          >
            {evidence.quote}
          </p>
          <p className="pointer-events-none absolute bottom-[-24px] right-2 text-7xl font-semibold leading-none text-white/20">
            "
          </p>

          {evidence.chips?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {evidence.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/25 px-2.5 py-1 text-xs text-[#d9ecff]"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {(() => {
                const singleLogo = evidence.logos.length === 1;
                return evidence.logos.map((logo) => (
                  <img
                    key={logo.domain}
                    src={institutionLogoUrl(logo.domain)}
                    alt={logo.label}
                    className={`h-5 w-auto object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)] ${singleLogo ? "rounded-md" : ""
                      }`}
                    loading="lazy"
                    decoding="async"
                  />
                ));
              })()}
            </div>
            <span className="text-[11px] text-[#cce6ff]">{evidence.source}</span>
          </div>
          {evidence.bridge ? (
            <p className="mt-3 text-sm text-[#d7e8ff]">{evidence.bridge}</p>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between pt-6">
          <button
            type="button"
            onClick={previousStep}
            className="rounded-full border border-white/35 bg-white/10 px-5 py-2 text-sm font-medium text-white"
          >
            Back
          </button>
          <button
            type="button"
            onClick={nextStep}
            className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#10223e]"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  function renderSavingsGapStep() {
    return (
      <div className="flex h-full flex-col">
        <h2
          className="text-3xl font-extrabold tracking-tight text-white"
          style={{ textShadow: "0 -1px 0 rgba(0, 0, 0, 0.2)" }}
        >
          {SAVINGS_GAP_STEP.headline}
        </h2>

        <div className="relative mt-4 p-1">
          <p className="pointer-events-none absolute -left-1 top-0 text-7xl font-semibold leading-none text-white/20">
            "
          </p>
          <p
            className="relative z-10 text-[2.1rem] leading-[1.16] text-white"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              textShadow: "0 -1px 0 rgba(0, 0, 0, 0.2)",
            }}
          >
            {SAVINGS_GAP_STEP.quote}
          </p>
          <p className="pointer-events-none absolute bottom-[-24px] right-2 text-7xl font-semibold leading-none text-white/20">
            "
          </p>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {SAVINGS_GAP_STEP.logos.map((logo) => (
                <img
                  key={logo.domain}
                  src={institutionLogoUrl(logo.domain)}
                  alt={logo.label}
                  className="h-5 w-auto rounded-md object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]"
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
            <span className="text-[11px] text-[#cce6ff]">{SAVINGS_GAP_STEP.source}</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-6">
          <button
            type="button"
            onClick={previousStep}
            className="rounded-full border border-white/35 bg-white/10 px-5 py-2 text-sm font-medium text-white"
          >
            Back
          </button>
          <button
            type="button"
            onClick={nextStep}
            className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#10223e]"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  function renderAuditFrequencyStep() {
    return (
      <div className="flex h-full flex-col">
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Quick check
        </h2>
        <p className="mt-1 text-sm text-[#cde7ff]">How often do you check subscriptions?</p>

        <div className="mt-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-[#dbeeff]">
            <img
              src="/mascot-subzro/mascotsitsmilewave.webp"
              alt="Zro guide"
              className="h-7 w-7 rounded-lg bg-white/15 p-1"
            />
            <p>Pick the option closest to your habit.</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {AUDIT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setAuditCadence(option.value);
                  setAuditInteracted(true);
                }}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${auditCadence === option.value
                  ? "border-white/50 bg-white/20 text-white"
                  : "border-white/20 bg-white/8 text-[#dbeeff]"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-6">
          <button
            type="button"
            onClick={previousStep}
            className="rounded-full border border-white/35 bg-white/10 px-5 py-2 text-sm font-medium text-white"
          >
            Back
          </button>
          <button
            type="button"
            onClick={nextStep}
            disabled={!auditInteracted}
            className={`rounded-full px-6 py-2 text-sm font-semibold transition ${auditInteracted
              ? "bg-white text-[#10223e]"
              : "cursor-not-allowed bg-white/30 text-white/70"
              }`}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  function renderSurpriseChargesStep() {
    return (
      <div className="flex h-full flex-col">
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Quick check
        </h2>
        <p className="mt-1 text-sm text-[#cde7ff]">How many charges surprised you in 6 months?</p>

        <div className="mt-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-[#dbeeff]">
            <img
              src="/mascot-subzro/mascotmove12.webp"
              alt="Zro guide"
              className="h-7 w-7 rounded-lg bg-white/15 p-1"
            />
            <p>Use your best guess. You can update this later.</p>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSurpriseInteracted(true);
                setSurpriseRenewals((value) => Math.max(0, value - 1));
              }}
              className="h-10 w-10 rounded-full border border-white/30 bg-white/10 text-xl text-white"
            >
              -
            </button>
            <div className="min-w-[3.5rem] rounded-xl bg-white/10 px-3 py-2 text-center font-mono text-2xl font-bold text-white">
              {surpriseRenewals}
            </div>
            <button
              type="button"
              onClick={() => {
                setSurpriseInteracted(true);
                setSurpriseRenewals((value) => Math.min(8, value + 1));
              }}
              className="h-10 w-10 rounded-full border border-white/30 bg-white/10 text-xl text-white"
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-6">
          <button
            type="button"
            onClick={previousStep}
            className="rounded-full border border-white/35 bg-white/10 px-5 py-2 text-sm font-medium text-white"
          >
            Back
          </button>
          <button
            type="button"
            onClick={nextStep}
            disabled={!surpriseInteracted}
            className={`rounded-full px-6 py-2 text-sm font-semibold transition ${surpriseInteracted
              ? "bg-white text-[#10223e]"
              : "cursor-not-allowed bg-white/30 text-white/70"
              }`}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  function renderRiskRevealStep() {
    const riskTier =
      prescreenSignal.label === "High risk"
        ? 3
        : prescreenSignal.label === "Medium risk"
          ? 2
          : 1;

    return (
      <div className="flex h-full flex-col">
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Your risk signal
        </h2>
        <p className="mt-1 text-sm text-[#cde7ff]">Based on your answers so far.</p>

        <div className="mt-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3">
            <img
              src="/mascot-subzro/mascotwinksmile.webp"
              alt="Zro guide"
              className="h-9 w-9 rounded-lg bg-white/15 p-1"
            />
            <div>
              <p className="text-xs uppercase tracking-wider text-[#cde7ff]">Risk level</p>
              <p className="text-xl font-bold text-white">{prescreenSignal.label}</p>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-white/10 px-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-[#cde7ff]">Leak meter</p>
              <p className="text-xs font-semibold text-white">Level {riskTier}/3</p>
            </div>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3].map((level) => (
                <span
                  key={level}
                  className={`h-2.5 rounded-full transition-all ${riskTier >= level ? "w-8 bg-[#26c06f]" : "w-5 bg-white/25"
                    }`}
                />
              ))}
            </div>
          </div>

          <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm text-[#dbeeff]">
            {prescreenSignal.message}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-6">
          <button
            type="button"
            onClick={previousStep}
            className="rounded-full border border-white/35 bg-white/10 px-5 py-2 text-sm font-medium text-white"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              setRiskViewed(true);
              nextStep();
            }}
            className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#10223e]"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  function renderMissionStep() {
    return (
      <div className="flex h-full flex-col">
        <h2
          className="text-3xl font-extrabold tracking-tight text-white"
          style={{ textShadow: "0 -1px 0 rgba(0, 0, 0, 0.2)" }}
        >
          Pick your mission
        </h2>
        <p className="mt-1 text-sm text-[#cde7ff]">Pick one. I shape the plan around this.</p>

        <div className="mt-4 space-y-3">
          <OptionCard
            title="Cut waste"
            subtitle="Find and freeze low-value recurring charges"
            selected={goal === "cut"}
            onClick={() => setGoal("cut")}
            mascot="/mascot-subzro/mascotmove5.webp"
          />
          <OptionCard
            title="Gain control"
            subtitle="Build a clean live view of your money flow"
            selected={goal === "control"}
            onClick={() => setGoal("control")}
            mascot="/mascot-subzro/mascotsitsmilewave.webp"
          />
        </div>

        <div className="mt-auto flex items-center justify-between pt-6">
          <button
            type="button"
            onClick={previousStep}
            className="rounded-full border border-white/35 bg-white/10 px-5 py-2 text-sm font-medium text-white"
          >
            Back
          </button>
          <button
            type="button"
            onClick={nextStep}
            disabled={!goal}
            className={`rounded-full px-6 py-2 text-sm font-semibold transition ${goal
              ? "bg-white text-[#10223e]"
              : "cursor-not-allowed bg-white/30 text-white/70"
              }`}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  function renderCountStep() {
    return (
      <div className="flex h-full flex-col">
        <h2 className="text-3xl font-extrabold tracking-tight text-black/90">
          Active subscriptions
        </h2>
        <p className="mt-1 text-sm text-black/60">Set an estimate. You can refine later.</p>

        <div className="mt-4 rounded-2xl border border-[#cfe4f8] bg-gradient-to-br from-[#f2f8ff] to-[#f6fdff] p-4">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-black/45">
            Current estimate
          </p>

          <div className="mt-3 flex justify-center">
            <SlotCounter value={subscriptionCount} />
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setCountInteracted(true);
                setSubscriptionCount((value) => Math.max(3, value - 1));
              }}
              className="h-11 w-11 rounded-full border border-black/20 bg-white text-xl font-semibold text-black/75"
            >
              -
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setCountInteracted(true);
                setSubscriptionCount((value) => Math.min(24, value + 1));
              }}
              className="h-11 w-11 rounded-full border border-black/20 bg-white text-xl font-semibold text-black/75"
            >
              +
            </motion.button>
          </div>

          <p className="mt-3 text-center text-xs text-black/50">
            {getCountReaction(subscriptionCount)}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-6">
          <button
            type="button"
            onClick={previousStep}
            className="rounded-full border border-black/20 bg-white/70 px-5 py-2 text-sm font-medium text-black/75"
          >
            Back
          </button>
          <button
            type="button"
            onClick={nextStep}
            disabled={!countInteracted}
            className={`rounded-full px-6 py-2 text-sm font-medium transition ${countInteracted
              ? "bg-black text-white"
              : "cursor-not-allowed bg-black/20 text-black/45"
              }`}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  function renderPriceStep() {
    return (
      <div className="flex h-full flex-col">
        <h2 className="text-3xl font-extrabold tracking-tight text-black/90">
          Average monthly price
        </h2>
        <p className="mt-1 text-sm text-black/60">Move once. Then reveal payoff.</p>

        <div className="mt-4 rounded-2xl border border-[#cfe4f8] bg-gradient-to-br from-[#f2f8ff] to-[#f6fdff] p-4">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-black/45">
            Average per subscription
          </p>
          <p className="mt-1 text-center font-mono text-6xl font-extrabold text-black/90">
            ${averagePrice}
          </p>
          <input
            type="range"
            min="4"
            max="40"
            value={averagePrice}
            onChange={(event) => {
              setPriceInteracted(true);
              setAveragePrice(Number(event.target.value));
            }}
            className="mt-4 w-full"
          />
          <div className="mt-2 flex justify-between text-[11px] font-medium text-black/45">
            <span>$4</span>
            <span>$11</span>
            <span>$22</span>
            <span>$40</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-6">
          <button
            type="button"
            onClick={previousStep}
            className="rounded-full border border-black/20 bg-white/70 px-5 py-2 text-sm font-medium text-black/75"
          >
            Back
          </button>
          <button
            type="button"
            onClick={revealPayoffStep}
            className={`rounded-full px-6 py-2 text-sm font-medium text-white ${priceInteracted ? "bg-black" : "animate-pulse bg-black/85"
              }`}
          >
            Reveal payoff
          </button>
        </div>
      </div>
    );
  }

  function renderPayoffStep() {
    return (
      <div className="flex h-full flex-col">
        <h2 className="bg-gradient-to-r from-[#153352] via-[#2b72b1] to-[#0f7a54] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
          {payoffTitle || " "}
        </h2>
        <p className="mt-1 text-sm text-black/60">{payoffHeadline}</p>

        {!countdownDone ? (
          <div className="mt-4 rounded-2xl border border-[#bddcf2] bg-gradient-to-br from-[#f4f8ff] via-white to-[#eef7ff] p-5 shadow-[0_1px_1px_rgba(0,0,0,0.12),0_2px_2px_rgba(0,0,0,0.12),0_4px_4px_rgba(0,0,0,0.12),0_8px_8px_rgba(0,0,0,0.12)]">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#36597d]">
              Final calibration
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={countdownValue}
                initial={{ opacity: 0, y: 10, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 1.02 }}
                transition={{ duration: 0.2, ease: ENTER_EASE }}
                className="mt-2 text-center font-mono text-7xl font-extrabold text-[#173759]"
                style={{ textShadow: "0 1px 0 rgba(255, 255, 255, 0.1)" }}
              >
                {countdownValue === 0 ? "NOW" : countdownValue}
              </motion.p>
            </AnimatePresence>
            <div className="mt-3 flex items-center justify-center gap-2">
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className={`h-2.5 rounded-full transition-all duration-200 ${countdownValue <= 2 - index
                    ? "w-8 bg-[#1ab86d]"
                    : "w-3 bg-black/20"
                    }`}
                />
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-black/60">
              running statement analysis...
            </p>
          </div>
        ) : (
          <>
            <div className="mt-3 rounded-xl border border-[#bddcf2] bg-[#f6fbff] p-3 shadow-[0_1px_1px_rgba(0,0,0,0.12),0_2px_2px_rgba(0,0,0,0.12),0_4px_4px_rgba(0,0,0,0.12)]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#36597d]">
                Statement scan preview
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-white p-2">
                  <p className="text-[10px] text-black/55">Found recurring</p>
                  <p className="font-mono text-xl font-extrabold text-black/90">
                    {detectedSubscriptions}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-2">
                  <p className="text-[10px] text-black/55">Likely cancellable</p>
                  <p className="font-mono text-xl font-extrabold text-black/90">
                    {cancelCandidates}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-2">
                  <p className="text-[10px] text-black/55">Est. monthly save</p>
                  <p className="font-mono text-xl font-extrabold text-[#14955a]">
                    ${formatMoney(monthlyRecoverable)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-black/55">
                Unlock to view exact merchant-level savings from your uploaded statement.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {payoffCards.map((card, index) => (
                <motion.div
                  key={card.label}
                  animate={{
                    opacity: revealCount > index ? 1 : 0.28,
                    y: revealCount > index ? 0 : 8,
                    scale: revealCount > index ? 1 : 0.97,
                  }}
                  transition={{ duration: 0.24, ease: ENTER_EASE }}
                  className={`rounded-xl border p-3 shadow-[0_1px_1px_rgba(0,0,0,0.12),0_2px_2px_rgba(0,0,0,0.12),0_4px_4px_rgba(0,0,0,0.12),0_8px_8px_rgba(0,0,0,0.12),0_16px_16px_rgba(0,0,0,0.12)] ${card.className}`}
                >
                  <p className="text-[11px] uppercase tracking-wide text-black/55">{card.label}</p>
                  <AnimatedCurrency
                    value={card.value}
                    active={revealCount > index}
                    duration={index === 3 ? 1200 : 850}
                    className={`mt-1 font-mono text-3xl font-extrabold ${card.valueClassName}`}
                  />
                </motion.div>
              ))}
            </div>

            <div className="mt-3 rounded-xl border border-black/10 bg-white/80 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-black/50">
                  Profile strength
                </p>
                <p className="font-mono text-sm font-semibold text-black/80">{profileStrength}/100</p>
              </div>
              <motion.div className="h-2 rounded-full bg-black/10">
                <motion.div
                  className="h-2 rounded-full bg-gradient-to-r from-[#2fd281] via-[#57dfaf] to-[#89edca]"
                  initial={{ width: 0 }}
                  animate={{ width: `${profileStrength}%` }}
                  transition={{ duration: 0.42, ease: ENTER_EASE }}
                />
              </motion.div>
            </div>

            <p className="mt-3 text-xs text-black/55">getting your subscriptions to subzro.</p>
          </>
        )}

        <div className="mt-auto flex items-center justify-between pt-5">
          <button
            type="button"
            onClick={previousStep}
            className="rounded-full border border-black/20 bg-white/70 px-5 py-2 text-sm font-medium text-black/75"
          >
            Back
          </button>

          {isAdminUser ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={skipToApp}
                className="rounded-full border border-black/20 bg-white/70 px-4 py-2 text-sm font-medium text-black/75"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={continueToCheckout}
                disabled={!countdownDone}
                className={`rounded-full px-6 py-2 text-sm font-medium text-white ${countdownDone ? "bg-black" : "cursor-not-allowed bg-black/35"
                  }`}
              >
                Unlock savings
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={continueToCheckout}
              disabled={!countdownDone}
              className={`rounded-full px-6 py-2 text-sm font-medium text-white ${countdownDone ? "bg-black" : "cursor-not-allowed bg-black/35"
                }`}
            >
              Unlock savings
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderStepBody() {
    if (step === 0) return renderIntroStep();
    if (step === 1) return renderGreetingStep();
    if (step === 2) return renderEvidenceStep(0);
    if (step === 3) return renderMissionStep();
    if (step === 4) return renderSavingsGapStep();
    if (step === 5) return renderAuditFrequencyStep();
    if (step === 6) return renderSurpriseChargesStep();
    if (step === 7) return renderRiskRevealStep();
    if (step === 8) return renderEvidenceStep(1);
    if (step === 9) return renderCountStep();
    if (step === 10) return renderPriceStep();
    return renderPayoffStep();
  }

  const stepMascot = useMemo(() => {
    if (step === 0) return "/mascot-subzro/officiallogos/officialsubzromascot-removebg-preview.png";
    if (step === 10) {
      if (averagePrice <= 12) return "/mascot-subzro/officiallogos/expressions/mascotexpressioncalm.png";
      if (averagePrice <= 22) return "/mascot-subzro/officiallogos/expressions/mascotexpressionangry.png";
      if (averagePrice <= 32) return "/mascot-subzro/officiallogos/expressions/mascotexpressioncry.png";
      return "/mascot-subzro/officiallogos/expressions/mascotexpressionshocked.png";
    }

    const mascotMap = {
      1: "/mascot-subzro/mascotsitsmile1.webp",
      2: "/mascot-subzro/mascotwinksmile.webp",
      3: "/mascot-subzro/mascotsitsmilewave.webp",
      4: "/mascot-subzro/mascotsleep.webp",
      5: "/mascot-subzro/mascotmove12.webp",
      6: "/mascot-subzro/mascotsitsmile1.webp",
      7: "/mascot-subzro/mascotwinksmile.webp",
      8: "/mascot-subzro/mascoteyesclosedsweat.webp",
      9: "/mascot-subzro/mascotsitsmile2.webp",
      11: "/mascot-subzro/mascotwave.webp",
    };

    return mascotMap[step] || "/mascot-subzro/mascotwink.webp";
  }, [step, averagePrice]);

  const calibrationBackgrounds = {
    3: "from-[#355476] via-[#4f749c] to-[#7098bf]",
    2: "from-[#567ca2] via-[#7fa5ca] to-[#a9c8e5]",
    1: "from-[#87afd3] via-[#b4d1ea] to-[#d7e8f8]",
    0: "from-[#bcd8ef] via-[#dcedfb] to-[#f0f7ff]",
  };

  const backgroundClass =
    step < TOTAL_STEPS - 1
      ? STEP_BACKGROUNDS[step]
      : countdownDone
        ? STEP_BACKGROUNDS[TOTAL_STEPS - 1]
        : calibrationBackgrounds[countdownValue] || calibrationBackgrounds[3];

  const backgroundKey =
    step < TOTAL_STEPS - 1
      ? `bg-${step}`
      : `bg-${step}-${countdownDone ? "done" : countdownValue}`;

  // Full-screen splash takeover — bypass entire layout
  if (step === 0) return renderIntroStep();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={backgroundKey}
          initial={{ opacity: 0.2 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.2 }}
          transition={{ duration: 0.36, ease: ENTER_EASE }}
          className={`absolute inset-0 -z-20 bg-gradient-to-b ${backgroundClass}`}
        />
      </AnimatePresence>

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 left-8 h-56 w-56 rounded-full bg-[#8fdfff]/20 blur-3xl" />
        <div className="absolute bottom-10 right-8 h-56 w-56 rounded-full bg-[#b6ffe1]/18 blur-3xl" />
      </div>

      {/* Hide nav entirely on splash step for full immersion */}
      {step !== 0 && (
        <nav
          className={`sticky top-0 z-40 border-b backdrop-blur-md ${isDarkStep ? "border-white/15 bg-[#0b1a30]/35" : "border-white/30 bg-white/55"
            }`}
        >
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/subzero_logo_icon.png"
                alt="Subzro"
                className="h-7 w-7 rounded-full object-cover"
              />
              <span className={`text-lg font-semibold ${isDarkStep ? "text-white" : "text-black/80"}`}>
                subzro
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <StepProgress step={step - 1} total={TOTAL_STEPS - 1} dark={isDarkStep} />
              <UserButton afterSignOutUrl={window.location.origin} />
            </div>
          </div>
        </nav>
      )}

      <main className={step === 0 ? '' : 'px-4 pb-6 pt-4'}>
        <div className={step === 0 ? '' : 'mx-auto max-w-2xl'}>
          <section
            className={step === 0
              ? ''
              : `relative flex flex-col overflow-hidden rounded-3xl border p-5 shadow-xl sm:p-6 ${isDarkStep
                ? "border-white/20 bg-[#0b1a30]/70 text-white"
                : "border-white/60 bg-white/78 text-black/90"
              }`}
            style={step === 0 ? {} : { minHeight: "calc(100vh - 168px)" }}
          >
            {/* Hide step header on splash for clean full-screen animation */}
            {step !== 0 && (
              <div className="mb-3 flex items-center justify-between gap-4">
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isDarkStep ? "text-[#d3ebff]" : "text-black/55"}`}>
                  Step {step} of {TOTAL_STEPS - 1}
                </p>
                <div className="flex items-center gap-2">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.img
                      key={stepMascot}
                      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 25,
                        mass: 0.5
                      }}
                      src={stepMascot}
                      alt="Zro guide"
                      className={`h-8 w-8 rounded-xl p-0.5 ${isDarkStep ? "border border-white/25 bg-white/10" : "bg-[#ecf8ff]"
                        }`}
                    />
                  </AnimatePresence>
                  {isForced && (
                    <div
                      className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${isDarkStep
                        ? "border-white/35 bg-white/10 text-white"
                        : "border-[#cbe9ff] bg-[#eef8ff] text-black/60"
                        }`}
                    >
                      Admin forced run
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mb-3 rounded-xl bg-white/10 px-3 py-2 text-sm text-[#dbeeff]">
                Zro tip: choose the one that sounds most like your real goal today.
              </div>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                className="flex flex-1 flex-col"
                initial={{ opacity: 0, y: 12, scale: 0.995, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, scale: 0.998, filter: "blur(4px)" }}
                transition={{ duration: 0.2, ease: ENTER_EASE }}
              >
                {renderStepBody()}
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {payoffTransitioning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: ENTER_EASE }}
                  className="pointer-events-none absolute inset-0 z-40 overflow-hidden rounded-3xl"
                >
                  <motion.div
                    initial={{ y: "100%", opacity: 0.5 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.38, ease: ENTER_EASE }}
                    className="absolute inset-0 bg-gradient-to-t from-[#d7eeff] via-[#edf7ff]/95 to-white/40 backdrop-blur-[2px]"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <div className={`mt-4 hidden flex-wrap justify-center gap-4 text-xs sm:flex ${isDarkStep ? "text-white/65" : "text-black/55"}`}>
            <Link to="/impressum" className="hover:opacity-85">
              Impressum
            </Link>
            <Link to="/terms" className="hover:opacity-85">
              Terms
            </Link>
            <Link to="/privacy" className="hover:opacity-85">
              Privacy
            </Link>
            <Link to="/refund" className="hover:opacity-85">
              Refunds
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
