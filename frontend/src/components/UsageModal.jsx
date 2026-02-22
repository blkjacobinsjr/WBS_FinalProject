import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useDataContext } from "../contexts/dataContext";
import eventEmitter from "../utils/EventEmitter";

// ─── Theme helper ─────────────────────────────────────────────────────────────
function useDark() {
  return useSyncExternalStore(
    (cb) => {
      const obs = new MutationObserver(cb);
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      return () => obs.disconnect();
    },
    () => document.documentElement.classList.contains("dark")
  );
}

const T = {
  light: {
    panel: "#f5f5f7",
    card: "linear-gradient(160deg, #e8ecf4 0%, #dce3ef 50%, #c9d6e8 100%)",
    cardShadowTop: "0 20px 60px rgba(0,0,0,0.12), 0 4px 20px rgba(0,0,0,0.08)",
    cardShadow: "0 8px 24px rgba(0,0,0,0.06)",
    text: "#1a1a1a",
    textSub: "rgba(0,0,0,0.5)",
    textMuted: "rgba(0,0,0,0.35)",
    textHint: "rgba(0,0,0,0.25)",
    glass: "rgba(0,0,0,0.04)",
    glassBorder: "rgba(0,0,0,0.08)",
    questionBg: "rgba(0,0,0,0.05)",
    questionBorder: "rgba(0,0,0,0.08)",
    questionText: "rgba(0,0,0,0.7)",
    headerBorder: "rgba(0,0,0,0.06)",
    closeBg: "rgba(0,0,0,0.06)",
    closeText: "rgba(0,0,0,0.5)",
    doneBg: "rgba(0,0,0,0.06)",
    doneBorder: "rgba(0,0,0,0.1)",
    doneText: "rgba(0,0,0,0.6)",
    titleText: "rgba(0,0,0,0.85)",
    progressBg: "rgba(0,0,0,0.06)",
    backdrop: "rgba(255,255,255,0.6)",
    logoBorder: "1px solid rgba(0,0,0,0.08)",
    logoShadow: "0 8px 32px rgba(0,0,0,0.08)",
    noSubText: "rgba(0,0,0,0.4)",
  },
  dark: {
    panel: "#0d0d0d",
    card: "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    cardShadowTop: "0 20px 60px rgba(0,0,0,0.4), 0 4px 20px rgba(0,0,0,0.3)",
    cardShadow: "0 8px 24px rgba(0,0,0,0.2)",
    text: "#fff",
    textSub: "rgba(255,255,255,0.55)",
    textMuted: "rgba(255,255,255,0.35)",
    textHint: "rgba(255,255,255,0.3)",
    glass: "rgba(255,255,255,0.08)",
    glassBorder: "rgba(255,255,255,0.12)",
    questionBg: "rgba(255,255,255,0.07)",
    questionBorder: "rgba(255,255,255,0.1)",
    questionText: "rgba(255,255,255,0.85)",
    headerBorder: "rgba(255,255,255,0.06)",
    closeBg: "rgba(255,255,255,0.08)",
    closeText: "rgba(255,255,255,0.7)",
    doneBg: "rgba(255,255,255,0.1)",
    doneBorder: "rgba(255,255,255,0.15)",
    doneText: "rgba(255,255,255,0.8)",
    titleText: "rgba(255,255,255,0.9)",
    progressBg: "rgba(255,255,255,0.08)",
    backdrop: "rgba(0,0,0,0.75)",
    logoBorder: "1px solid rgba(255,255,255,0.12)",
    logoShadow: "0 8px 32px rgba(0,0,0,0.3)",
    noSubText: "rgba(255,255,255,0.4)",
  },
};

// ─── Tinder Card Component ────────────────────────────────────────────────────
// Emil Kowalski's key insights applied:
//  1. Only animate transform + opacity (GPU-composited layer, zero reflow)
//  2. Use pointer-events (not mouse/touch split) for unified web drag
//  3. requestAnimationFrame for smooth visual feedback, no setState mid-drag
//  4. Spring settle via CSS transition re-enable after drag ends
//  5. will-change:transform on the card, removed after settle

