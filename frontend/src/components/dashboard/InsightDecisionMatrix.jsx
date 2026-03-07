import SubscriptionLogo from "../SubscriptionLogos";

function toMonthlyPrice(subscription) {
  if (!subscription) return 0;
  if (typeof subscription.monthlyPrice === "number") return subscription.monthlyPrice;

  const price = Number(subscription.price || 0);
  return subscription.interval === "year" ? price / 12 : price;
}

function getZone(subscription, maxPrice) {
  const normalizedCost = maxPrice > 0 ? subscription.monthlyPrice / maxPrice : 0;
  const normalizedScore = subscription.score / 5;

  if (normalizedCost > 0.58 && normalizedScore < 0.45) return "cut";
  if (normalizedCost > 0.56 || normalizedScore < 0.55) return "review";
  return "keep";
}

const ZONE_STYLES = {
  keep: {
    ring: "ring-emerald-200/80",
    glow: "shadow-[0_18px_34px_rgba(74,222,128,0.18)]",
    label: "Keep",
  },
  review: {
    ring: "ring-amber-200/80",
    glow: "shadow-[0_18px_34px_rgba(245,158,11,0.18)]",
    label: "Review",
  },
  cut: {
    ring: "ring-rose-200/80",
    glow: "shadow-[0_18px_34px_rgba(244,63,94,0.18)]",
    label: "Cut",
  },
};

export default function InsightDecisionMatrix({
  subscriptions = [],
  highlightId = null,
}) {
  const filtered = (subscriptions || [])
    .map((subscription) => ({
      id: subscription._id,
      name: subscription.name,
      monthlyPrice: toMonthlyPrice(subscription),
      score:
        subscription.score === undefined ||
        subscription.score === null ||
        subscription.score === 0
          ? null
          : Number(subscription.score),
    }))
    .filter(
      (subscription) =>
        subscription.monthlyPrice > 0 &&
        subscription.score !== null &&
        Number.isFinite(subscription.score),
    )
    .sort((a, b) => b.monthlyPrice - a.monthlyPrice)
    .slice(0, 8);

  const maxPrice = filtered[0]?.monthlyPrice || 1;

  if (!filtered.length) {
    return (
      <div className="rounded-[32px] border border-white/70 bg-white/55 p-5 shadow-[0_22px_50px_rgba(125,145,189,0.12)] backdrop-blur-xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          Action field
        </div>
        <div
          className="mt-3 max-w-[15ch] text-[1.55rem] leading-[1.08] tracking-[-0.04em] text-slate-800/90"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Complete a few reviews and the field comes alive.
        </div>
      </div>
    );
  }

  const plotted = filtered.map((subscription, index) => {
    const x = (subscription.monthlyPrice / maxPrice) * 68 + 14;
    const y = 78 - Math.min(72, (subscription.score / 5) * 64);
    const zone = getZone(subscription, maxPrice);
    const size = 44 + Math.round((subscription.monthlyPrice / maxPrice) * 18);

    return {
      ...subscription,
      x,
      y,
      zone,
      size,
      order: index,
    };
  });

  const decisionTarget =
    plotted.find((subscription) => subscription.id === highlightId) ||
    plotted.find((subscription) => subscription.zone === "cut") ||
    plotted.find((subscription) => subscription.zone === "review") ||
    plotted[0];

  return (
    <div className="rounded-[32px] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.6)_0%,rgba(245,242,255,0.72)_100%)] p-5 shadow-[0_24px_58px_rgba(125,145,189,0.14)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Action field
          </div>
          <div
            className="mt-3 max-w-[11ch] text-[1.75rem] leading-[1.02] tracking-[-0.05em] text-slate-900"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Cost against conviction.
          </div>
        </div>
        <div className="flex flex-col gap-2 text-[11px] font-semibold text-slate-600">
          <div className="rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3 py-1">
            Keep
          </div>
          <div className="rounded-full border border-amber-200/70 bg-amber-50/80 px-3 py-1">
            Review
          </div>
          <div className="rounded-full border border-rose-200/70 bg-rose-50/80 px-3 py-1">
            Cut
          </div>
        </div>
      </div>

      <div className="relative mt-5 h-[300px] overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(245,247,255,0.82)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
        <div className="absolute inset-0">
          <div className="absolute left-0 top-0 h-1/2 w-1/2 bg-[radial-gradient(circle_at_18%_20%,rgba(74,222,128,0.16)_0,rgba(74,222,128,0)_72%)]" />
          <div className="absolute right-0 top-0 h-1/2 w-1/2 bg-[radial-gradient(circle_at_82%_22%,rgba(245,158,11,0.16)_0,rgba(245,158,11,0)_72%)]" />
          <div className="absolute right-0 bottom-0 h-1/2 w-1/2 bg-[radial-gradient(circle_at_82%_82%,rgba(244,63,94,0.16)_0,rgba(244,63,94,0)_72%)]" />
        </div>

        <div className="absolute inset-x-0 top-1/2 h-px bg-black/6" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-black/6" />

        <div className="absolute left-4 top-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
          Keep
        </div>
        <div className="absolute right-4 top-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700/80">
          Review
        </div>
        <div className="absolute right-4 bottom-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-700/80">
          Cut first
        </div>
        <div className="absolute left-4 bottom-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Low signal
        </div>

        {plotted.map((subscription) => {
          const zoneStyle = ZONE_STYLES[subscription.zone];
          const isHighlighted = subscription.id === decisionTarget.id;

          return (
            <div
              key={subscription.id || subscription.name}
              className="absolute"
              style={{
                left: `${subscription.x}%`,
                top: `${subscription.y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: isHighlighted ? 2 : 1,
              }}
            >
              <div className="relative">
                <div
                  className={`grid place-items-center rounded-full border border-white/80 bg-white/88 ring-4 ${zoneStyle.ring} ${zoneStyle.glow}`}
                  style={{
                    width: `${subscription.size}px`,
                    height: `${subscription.size}px`,
                  }}
                  title={`${subscription.name} • EUR ${subscription.monthlyPrice.toFixed(2)}`}
                >
                  <div className="grid h-[58%] w-[58%] place-items-center rounded-full bg-slate-950/5 text-slate-700">
                    <SubscriptionLogo subscriptionName={subscription.name} />
                  </div>
                </div>

                {isHighlighted ? (
                  <div className="absolute left-1/2 top-[calc(100%+8px)] -translate-x-1/2 whitespace-nowrap rounded-full border border-white/80 bg-slate-950 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_18px_30px_rgba(15,23,42,0.18)]">
                    {subscription.name}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] font-medium text-slate-500">
          Higher monthly cost
        </div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] font-medium text-slate-500">
          Stronger score signal
        </div>
      </div>

      <div className="mt-4 text-sm leading-6 text-slate-600">
        <span style={{ fontFamily: "'Playfair Display', serif" }} className="italic text-slate-800/90">
          {decisionTarget.name}
        </span>{" "}
        sits closest to the clearest decision edge right now.
      </div>
    </div>
  );
}
