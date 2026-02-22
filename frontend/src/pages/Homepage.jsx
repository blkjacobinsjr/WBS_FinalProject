import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import Grainient from "../components/ui/Grainient";
import BlurText from "../components/ui/BlurText";
import FadeIn from "../components/ui/FadeIn";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

/* ─── Logosphere: Hyper-performant interactive logo cluster ─── */
const LOGO_DOMAINS = [
  "spotify.com", "netflix.com", "amazon.com", "disneyplus.com",
  "youtube.com", "apple.com", "openai.com", "google.com",
  "notion.so", "slack.com", "dropbox.com", "hulu.com",
  "hbo.com", "twitch.tv", "canva.com", "adobe.com",
  "microsoft.com", "github.com", "zoom.us", "replit.com",
  "figma.com", "stripe.com", "shopify.com", "airbnb.com",
  "uber.com", "headspace.com", "duolingo.com", "tinder.com",
  "bumble.com", "hellofresh.com", "audible.com", "masterclass.com"
];

function InteractiveLogosphere({ isMobile = false }) {
  const { scrollY } = useScroll();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    setMousePos({
      x: (clientX / innerWidth - 0.5) * 60,
      y: (clientY / innerHeight - 0.5) * 60,
    });
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Smoothen the interactions
  const smoothMouseX = useSpring(mousePos.x, { damping: 35, stiffness: 100 });
  const smoothMouseY = useSpring(mousePos.y, { damping: 35, stiffness: 100 });

  // Scroll parallax for mobile/desktop
  const scrollParallax = useTransform(scrollY, [0, 500], [0, -100]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {LOGO_DOMAINS.map((domain, i) => {
        // Deterministic but "random" distribution
        const top = `${(i * 17) % 85 + 7}%`;
        const left = `${(i * 23) % 85 + 7}%`;

        // Varying depth layers (i < 3 is Lens Blur, then % 8 for others)
        let size, blur, opacity, depth, zIndex;

        if (i < 3) {
          size = 120 + (i * 30);
          blur = 7 + i * 2;
          opacity = 0.12;
          depth = 2.0;
          zIndex = 50;
        } else if (i % 8 === 0) { // Foreground bokeh
          size = 64 + (i % 3) * 24;
          blur = 3 + (i % 2) * 2.5;
          opacity = 0.18;
          depth = 1.6;
          zIndex = 40;
        } else if (i % 8 < 4) { // Midground
          size = 32 + (i % 4) * 8;
          blur = 0.2;
          opacity = 0.38;
          depth = 0.8;
          zIndex = 30;
        } else { // Background
          size = 18 + (i % 3) * 5;
          blur = 1.8;
          opacity = 0.15;
          depth = 0.4;
          zIndex = 10;
        }

        return (
          <motion.div
            key={domain + i}
            className="absolute flex items-center justify-center select-none"
            style={{
              top,
              left,
              width: size,
              height: size,
              opacity,
              filter: `blur(${blur}px)`,
              zIndex,
              x: useTransform(smoothMouseX, (x) => x * depth),
              y: useTransform(smoothMouseY, (y) => y * depth + (isMobile ? i * -2 : 0)),
              translateY: isMobile ? scrollParallax : 0
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, (i % 2 === 0 ? 12 : -12), 0],
            }}
            transition={{
              duration: 7 + (i % 5) * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1
            }}
          >
            <img
              src={`https://img.logo.dev/${domain}?token=pk_fg7nZQ2oQQK-tZnjxKWfPQ`}
              alt=""
              className="w-full h-full object-contain rounded-xl shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20"
              loading="lazy"
            />
          </motion.div>
        );
      })}
    </div>
  );
}


/* ─── tiny reusable: counter that animates on scroll ─── */
function AnimatedCounter({ end, suffix = "", prefix = "", duration = 1600 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - t, 3);
            setCount(Math.round(ease * end));
            if (t < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {prefix}{count}{suffix}
    </span>
  );
}

