import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
} from "recharts";

const PIE_COLORS = ["#7dd3fc", "#f472b6"];

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
    (subscriptions?.length || 0) - (subscriptions?.filter((s) => s.active).length || 0);

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

  const barelyUsed = dashboardData?.barelyUsedMostExpensive;
  const mostUsed = dashboardData?.mostUsed;

  return (
    <div className="grid gap-3 xl:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-[#0b1020]/90 p-4 text-white shadow-lg shadow-black/30">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
          Spend By Category
        </div>
        <div className="mt-3 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip content={<CategoryTooltip />} />
              <defs>
                <linearGradient id="barFlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#7dd3fc" />
                </linearGradient>
              </defs>
              <Bar dataKey="value" fill="url(#barFlow)" radius={[12, 12, 6, 6]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-white/60">
          Focus on the top bar first.
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0b1020]/90 p-4 text-white shadow-lg shadow-black/30">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
          Cost vs Usage Score
        </div>
        <div className="mt-3 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <XAxis dataKey="monthly" type="number" hide />
              <YAxis dataKey="score" type="number" hide domain={[0, 5]} />
              <Tooltip content={<ScatterTooltip />} />
              <Scatter data={scatterData} fill="#7dd3fc" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-white/60">
          Barely used: {barelyUsed?.name || "Insufficient Data"} | Most used:{" "}
          {mostUsed?.name || "Insufficient Data"}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0b1020]/90 p-4 text-white shadow-lg shadow-black/30">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
          Active vs Inactive
        </div>
        <div className="mt-3 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={activeData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {activeData.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-white/60">
          Active {activeCount} | Inactive {inactiveCount}
        </div>
      </div>
    </div>
  );
}
