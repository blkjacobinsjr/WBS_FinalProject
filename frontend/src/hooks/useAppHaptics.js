import { useCallback, useMemo, useRef } from "react";
import { haptic as iosHaptic, supportsHaptics as iosSupportsHaptics } from "ios-haptics";
import { useWebHaptics } from "web-haptics/react";

function nowMs() {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }
  return Date.now();
}

function isLikelyIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iP(hone|ad|od)/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

function countPatternPulses(input) {
  if (typeof input === "number") return input > 0 ? 1 : 0;
  if (typeof input === "string") {
    if (input === "error") return 3;
    if (input === "success" || input === "warning" || input === "nudge") return 2;
    return 1;
  }

  if (Array.isArray(input)) {
    if (input.length === 0) return 0;
    if (typeof input[0] === "number") {
      let count = 0;
      for (let i = 0; i < input.length; i += 2) {
        if ((input[i] || 0) > 0) count += 1;
      }
      return count;
    }
    return input.filter((step) => (step?.duration || 0) > 0).length;
  }

  if (input?.pattern && Array.isArray(input.pattern)) {
    return countPatternPulses(input.pattern);
  }

  return 1;
}

function triggerIosFallback(input) {
  try {
    const pulseCount = Math.min(3, Math.max(0, countPatternPulses(input)));
    if (pulseCount <= 0) return;
    if (pulseCount === 1) {
      iosHaptic();
      return;
    }
    if (pulseCount === 2) {
      iosHaptic.confirm();
      return;
    }
    iosHaptic.error();
  } catch {
    // no-op
  }
}

export default function useAppHaptics(options) {
  const { trigger, isSupported: hasVibrationApi } = useWebHaptics(options);
  const canUseIosFallback = useMemo(() => {
    if (typeof window === "undefined" || hasVibrationApi) return false;
    return Boolean(iosSupportsHaptics && isLikelyIOS());
  }, [hasVibrationApi]);
  const isSupported = hasVibrationApi || canUseIosFallback;
  const lastTriggerRef = useRef({});

  const fire = useCallback(
    (key, input, cooldownMs = 80) => {
      if (!trigger && !canUseIosFallback) return;
      const t = nowMs();
      const previous = lastTriggerRef.current[key] ?? -Infinity;
      if (t - previous < cooldownMs) return;
      lastTriggerRef.current[key] = t;

      if (hasVibrationApi && trigger) {
        trigger(input);
        return;
      }

      if (canUseIosFallback) {
        triggerIosFallback(input);
        return;
      }

      if (trigger) {
        trigger(input);
      }
    },
    [canUseIosFallback, hasVibrationApi, trigger],
  );

  const tap = useCallback(() => {
    fire("tap", "light", 70);
  }, [fire]);

  const selection = useCallback(() => {
    fire("selection", "selection", 50);
  }, [fire]);

  const switchTab = useCallback(() => {
    fire("switchTab", "soft", 90);
  }, [fire]);

  const openSheet = useCallback(() => {
    fire("openSheet", "soft", 140);
  }, [fire]);

  const closeSheet = useCallback(() => {
    fire("closeSheet", "selection", 100);
  }, [fire]);

  const confirm = useCallback(() => {
    fire("confirm", "medium", 140);
  }, [fire]);

  const success = useCallback(() => {
    fire("success", "success", 220);
  }, [fire]);

  const warning = useCallback(() => {
    fire("warning", "warning", 220);
  }, [fire]);

  const error = useCallback(() => {
    fire("error", "error", 260);
  }, [fire]);

  const reveal = useCallback(() => {
    fire("reveal", "nudge", 260);
  }, [fire]);

  const dragThreshold = useCallback(() => {
    fire("dragThreshold", "rigid", 120);
  }, [fire]);

  const dragCommit = useCallback(() => {
    fire("dragCommit", "medium", 120);
  }, [fire]);

  const dragSnapBack = useCallback(() => {
    fire("dragSnapBack", "soft", 140);
  }, [fire]);

  const sliderStep = useCallback(() => {
    fire("sliderStep", "selection", 90);
  }, [fire]);

  return useMemo(
    () => ({
      isSupported,
      fire,
      tap,
      selection,
      switchTab,
      openSheet,
      closeSheet,
      confirm,
      success,
      warning,
      error,
      reveal,
      dragThreshold,
      dragCommit,
      dragSnapBack,
      sliderStep,
    }),
    [
      closeSheet,
      confirm,
      dragCommit,
      dragSnapBack,
      dragThreshold,
      error,
      fire,
      isSupported,
      openSheet,
      reveal,
      selection,
      sliderStep,
      success,
      switchTab,
      tap,
      warning,
    ],
  );
}
