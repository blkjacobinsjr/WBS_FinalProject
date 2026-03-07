import { useMemo } from "react";
import { BanknotesIcon } from "@heroicons/react/24/solid";
import { useDataContext } from "../contexts/dataContext";
import InsightDecisionMatrix from "../components/dashboard/InsightDecisionMatrix";
import SubscriptionLogo from "../components/SubscriptionLogos";
import VisualKpiTile from "../components/dashboard/VisualKpiTile";
import UsageRadarChart from "../components/charts/UsageRadarChart";
import HighestSpendOrbit from "../components/charts/HighestSpendOrbit";
import CategoryPieChart from "../components/charts/CategoryPieChart";
import Piechartwithneedle from "../components/charts/Piechartwithneedle";
import WealthBuilderCard from "../components/WealthBuilderCard";
import eventEmitter from "../utils/EventEmitter";

export default function InsightsTab() {
  const { subscriptions, usedCategories, dashboardData } = useDataContext();
  const enableControlHero = import.meta.env.VITE_ENABLE_CONTROL_HERO !== "0";

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

  const totalMonthlySpend = dashboardData?.totalCostPerMonth || 0;
  const savingsValue = dashboardData?.potentialMonthlySavings || 0;
  const biggestLeak = dashboardData?.barelyUsedMostExpensive || null;
  const savingsMeter =
    totalMonthlySpend > 0
      ? Math.min(100, Math.round((savingsValue / totalMonthlySpend) * 100))
      : 0;
  const biggestLeakMeter =
    totalMonthlySpend > 0 && biggestLeak?.monthlyPrice
      ? Math.min(
          100,
          Math.round((biggestLeak.monthlyPrice / totalMonthlySpend) * 100),
        )
      : 0;
  const mostUsedMeter = mostUsed?.score
    ? Math.min(100, Math.round((mostUsed.score / 5) * 100))
    : 0;
  const leastUsedMeter = leastUsed?.score
    ? Math.min(100, Math.round((leastUsed.score / 5) * 100))
    : 0;

  // Memoize least used subscriptions for recommendations
  const leastUsedSubs = useMemo(() =>
    subscriptions
      ?.filter((s) => s.score !== 0 && s.score !== undefined && s.score !== null)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3),
    [subscriptions]
  );

  return (
    <div className="flex flex-col gap-4 pb-24">
      {enableControlHero && (
        <div className="px-1">
          <p
            className="max-w-[15ch] text-[1.7rem] leading-[1.06] tracking-[-0.04em] text-slate-800/90"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Keep what earns its place. Question the rest.
          </p>
        </div>
      )}

      {/* Usage Quiz Card (Original - Frequency-based) */}
      <div className="rounded-[28px] border border-white/70 bg-[linear-gradient(160deg,rgba(239,248,255,0.92)_0%,rgba(246,252,250,0.9)_100%)] p-5 shadow-[0_18px_40px_rgba(125,145,189,0.1)] backdrop-blur-xl dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-teal-900/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-blue-800/60 dark:text-blue-200/60">
              Usage Quiz
            </p>
            <p className="mt-1 text-sm text-blue-900/80 dark:text-blue-100/80">
              How often it earns its place in your stack
            </p>
          </div>
          <button
            onClick={() => eventEmitter.emit("openFrequencyQuiz")}
            disabled={totalCount === 0}
            className="shrink-0 rounded-full bg-blue-900 px-4 py-2 text-xs font-medium text-white transition-all active:scale-95 disabled:opacity-50 dark:bg-blue-100 dark:text-blue-900"
          >
            {unratedCount > 0 ? `Rate ${unratedCount}` : "Review"}
          </button>
        </div>
        {totalCount > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-blue-800/60 dark:text-blue-200/60">
              <span>Progress</span>
              <span>
                {ratedCount}/{totalCount}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-blue-900/10 dark:bg-blue-100/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                style={{ width: `${ratingProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Joy Check Card (Ramit's Philosophy) */}
      <div className="rounded-[28px] border border-white/70 bg-[linear-gradient(160deg,rgba(247,240,255,0.92)_0%,rgba(255,245,249,0.9)_100%)] p-5 shadow-[0_18px_40px_rgba(125,145,189,0.1)] backdrop-blur-xl dark:from-purple-900/20 dark:via-pink-900/20 dark:to-rose-900/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-purple-800/60 dark:text-purple-200/60">
              Joy Check
            </p>
            <p className="mt-1 text-sm text-purple-900/80 dark:text-purple-100/80">
              How much you value it when you do use it
            </p>
          </div>
          <button
            onClick={() => eventEmitter.emit("openUsageQuiz")}
            disabled={totalCount === 0}
            className="shrink-0 rounded-full bg-purple-900 px-4 py-2 text-xs font-medium text-white transition-all active:scale-95 disabled:opacity-50 dark:bg-purple-100 dark:text-purple-900"
          >
            {unratedCount > 0 ? `Check ${unratedCount}` : "Review"}
          </button>
        </div>
        {totalCount > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-purple-800/60 dark:text-purple-200/60">
              <span>Progress</span>
              <span>
                {ratedCount}/{totalCount}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-purple-900/10 dark:bg-purple-100/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                style={{ width: `${ratingProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {enableControlHero && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <VisualKpiTile
              label="Savings"
              value={`€${savingsValue.toFixed(0)}`}
              annotation={
                savingsValue > 0
                  ? `${savingsMeter}% of current monthly spend looks recoverable.`
                  : "Finish reviews to reveal recoverable savings."
              }
              tone="emerald"
              meter={savingsMeter}
              icon={<BanknotesIcon className="h-5 w-5" />}
            />
            <VisualKpiTile
              label="Biggest leak"
              value={biggestLeak?.name || "No leak yet"}
              annotation={
                biggestLeak?.monthlyPrice
                  ? `€${biggestLeak.monthlyPrice.toFixed(2)} / month is the cleanest challenge target.`
                  : "The leak signal strengthens after more scoring."
              }
              tone="rose"
              meter={biggestLeakMeter}
              icon={<SubscriptionLogo subscriptionName={biggestLeak?.name || "Subscription"} />}
            />
            <VisualKpiTile
              label="Most used"
              value={dashboardData?.mostUsed?.name || "No leader yet"}
              annotation={
                mostUsed?.score
                  ? `Score ${mostUsed.score.toFixed(1)}. This is currently earning its place.`
                  : "The strongest keep signal appears after scoring."
              }
              tone="sky"
              meter={mostUsedMeter}
              icon={
                <SubscriptionLogo
                  subscriptionName={dashboardData?.mostUsed?.name || "Subscription"}
                />
              }
            />
            <VisualKpiTile
              label="Least used"
              value={dashboardData?.leastUsed?.name || "No laggard yet"}
              annotation={
                leastUsed?.score
                  ? `Score ${leastUsed.score.toFixed(1)}. Watch this before renewal.`
                  : "A low-score laggard shows up once reviews begin."
              }
              tone="slate"
              meter={leastUsedMeter}
              icon={
                <SubscriptionLogo
                  subscriptionName={dashboardData?.leastUsed?.name || "Subscription"}
                />
              }
            />
          </div>

          <InsightDecisionMatrix
            subscriptions={subscriptions}
            highlightId={dashboardData?.barelyUsedMostExpensive?._id}
          />
        </>
      )}

      {/* Wealth Builder Card */}
      <WealthBuilderCard />

      {/* Cut Ruthlessly Section */}
      {(dashboardData?.barelyUsedMostExpensive?.name || leastUsedSubs?.length > 0) && (
        <div className="rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 p-5 dark:from-red-900/20 dark:to-orange-900/20">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-red-800/60 dark:text-red-200/60">
            Cut Ruthlessly
          </p>

          {/* No Joy, High Cost */}
          {dashboardData?.barelyUsedMostExpensive?.name && (
            <div className="mb-3 rounded-xl bg-white/50 p-3 dark:bg-black/20">
              <div className="flex items-center gap-2">
                <div className="text-xl">🗑️</div>
                <p className="text-xs font-medium text-red-800/70 dark:text-red-200/70">
                  No Joy, High Cost
                </p>
              </div>
              <p className="mt-2 text-sm text-red-900/80 dark:text-red-100/80">
                <span className="font-semibold">
                  {dashboardData.barelyUsedMostExpensive.name}
                </span>{" "}
                costs €{dashboardData.barelyUsedMostExpensive.monthlyPrice?.toFixed(2) || "0"}/mo
                but brings no joy. Cancel it.
              </p>
            </div>
          )}

          {/* Candidates for Cutting */}
          {leastUsedSubs?.length > 0 && (
            <div className="rounded-xl bg-white/50 p-3 dark:bg-black/20">
              <div className="flex items-center gap-2">
                <div className="text-xl">✂️</div>
                <p className="text-xs font-medium text-orange-800/70 dark:text-orange-200/70">
                  Review These
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
                      {sub.score >= 4 ? "✨ Keep" : sub.score >= 2 ? "🤷 Maybe" : "🗑️ Cut"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid - Row 1 */}
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Subscription statistics">
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/15">
          <p className="text-xs font-medium text-black/50 dark:text-white/50">
            Total Subscriptions
          </p>
          <p className="mt-1 bg-gradient-to-b from-black/50 to-black/90 bg-clip-text text-2xl font-bold text-transparent dark:from-white dark:to-white/60">
            {totalCount}
          </p>
        </div>
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/15">
          <p className="text-xs font-medium text-black/50 dark:text-white/50">
            Monthly Spend
          </p>
          <p className="mt-1 bg-gradient-to-b from-black/50 to-black/90 bg-clip-text text-2xl font-bold text-transparent dark:from-white dark:to-white/60">
            €{dashboardData?.totalCostPerMonth?.toFixed(2) || "0.00"}
          </p>
        </div>
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/15">
          <p className="text-xs font-medium text-black/50 dark:text-white/50">
            You've Identified
          </p>
          <p className="mt-1 bg-gradient-to-b from-green-400 to-green-600 bg-clip-text text-2xl font-bold text-transparent dark:from-green-300 dark:to-green-500">
            €{dashboardData?.potentialMonthlySavings?.toFixed(2) || "0.00"}
          </p>
          {dashboardData?.potentialMonthlySavings > 0 && (
            <p className="mt-0.5 text-[10px] text-green-700/70 dark:text-green-400/70">
              in savings. Don't lose it.
            </p>
          )}
        </div>
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/15">
          <p className="text-xs font-medium text-black/50 dark:text-white/50">
            Barely Used, Expensive
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-red-600 dark:text-red-400">
            {dashboardData?.barelyUsedMostExpensive?.name || "—"}
          </p>
          {dashboardData?.barelyUsedMostExpensive?.monthlyPrice && (
            <p className="text-xs text-black/50 dark:text-white/50">
              €{dashboardData.barelyUsedMostExpensive.monthlyPrice.toFixed(2)} • Score {dashboardData.barelyUsedMostExpensive.score?.toFixed(1) || "0"}
            </p>
          )}
        </div>
      </div>

      {/* Stats Grid - Row 2 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/15">
          <p className="text-xs font-medium text-black/50 dark:text-white/50">
            Most Used
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-black/80 dark:text-white/80">
            {dashboardData?.mostUsed?.name || "—"}
          </p>
          {mostUsed?.monthlyPrice && (
            <p className="text-xs text-black/50 dark:text-white/50">
              €{mostUsed.monthlyPrice.toFixed(2)} • Score {mostUsed.score?.toFixed(1) || "0"}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/15">
          <p className="text-xs font-medium text-black/50 dark:text-white/50">
            Least Used
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-black/80 dark:text-white/80">
            {dashboardData?.leastUsed?.name || "—"}
          </p>
          {leastUsed?.monthlyPrice && (
            <p className="text-xs text-black/50 dark:text-white/50">
              €{leastUsed.monthlyPrice.toFixed(2)} • Score {leastUsed.score?.toFixed(1) || "0"}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/15">
          <p className="text-xs font-medium text-black/50 dark:text-white/50">
            Most Expensive Category
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-black/80 dark:text-white/80">
            {mostExpensiveCategory?.name || "—"}
          </p>
          {mostExpensiveCategory?.totalCost > 0 && (
            <p className="text-xs text-black/50 dark:text-white/50">
              €{mostExpensiveCategory.totalCost.toFixed(2)}/mo
            </p>
          )}
        </div>
        <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/15">
          <p className="text-xs font-medium text-black/50 dark:text-white/50">
            Least Expensive Category
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-black/80 dark:text-white/80">
            {leastExpensiveCategory?.name || "—"}
          </p>
          {leastExpensiveCategory?.totalCost > 0 && (
            <p className="text-xs text-black/50 dark:text-white/50">
              €{leastExpensiveCategory.totalCost.toFixed(2)}/mo
            </p>
          )}
        </div>
      </div>

      {/* Charts Grid - Side by Side View */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {/* Spend-O-Meter */}
        <div className="rounded-2xl bg-white/40 p-5 backdrop-blur-sm dark:bg-white/10 min-w-0">
          <p className="text-center text-sm font-semibold text-black/80 dark:text-white/80">
            Spend-O-Meter
          </p>
          <p className="text-center text-xs text-black/40 dark:text-white/40">
            Reference line (€219)
          </p>
          <div className="mt-4 h-[250px] w-full">
            <Piechartwithneedle
              maxFirstSegment={219}
              needleValue={dashboardData?.totalCostPerMonth}
            />
          </div>
        </div>

        {/* Usage Radar Chart */}
        {usedCategories?.length > 0 && (
          <div className="rounded-2xl bg-white/40 p-5 backdrop-blur-sm dark:bg-white/10 min-w-0">
            <p className="text-center text-sm font-semibold text-black/80 dark:text-white/80">
              Category Usage vs. Cost
            </p>
            <p className="text-center text-xs text-black/40 dark:text-white/40">
              Higher means more usage relative to cost
            </p>
            <div className="mt-4 h-[250px] w-full">
              <UsageRadarChart />
            </div>
          </div>
        )}

        {/* Highest Spend Orbit Chart */}
        {subscriptions?.length > 0 && (
          <div className="rounded-2xl bg-white/40 p-2 sm:p-5 backdrop-blur-sm dark:bg-white/10 min-w-0 flex flex-col items-center">
            <p className="text-center text-[10px] sm:text-sm font-semibold text-black/80 dark:text-white/80">
              Highest Spend
            </p>
            <p className="text-center text-[8px] sm:text-xs text-black/40 dark:text-white/40">
              Highest Spend Overview
            </p>
            <div className="mt-2 w-full">
              <HighestSpendOrbit data={subscriptions ? subscriptions.slice(0, 10).map(s => ({ ...s, value: s.price || s.monthlyPrice || 0 })).sort((a, b) => b.value - a.value) : []} />
            </div>
          </div>
        )}

        {/* All Subscriptions Pie Chart */}
        {subscriptions?.length > 0 && (
          <div className="rounded-2xl bg-white/40 p-5 backdrop-blur-sm dark:bg-white/10 min-w-0">
            <p className="text-center text-sm font-semibold text-black/80 dark:text-white/80">
              All Subscriptions
            </p>
            <p className="text-center text-xs text-black/40 dark:text-white/40">
              Individual subscription costs
            </p>
            <div className="mt-4 h-[250px] w-full">
              <CategoryPieChart />
            </div>
          </div>
        )}
      </div>

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
