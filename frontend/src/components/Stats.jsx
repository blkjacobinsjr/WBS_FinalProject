import StatsCard from "./StatsCard";
import { useDataContext } from "../contexts/dataContext";

export default function Stats() {
  const { subscriptions, dashboardData } = useDataContext();

  if (!Object.keys(dashboardData).length > 0) return;
  const totalSubscriptions = subscriptions?.length ?? 0;

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard className="text-sm" title="Total Subscriptions">
        {totalSubscriptions}
      </StatsCard>
      <StatsCard className="text-sm" title="Total Cost">
        {`EUR ${dashboardData.totalCostPerMonth.toFixed(2)}`}
      </StatsCard>
      <StatsCard className="text-sm" title="Potential Savings">
        {`EUR ${dashboardData.potentialMonthlySavings.toFixed(2)}`}
      </StatsCard>
      <StatsCard className="text-sm" title="Most Used">
        {dashboardData.mostUsed.name || "Insufficient Data"}
      </StatsCard>
    </div>
  );
}
