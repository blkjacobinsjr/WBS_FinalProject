import { useDataContext } from "../contexts/dataContext";
import UsageRadarChart from "../components/charts/UsageRadarChart";
import UsedCategoriesPieChart from "../components/charts/UsedCategoriesPieChart";
import CategoryPieChart from "../components/charts/CategoryPieChart";
import Piechartwithneedle from "../components/charts/Piechartwithneedle";
import WealthBuilderCard from "../components/WealthBuilderCard";
import eventEmitter from "../utils/EventEmitter";

export default function InsightsTab() {
  const { subscriptions, usedCategories, dashboardData } = useDataContext();

  // Count subscriptions that haven't been rated yet
  const unratedCount =
    subscriptions?.filter(
      (s) => s.score === undefined || s.score === null || s.score === 0
    ).length || 0;
  const ratedCount = (subscriptions?.length || 0) - unratedCount;
  const totalCount = subscriptions?.length || 0;
  const ratingProgress =
    totalCount > 0 ? Math.round((ratedCount / totalCount) * 100) : 0;

  // Find full subscription data for most/least used
  const mostUsed = subscriptions?.find(
    (s) => s._id === dashboardData?.mostUsed?._id
  );
  const leastUsed = subscriptions?.find(
    (s) => s._id === dashboardData?.leastUsed?._id
  );

  // Calculate category stats
  const mostExpensiveCategory = usedCategories?.reduce(
    (prev, curr) => (curr.totalCost > prev.totalCost ? curr : prev),
    { name: "—", totalCost: -Infinity }
  );
  if (mostExpensiveCategory?.totalCost === -Infinity)
    mostExpensiveCategory.totalCost = 0;

  const leastExpensiveCategory = usedCategories?.reduce(
    (prev, curr) => (curr.totalCost < prev.totalCost ? curr : prev),
    { name: "—", totalCost: Infinity }
  );
  if (leastExpensiveCategory?.totalCost === Infinity)
    leastExpensiveCategory.totalCost = 0;

  // Pie chart data
  const pieData =
    usedCategories?.length > 0 && subscriptions?.length > 0
      ? usedCategories.map((category) => ({
          name: category.name,
          value: category.totalCost,
          subscriptions: subscriptions.filter(
            (s) => s.category._id === category._id
          ),
        }))
      : [];

  // Least used subscriptions for recommendations
  const leastUsedSubs = subscriptions
    ?.filter((s) => s.score !== 0 && s.score !== undefined && s.score !== null)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Usage Quiz Card */}
      <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-5 dark:from-green-900/20 dark:to-emerald-900/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-green-800/60 dark:text-green-200/60">
              Usage Quiz
            </p>
            <p className="mt-1 text-sm text-green-900/80 dark:text-green-100/80">
              Rate how often you use each subscription
            </p>
          </div>
          <button
            onClick={() => eventEmitter.emit("openUsageQuiz")}
            disabled={totalCount === 0}
            className="shrink-0 rounded-full bg-green-900 px-4 py-2 text-xs font-medium text-white transition-all active:scale-95 disabled:opacity-50 dark:bg-green-100 dark:text-green-900"
          >
            {unratedCount > 0 ? `Rate ${unratedCount}` : "Review"}
          </button>
        </div>
        {totalCount > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-green-800/60 dark:text-green-200/60">
              <span>Progress</span>
              <span>
                {ratedCount}/{totalCount}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-green-900/10 dark:bg-green-100/10">
              <div
                className="h-full rounded-full bg-green-600 transition-all dark:bg-green-400"
                style={{ width: `${ratingProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Wealth Builder Card */}
      <WealthBuilderCard />

      {/* Recommendations Section */}
      {(dashboardData?.barelyUsedMostExpensive?.name || leastUsedSubs?.length > 0) && (
        <div className="rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 p-5 dark:from-red-900/20 dark:to-orange-900/20">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-red-800/60 dark:text-red-200/60">
            Recommendations
          </p>

          {/* Expensive & Barely Used */}
          {dashboardData?.barelyUsedMostExpensive?.name && (
            <div className="mb-3 rounded-xl bg-white/50 p-3 dark:bg-black/20">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-red-100 p-1.5 dark:bg-red-800/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 text-red-600 dark:text-red-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M14.78 5.22a.75.75 0 00-1.06 0L6.5 12.44V6.75a.75.75 0 00-1.5 0v7.5c0 .414.336.75.75.75h7.5a.75.75 0 000-1.5H7.56l7.22-7.22a.75.75 0 000-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-xs font-medium text-red-800/70 dark:text-red-200/70">
                  Expensive & Barely Used
                </p>
              </div>
              <p className="mt-2 text-sm text-red-900/80 dark:text-red-100/80">
                <span className="font-semibold">
                  {dashboardData.barelyUsedMostExpensive.name}
                </span>{" "}
                costs €{dashboardData.barelyUsedMostExpensive.monthlyPrice?.toFixed(2) || "0"}/mo
                but you rarely use it. Consider cancelling.
              </p>
            </div>
          )}

          {/* Top 3 Least Used */}
          {leastUsedSubs?.length > 0 && (
            <div className="rounded-xl bg-white/50 p-3 dark:bg-black/20">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-orange-100 p-1.5 dark:bg-orange-800/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 text-orange-600 dark:text-orange-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M1.22 5.222a.75.75 0 011.06 0L7 9.942l3.768-3.769a.75.75 0 011.113.058 20.908 20.908 0 013.813 7.254l1.574-2.727a.75.75 0 011.3.75l-2.475 4.286a.75.75 0 01-1.025.275l-4.287-2.475a.75.75 0 01.75-1.3l2.71 1.565a19.422 19.422 0 00-3.013-6.024L7.53 11.533a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 010-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-xs font-medium text-orange-800/70 dark:text-orange-200/70">
                  Least Used Subscriptions
                </p>
              </div>
              <div className="mt-2 space-y-1">
                {leastUsedSubs.map((sub, index) => (
                  <div
                    key={sub._id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-orange-900/80 dark:text-orange-100/80">
                      {index + 1}. {sub.name}
                    </span>
                    <span className="text-xs text-orange-700/60 dark:text-orange-300/60">
                      Score: {sub.score?.toFixed(1) || "0"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid - Row 1 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm dark:bg-white/10">
          <p className="text-xs font-medium text-black/40 dark:text-white/40">
            Total Subscriptions
          </p>
          <p className="mt-1 text-2xl font-bold text-black/80 dark:text-white/80">
            {totalCount}
          </p>
        </div>
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm dark:bg-white/10">
          <p className="text-xs font-medium text-black/40 dark:text-white/40">
            Monthly Spend
          </p>
          <p className="mt-1 text-2xl font-bold text-black/80 dark:text-white/80">
            €{dashboardData?.totalCostPerMonth?.toFixed(2) || "0.00"}
          </p>
        </div>
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm dark:bg-white/10">
          <p className="text-xs font-medium text-black/40 dark:text-white/40">
            Potential Savings
          </p>
          <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
            €{dashboardData?.potentialMonthlySavings?.toFixed(2) || "0.00"}
          </p>
        </div>
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm dark:bg-white/10">
          <p className="text-xs font-medium text-black/40 dark:text-white/40">
            Barely Used, Expensive
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-red-600 dark:text-red-400">
            {dashboardData?.barelyUsedMostExpensive?.name || "—"}
          </p>
          {dashboardData?.barelyUsedMostExpensive?.monthlyPrice && (
            <p className="text-xs text-black/40 dark:text-white/40">
              €{dashboardData.barelyUsedMostExpensive.monthlyPrice.toFixed(2)} • Score {dashboardData.barelyUsedMostExpensive.score?.toFixed(1) || "0"}
            </p>
          )}
        </div>
      </div>

      {/* Stats Grid - Row 2 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm dark:bg-white/10">
          <p className="text-xs font-medium text-black/40 dark:text-white/40">
            Most Used
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-black/80 dark:text-white/80">
            {dashboardData?.mostUsed?.name || "—"}
          </p>
          {mostUsed?.monthlyPrice && (
            <p className="text-xs text-black/40 dark:text-white/40">
              €{mostUsed.monthlyPrice.toFixed(2)} • Score {mostUsed.score?.toFixed(1) || "0"}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm dark:bg-white/10">
          <p className="text-xs font-medium text-black/40 dark:text-white/40">
            Least Used
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-black/80 dark:text-white/80">
            {dashboardData?.leastUsed?.name || "—"}
          </p>
          {leastUsed?.monthlyPrice && (
            <p className="text-xs text-black/40 dark:text-white/40">
              €{leastUsed.monthlyPrice.toFixed(2)} • Score {leastUsed.score?.toFixed(1) || "0"}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm dark:bg-white/10">
          <p className="text-xs font-medium text-black/40 dark:text-white/40">
            Most Expensive Category
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-black/80 dark:text-white/80">
            {mostExpensiveCategory?.name || "—"}
          </p>
          {mostExpensiveCategory?.totalCost > 0 && (
            <p className="text-xs text-black/40 dark:text-white/40">
              €{mostExpensiveCategory.totalCost.toFixed(2)}/mo
            </p>
          )}
        </div>
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm dark:bg-white/10">
          <p className="text-xs font-medium text-black/40 dark:text-white/40">
            Least Expensive Category
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-black/80 dark:text-white/80">
            {leastExpensiveCategory?.name || "—"}
          </p>
          {leastExpensiveCategory?.totalCost > 0 && (
            <p className="text-xs text-black/40 dark:text-white/40">
              €{leastExpensiveCategory.totalCost.toFixed(2)}/mo
            </p>
          )}
        </div>
      </div>

      {/* Spend-O-Meter */}
      <div className="rounded-2xl bg-white/40 p-5 backdrop-blur-sm dark:bg-white/10">
        <p className="text-center text-sm font-semibold text-black/80 dark:text-white/80">
          Spend-O-Meter
        </p>
        <p className="text-center text-xs text-black/40 dark:text-white/40">
          vs. Average Monthly Spend (€219)
        </p>
        <div className="mt-4 flex items-center justify-center">
          <Piechartwithneedle
            maxFirstSegment={219}
            needleValue={dashboardData?.totalCostPerMonth}
          />
        </div>
      </div>

      {/* Usage Radar Chart */}
      {usedCategories?.length > 0 && (
        <div className="rounded-2xl bg-white/40 p-5 backdrop-blur-sm dark:bg-white/10">
          <p className="text-center text-sm font-semibold text-black/80 dark:text-white/80">
            Category Usage vs. Cost
          </p>
          <p className="text-center text-xs text-black/40 dark:text-white/40">
            Higher means more usage relative to cost
          </p>
          <div className="mt-4 flex min-h-[200px] items-center justify-center">
            <UsageRadarChart />
          </div>
        </div>
      )}

      {/* Category Spend Pie Chart */}
      {usedCategories?.length > 0 && pieData.length > 0 && (
        <div className="rounded-2xl bg-white/40 p-5 backdrop-blur-sm dark:bg-white/10">
          <p className="text-center text-sm font-semibold text-black/80 dark:text-white/80">
            Spending by Category
          </p>
          <p className="text-center text-xs text-black/40 dark:text-white/40">
            How your money is distributed
          </p>
          <div className="mt-4 flex min-h-[250px] items-center justify-center">
            <UsedCategoriesPieChart pieData={pieData} />
          </div>
        </div>
      )}

      {/* All Subscriptions Pie Chart */}
      {subscriptions?.length > 0 && (
        <div className="rounded-2xl bg-white/40 p-5 backdrop-blur-sm dark:bg-white/10">
          <p className="text-center text-sm font-semibold text-black/80 dark:text-white/80">
            All Subscriptions
          </p>
          <p className="text-center text-xs text-black/40 dark:text-white/40">
            Individual subscription costs
          </p>
          <div className="mt-4 flex min-h-[250px] items-center justify-center">
            <CategoryPieChart />
          </div>
        </div>
      )}

      {/* Empty State */}
      {subscriptions?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white/40 py-12 text-center backdrop-blur-sm dark:bg-white/10">
          <p className="text-sm text-black/50 dark:text-white/50">
            Add subscriptions to see insights
          </p>
        </div>
      )}
    </div>
  );
}
