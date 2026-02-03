import { useDataContext } from "../contexts/dataContext";
import StatsCard from "./StatsCard";
import CategoryPieChart from "./charts/CategoryPieChart";
import UsageRadarChart from "./charts/UsageRadarChart";
import UsedCategoriesPieChart from "./charts/UsedCategoriesPieChart";
import Piechartwithneedle from "./charts/Piechartwithneedle";

// TODO: Right now 'Insufficient Data' is a hardcoded value... should be dynamic or in a const
// somehwere...
export default function UsagePage() {
  const { subscriptions, usedCategories, dashboardData } = useDataContext();

  // We have to resort to one of the most evil things in the known universe to
  // populate the usage page... math!
  const totalSubscriptions = subscriptions?.length;

  // We need to do these calculations / lookups as dashboardData does not contain
  // all relevant information (e.g. monthly price)
  const mostUsed = subscriptions?.find(
    (s) => s._id === dashboardData?.mostUsed?._id,
  );
  const leastUsed = subscriptions?.find(
    (s) => s._id === dashboardData?.leastUsed?._id,
  );

  const mostExpensiveCategory = usedCategories?.reduce(
    (prev, curr) => {
      if (curr.totalCost > prev.totalCost) {
        return curr;
      } else {
        return prev;
      }
    },
    { name: "Insufficient Data", totalCost: -Infinity },
  );
  if (mostExpensiveCategory?.totalCost === -Infinity)
    mostExpensiveCategory.totalCost = 0;

  const leastExpensiveCategory = usedCategories?.reduce(
    (prev, curr) => {
      if (curr.totalCost < prev.totalCost) {
        return curr;
      } else {
        return prev;
      }
    },
    { name: "Insufficient Data", totalCost: Infinity },
  );
  if (leastExpensiveCategory?.totalCost === Infinity)
    leastExpensiveCategory.totalCost = 0;

  const pieData =
    usedCategories?.length > 0 && subscriptions?.length > 0
      ? usedCategories.map((category) => {
          return {
            name: category.name,
            value: category.totalCost,
            subscriptions: subscriptions.filter(
              (s) => s.category._id === category._id,
            ),
          };
        })
      : [];

  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {/* Row 1 */}
        <StatsCard title="Total Subscriptions">{totalSubscriptions}</StatsCard>
        <StatsCard title="Total Cost Per Month">
          EUR {dashboardData?.totalCostPerMonth.toFixed(2)}
        </StatsCard>
        <StatsCard title="Potential Savings">
          EUR {dashboardData?.potentialMonthlySavings.toFixed(2)}
        </StatsCard>
        <StatsCard title="Barely Used, Most Expensive">
          {dashboardData?.barelyUsedMostExpensive?.name || "Insufficient Data"}
          <div className="flex justify-around text-xs text-gray-500">
            <div>
              EUR{" "}
              {dashboardData?.barelyUsedMostExpensive?.monthlyPrice?.toFixed(
                2,
              ) || 0}
            </div>
            <div>
              Score{" "}
              {dashboardData?.barelyUsedMostExpensive?.score?.toFixed(2) || 0}
            </div>
          </div>
        </StatsCard>

        {/* Row 2 */}
        <StatsCard title="Most Used Subscription">
          {dashboardData?.mostUsed?.name || "Insufficient Data"}
          <div className="flex justify-around text-xs text-gray-500">
            <div>EUR {mostUsed?.monthlyPrice?.toFixed(2) || 0}</div>
            <div>Score {mostUsed?.score?.toFixed(2) || 0}</div>
          </div>
        </StatsCard>
        <StatsCard title="Least Used Subscription">
          {dashboardData?.leastUsed?.name || "Insufficient Data"}
          <div className="flex justify-around text-xs text-gray-500">
            <div>EUR {leastUsed?.monthlyPrice?.toFixed(2) || 0}</div>
            <div>Score {leastUsed?.score?.toFixed(2) || 0}</div>
          </div>
        </StatsCard>
        <StatsCard title="Most Expensive Category">
          {mostExpensiveCategory?.name}
          <div className="text-xs text-gray-500">
            EUR {mostExpensiveCategory?.totalCost?.toFixed(2) || 0}
          </div>
        </StatsCard>
        <StatsCard title="Least Expensive Category">
          {leastExpensiveCategory?.name}
          <div className="text-xs text-gray-500">
            EUR {leastExpensiveCategory?.totalCost?.toFixed(2) || 0}
          </div>
        </StatsCard>
      </div>

      {/* Fancy Schmancy Charts */}
      <div className="grid gap-2 xl:grid-cols-2">
        {/* Category Radar Chart */}
        <div className="min-h-[220px] w-full p-4 sm:min-h-[260px]">
          <h4 className="text-center text-sm font-bold text-gray-800">
            Category Price vs. Usage
          </h4>
          <div className="flex min-h-[160px] w-full items-center justify-center sm:min-h-[200px]">
            {/* Enough categories to show graph */}
            {usedCategories?.length > 0 && <UsageRadarChart />}
            {/* Not enough categories to show graph */}
            {usedCategories?.length === 0 && (
              <span className="text-sm text-gray-500">Insufficient Data</span>
            )}
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="min-h-[220px] w-full p-4 sm:min-h-[260px]">
          <h4 className="text-center text-sm font-bold text-gray-800">
            Category Spend
          </h4>
          <div className="flex min-h-[160px] w-full items-center justify-center sm:min-h-[200px]">
            {/* Enough categories to show graph */}
            {usedCategories?.length > 0 && (
              <UsedCategoriesPieChart pieData={pieData} />
            )}
            {/* Not enough categories to show graph */}
            {usedCategories?.length === 0 && (
              <span className="text-sm text-gray-500">Insufficient Data</span>
            )}
          </div>
        </div>

        {/* All subscriptions pie chart */}
        <div className="min-h-[220px] w-full p-4 sm:min-h-[260px]">
          <h4 className="text-center text-sm font-bold text-gray-800">
            All Subscriptions
          </h4>
          <div className="flex min-h-[160px] w-full items-center justify-center sm:min-h-[200px]">
            {/* Enough categories to show graph */}
            {subscriptions?.length > 0 && <CategoryPieChart />}
            {/* Not enough categories to show graph */}
            {subscriptions?.length === 0 && (
              <span className="text-sm text-gray-500">Insufficient Data</span>
            )}
          </div>
        </div>

        {/* Spend-o-Meter */}
        <div className="min-h-[220px] w-full p-4 sm:min-h-[260px]">
          <h4 className="text-center text-sm font-bold text-gray-800">
            Subzero Spend-O-Meter
            <div className="text-xs font-normal">
              Track Subscription Spend Above Average
            </div>
          </h4>
          <div className="flex min-h-[160px] w-full items-center justify-center sm:min-h-[200px]">
            <Piechartwithneedle
              maxFirstSegment={219}
              needleValue={dashboardData?.totalCostPerMonth}
            />
          </div>
        </div>
      </div>
    </>
  );
}
