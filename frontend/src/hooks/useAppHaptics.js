import { useCallback, useMemo, useRef } from "react";
import { useWebHaptics } from "web-haptics/react";

function nowMs() {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }
  return Date.now();
}

export default function useAppHaptics(options) {
  const { trigger, isSupported: hasVibrationApi } = useWebHaptics(options);
  const isSupported = hasVibrationApi;
  const lastTriggerRef = useRef({});

  const fire = useCallback(
    (key, input, cooldownMs = 80) => {
      if (!trigger) return;
      const t = nowMs();
      const previous = lastTriggerRef.current[key] ?? -Infinity;
      if (t - previous < cooldownMs) return;
      lastTriggerRef.current[key] = t;
      trigger(input);
    },
    [trigger],
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
