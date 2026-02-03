import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDataContext } from "../contexts/dataContext";
import useSubscription from "../hooks/useSubscription";
import eventEmitter from "../utils/EventEmitter";
import { resolveCancelLink } from "../utils/cancelProviders";
import LoadingButton from "./LoadingButton";

export default function FinancialResetFlow({ open, onClose }) {
  const navigate = useNavigate();
  const { subscriptions, dashboardData } = useDataContext();
  const { updateSubscription } = useSubscription();

  const [step, setStep] = useState(0);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0);
      setIsWorking(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

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

  async function handleCancelNow() {
    if (!candidate) {
      toast.error("Add a subscription first");
      return;
    }

    setIsWorking(true);

    if (cancelLink?.url) {
      window.open(cancelLink.url, "_blank", "noopener,noreferrer");
    }

    try {
      await updateSubscription(
        { _id: candidate._id, active: false },
        new AbortController(),
      );
      toast.success("Canceled");
    } catch (error) {
      toast.error("Cancel failed");
    } finally {
      setIsWorking(false);
    }

    eventEmitter.emit("refetchData");
    setStep(3);
  }

  function handleOpenBulk() {
    navigate("/dashboard/bulk");
    onClose?.();
  }

  function handleAddSubscription() {
    eventEmitter.emit("openSubscriptionForm", {}, "add");
    onClose?.();
  }

  async function runQuickAction(action) {
    setIsWorking(true);
    await new Promise((resolve) => setTimeout(resolve, 150));
    setIsWorking(false);
    action();
  }

  const steps = [
    {
      title: "Financial Reset",
      subtitle: "One minute. One move.",
      insight: "Cut one leak to win the week.",
      cta: "Start Reset",
      action: () => runQuickAction(() => setStep(1)),
    },
    {
      title: "Find leaks fast",
      subtitle: "Upload a statement. We detect subscriptions.",
      insight: "Instant payoff. Zero setup.",
      cta: "Upload Statement",
      action: () => runQuickAction(handleOpenBulk),
    },
    {
      title: candidate ? `Cut ${candidate.name}` : "Add your first subscription",
      subtitle: candidate
        ? `Save ${candidate.price.toFixed(2)} EUR per ${candidate.interval}`
        : "Track one bill to unlock cancel flow.",
      insight: candidate ? "One click. One win." : "Start with the first bill.",
      cta: candidate ? "Cancel in 1 click" : "Add Subscription",
      action: candidate
        ? handleCancelNow
        : () => runQuickAction(handleAddSubscription),
    },
    {
      title: "Reset complete",
      subtitle: "Come back weekly to stay sharp.",
      insight: "You just reclaimed budget headroom.",
      cta: "Run Again",
      action: () => runQuickAction(() => setStep(1)),
    },
  ];

  const current = steps[Math.min(step, steps.length - 1)];
  const progress = Math.min(100, Math.round((step / 3) * 100));
  const stepLabel = Math.min(step, 3);

  if (!open) return null;

  const portalTarget =
    typeof document !== "undefined" ? document.body : null;
  if (!portalTarget) return null;

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
        margin: 0,
        borderRadius: 0,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-pink-300/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-cyan-300/10 blur-2xl" />

      <div
        className="relative flex min-h-[100svh] min-h-[100dvh] w-full flex-col justify-between px-5 py-6 sm:px-10 sm:py-10"
        style={{
          paddingTop: "max(1.5rem, env(safe-area-inset-top))",
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
          paddingRight: "max(1.25rem, env(safe-area-inset-right))",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            Reset Sprint
            <span className="rounded-full bg-white/15 px-2 py-1 text-[10px]">
              {stepLabel}/3
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn-press rounded-full border border-white/30 px-3 py-1 text-xs font-semibold text-white/80"
          >
            Exit
          </button>
        </div>

        <div className="mt-6 h-1.5 w-full rounded-full bg-white/15">
          <div
            className="h-1.5 rounded-full bg-white transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center text-white motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200">
          <div className="w-full max-w-[560px] space-y-3">
            <div className="text-3xl font-semibold leading-tight sm:text-5xl">
              {current.title}
            </div>
            <div className="text-sm text-white/75 sm:text-lg">
              {current.subtitle}
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/50">
              {current.insight}
            </div>
          </div>

          <LoadingButton
            onClick={current.action}
            isLoading={isWorking}
            loadingText="Working..."
            className="mt-4 w-full max-w-sm rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-xl shadow-black/30"
          >
            {current.cta}
          </LoadingButton>

          {candidate && step === 2 && (
            <div className="text-xs text-white/60">
              Cancel source: {cancelLink?.label}
            </div>
          )}
        </div>

        <div className="text-center text-xs text-white/40">
          60 seconds or less. One action per step.
        </div>
      </div>
    </div>,
    portalTarget,
  );
}
