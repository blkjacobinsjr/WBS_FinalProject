import { useMemo, useState } from "react";
import { useDataContext } from "../contexts/dataContext";
import StatsCard from "../components/StatsCard";
import FinanceInsightsFlow from "../components/FinanceInsightsFlow";
import LoadingButton from "../components/LoadingButton";

const FLOW = `flowchart TD
  A[Start: define Rich Life priorities] --> B[System: 4 pillars banking saving budgeting investing]
  B --> C[Autopilot: automatic transfers and bill pay]
  C --> D[Big wins: bank fees, credit cards, negotiate income]
  D --> E[Franklin guardrails: industry, frugality, avoid debt, plug leaks]
  E --> F[Invest long term]
  F --> G{Edge bet with known odds?}
  G -- No --> H[Skip]
  G -- Yes --> I[Kelly fraction bet size]
  H --> J[Checklists: setup, monthly, quarterly]
  I --> J
  J --> C`;

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

        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {[
            "Define Rich Life",
            "Autopilot",
            "Big Wins",
            "Guardrails",
            "Invest",
            "Checklists",
          ].map((label) => (
            <div
              key={label}
              className="min-w-[140px] rounded-2xl border border-black/10 bg-white/80 px-3 py-3 text-xs font-semibold text-gray-700 shadow-sm"
            >
              {label}
            </div>
          ))}
        </div>

        <pre className="mt-3 hidden rounded-lg bg-slate-950 px-4 py-3 text-[11px] text-white sm:block">
          {FLOW}
        </pre>
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
