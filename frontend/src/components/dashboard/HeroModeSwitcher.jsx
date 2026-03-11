import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";

const MODE_META = {
  spend: {
    label: "Spend",
    icon: BanknotesIcon,
    active:
      "bg-slate-950 text-white shadow-[0_16px_30px_rgba(15,23,42,0.18)] dark:bg-white dark:text-slate-950",
  },
  recover: {
    label: "Recover",
    icon: SparklesIcon,
    active:
      "bg-[linear-gradient(135deg,rgba(214,255,236,0.96)_0%,rgba(222,246,255,0.96)_100%)] text-emerald-800 shadow-[0_16px_30px_rgba(74,222,128,0.16)]",
  },
  future: {
    label: "Future",
    icon: ArrowTrendingUpIcon,
    active:
      "bg-[linear-gradient(135deg,rgba(233,239,255,0.96)_0%,rgba(248,235,255,0.96)_100%)] text-indigo-800 shadow-[0_16px_30px_rgba(129,140,248,0.16)]",
  },
};

export default function HeroModeSwitcher({ activeMode, onModeChange }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/50 p-1 shadow-[0_18px_40px_rgba(140,160,196,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-white/8 dark:shadow-[0_18px_36px_rgba(7,10,24,0.18)]">
      {Object.entries(MODE_META).map(([mode, meta]) => {
        const isActive = activeMode === mode;
        const Icon = meta.icon;

        return (
          <button
            key={mode}
            type="button"
            onClick={() => onModeChange(mode)}
            className={`btn-press tap-target-44 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold ${
              isActive
                ? meta.active
                : "interactive-hover-bg interactive-hover-color bg-transparent text-slate-500 [--hover-bg:rgba(255,255,255,0.7)] [--hover-color:rgba(30,41,59,1)] dark:text-white/46 dark:[--hover-bg:rgba(255,255,255,0.1)] dark:[--hover-color:rgba(255,255,255,0.82)]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
