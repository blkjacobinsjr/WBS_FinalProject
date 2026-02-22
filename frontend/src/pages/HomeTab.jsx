import { useMemo, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { useDataContext } from "../contexts/dataContext";
import FinancialResetCard from "../components/FinancialResetCard";
import Notifications from "../components/Notifications";
import SubscriptionListCard from "../components/SubscriptionListCard";
import HighestSpendOrbit from "../components/charts/HighestSpendOrbit";
import Piechartwithneedle from "../components/charts/Piechartwithneedle";
import eventEmitter from "../utils/EventEmitter";

// Daily rotating insights - FOMO Punch + Variable Rewards
const dailyInsights = [
  (spent) => `You've spent €${spent} this year on subscriptions. Worth it?`,
  (spent) => `€${spent}/year = ${Math.round(spent / 5)} fancy coffees`,
  (spent) => `That's €${(spent / 12).toFixed(0)}/month leaving your account quietly`,
  (spent) => `€${spent}/year could be a weekend trip instead`,
  (spent) =>
    `About ${Math.max(1, Math.round(spent / 12 / 28))} dinners out per month at €28 each`,
];

function getDailyInsight(yearlySpend) {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const idx = dayOfYear % dailyInsights.length;
  return dailyInsights[idx](yearlySpend.toFixed(0));
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeTab() {
  const { user } = useUser();
  const { subscriptions, dashboardData, notifications, usedCategories } = useDataContext();

  const greeting = useMemo(() => getGreeting(), []);
  const firstName = user?.firstName || "there";

  // Memoize recent subscriptions to prevent unnecessary re-renders
  const recentSubs = useMemo(() => subscriptions?.slice(0, 3) || [], [subscriptions]);

  // Yearly spend for daily insight
  const yearlySpend = useMemo(
    () => (dashboardData?.totalCostPerMonth || 0) * 12,
    [dashboardData?.totalCostPerMonth]
  );

  const handleSubscriptionClick = useCallback((subscription) => {
    eventEmitter.emit("openSubscriptionForm", subscription, "show");
  }, []);

  const handleAlertsClick = useCallback(() => {
    const firstNotificationId = notifications?.[0]?._id;
    if (firstNotificationId) {
      eventEmitter.emit("notificationClicked", firstNotificationId);
    }
  }, [notifications]);

  const pieData = useMemo(() =>
    usedCategories?.length > 0 && subscriptions?.length > 0
      ? usedCategories.map((category) => ({
        name: category.name,
        value: category.totalCost,
        subscriptions: subscriptions.filter(
          (s) => s.category?._id === category._id
        ),
      }))
      : [],
    [usedCategories, subscriptions]
  );


  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-black/80 dark:text-white/80">
          {greeting}, {firstName}
        </h1>
        <Notifications />
      </div>

      {/* Hero Stat Card */}
      <div className="rounded-2xl bg-white/40 p-5 backdrop-blur-sm transition-all duration-150 ease-out hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/15">
        <p className="text-xs font-medium uppercase tracking-wider text-black/50 dark:text-white/50">
          Total Monthly Spend
        </p>
        <p className="mt-1 bg-gradient-to-b from-black/60 to-black bg-clip-text text-3xl font-bold text-transparent dark:from-white dark:to-white/60">
          €{dashboardData?.totalCostPerMonth?.toFixed(2) || "0.00"}
        </p>
        {yearlySpend > 0 && (
          <p className="mt-2 text-xs text-black/60 dark:text-white/60">
            {getDailyInsight(yearlySpend)}
          </p>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Quick statistics">
        <div className="rounded-xl bg-white/40 p-3 text-center backdrop-blur-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/15">
          <p className="bg-gradient-to-b from-black/60 to-black bg-clip-text text-2xl font-bold text-transparent dark:from-white dark:to-white/60">
            {subscriptions?.length || 0}
          </p>
          <p className="text-[10px] font-medium text-black/50 dark:text-white/50">
            Subscriptions
          </p>
        </div>
        <div className="rounded-xl bg-white/40 p-3 text-center backdrop-blur-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/15">
          <p className="bg-gradient-to-b from-green-400 to-green-600 bg-clip-text text-2xl font-bold text-transparent dark:from-green-300 dark:to-green-500">
            €{dashboardData?.potentialMonthlySavings?.toFixed(0) || "0"}
          </p>
          <p className="text-[10px] font-medium text-black/50 dark:text-white/50">
            Yours to Claim
          </p>
        </div>
        <button
          type="button"
          onClick={handleAlertsClick}
          disabled={!notifications?.length}
          className="rounded-xl bg-white/40 p-3 text-center backdrop-blur-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white/10 dark:hover:bg-white/15"
        >
          <p className="bg-gradient-to-b from-black/60 to-black bg-clip-text text-2xl font-bold text-transparent dark:from-white dark:to-white/60">
            {notifications?.length || 0}
          </p>
          <p className="text-[10px] font-medium text-black/50 dark:text-white/50">
            Alerts
          </p>
        </button>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {subscriptions?.length > 0 && (
          <div className="rounded-2xl bg-white/40 p-3 sm:p-5 backdrop-blur-sm dark:bg-white/10 glow-xs min-w-0 flex flex-col items-center justify-start lg:col-span-2">
            <p className="text-center text-[11px] sm:text-sm font-bold text-black/80 dark:text-white/80">
              Highest Spend
            </p>
            <div className="mt-2 w-full flex-grow flex items-center justify-center">
              <HighestSpendOrbit data={subscriptions ? subscriptions.slice(0, 10).map(s => ({ ...s, value: s.price || s.monthlyPrice || 0 })).sort((a, b) => b.value - a.value) : []} />
            </div>
          </div>
        )}
        {(dashboardData?.totalCostPerMonth > 0 || subscriptions?.length > 0) && (
          <div className="rounded-2xl bg-white/40 p-3 sm:p-5 backdrop-blur-sm dark:bg-white/10 glow-xs min-w-0 flex flex-col items-center justify-start lg:col-span-2">
            <p className="text-center text-[11px] sm:text-sm font-bold text-black/80 dark:text-white/80">
              Spend-O-Meter
            </p>
            <p className="text-center text-[9px] sm:text-xs text-black/40 dark:text-white/40 mt-0.5">
              vs Average (€219)
            </p>
            <div className="mt-2 w-full h-[150px] sm:h-[180px] flex-grow flex items-center justify-center">
              <Piechartwithneedle
                maxFirstSegment={219}
                needleValue={dashboardData?.totalCostPerMonth || 0}
              />
            </div>
          </div>
        )}
      </div>

      {/* Recent Subscriptions */}
      {recentSubs.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
              Recent Subscriptions
            </h2>
            <button
              onClick={() => eventEmitter.emit("switchTab", "subscriptions")}
              className="text-xs font-medium text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60"
            >
              See all
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {recentSubs.map((sub) => (
              <SubscriptionListCard
                key={sub._id}
                subscription={sub}
                clickHandler={() => handleSubscriptionClick(sub)}
                showCategory={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Financial Reset Card */}
      <FinancialResetCard />

      {/* Empty State */}
      {subscriptions?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white/40 py-12 text-center backdrop-blur-sm dark:bg-white/10">
          <div className="mb-3 rounded-full bg-black/5 p-4 dark:bg-white/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-8 w-8 text-black/30 dark:text-white/30"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-black/50 dark:text-white/50">
            No subscriptions yet
          </p>
          <p className="mt-1 text-xs text-black/30 dark:text-white/30">
            Add your first subscription to get started
          </p>
        </div>
      )}
    </div>
  );
}
