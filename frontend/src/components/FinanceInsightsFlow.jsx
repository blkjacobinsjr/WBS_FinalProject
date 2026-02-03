import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useDataContext } from "../contexts/dataContext";
import LoadingButton from "./LoadingButton";

export default function FinanceInsightsFlow({ open, onClose }) {
  const { subscriptions, usedCategories, dashboardData } = useDataContext();
  const [stepIndex, setStepIndex] = useState(0);

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

  const steps = [
    {
      title: "Your Money Wrapped",
      subtitle: "A fast recap of your subscriptions.",
      value: `${subscriptions?.length || 0} subscriptions`,
      footnote: "Built from your latest import.",
    },
    {
      title: "Monthly Burn",
      subtitle: "Recurring cost per month.",
      value: `EUR ${dashboardData?.totalCostPerMonth?.toFixed(2) || "0.00"}`,
      footnote: "Keep this below your comfort ceiling.",
    },
    {
      title: "Biggest Leak",
      subtitle: "Highest priced subscription.",
      value: highestCost?.name || "Insufficient Data",
      footnote: highestCost
        ? `EUR ${highestCost.price?.toFixed(2)}`
        : "Add subscriptions to unlock.",
    },
    {
      title: "Top Spend Category",
      subtitle: "Where most money goes.",
      value: topCategory?.name || "Insufficient Data",
      footnote: topCategory
        ? `EUR ${topCategory.totalCost?.toFixed(2)}`
        : "Add subscriptions to unlock.",
    },
    {
      title: "Potential Savings",
      subtitle: "What you can reclaim.",
      value: `EUR ${
        dashboardData?.potentialMonthlySavings?.toFixed(2) || "0.00"
      }`,
      footnote: "Focus on one cancel per week.",
    },
  ];

  if (!open) return null;
  const portalTarget =
    typeof document !== "undefined" ? document.body : null;
  if (!portalTarget) return null;

  const current = steps[Math.min(stepIndex, steps.length - 1)];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b1020] via-[#0f1730] to-[#131b38]" />
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-fuchsia-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-cyan-300/15 blur-3xl" />

      <div
        className="relative flex min-h-[100svh] min-h-[100dvh] w-full flex-col justify-between px-5 py-6 sm:px-10 sm:py-10"
        style={{
          paddingTop: "max(1.5rem, env(safe-area-inset-top))",
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
          paddingRight: "max(1.25rem, env(safe-area-inset-right))",
        }}
      >
        <div className="flex items-center justify-between text-white/70">
          <div className="text-xs font-semibold uppercase tracking-[0.2em]">
            Money Wrapped
          </div>
          <button
            onClick={onClose}
            className="btn-press rounded-full border border-white/30 px-3 py-1 text-xs font-semibold text-white/80"
          >
            Exit
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.title}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex w-full max-w-xl flex-col items-center gap-4 text-center text-white"
            >
              <div className="text-3xl font-semibold sm:text-5xl">
                {current.title}
              </div>
              <div className="text-sm text-white/70 sm:text-lg">
                {current.subtitle}
              </div>
              <div className="rounded-3xl bg-white/10 px-6 py-4 text-2xl font-semibold shadow-lg shadow-black/30">
                {current.value}
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                {current.footnote}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
            className="btn-press rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/70"
            disabled={stepIndex === 0}
          >
            Back
          </button>
          <div className="text-xs text-white/50">
            {stepIndex + 1} of {steps.length}
          </div>
          <LoadingButton
            onClick={() =>
              setStepIndex(Math.min(steps.length - 1, stepIndex + 1))
            }
            className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-slate-900"
          >
            Next
          </LoadingButton>
        </div>
      </div>
    </div>,
    portalTarget,
  );
}
