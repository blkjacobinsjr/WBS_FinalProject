import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import SubscriptionLogo from "../SubscriptionLogos";
import HeroModeSwitcher from "./HeroModeSwitcher";

const MODE_STYLES = {
  spend: {
    shell:
      "bg-[linear-gradient(165deg,rgba(255,255,255,0.76)_0%,rgba(235,241,255,0.92)_56%,rgba(236,243,255,0.98)_100%)]",
    accent: "text-indigo-700",
    orbA: "bg-indigo-300/30",
    orbB: "bg-sky-200/35",
    stage:
      "bg-[linear-gradient(160deg,rgba(237,243,255,0.98)_0%,rgba(222,232,255,0.96)_100%)]",
    card:
      "bg-[linear-gradient(160deg,rgba(235,242,255,0.94)_0%,rgba(255,255,255,0.78)_100%)]",
  },
  recover: {
    shell:
      "bg-[linear-gradient(165deg,rgba(255,255,255,0.76)_0%,rgba(234,250,244,0.94)_58%,rgba(239,246,255,0.98)_100%)]",
    accent: "text-emerald-700",
    orbA: "bg-emerald-200/35",
    orbB: "bg-sky-200/30",
    stage:
      "bg-[linear-gradient(160deg,rgba(232,252,243,0.98)_0%,rgba(226,240,255,0.96)_100%)]",
    card:
      "bg-[linear-gradient(160deg,rgba(240,255,248,0.94)_0%,rgba(255,255,255,0.8)_100%)]",
  },
  future: {
    shell:
      "bg-[linear-gradient(165deg,rgba(255,255,255,0.76)_0%,rgba(238,240,255,0.94)_58%,rgba(250,239,255,0.98)_100%)]",
    accent: "text-violet-700",
    orbA: "bg-violet-200/35",
    orbB: "bg-pink-200/30",
    stage:
      "bg-[linear-gradient(160deg,rgba(236,239,255,0.98)_0%,rgba(244,233,255,0.96)_100%)]",
    card:
      "bg-[linear-gradient(160deg,rgba(243,242,255,0.94)_0%,rgba(255,255,255,0.8)_100%)]",
  },
};

const CHIP_POSITIONS = [
  "left-[-2px] top-3",
  "right-[-6px] top-[30px]",
  "right-[2px] bottom-[10px]",
];

function formatMoney(value) {
  if (!value) return "€0";
  return `€${Math.round(value).toLocaleString()}`;
}

function toVisualChips(model) {
  return [
    model.biggestLeak?.name
      ? {
          key: "leak",
          name: model.biggestLeak.name,
          label: "Leak",
          value: Math.round(model.biggestLeak.monthlyPrice || 0),
        }
      : null,
    model.mostUsed?.name
      ? {
          key: "keep",
          name: model.mostUsed.name,
          label: "Keep",
          value: Math.round(model.mostUsed.monthlyPrice || 0),
        }
      : null,
    model.leastUsed?.name
      ? {
          key: "watch",
          name: model.leastUsed.name,
          label: "Watch",
          value: Math.round(model.leastUsed.monthlyPrice || 0),
        }
      : null,
  ].filter(Boolean);
}

