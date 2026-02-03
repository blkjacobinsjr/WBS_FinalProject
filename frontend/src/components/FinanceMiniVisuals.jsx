import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ScatterChart,
  Scatter,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

function SkeletonBlock({ className }) {
  return <div className={`skeleton ${className}`} />;
}

function CategoryTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs text-white">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">
        Category
      </div>
      <div className="mt-1 text-sm font-semibold">{item.name}</div>
      <div className="mt-1 text-xs text-white/60">
        EUR {item.value?.toFixed(2)}
      </div>
    </div>
  );
}

function ScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs text-white">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">
        Subscription
      </div>
      <div className="mt-1 text-sm font-semibold">{item.name}</div>
      <div className="mt-1 text-xs text-white/60">
        EUR {item.monthly?.toFixed(2)} | Score {item.score?.toFixed(1)}
      </div>
    </div>
  );
}

export default function FinanceMiniVisuals({
  categories,
  subscriptions,
  dashboardData,
}) {
  const hasCategories = (categories || []).length > 0;
  const hasSubscriptions = (subscriptions || []).length > 0;

  const categoryData = (categories || [])
    .slice()
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 5)
    .map((category) => ({
      name: category.name,
      value: category.totalCost,
    }));

  const activeCount = subscriptions?.filter((sub) => sub.active).length || 0;
  const inactiveCount =
    (subscriptions?.length || 0) -
    (subscriptions?.filter((s) => s.active).length || 0);

  const activeData = [
    { name: "Active", value: activeCount },
    { name: "Inactive", value: inactiveCount },
  ];

  const scatterData = (subscriptions || [])
    .map((sub) => ({
      name: sub.name,
      monthly: sub.monthlyPrice ?? sub.price ?? 0,
      score: sub.score ?? 0,
    }))
    .filter((item) => item.monthly > 0)
    .slice(0, 25);

  const medianCost = scatterData.length
    ? [...scatterData]
        .map((item) => item.monthly)
        .sort((a, b) => a - b)[Math.floor(scatterData.length / 2)]
    : 0;
  const lowUsageThreshold = 2;

  const barelyUsed = dashboardData?.barelyUsedMostExpensive;
  const mostUsed = dashboardData?.mostUsed;

  return (
    <div className="grid gap-3 xl:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-[#0b1020]/90 p-4 text-white shadow-lg shadow-black/30">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
          Spend By Category
        </div>
        <div className="mt-3 h-[220px]">
          {hasCategories ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.6)" }}
                  interval={0}
                  angle={-20}
                  height={40}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.6)" }}
                  tickFormatter={(value) => `€${value}`}
                />
                <Tooltip content={<CategoryTooltip />} />
                <defs>
                  <linearGradient id="barFlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#7dd3fc" />
                  </linearGradient>
                </defs>
                <Bar
                  dataKey="value"
                  fill="url(#barFlow)"
                  radius={[12, 12, 6, 6]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col justify-between">
              <SkeletonBlock className="h-4 w-40 rounded-full" />
              <SkeletonBlock className="h-4 w-32 rounded-full" />
              <SkeletonBlock className="h-4 w-24 rounded-full" />
              <SkeletonBlock className="h-4 w-28 rounded-full" />
              <SkeletonBlock className="h-4 w-20 rounded-full" />
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-white/60">
          {hasCategories ? "Focus on the top bar first." : "Upload data to unlock."}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0b1020]/90 p-4 text-white shadow-lg shadow-black/30">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
          Cost vs Usage Score
        </div>
        <div className="mt-3 h-[220px]">
          {hasSubscriptions ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="monthly"
                  type="number"
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.6)" }}
                  tickFormatter={(value) => `€${value}`}
                />
                <YAxis
                  dataKey="score"
                  type="number"
                  domain={[0, 5]}
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.6)" }}
                />
                <Tooltip content={<ScatterTooltip />} />
                <ReferenceLine
                  y={lowUsageThreshold}
                  stroke="rgba(255,255,255,0.3)"
                  strokeDasharray="4 6"
                />
                <ReferenceLine
                  x={medianCost}
                  stroke="rgba(255,255,255,0.2)"
                  strokeDasharray="4 6"
                />
                <Scatter data={scatterData} fill="#7dd3fc" />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full grid-cols-3 gap-3">
              <SkeletonBlock className="h-full rounded-2xl" />
              <SkeletonBlock className="h-full rounded-2xl" />
              <SkeletonBlock className="h-full rounded-2xl" />
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-white/60">
          {hasSubscriptions
            ? `Barely used: ${barelyUsed?.name || "Insufficient Data"} | Most used: ${
                mostUsed?.name || "Insufficient Data"
              }`
            : "Add subscriptions to reveal usage."}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0b1020]/90 p-4 text-white shadow-lg shadow-black/30">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
          Active vs Inactive
        </div>
        <div className="mt-3 h-[220px]">
          {hasSubscriptions ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeData} layout="vertical">
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.6)" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.6)" }}
                />
                <Tooltip content={<CategoryTooltip />} />
                <Bar dataKey="value" fill="#7dd3fc" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <SkeletonBlock className="h-32 w-32 rounded-full" />
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-white/60">
          {hasSubscriptions
            ? `Active ${activeCount} | Inactive ${inactiveCount}`
            : "No subscriptions yet."}
        </div>
      </div>
    </div>
  );
}
