import { useUser } from "@clerk/clerk-react";
import { useDataContext } from "../contexts/dataContext";
import FinancialResetCard from "../components/FinancialResetCard";
import SubscriptionListCard from "../components/SubscriptionListCard";
import eventEmitter from "../utils/EventEmitter";

export default function HomeTab() {
  const { user } = useUser();
  const { subscriptions, dashboardData, notifications } = useDataContext();

  const greeting = getGreeting();
  const firstName = user?.firstName || "there";

  // Get 3 most recent/upcoming subscriptions
  const recentSubs = subscriptions?.slice(0, 3) || [];

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  function handleSubscriptionClick(subscription) {
    eventEmitter.emit("openSubscriptionForm", subscription, "show");
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-black/80 dark:text-white/80">
          {greeting}, {firstName}
        </h1>
        <div className="flex items-center gap-2">
          {notifications?.length > 0 && (
            <div className="relative">
              <button className="rounded-full bg-black/5 p-2 transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                  />
                </svg>
              </button>
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {notifications.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Hero Stat Card */}
      <div className="rounded-2xl bg-gradient-to-br from-black/5 to-black/10 p-5 dark:from-white/5 dark:to-white/10">
        <p className="text-xs font-medium uppercase tracking-wider text-black/50 dark:text-white/50">
          Total Monthly Spend
        </p>
        <p className="mt-1 text-3xl font-bold text-black dark:text-white">
          €{dashboardData?.totalCostPerMonth?.toFixed(2) || "0.00"}
        </p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white/50 p-3 text-center dark:bg-white/5">
          <p className="text-2xl font-bold text-black dark:text-white">
            {subscriptions?.length || 0}
          </p>
          <p className="text-[10px] font-medium text-black/50 dark:text-white/50">
            Subscriptions
          </p>
        </div>
        <div className="rounded-xl bg-white/50 p-3 text-center dark:bg-white/5">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            €{dashboardData?.potentialMonthlySavings?.toFixed(0) || "0"}
          </p>
          <p className="text-[10px] font-medium text-black/50 dark:text-white/50">
            Potential Savings
          </p>
        </div>
        <div className="rounded-xl bg-white/50 p-3 text-center dark:bg-white/5">
          <p className="text-2xl font-bold text-black dark:text-white">
            {notifications?.length || 0}
          </p>
          <p className="text-[10px] font-medium text-black/50 dark:text-white/50">
            Alerts
          </p>
        </div>
      </div>

      {/* Financial Reset Card */}
      <FinancialResetCard />

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

      {/* Empty State */}
      {subscriptions?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white/50 py-12 text-center dark:bg-white/5">
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