const BRETT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,500;1,600&display=swap');
  
  .font-serif {
    font-family: 'Playfair Display', serif;
  }

  .text-gradient {
    background: linear-gradient(135deg, #000000 0%, #434343 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .liquid-button {
    position: relative;
    overflow: hidden;
    transition: all 0.15s ease-in-out;
    background: #000;
    color: #fff;
  }

  .liquid-button:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }

  .liquid-button::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.15s ease-in-out;
    pointer-events: none;
  }

  .liquid-button:hover::after {
    opacity: 1;
  }

  .tactile-card {
    transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
  }

  .tactile-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.05);
    opacity: 1 !important;
  }

  .screenshot-hover {
    transition: all 0.5s cubic-bezier(0.2, 0, 0, 1);
  }

  .screenshot-hover:hover {
    transform: translateY(-10px) rotate3d(1, 1, 1, 2deg);
  }
`;

export default function Homepage() {
  const [menuOpen, setMenuOpen] = useState(false);

  /* ─── feature walkthrough data ─── */
  const featureSections = [
    {
      badge: "Dashboard",
      title: (
        <>
          Your full picture, <i className="font-serif italic font-medium">one glance</i>
        </>
      ),
      description:
        "See every active subscription, your total monthly spend, and what you could save—all on a single screen. No more guessing where the money went.",
      screenshot: "/newproductscreenshots/dashboard.png",
      mascot: "/mascot-subzro/mascotsitsmilewave.webp",
    },
    {
      badge: "Insights",
      title: (
        <>
          Know <i className="font-serif italic font-medium">exactly</i> where it goes
        </>
      ),
      description:
        "Your Spend-O-Meter shows how you compare to the average. Spot your most & least used services, highlight the barely-used ones draining your wallet, and identify savings instantly.",
      screenshot: "/newproductscreenshots/insightsoverview.png",
      mascot: "/mascot-subzro/mascotwink.webp",
    },
    {
      badge: "Analytics",
      title: (
        <>
          Deeper insights, <i className="font-serif italic font-medium">smarter choices</i>
        </>
      ),
      description:
        "Visualise your highest-spend categories, track individual subscription costs over time, and make confident decisions about what stays and what goes.",
      screenshot: "/newproductscreenshots/insightsmix.png",
      mascot: "/mascot-subzro/mascotlaugh.webp",
    },
    {
      badge: "Manage",
      title: (
        <>
          All your subscriptions, <i className="font-serif italic font-medium">organised</i>
        </>
      ),
      description:
        "Search, filter, and manage every subscription in one place. Each service is scored so you can spot which ones truly spark joy—and which are just noise.",
      screenshot: "/newproductscreenshots/addsubscreenshot.png",
      mascot: "/mascot-subzro/mascotwave.webp",
    },
  ];

  const whyCards = [
    {
      icon: "✨",
      title: "Takes 3 Minutes",
      description: "Quick setup. Immediate clarity on your recurring spend.",
    },
    {
      icon: "🔒",
      title: "Private & Secure",
      description: "Your data stays yours. No bank connections needed to start.",
    },
    {
      icon: "🎯",
      title: "Joy-Based Scoring",
      description: "Each subscription gets a score—keep what sparks joy, freeze the rest.",
    },
    {
      icon: "💜",
      title: "Lifetime Plan",
      description: "Pay once, keep it forever. No monthly fees, no hidden costs.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#e8e4f0] font-sans selection:bg-purple-100 selection:text-purple-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,500;1,600&display=swap');
        
        .font-serif {
          font-family: 'Playfair Display', serif;
        }

        .liquid-button {
          position: relative;
          overflow: hidden;
          transition: all 0.15s ease-in-out;
        }

        .liquid-button:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3);
        }

        .liquid-button::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.15s ease-in-out;
          pointer-events: none;
        }

        .liquid-button:hover::after {
          opacity: 1;
        }

        .tactile-card {
          transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
        }

        .tactile-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.05);
          background: rgba(255, 255, 255, 0.6);
          opacity: 1 !important;
        }

        .screenshot-hover {
          transition: all 0.5s cubic-bezier(0.2, 0, 0, 1);
        }

        .screenshot-hover:hover {
          transform: translateY(-10px) rotate3d(1, 1, 1, 1deg);
        }
      `}</style>
      <div className="fixed inset-0 -z-10">
        <Grainient />
      </div>

      {/* ═══════════════════════════════  NAV  ═══════════════════════════════ */}
      <nav className="sticky top-0 z-50 border-b border-white/20 bg-white/40 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/subzero_logo_icon.png" alt="Subzro" className="h-7 w-7" />
            <span className="text-lg font-semibold text-black/80">subzro</span>
          </Link>
          <div className="relative flex items-center gap-2 whitespace-nowrap">
            <SignedOut>
              <Link to="/login" className="px-3 py-2 text-sm font-medium text-black/60 transition-colors hover:text-black sm:px-4">Sign in</Link>
              <Link to="/signup" className="liquid-button rounded-full bg-black px-5 py-2.5 text-sm font-semibold tracking-tight text-white shadow-md">
                Get Started
              </Link>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard" className="liquid-button rounded-full bg-black px-5 py-2.5 text-sm font-semibold tracking-tight text-white shadow-md">Dashboard</Link>
              <UserButton afterSignOutUrl={window.location.origin} />
            </SignedIn>
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
              className="grid h-9 w-9 place-content-center rounded-full bg-white/65 transition hover:bg-white/80"
            >
              <span
                className={`block h-[2px] w-4 bg-black transition duration-200 ${menuOpen ? "translate-y-[4px] rotate-45" : ""
                  }`}
              />
              <span
                className={`mt-[4px] block h-[2px] w-4 bg-black transition duration-200 ${menuOpen ? "-translate-y-[2px] -rotate-45" : ""
                  }`}
              />
            </button>
            <div
              className={`absolute right-0 top-12 w-44 overflow-hidden rounded-2xl border border-white/30 bg-white/85 p-2 shadow-xl backdrop-blur-md transition-all duration-200 ${menuOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
                }`}
            >
              <Link to="/pricing" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-medium text-black/80 transition hover:bg-white">Pricing</Link>
              <Link to="/impressum" onClick={() => setMenuOpen(false)} className="mt-1 block rounded-xl px-3 py-2 text-sm font-medium text-black/70 transition hover:bg-white">Impressum</Link>
              <Link to="/privacy" onClick={() => setMenuOpen(false)} className="mt-1 block rounded-xl px-3 py-2 text-sm font-medium text-black/70 transition hover:bg-white">Privacy</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════  HERO  ═══════════════════════════════ */}
      <section className="relative overflow-hidden px-4 pt-16 pb-8 sm:pt-24 sm:pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left: copy */}
            <div className="text-center lg:text-left">


              <BlurText
                text="Zero in on What Matters"
                delay={80}
                className="mb-4 text-4xl font-bold tracking-tight text-black/90 sm:text-5xl md:text-6xl"
              />

              <FadeIn delay={0.3}>
                <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-black/70 lg:mx-0 lg:text-xl">
                  Your personal finance pet quietly tracks every <i className="font-serif italic font-medium">recurring charge</i>.
                  <strong className="text-black/90 block mt-6 text-xl sm:text-2xl">Keep what sparks joy.</strong>
                  <span className="text-black/40 block mt-1">Freeze what doesn't.</span>
                </p>
              </FadeIn>

              <FadeIn delay={0.5}>
                <div className="flex flex-col items-center gap-6 sm:flex-row lg:justify-start">
                  <Link
                    to="/signup"
                    className="liquid-button rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-purple-500/25 hover:scale-[1.02]"
                  >
                    Get Lifetime Access — Pay Once
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-6 py-3.5 text-sm font-medium text-black/70 backdrop-blur-sm transition hover:bg-white/70"
                  >
                    I have an account →
                  </Link>
                </div>
              </FadeIn>

              {/* Mobile Easter Egg: Leaning mascot & logosphere stacked below text */}
              <FadeIn delay={0.7} className="lg:hidden relative mt-12 h-[350px] w-full">
                <div className="relative h-full w-full overflow-hidden rounded-2xl">
                  {/* The Leaning Mascot - Mobile version (Left Aligned) */}
                  <div className="absolute top-[15%] left-[-5%] z-0 w-[65%] transform -rotate-6 opacity-0 animate-[fadeIn_1.5s_ease-out_1s_forwards]">
                    <img
                      src="/mascot-subzro/officiallogos/officialsubzromascot-removebg-preview (1).png"
                      alt=""
                      className="w-full filter brightness-105 contrast-110 saturate-125 animate-float-slow"
                      style={{
                        maskImage: 'linear-gradient(to top, black 80%, transparent 100%)',
                        filter: 'blur(0.5px) drop-shadow(0 0 15px rgba(255,255,255,0.2))'
                      }}
                    />
                  </div>

                  <div className="absolute inset-x-2 bottom-0 z-[1]">
                    <img
                      src="/newproductscreenshots/3Ddashboardlandscape.png"
                      alt="Subzro Dashboard preview"
                      className="w-full rounded-xl opacity-95 drop-shadow-[0_20px_35px_rgba(0,0,0,0.22)]"
                      loading="lazy"
                    />
                  </div>

                  <div className="absolute inset-0 pointer-events-none">
                    <InteractiveLogosphere isMobile={true} />
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Right: hero screenshot - Desktop only */}
            <FadeIn delay={0.6} direction="up" className="hidden lg:block lg:absolute lg:right-[-12%] lg:top-[12%] lg:w-[65%] lg:z-10">
              <div className="relative mx-auto lg:max-w-none">
                {/* The 'How tf' Mascot & Logosphere Easter Egg */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <InteractiveLogosphere />

                  {/* The Leaning Mascot */}
                  <div className="absolute bottom-[24%] left-[12%] z-0 w-[16%] transform -rotate-6 opacity-0 animate-[fadeIn_1.5s_ease-out_1s_forwards]">
                    <img
                      src="/mascot-subzro/officiallogos/officialsubzromascot-removebg-preview (1).png"
                      alt=""
                      className="w-full filter brightness-105 contrast-110 saturate-125 animate-float-slow"
                      style={{
                        maskImage: 'linear-gradient(to top, black 80%, transparent 100%)',
                        filter: 'blur(0.5px) drop-shadow(0 0 15px rgba(255,255,255,0.2))'
                      }}
                    />
                  </div>
                </div>

                <img
                  src="/newproductscreenshots/3Ddashboardlandscapesuper.png"
                  alt="Subzro Dashboard"
                  className="relative z-10 w-full drop-shadow-[0_25px_50px_rgba(0,0,0,0.25)] scale-110 lg:scale-[1.35] transition-transform duration-700 hover:scale-[1.4]"
                />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 sm:py-32">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            { static: "Thousands", label: "spent yearly on subscriptions" },
            { value: 40, suffix: "%", label: "goes to forgotten services" },
            { static: "Privacy First", label: "No bank connection needed" },
          ].map((stat, i) => (
            <FadeIn key={i} delay={0.1 * i}>
              <div className="tactile-card rounded-[32px] border border-white/30 bg-white/40 p-8 text-center backdrop-blur-md transition-all">
                <p className="text-3xl font-bold text-black/90">
                  {stat.static ? (
                    stat.static
                  ) : (
                    <AnimatedCounter end={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  )}
                </p>
                <p className="mt-1 text-sm text-black/60 uppercase tracking-wide">{stat.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ═══════════════════════  "WHAT CAN YOU DO?" WALKTHROUGH  ═══════════════════════ */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <h2 className="mb-3 text-center text-3xl font-bold text-black/90 sm:text-4xl">
              What can you do with Subzro?
            </h2>
            <p className="mx-auto mb-16 max-w-xl text-center text-black/55">
              Everything you need to understand, manage, and optimise your subscriptions—
              all in one beautifully simple place.
            </p>
          </FadeIn>

          <div className="space-y-24">
            {featureSections.map((feat, i) => {
              const isReversed = i % 2 === 1;
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-8 lg:flex-row lg:gap-14 ${isReversed ? "lg:flex-row-reverse" : ""
                    }`}
                >
                  {/* Phone screenshot */}
                  <FadeIn delay={0.15} direction={isReversed ? "left" : "right"}>
                    <div className="relative mx-auto w-[260px] flex-shrink-0 sm:w-[300px]">
                      <div className="overflow-hidden p-1.5 drop-shadow-2xl">
                        <img
                          src={feat.screenshot}
                          alt={feat.title}
                          className="w-full rounded-[1.6rem]"
                        />
                      </div>
                      {/* Mascot peeking */}
                      <img
                        src={feat.mascot}
                        alt=""
                        className="absolute -bottom-4 -right-4 h-14 w-14 rounded-full drop-shadow-md sm:h-16 sm:w-16"
                      />
                    </div>
                  </FadeIn>

                  {/* Copy */}
                  <FadeIn delay={0.3}>
                    <div className={`max-w-md ${isReversed ? "lg:text-right" : "lg:text-left"} text-center`}>
                      <span className="mb-3 inline-block rounded-full border border-purple-200 bg-white/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-purple-700 backdrop-blur-sm">
                        {feat.badge}
                      </span>
                      <h3 className="mb-3 text-2xl font-bold text-black/90 sm:text-3xl">
                        {feat.title}
                      </h3>
                      <p className="text-base leading-relaxed text-black/60">
                        {feat.description}
                      </p>
                    </div>
                  </FadeIn>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════  "STILL USING THIS?"  NUDGE  ═══════════════════════ */}
      <section className="py-32 px-6 sm:py-48">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-purple-800">The Gentle Nudge</p>
            <h2 className="text-4xl font-bold text-black/90 sm:text-5xl">
              "Are you <i className="font-serif italic font-medium">still</i> using this?"
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-black/60 leading-relaxed">
              Inspired by Netflix's "still watching?" prompt, Subzro gently checks in on your subscriptions—so
              nothing slips through the cracks.
            </p>
          </FadeIn>
          <FadeIn delay={0.3} direction="up">
            <div className="screenshot-hover mx-auto mt-20 max-w-sm overflow-hidden rounded-[40px] border border-black/[0.05] bg-white/40 p-2 shadow-2xl backdrop-blur-xl transition-all">
              <img src="/ReminderModalplain.png" alt="Usage reminder" className="w-full rounded-[34px]" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════  WHY SUBZRO?  ═══════════════════════ */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <h2 className="mb-3 text-center text-3xl font-bold text-black/90">Why Subzro?</h2>
            <p className="mb-12 text-center text-black/55">
              Designed for anyone who wants to understand their spending—and take control of it.
            </p>
          </FadeIn>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
            {whyCards.map((card, i) => (
              <FadeIn key={i} delay={0.1 * i}>
                <div className="group rounded-2xl border border-white/30 bg-white/40 p-6 backdrop-blur-sm transition-all hover:bg-white/55 hover:shadow-lg hover:-translate-y-1">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/60 text-2xl transition group-hover:scale-110">
                    {card.icon}
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-black/90">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-black/55">{card.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════  INCLUSIVE BAND  ═══════════════════════ */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100/40 via-pink-50/30 to-blue-100/40" />
        <div className="relative mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-8 md:flex-row md:gap-12">
            <FadeIn delay={0.1}>
              <div className="flex-shrink-0">
                <img
                  src="/mascot-subzro/mascotsitsmilewave.webp"
                  alt="Subzro mascot waving"
                  className="h-36 w-36 sm:h-44 sm:w-44"
                />
              </div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div>
                <h2 className="mb-4 text-3xl font-bold text-black/90">
                  Built for everyone, not just finance bros
                </h2>
                <p className="mb-4 max-w-lg text-base leading-relaxed text-black/60">
                  Whether you're a student juggling streaming services, a professional managing tools & memberships,
                  or a parent keeping household subscriptions in check—Subzro is your calm, no-judgement companion.
                </p>
                <p className="text-sm text-black/45">
                  Your money, your rules. We just make it easier to see the full picture.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════════════  HOW IT WORKS (PRIME FOR ONBOARDING)  ═══════════════════════ */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <p className="mb-3 text-sm font-medium uppercase tracking-wider text-purple-800">How it works</p>
            <h2 className="mb-12 text-3xl font-bold text-black/90">Three steps to clarity</h2>
          </FadeIn>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                step: "1",
                emoji: "📝",
                title: "Tell us about you",
                description: "A quick, friendly onboarding—no bank login required. Just the basics.",
              },
              {
                step: "2",
                emoji: "📊",
                title: "See your full picture",
                description: "Your dashboard lights up with every subscription, cost, and insight.",
              },
              {
                step: "3",
                emoji: "❄️",
                title: "Freeze, keep, or act",
                description: "Decide what sparks joy. Freeze what doesn't. Save without sacrifice.",
              },
            ].map((s, i) => (
              <FadeIn key={i} delay={0.15 * i}>
                <div className="rounded-2xl border border-white/30 bg-white/40 p-6 backdrop-blur-sm">
                  <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white shadow-md">
                    {s.step}
                  </div>
                  <div className="mb-2 text-2xl">{s.emoji}</div>
                  <h3 className="mb-2 text-base font-semibold text-black/90">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-black/55">{s.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════  FINAL CTA  ═══════════════════════ */}
      <section className="py-32 px-6 sm:py-64">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <div className="rounded-[48px] border border-black/[0.05] bg-white/40 p-12 sm:p-24 backdrop-blur-2xl shadow-[0_50px_100px_rgba(0,0,0,0.08)]">
              <img
                src="/mascot-subzro/mascotlaugh.webp"
                alt="Subzro mascot"
                className="mx-auto mb-10 h-24 w-24 rounded-full border-4 border-white bg-white/80 p-2 shadow-2xl transition-transform hover:scale-110 hover:rotate-6"
              />
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-purple-800 tracking-wide">Lifetime Plan — Pay Once</span>
              </div>
              <h2 className="mb-6 text-4xl font-bold text-black/90 leading-tight">
                Your future self <br />
                <i className="font-serif italic font-medium">will thank you</i>
              </h2>
              <p className="mx-auto mb-10 max-w-md text-lg text-black/60 leading-relaxed">
                Take control of your spending in minutes.
                <br />
                <span className="text-sm text-black/45 italic">No bank connections. No monthly fees.</span>
              </p>
              <Link
                to="/signup"
                className="liquid-button inline-flex items-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:shadow-purple-500/25 hover:scale-[1.02]"
              >
                Get Lifetime Access Now →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════  FOOTER  ═══════════════════════ */}
      <footer className="border-t border-white/20 py-8 px-4">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/subzero_logo_icon.png" alt="Subzro" className="h-5 w-5 opacity-60" />
            <span className="text-sm text-black/50">© 2025 Subzro</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-black/50">
            <Link to="/pricing" className="transition hover:text-black/80">Pricing</Link>
            <Link to="/impressum" className="transition hover:text-black/80">Impressum</Link>
            <Link to="/terms" className="transition hover:text-black/80">Terms</Link>
            <Link to="/privacy" className="transition hover:text-black/80">Privacy</Link>
            <Link to="/refund" className="transition hover:text-black/80">Refunds</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
