import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";

const MODE_META = {
  spend: {
    label: "Spend",
    icon: BanknotesIcon,
    active: "bg-slate-950 text-white shadow-[0_16px_30px_rgba(15,23,42,0.18)]",
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
    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/50 p-1 shadow-[0_18px_40px_rgba(140,160,196,0.14)] backdrop-blur-xl">
      {Object.entries(MODE_META).map(([mode, meta]) => {
        const isActive = activeMode === mode;
        const Icon = meta.icon;

        return (
          <button
            key={mode}
            type="button"
            onClick={() => onModeChange(mode)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
              isActive
                ? meta.active
                : "bg-transparent text-slate-500 hover:bg-white/70 hover:text-slate-800"
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
