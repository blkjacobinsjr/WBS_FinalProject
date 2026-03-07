export const CONTROL_HERO_REFERENCE = 219;
export const CONTROL_HERO_MODES = ["spend", "recover", "future"];

function toMonthlyPrice(subscription) {
  if (!subscription) return 0;

  if (typeof subscription.monthlyPrice === "number") {
    return subscription.monthlyPrice;
  }

  const price = Number(subscription.price || 0);
  return subscription.interval === "year" ? price / 12 : price;
}

function calculateFutureValue(monthlyAmount, years = 10, annualRate = 0.08) {
  if (!monthlyAmount) return 0;
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  return Math.round(
    monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate),
  );
}

function getCompactLabel(name) {
  if (!name) return "SUB";

  const clean = name
    .replace(/^(?:PAYPAL\s*\*?\s*|APPLE\s*\.?\s*COM\/BILL\s*|GOOGLE\s*\*?\s*)/i, "")
    .trim();

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getActionForMode({
  totalSubscriptions,
  unratedCount,
  notificationsCount,
  recoverableMonthly,
  mode,
}) {
  if (!totalSubscriptions) {
    return {
      type: "add",
      label: "Add subscription",
      helper: "Give the dashboard something to control.",
    };
  }

  if (mode === "spend" && unratedCount > 0) {
    return {
      type: "frequency",
      label: `Rate ${unratedCount}`,
      helper: "Mark what you actually use.",
    };
  }

  if (mode === "recover" && unratedCount > 0) {
    return {
      type: "joy",
      label: `Joy check ${unratedCount}`,
      helper: "Separate affection from autopilot.",
    };
  }

  if (notificationsCount > 0) {
    return {
      type: "alerts",
      label: `Review ${notificationsCount} alerts`,
      helper: "Unresolved subscription signals need review.",
    };
  }

  if (mode === "future" && recoverableMonthly > 0) {
    return {
      type: "insights",
      label: "See the upside",
      helper: "Translate savings into future leverage.",
    };
  }

  return {
    type: "subscriptions",
    label: "Review subscriptions",
    helper: "Tighten the stack one decision at a time.",
  };
}

export function getInitialControlHeroMode(search = "") {
  if (!search) return "recover";

  const params = new URLSearchParams(search);
  const fromOnboarding = params.get("from") === "onboarding";
  const checkoutSuccess = params.get("checkout") === "success";

  if (fromOnboarding && checkoutSuccess) {
    return "recover";
  }

  return "recover";
}

export function createDashboardHeroModel({
  subscriptions = [],
  dashboardData = {},
  notifications = [],
  activeMode = "recover",
}) {
  const safeSubscriptions = Array.isArray(subscriptions) ? subscriptions : [];
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const sortedByMonthly = [...safeSubscriptions].sort(
    (a, b) => toMonthlyPrice(b) - toMonthlyPrice(a),
  );

  const monthlySpend = Number(dashboardData?.totalCostPerMonth || 0);
  const yearlySpend = Math.round(monthlySpend * 12);
  const recoverableMonthly = Number(dashboardData?.potentialMonthlySavings || 0);
  const recoverableYearly = Math.round(recoverableMonthly * 12);
  const futureValue10y = calculateFutureValue(recoverableMonthly);
  const spendGap = Math.round(monthlySpend - CONTROL_HERO_REFERENCE);
  const recoverableRatio =
    monthlySpend > 0 ? Math.round((recoverableMonthly / monthlySpend) * 100) : 0;
  const totalSubscriptions = safeSubscriptions.length;
  const notificationsCount = safeNotifications.length;
  const unratedCount =
    safeSubscriptions.filter(
      (subscription) =>
        subscription?.score === undefined ||
        subscription?.score === null ||
        subscription?.score === 0,
    ).length || 0;

  const biggestLeak =
    dashboardData?.barelyUsedMostExpensive?.name
      ? {
          ...dashboardData.barelyUsedMostExpensive,
          monthlyPrice:
            Number(dashboardData.barelyUsedMostExpensive.monthlyPrice) ||
            toMonthlyPrice(dashboardData.barelyUsedMostExpensive),
        }
      : sortedByMonthly[0] || null;

  const mostUsed =
    safeSubscriptions.find(
      (subscription) => subscription?._id === dashboardData?.mostUsed?._id,
    ) ||
    dashboardData?.mostUsed ||
    null;

  const leastUsed =
    safeSubscriptions.find(
      (subscription) => subscription?._id === dashboardData?.leastUsed?._id,
    ) ||
    dashboardData?.leastUsed ||
    null;

  const commonAction = getActionForMode({
    totalSubscriptions,
    unratedCount,
    notificationsCount,
    recoverableMonthly,
    mode: activeMode,
  });

  const orbitBadges = [
    biggestLeak?.name
      ? {
          key: "leak",
          label: getCompactLabel(biggestLeak.name),
          value: biggestLeak.monthlyPrice || toMonthlyPrice(biggestLeak),
          tone: "slate",
        }
      : null,
    mostUsed?.name
      ? {
          key: "most",
          label: getCompactLabel(mostUsed.name),
          value: toMonthlyPrice(mostUsed),
          tone: "sky",
        }
      : null,
    futureValue10y > 0
      ? {
          key: "future",
          label: "10Y",
          value: Math.round(futureValue10y / 1000),
          suffix: "k",
          tone: "emerald",
        }
      : null,
  ].filter(Boolean);

  const modes = {
    spend: {
      id: "spend",
      eyebrow: "Monthly spend",
      value: monthlySpend,
      valuePrefix: "€",
      detail: yearlySpend
        ? `Yearly exposure €${yearlySpend.toLocaleString()}`
        : "Track every recurring cost",
      helper: "See the quiet outflow clearly.",
      takeaway: biggestLeak?.name
        ? `${biggestLeak.name} is the main drag.`
        : "No dominant leak yet. Add more data.",
      supportingNote: monthlySpend
        ? spendGap > 0
          ? `You are €${Math.abs(spendGap).toLocaleString()} above the current reference line.`
          : spendGap < 0
          ? `You are €${Math.abs(spendGap).toLocaleString()} below the current reference line.`
          : "You are sitting exactly on the current reference line."
        : "The reference line becomes useful once spend data lands.",
      action: getActionForMode({
        totalSubscriptions,
        unratedCount,
        notificationsCount,
        recoverableMonthly,
        mode: "spend",
      }),
    },
    recover: {
      id: "recover",
      eyebrow: "Potential to reclaim",
      value: recoverableMonthly,
      valuePrefix: "€",
      detail: recoverableYearly
        ? `€${recoverableYearly.toLocaleString()} per year`
        : "Find the cleanest leak",
      helper: "Start where the money comes back fastest.",
      takeaway: biggestLeak?.name
        ? `${biggestLeak.name} is the leak.`
        : "Joy and usage checks reveal the strongest recoverable win.",
      supportingNote: recoverableMonthly
        ? `${recoverableRatio}% of current monthly spend looks recoverable right now.`
        : "Recoverable value appears after you score more of the stack.",
      action: getActionForMode({
        totalSubscriptions,
        unratedCount,
        notificationsCount,
        recoverableMonthly,
        mode: "recover",
      }),
    },
    future: {
      id: "future",
      eyebrow: "Future value in 10 years",
      value: futureValue10y,
      valuePrefix: "€",
      detail: recoverableMonthly
        ? `From €${Math.round(recoverableMonthly).toLocaleString()} redirected each month`
        : "No savings stream yet",
      helper: "Keep the long horizon attached to the small cut.",
      takeaway: recoverableMonthly
        ? "Small recurring wins compound into a much larger position."
        : "You need reclaimable savings before the future view matters.",
      supportingNote: recoverableMonthly
        ? "Assumes an 8% annual return with monthly contributions for 10 years."
        : "Build a savings stream first, then the future view becomes real.",
      action: getActionForMode({
        totalSubscriptions,
        unratedCount,
        notificationsCount,
        recoverableMonthly,
        mode: "future",
      }),
    },
  };

  const currentMode = modes[activeMode] ? activeMode : "recover";

  return {
    activeMode: currentMode,
    referenceValue: CONTROL_HERO_REFERENCE,
    totalSubscriptions,
    notificationsCount,
    unratedCount,
    biggestLeak,
    mostUsed,
    leastUsed,
    orbitBadges,
    modes,
    current: modes[currentMode],
    hasData: totalSubscriptions > 0,
    hasRecoverableValue: recoverableMonthly > 0,
    shouldHighlightRecover: recoverableMonthly > 0 || unratedCount > 0,
    action: commonAction,
  };
}
