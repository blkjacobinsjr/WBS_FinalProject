import { useState } from "react";
import { useDataContext } from "../contexts/dataContext";

// Compound interest: A = P * (1 + r/n)^(nt)
// For monthly contributions: FV = PMT * [((1 + r/n)^(nt) - 1) / (r/n)]
function calculateCompoundGrowth(monthlyAmount, years, annualRate = 0.08) {
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  // Future value of a series of monthly contributions
  const futureValue =
    monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  return Math.round(futureValue);
}

export default function WealthBuilderCard() {
  const { dashboardData } = useDataContext();
  const [showDetails, setShowDetails] = useState(false);

  const monthlySavings = dashboardData?.potentialMonthlySavings || 0;

  // Calculate projections for 5, 10, and 20 years
  const projection5 = calculateCompoundGrowth(monthlySavings, 5);
  const projection10 = calculateCompoundGrowth(monthlySavings, 10);
  const projection20 = calculateCompoundGrowth(monthlySavings, 20);

  // Total contributed (without compounding)
  const contributed10 = monthlySavings * 12 * 10;
  const interestEarned10 = projection10 - contributed10;

  // Don't show if no savings potential
  if (monthlySavings <= 0) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-5 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-rose-900/20">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-amber-100 p-1.5 dark:bg-amber-800/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4 text-amber-700 dark:text-amber-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
              />
            </svg>
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-amber-800/60 dark:text-amber-200/60">
            Wealth Builder
          </p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-medium text-amber-700/60 hover:text-amber-700 dark:text-amber-300/60 dark:hover:text-amber-300"
        >
          {showDetails ? "Less" : "More"}
        </button>
      </div>

      {/* Main Projection */}
      <div className="mt-4">
        <p className="text-xs text-amber-900/60 dark:text-amber-100/60">
          If you invest your €{monthlySavings.toFixed(0)}/mo savings
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-amber-900 dark:text-amber-100">
            €{projection10.toLocaleString()}
          </span>
          <span className="text-sm text-amber-700/60 dark:text-amber-300/60">
            in 10 years
          </span>
        </div>
        <p className="mt-1 text-xs text-amber-700/50 dark:text-amber-300/50">
          €{interestEarned10.toLocaleString()} from compound interest alone
        </p>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-4 space-y-4 border-t border-amber-200/50 pt-4 dark:border-amber-700/30">
          {/* Projection Timeline */}
          <div>
            <p className="mb-2 text-xs font-medium text-amber-800/70 dark:text-amber-200/70">
              Growth Timeline
            </p>
            <div className="flex justify-between rounded-xl bg-white/50 p-3 dark:bg-black/20">
              <div className="text-center">
                <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                  €{projection5.toLocaleString()}
                </p>
                <p className="text-[10px] text-amber-700/50 dark:text-amber-300/50">
                  5 years
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                  €{projection10.toLocaleString()}
                </p>
                <p className="text-[10px] text-amber-700/50 dark:text-amber-300/50">
                  10 years
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                  €{projection20.toLocaleString()}
                </p>
                <p className="text-[10px] text-amber-700/50 dark:text-amber-300/50">
                  20 years
                </p>
              </div>
            </div>
          </div>

          {/* The 3-Step Checklist */}
          <div>
            <p className="mb-2 text-xs font-medium text-amber-800/70 dark:text-amber-200/70">
              Your Wealth Building Path
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-xl bg-white/50 p-3 dark:bg-black/20">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800 dark:bg-amber-700 dark:text-amber-100">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Build your cushion
                  </p>
                  <p className="text-[10px] text-amber-700/60 dark:text-amber-300/60">
                    1 month of expenses saved for flexibility
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/50 p-3 dark:bg-black/20">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800 dark:bg-amber-700 dark:text-amber-100">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Kill high-interest debt
                  </p>
                  <p className="text-[10px] text-amber-700/60 dark:text-amber-300/60">
                    Credit cards first, then loans above 5%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/50 p-3 dark:bg-black/20">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800 dark:bg-amber-700 dark:text-amber-100">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Invest automatically
                  </p>
                  <p className="text-[10px] text-amber-700/60 dark:text-amber-300/60">
                    Low-cost index fund, auto-transfer monthly
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* The Wisdom */}
          <div className="rounded-xl bg-white/50 p-3 dark:bg-black/20">
            <p className="text-xs italic text-amber-800/70 dark:text-amber-200/70">
              "The best time to plant a tree was 20 years ago. The second best
              time is now."
            </p>
            <p className="mt-1 text-[10px] text-amber-700/40 dark:text-amber-300/40">
              Assumes 8% annual return (historical S&P 500 average)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
