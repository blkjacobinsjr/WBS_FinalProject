import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDataContext } from "../contexts/dataContext";
import useSubscription from "../hooks/useSubscription";
import eventEmitter from "../utils/EventEmitter";
import { resolveCancelLink } from "../utils/cancelProviders";

export default function FinancialResetCard() {
  const navigate = useNavigate();
  const { subscriptions, dashboardData } = useDataContext();
  const { updateSubscription } = useSubscription();

  const candidate = useMemo(() => {
    const targetName = dashboardData?.barelyUsedMostExpensive?.name;
    if (targetName && subscriptions?.length) {
      return subscriptions.find((sub) => sub.name === targetName);
    }

    if (subscriptions?.length) {
      return [...subscriptions].sort((a, b) => b.price - a.price)[0];
    }

    return null;
  }, [dashboardData, subscriptions]);

  const cancelLink = useMemo(() => {
    if (!candidate?.name) return null;
    return resolveCancelLink(candidate.name);
  }, [candidate]);

  const [step, setStep] = useState(0);

  async function handleCancelNow() {
    if (!candidate) {
      setStep(0);
      return;
    }

    if (cancelLink?.url) {
      window.open(cancelLink.url, "_blank", "noopener,noreferrer");
    }

    try {
      await updateSubscription(
        { _id: candidate._id, active: false },
        new AbortController(),
      );
    } catch (error) {
      // ignore for fast flow
    }

    eventEmitter.emit("refetchData");
    setStep(3);
  }

  const steps = [
    {
      title: "Financial Reset",
      subtitle: "One minute. One action. One win.",
      cta: "Start 60s Reset",
      action: () => setStep(1),
    },
    {
      title: "Scan for leaks",
      subtitle: "Upload a statement. Auto add subs.",
      cta: "Open Bulk Import",
      action: () => navigate("/dashboard/bulk"),
    },
    {
      title: candidate ? `Cancel ${candidate.name}` : "Add your first sub",
      subtitle: candidate
        ? `${candidate.price.toFixed(2)} EUR per ${candidate.interval}`
        : "Track one bill to unlock cancel flow.",
      cta: candidate ? "Cancel Now" : "Add Subscription",
      action: candidate
        ? handleCancelNow
        : () => eventEmitter.emit("openSubscriptionForm", {}, "add"),
    },
    {
      title: "Reset complete",
      subtitle: "Run again when ready.",
      cta: "Run Again",
      action: () => setStep(1),
    },
  ];

  const current = steps[Math.min(step, steps.length - 1)];
  const progress = Math.min(100, Math.round((step / 3) * 100));

  return (
    <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-white/90 via-white/70 to-white/50 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M12 2.25a.75.75 0 01.75.75v7.5h7.5a.75.75 0 010 1.5h-7.5v7.5a.75.75 0 01-1.5 0v-7.5h-7.5a.75.75 0 010-1.5h7.5v-7.5a.75.75 0 01.75-.75z" />
            </svg>
          </div>
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Reset Sprint
          </div>
        </div>
        <div className="text-xs font-semibold text-gray-500">
          {step}/3
        </div>
      </div>

      <div className="mt-3">
        <div className="text-lg font-semibold text-gray-900">
          {current.title}
        </div>
        <div className="text-sm text-gray-600">{current.subtitle}</div>
      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-black"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="mt-4">
        <button
          onClick={current.action}
          className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
        >
          {current.cta}
        </button>
      </div>
    </div>
  );
}
