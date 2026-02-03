import { useMemo, useState } from "react";
import { useDataContext } from "../contexts/dataContext";
import StatsCard from "../components/StatsCard";
import FinanceInsightsFlow from "../components/FinanceInsightsFlow";
import LoadingButton from "../components/LoadingButton";

export default function FinanceInsights() {
  const { subscriptions, usedCategories, dashboardData } = useDataContext();
  const [flowOpen, setFlowOpen] = useState(false);

  const topCategory = useMemo(() => {
    if (!usedCategories?.length) return null;
    return usedCategories.reduce(
      (prev, curr) => (curr.totalCost > prev.totalCost ? curr : prev),
      usedCategories[0],
    );
  }, [usedCategories]);

  const highestCost = useMemo(() => {
    if (!subscriptions?.length) return null;
    return [...subscriptions].sort((a, b) => b.price - a.price)[0];
  }, [subscriptions]);

  const lowestUsage = useMemo(() => {
    if (!dashboardData?.leastUsed) return null;
    return dashboardData.leastUsed;
  }, [dashboardData]);

  const flowSteps = [
    {
      title: "Define Rich Life",
      body: "Anchor on the number that matters.",
      metric: `Monthly burn: EUR ${dashboardData?.totalCostPerMonth?.toFixed(2) || "0.00"}`,
    },
    {
      title: "Autopilot",
      body: "Get every bill captured.",
      metric: `${subscriptions?.length || 0} subscriptions tracked`,
    },
    {
      title: "Big Wins",
      body: "Attack the biggest leak first.",
      metric: highestCost
        ? `${highestCost.name} EUR ${highestCost.price?.toFixed(2)}`
        : "Insufficient Data",
    },
    {
      title: "Guardrails",
      body: "Stop surprise spend.",
      metric: `Potential savings: EUR ${
        dashboardData?.potentialMonthlySavings?.toFixed(2) || "0.00"
      }`,
    },
    {
      title: "Invest Long Term",
      body: "Keep recurring cost in check.",
      metric: topCategory
        ? `Top category: ${topCategory.name}`
        : "Insufficient Data",
    },
    {
      title: "Checklists",
      body: "Weekly review beats willpower.",
      metric: "Run Financial Reset weekly",
    },
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="rounded-lg border border-black/10 bg-white/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              Personal Finance Flow
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Spotify wrapped style recap. Full screen.
            </div>
          </div>
          <LoadingButton
            onClick={() => setFlowOpen(true)}
            className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white"
          >
            Play Money Wrapped
          </LoadingButton>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {flowSteps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                Step {index + 1}
              </div>
              <div className="mt-2 text-sm font-semibold text-gray-900">
                {step.title}
              </div>
              <div className="mt-1 text-xs text-gray-600">{step.body}</div>
              <div className="mt-3 rounded-xl bg-slate-950/90 px-3 py-2 text-xs font-semibold text-white">
                {step.metric}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard title="Total Subscriptions">
          {subscriptions?.length || 0}
        </StatsCard>
        <StatsCard title="Total Cost Per Month">
          EUR {dashboardData?.totalCostPerMonth?.toFixed(2) || "0.00"}
        </StatsCard>
        <StatsCard title="Potential Savings">
          EUR {dashboardData?.potentialMonthlySavings?.toFixed(2) || "0.00"}
        </StatsCard>
      </div>

      <div className="rounded-lg border border-black/10 bg-white/70 p-4">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
          Hidden Insights
        </div>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          <li>
            Highest cost: {highestCost?.name || "Insufficient Data"}{" "}
            {highestCost ? `EUR ${highestCost.price?.toFixed(2)}` : ""}
          </li>
          <li>
            Top category: {topCategory?.name || "Insufficient Data"}{" "}
            {topCategory ? `EUR ${topCategory.totalCost?.toFixed(2)}` : ""}
          </li>
          <li>
            Least used: {lowestUsage?.name || "Insufficient Data"}
          </li>
          <li>
            Barely used most expensive:{" "}
            {dashboardData?.barelyUsedMostExpensive?.name ||
              "Insufficient Data"}
          </li>
        </ul>
      </div>

      <FinanceInsightsFlow open={flowOpen} onClose={() => setFlowOpen(false)} />
    </div>
  );
}
