const TONE_STYLES = {
  slate: {
    shell: "bg-white/80 border-black/5",
    label: "text-black/45",
    value: "text-black/85",
    annotation: "text-black/55",
    fill: "from-slate-600 via-slate-700 to-slate-900",
  },
  sky: {
    shell: "bg-sky-50/90 border-sky-100",
    label: "text-sky-700/70",
    value: "text-sky-950",
    annotation: "text-sky-900/65",
    fill: "from-sky-400 via-cyan-400 to-blue-500",
  },
  emerald: {
    shell: "bg-emerald-50/90 border-emerald-100",
    label: "text-emerald-700/70",
    value: "text-emerald-950",
    annotation: "text-emerald-900/65",
    fill: "from-emerald-400 via-teal-400 to-emerald-500",
  },
  rose: {
    shell: "bg-rose-50/90 border-rose-100",
    label: "text-rose-700/70",
    value: "text-rose-950",
    annotation: "text-rose-900/65",
    fill: "from-rose-400 via-orange-300 to-rose-500",
  },
};

export default function VisualKpiTile({
  label,
  value,
  annotation,
  tone = "slate",
  meter = 50,
  icon = null,
}) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.slate;
  const clampedMeter = Math.max(0, Math.min(100, Number(meter) || 0));

  return (
    <div
      className={`rounded-[26px] border p-4 shadow-[0_18px_40px_rgba(125,145,189,0.12)] backdrop-blur-xl ${styles.shell}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${styles.label}`}>
          {label}
        </div>
        {icon ? (
          <div className="grid h-10 w-10 place-items-center rounded-[18px] border border-white/70 bg-white/75 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_20px_rgba(125,145,189,0.12)]">
            {icon}
          </div>
        ) : null}
      </div>
      <div className={`mt-3 text-2xl font-semibold tracking-[-0.04em] ${styles.value}`}>
        {value}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${styles.fill}`}
          style={{ width: `${clampedMeter}%` }}
        />
      </div>
      <div className={`mt-3 text-xs leading-5 ${styles.annotation}`}>
        {annotation}
      </div>
    </div>
  );
}
