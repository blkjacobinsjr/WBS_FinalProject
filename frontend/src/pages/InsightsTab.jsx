import { useDataContext } from "../contexts/dataContext";
import UsageRadarChart from "../components/charts/UsageRadarChart";
import Piechartwithneedle from "../components/charts/Piechartwithneedle";
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm dark:bg-white/10">
          <p className="text-xs font-medium text-black/40 dark:text-white/40">
            Most Used
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-black/80 dark:text-white/80">
            {dashboardData?.mostUsed?.name || "—"}
          </p>
        </div>
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm dark:bg-white/10">
          <p className="text-xs font-medium text-black/40 dark:text-white/40">
            Least Used
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-black/80 dark:text-white/80">
            {dashboardData?.leastUsed?.name || "—"}
          </p>
        </div>
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm dark:bg-white/10">
          <p className="text-xs font-medium text-black/40 dark:text-white/40">
            Potential Savings
          </p>
          <p className="mt-1 text-sm font-semibold text-green-600 dark:text-green-400">
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
        </div>
      </div>

      {/* Spend-O-Meter */}
      <div className="rounded-2xl bg-white/40 p-5 backdrop-blur-sm dark:bg-white/10">
        <p className="text-center text-sm font-semibold text-black/80 dark:text-white/80">
          Spend-O-Meter
        </p>
        <p className="text-center text-xs text-black/40 dark:text-white/40">
          vs. Average Monthly Spend
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
          <div className="mt-4 flex min-h-[200px] items-center justify-center">
            <UsageRadarChart />
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
