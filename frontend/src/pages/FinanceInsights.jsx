import { useMemo, useState } from "react";
import { useDataContext } from "../contexts/dataContext";
import StatsCard from "../components/StatsCard";
import FinanceInsightsFlow from "../components/FinanceInsightsFlow";
import FlowChartVisual from "../components/FlowChartVisual";
import FinanceMiniVisuals from "../components/FinanceMiniVisuals";
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

  const flowData = [
    {
      step: 1,
      y: 1,
      short: "Rich Life",
      label: flowSteps[0].title,
      body: flowSteps[0].body,
      metric: flowSteps[0].metric,
    },
    {
      step: 2,
      y: 1,
      short: "Autopilot",
      label: flowSteps[1].title,
      body: flowSteps[1].body,
      metric: flowSteps[1].metric,
    },
    {
      step: 3,
      y: 1,
      short: "Big Wins",
      label: flowSteps[2].title,
      body: flowSteps[2].body,
      metric: flowSteps[2].metric,
    },
    {
      step: 4,
      y: 1,
      short: "Guardrails",
      label: flowSteps[3].title,
      body: flowSteps[3].body,
      metric: flowSteps[3].metric,
    },
    {
      step: 5,
      y: 1,
      short: "Invest",
      label: flowSteps[4].title,
      body: flowSteps[4].body,
      metric: flowSteps[4].metric,
    },
    {
      step: 6,
      y: 1,
      short: "Checklist",
      label: flowSteps[5].title,
      body: flowSteps[5].body,
      metric: flowSteps[5].metric,
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
              Visual walkthrough with annotated metrics.
            </div>
          </div>
          <LoadingButton
            onClick={() => setFlowOpen(true)}
            className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white"
          >
            Play Money Wrapped
          </LoadingButton>
        </div>

        <div className="mt-4">
          {subscriptions?.length ? (
            <FlowChartVisual data={flowData} />
          ) : (
            <div className="flex h-[260px] items-center justify-center rounded-2xl border border-black/10 bg-white/80">
              <div className="flex flex-col items-center gap-2 text-xs text-gray-600">
                <div className="skeleton h-4 w-40 rounded-full" />
                <div className="skeleton h-3 w-28 rounded-full" />
                <div>Add subscriptions to unlock the flow</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard title="Total Subscriptions">
          {subscriptions?.length ? subscriptions?.length : "—"}
        </StatsCard>
        <StatsCard title="Total Cost Per Month">
          {subscriptions?.length
            ? `EUR ${dashboardData?.totalCostPerMonth?.toFixed(2) || "0.00"}`
            : "—"}
        </StatsCard>
        <StatsCard title="Potential Savings">
          {subscriptions?.length
            ? `EUR ${
                dashboardData?.potentialMonthlySavings?.toFixed(2) || "0.00"
              }`
            : "—"}
        </StatsCard>
      </div>

      <FinanceMiniVisuals
        categories={usedCategories}
        subscriptions={subscriptions}
        dashboardData={dashboardData}
      />

      <div className="rounded-lg border border-black/10 bg-white/70 p-4">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
          Hidden Insights
        </div>
        {subscriptions?.length ? (
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
        ) : (
          <div className="mt-3 text-sm text-gray-600">
            Add subscriptions to reveal insights.
          </div>
        )}
      </div>

      <FinanceInsightsFlow open={flowOpen} onClose={() => setFlowOpen(false)} />
    </div>
  );
}