function MascotStage({ activeMode, mascotSrc, chips }) {
  const modeStyle = MODE_STYLES[activeMode] || MODE_STYLES.recover;

  return (
    <div className="relative h-[184px] w-[148px] shrink-0">
      <div
        className={`absolute left-1/2 top-6 z-0 h-20 w-20 -translate-x-1/2 rounded-full blur-3xl ${modeStyle.orbA}`}
      />
      <div
        className={`absolute right-2 top-12 z-0 h-16 w-16 rounded-full blur-3xl ${modeStyle.orbB}`}
      />
      <div
        className="absolute left-1/2 top-[66%] z-[1] h-[42px] w-[96px] rounded-[24px] border border-white/65 bg-white/55 shadow-[0_24px_36px_rgba(134,156,196,0.18)] backdrop-blur-xl"
        style={{
          transform: "translateX(-50%) rotate(-14deg)",
        }}
      />
      <div
        className={`absolute left-1/2 top-[34%] z-10 flex h-[108px] w-[108px] items-center justify-center rounded-[32px] border border-white/70 shadow-[0_24px_50px_rgba(122,145,189,0.22)] backdrop-blur-xl ${modeStyle.stage}`}
        style={{
          transform: "translateX(-50%) rotate(12deg)",
        }}
      >
        <div
          className={`flex h-[92px] w-[92px] items-center justify-center rounded-[28px] border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_30px_rgba(119,138,179,0.18)] ${modeStyle.card}`}
          style={{
            transform: "rotate(-12deg)",
          }}
        >
          <img
            src={mascotSrc}
            alt="Subzro mascot"
            className="h-[74px] w-[74px] object-contain drop-shadow-[0_10px_18px_rgba(91,112,152,0.18)]"
          />
        </div>
      </div>

      {chips.map((chip, index) => (
        <div
          key={chip.key}
          className={`absolute z-[4] ${CHIP_POSITIONS[index]} rounded-full border border-white/82 bg-white/78 px-2 py-1.5 shadow-[0_16px_34px_rgba(112,132,173,0.14)] backdrop-blur-xl`}
        >
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-950/5 text-slate-700 ring-1 ring-black/5">
              <SubscriptionLogo subscriptionName={chip.name} />
            </div>
            <div className="leading-none">
              <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {chip.label}
              </div>
              <div className="mt-1 text-[10px] font-semibold text-slate-800">
                €{chip.value}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const MASCOT_BY_MODE = {
  spend: "/mascot-subzro/officiallogos/expressions/mascotexpressioncalm.png",
  recover:
    "/mascot-subzro/officiallogos/officialsubzromascot-removebg-preview.png",
  future: "/mascot-subzro/mascotsitsmilewave.webp",
};

export default function ControlHero({
  greeting,
  firstName,
  model,
  activeMode,
  onModeChange,
  onPrimaryAction,
  headerAccessory,
}) {
  const reduceMotion = useReducedMotion();
  const current = model.current;
  const mascotSrc = MASCOT_BY_MODE[activeMode] || MASCOT_BY_MODE.recover;
  const modeStyle = MODE_STYLES[activeMode] || MODE_STYLES.recover;
  const chips = toVisualChips(model).slice(0, 3);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500/70">
            Dashboard home
          </div>
          <h1 className="mt-2 max-w-[10ch] text-[1.96rem] font-semibold leading-[0.95] tracking-[-0.06em] text-slate-950">
            {greeting}, {firstName}.
          </h1>
        </div>
        {headerAccessory ? <div className="shrink-0 pt-0.5">{headerAccessory}</div> : null}
      </div>

      <HeroModeSwitcher activeMode={activeMode} onModeChange={onModeChange} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeMode}
          initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.985 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -10, scale: 0.985 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={`relative overflow-hidden rounded-[36px] border border-white/70 p-5 shadow-[0_28px_60px_rgba(126,146,189,0.2)] backdrop-blur-[24px] ${modeStyle.shell}`}
        >
          <div className="absolute inset-0 opacity-65">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 18% 14%, rgba(255,255,255,0.92) 0, rgba(255,255,255,0) 34%), radial-gradient(circle at 82% 16%, rgba(196,225,255,0.36) 0, rgba(196,225,255,0) 26%), radial-gradient(circle at 70% 86%, rgba(247,222,255,0.34) 0, rgba(247,222,255,0) 28%)",
              }}
            />
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(15,23,42,0.08) 0.7px, transparent 0.7px)",
                backgroundSize: "10px 10px",
                maskImage:
                  "linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.06) 70%, transparent)",
              }}
            />
          </div>

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {current.eyebrow}
            </div>
            <div className="mt-3 text-[3.1rem] font-semibold leading-[0.92] tracking-[-0.07em] text-slate-950">
              {formatMoney(current.value)}
            </div>
            <div className={`mt-2 text-sm font-semibold ${modeStyle.accent}`}>
              {current.detail}
            </div>
            <div className="mt-4 max-w-[16ch] text-[1rem] leading-7 text-slate-700/88">
              {current.takeaway}
            </div>
          </div>

            <MascotStage activeMode={activeMode} mascotSrc={mascotSrc} chips={chips} />
          </div>

          <div className="relative mt-6 rounded-[28px] border border-white/70 bg-white/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_18px_36px_rgba(135,153,193,0.12)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Do next
                </div>
                <div className="mt-2 max-w-[20ch] text-sm leading-6 text-slate-700">
                  {current.action.helper}
                </div>
              </div>
          <button
            type="button"
            onClick={() => onPrimaryAction(current.action)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-950 px-3 py-2 text-[14px] font-semibold text-white shadow-[0_18px_32px_rgba(15,23,42,0.2)] transition-transform duration-150 active:scale-[0.98]"
          >
            {current.action.label}
            <ArrowRightIcon className="h-[14px] w-[14px]" />
          </button>
        </div>

            <div className="mt-4 border-t border-black/5 pt-4 text-sm leading-6 text-slate-600">
              <span style={{ fontFamily: "'Playfair Display', serif" }} className="italic text-slate-700/85">
                {current.supportingNote}
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