function SwipeCard({ notification, onSwipe, isTop, stackIndex, c }) {
  const cardRef = useRef(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const draggingRef = useRef(false);
  const rafRef = useRef(null);

  const SWIPE_THRESHOLD = 80; // px to commit a swipe
  const MAX_ROTATE = 12; // degrees

  const applyTransform = useCallback((x, immediate = false) => {
    const card = cardRef.current;
    if (!card) return;
    const rotate = (x / 320) * MAX_ROTATE;
    card.style.transition = immediate ? "none" : "";
    card.style.transform = `translateX(${x}px) rotate(${rotate}deg)`;

    // Stamp overlays
    const likeStamp = card.querySelector("[data-stamp='like']");
    const nopeStamp = card.querySelector("[data-stamp='nope']");
    if (likeStamp) likeStamp.style.opacity = Math.min(1, x / SWIPE_THRESHOLD);
    if (nopeStamp) nopeStamp.style.opacity = Math.min(1, -x / SWIPE_THRESHOLD);
  }, []);

  const commitSwipe = useCallback((direction) => {
    const card = cardRef.current;
    if (!card) return;
    const tx = direction === "right" ? 500 : -500;
    const rotate = direction === "right" ? MAX_ROTATE : -MAX_ROTATE;
    card.style.transition = "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease";
    card.style.transform = `translateX(${tx}px) rotate(${rotate}deg)`;
    card.style.opacity = "0";
    setTimeout(() => onSwipe(direction === "right" ? 5 : 1), 280);
  }, [onSwipe]);

  const onPointerDown = useCallback((e) => {
    if (!isTop) return;
    // Only main button / single touch
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    startXRef.current = e.clientX;
    currentXRef.current = 0;
    const card = cardRef.current;
    if (card) {
      card.style.transition = "none";
      card.style.willChange = "transform";
    }
  }, [isTop]);

  const onPointerMove = useCallback((e) => {
    if (!draggingRef.current) return;
    currentXRef.current = e.clientX - startXRef.current;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      applyTransform(currentXRef.current, true);
    });
  }, [applyTransform]);

  const onPointerUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const card = cardRef.current;
    if (card) card.style.willChange = "";

    const x = currentXRef.current;
    if (x > SWIPE_THRESHOLD) {
      commitSwipe("right");
    } else if (x < -SWIPE_THRESHOLD) {
      commitSwipe("left");
    } else {
      // Spring back
      if (card) {
        card.style.transition = "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
        card.style.transform = "translateX(0px) rotate(0deg)";
        const likeStamp = card.querySelector("[data-stamp='like']");
        const nopeStamp = card.querySelector("[data-stamp='nope']");
        if (likeStamp) { likeStamp.style.transition = "opacity 0.3s"; likeStamp.style.opacity = "0"; }
        if (nopeStamp) { nopeStamp.style.transition = "opacity 0.3s"; nopeStamp.style.opacity = "0"; }
      }
    }
  }, [commitSwipe]);

  const sub = notification?.subscriptionId;
  const LOGO_DEV_TOKEN = "pk_fg7nZQ2oQQK-tZnjxKWfPQ";
  const logoUrl = sub?.name
    ? `https://img.logo.dev/${encodeURIComponent(sub.name.toLowerCase().replace(/\s+/g, ""))}.com?token=${LOGO_DEV_TOKEN}&format=png&size=256&retina=true`
    : null;

  // Stack visual: bottom cards are scaled down and shifted up
  const scale = 1 - stackIndex * 0.04;
  const translateY = stackIndex * -12;

  return (
    <div
      ref={cardRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: "absolute",
        inset: 0,
        transform: `translateY(${translateY}px) scale(${scale})`,
        transformOrigin: "bottom center",
        userSelect: "none",
        touchAction: "none",
        cursor: isTop ? "grab" : "default",
        zIndex: 10 - stackIndex,
      }}
    >
      {/* Card */}
      <div
        style={{
          height: "100%",
          borderRadius: 20,
          overflow: "hidden",
          background: c.card,
          boxShadow: isTop ? c.cardShadowTop : c.cardShadow,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: "40px 32px",
        }}
      >
        {/* LIKE stamp */}
        <div
          data-stamp="like"
          style={{
            position: "absolute",
            top: 32,
            left: 24,
            opacity: 0,
            transform: "rotate(-15deg)",
            border: "4px solid #22c55e",
            borderRadius: 8,
            padding: "4px 14px",
            color: "#22c55e",
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: 2,
            pointerEvents: "none",
            textShadow: "0 0 20px rgba(34,197,94,0.5)",
          }}
        >
          LOVE IT
        </div>

        {/* NOPE stamp */}
        <div
          data-stamp="nope"
          style={{
            position: "absolute",
            top: 32,
            right: 24,
            opacity: 0,
            transform: "rotate(15deg)",
            border: "4px solid #ef4444",
            borderRadius: 8,
            padding: "4px 14px",
            color: "#ef4444",
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: 2,
            pointerEvents: "none",
            textShadow: "0 0 20px rgba(239,68,68,0.5)",
          }}
        >
          CUT IT
        </div>

        {/* Logo / Icon */}
        <div style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          background: c.glass,
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          border: c.logoBorder,
          boxShadow: c.logoShadow,
        }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={sub?.name}
              style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 12 }}
              onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
            />
          ) : null}
          <div style={{
            display: logoUrl ? "none" : "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
          }}>
            ✨
          </div>
        </div>

        {/* Name */}
        <div style={{ textAlign: "center" }}>
          <p style={{
            color: c.text,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: -0.5,
            marginBottom: 8,
          }}>
            {sub?.name}
          </p>
          {sub?.price && (
            <p style={{
              color: c.textSub,
              fontSize: 16,
              fontWeight: 500,
            }}>
              €{sub.price}/{sub.interval || "month"}
            </p>
          )}
        </div>

        {/* Question */}
        <div style={{
          background: c.questionBg,
          backdropFilter: "blur(8px)",
          borderRadius: 16,
          padding: "14px 24px",
          border: `1px solid ${c.questionBorder}`,
        }}>
          <p style={{
            color: c.questionText,
            fontSize: 15,
            fontWeight: 600,
            textAlign: "center",
            letterSpacing: 0.2,
          }}>
            Does this bring you joy?
          </p>
        </div>

        {/* Swipe hint - only on top card */}
        {isTop && (
          <p style={{
            position: "absolute",
            bottom: 20,
            left: 0, right: 0,
            textAlign: "center",
            color: c.textHint,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: 0.5,
          }}>
            ← swipe to decide →
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Action Buttons ───────────────────────────────────────────────────────────
function ActionButton({ onClick, color, icon, size = 56 }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#fff",
        border: `3px solid ${color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        cursor: "pointer",
        boxShadow: `0 4px 20px ${color}40`,
        transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease",
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.88)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {icon}
    </button>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function UsageModal({
  opened,
  onClose,
  notificationId,
  manualSubscriptions = null,
}) {
  const isDark = useDark();
  const c = isDark ? T.dark : T.light;
  const { notifications } = useDataContext();

  const [currentNotification, setCurrentNotification] = useState(null);
  const [unratedNotifications, setUnratedNotifications] = useState([]);
  const [initialTotal, setInitialTotal] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const currentIndex = unratedNotifications?.findIndex(
    (n) => n?._id === currentNotification?._id
  );
  const progress = initialTotal > 0 ? Math.round((completedCount / initialTotal) * 100) : 0;

  useEffect(() => {
    if (!opened) {
      setIsInitialized(false);
      setIsDone(false);
    }
  }, [opened]);

  useEffect(() => {
    if (!opened || isInitialized) return;

    if (Array.isArray(manualSubscriptions) && manualSubscriptions.length > 0) {
      const manualList = manualSubscriptions.map((subscription) => ({
        _id: subscription?._id,
        subscriptionId: subscription,
      }));
      setCurrentNotification(manualList[0]);
      setUnratedNotifications(manualList);
      setInitialTotal(manualList.length);
      setCompletedCount(0);
      setIsInitialized(true);
      return;
    }

    const initialNotification = notifications?.find((n) => n._id === notificationId);
    const openedWithNotification = notifications?.findIndex((n) => n._id === notificationId) > -1;

    if (openedWithNotification) {
      const remainingNotifications = notifications?.filter((n) => n._id !== notificationId) ?? [];
      const initialUnrated = [initialNotification, ...remainingNotifications];
      setCurrentNotification(initialNotification);
      setUnratedNotifications(initialUnrated);
      setInitialTotal(initialUnrated.length);
      setCompletedCount(0);
    } else {
      setCurrentNotification(notifications?.at(0));
      setUnratedNotifications(notifications);
      setInitialTotal(notifications?.length || 0);
      setCompletedCount(0);
    }
    setIsInitialized(true);
  }, [opened, notificationId, notifications, manualSubscriptions, isInitialized]);

  // Use a ref so SwipeCard's commitSwipe always calls the latest version
  const handleSwipeRef = useRef(null);
  const handleSwipe = useCallback((score) => {
    const snap = handleSwipeRef.current;
    if (snap) snap(score);
  }, []);

  // Keep ref up to date with current state
  useEffect(() => {
    handleSwipeRef.current = (score) => {
      if (!currentNotification) return;
      const idx = unratedNotifications.findIndex((n) => n?._id === currentNotification?._id);
      const selectedSubscriptionId = unratedNotifications[idx]?.subscriptionId?._id;
      if (selectedSubscriptionId) {
        eventEmitter.emit("useScoreSelected", selectedSubscriptionId, score);
      }
      const filtered = unratedNotifications.filter((n) => n._id !== currentNotification._id);
      setUnratedNotifications(filtered);
      setCompletedCount((prev) => prev + 1);
      if (filtered.length === 0) {
        setTimeout(() => setIsDone(true), 320);
        return;
      }
      const nextIndex = Math.min(idx, filtered.length - 1);
      setCurrentNotification(filtered[nextIndex]);
    };
  }, [currentNotification, unratedNotifications]);

  // Show up to 3 stacked cards
  const visibleCards = unratedNotifications.slice(currentIndex, currentIndex + 3);

  return (
    <Transition show={opened} as={Fragment}>
      <Dialog as="div" style={{ position: "relative", zIndex: 50 }} onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div style={{
            position: "fixed",
            inset: 0,
            background: c.backdrop,
            backdropFilter: "blur(8px)",
          }} />
        </Transition.Child>

        {/* Sheet */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-350"
          enterFrom="translateY(100%)"
          enterTo="translateY(0)"
          leave="ease-in duration-250"
          leaveFrom="translateY(0)"
          leaveTo="translateY(100%)"
        >
          <Dialog.Panel style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            background: c.panel,
          }}>
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 16px 12px",
              borderBottom: `1px solid ${c.headerBorder}`,
            }}>
              <button
                onClick={onClose}
                style={{
                  width: 40, height: 40,
                  borderRadius: "50%",
                  background: c.closeBg,
                  border: "none",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: c.closeText,
                  fontSize: 18,
                }}
              >
                ✕
              </button>
              <Dialog.Title style={{
                color: c.titleText,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 0.3,
              }}>
                Joy Check
              </Dialog.Title>
              <button
                onClick={onClose}
                style={{
                  borderRadius: 20,
                  background: c.doneBg,
                  border: `1px solid ${c.doneBorder}`,
                  padding: "6px 16px",
                  color: c.doneText,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>

            {/* Progress bar */}
            {initialTotal > 1 && !isDone && (
              <div style={{
                height: 3,
                background: c.progressBg,
                position: "relative",
              }}>
                <div style={{
                  position: "absolute",
                  top: 0, left: 0,
                  height: "100%",
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #a855f7, #ec4899)",
                  transition: "width 0.4s ease",
                }} />
              </div>
            )}

            {/* Main content */}
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px 20px 16px",
              gap: 24,
              overflowY: "hidden",
            }}>
              {isDone ? (
                // Done state
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  animation: "fadeIn 0.4s ease",
                }}>
                  <div style={{ fontSize: 64 }}>🎉</div>
                  <p style={{ color: c.text, fontSize: 22, fontWeight: 800 }}>All done!</p>
                  <p style={{ color: c.textSub, fontSize: 14 }}>
                    Check Insights for your recommendations
                  </p>
                  <button
                    onClick={onClose}
                    style={{
                      marginTop: 8,
                      borderRadius: 24,
                      background: "linear-gradient(135deg, #a855f7, #ec4899)",
                      border: "none",
                      padding: "12px 32px",
                      color: "#fff",
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 8px 24px rgba(168,85,247,0.4)",
                    }}
                  >
                    See Results
                  </button>
                </div>
              ) : currentNotification?.subscriptionId ? (
                <>
                  {/* Counter */}
                  {initialTotal > 1 && (
                    <p style={{
                      color: c.textMuted,
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}>
                      {completedCount + 1} / {initialTotal}
                    </p>
                  )}

                  {/* Card stack */}
                  <div style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: 360,
                    height: 380,
                    flexShrink: 0,
                  }}>
                    {[...visibleCards].reverse().map((notification, reversedIdx) => {
                      const stackIndex = visibleCards.length - 1 - reversedIdx;
                      return (
                        <SwipeCard
                          key={notification._id}
                          notification={notification}
                          onSwipe={handleSwipe}
                          isTop={stackIndex === 0}
                          stackIndex={stackIndex}
                          c={c}
                        />
                      );
                    })}
                  </div>

                  {/* Action buttons */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 32,
                    paddingBottom: 8,
                  }}>
                    <ActionButton
                      onClick={() => handleSwipe(1)}
                      color="#ef4444"
                      icon="🗑️"
                      size={64}
                    />
                    {unratedNotifications?.length > 1 && (
                      <ActionButton
                        onClick={() => {
                          const nextIdx = currentIndex + 1 >= unratedNotifications.length ? 0 : currentIndex + 1;
                          setCurrentNotification(unratedNotifications[nextIdx]);
                        }}
                        color="#6b7280"
                        icon="⟳"
                        size={44}
                      />
                    )}
                    <ActionButton
                      onClick={() => handleSwipe(5)}
                      color="#22c55e"
                      icon="✨"
                      size={64}
                    />
                  </div>

                  {/* Labels */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 32,
                    width: "100%",
                    maxWidth: 240,
                    justifyContent: "space-between",
                    marginTop: -12,
                  }}>
                    <span style={{ color: "#ef4444", fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>CUT IT</span>
                    {unratedNotifications?.length > 1 && (
                      <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>SKIP</span>
                    )}
                    <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>LOVE IT</span>
                  </div>
                </>
              ) : (
                <p style={{ color: c.noSubText, fontSize: 14 }}>No subscriptions to review.</p>
              )}
            </div>

            {/* Safe area */}
            <div style={{ height: "env(safe-area-inset-bottom)" }} />
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}
