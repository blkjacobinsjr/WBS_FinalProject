import { useRef, useState } from "react";
import CategoryIcon from "./CategoryIcon";
import SubscriptionLogo from "./SubscriptionLogos";
import eventEmitter from "../utils/EventEmitter";

const SWIPE_THRESHOLD = 100;

export default function SubscriptionListCard({
  subscription,
  clickHandler,
  showCategory = true,
  className = "",
  style,
  enableDelete = true,
}) {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(null);

  const displayName =
    subscription?.name
      ?.replace(/[^\p{L}\s]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim() || subscription?.name;

  function handleDelete(e) {
    e.stopPropagation();
    eventEmitter.emit("deleteSubscription", subscription);
  }

  function handleTouchStart(e) {
    if (!enableDelete) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsSwiping(true);
  }

  function handleTouchMove(e) {
    if (!enableDelete || !isSwiping) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Determine if this is a horizontal or vertical swipe on first significant movement
    if (isHorizontalSwipe.current === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
    }

    // Only handle horizontal swipes (left only)
    if (isHorizontalSwipe.current && deltaX < 0) {
      setSwipeX(Math.max(deltaX, -150)); // Limit swipe distance
    }
  }

  function handleTouchEnd() {
    if (!enableDelete) return;
    setIsSwiping(false);

    if (swipeX < -SWIPE_THRESHOLD) {
      // Swipe past threshold - delete
      setSwipeX(-150); // Animate to full reveal
      setTimeout(() => {
        eventEmitter.emit("deleteSubscription", subscription);
        setSwipeX(0);
      }, 150);
    } else {
      // Spring back
      setSwipeX(0);
    }
    isHorizontalSwipe.current = null;
  }

  return (
    <div
      className={`group relative grid w-full min-w-0 cursor-pointer grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-white/50 bg-white/25 p-2 hover:bg-white/50 ${className}`}
      key={subscription?._id}
      onClick={clickHandler}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        ...style,
        transform: `translateX(${swipeX}px)`,
        transition: isSwiping ? "none" : "transform 0.2s ease-out",
      }}
    >
      {/* Subtle X button - top right, appears on hover */}
      {enableDelete && (
        <button
          onClick={handleDelete}
          className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/10 text-black/40 opacity-0 backdrop-blur-sm transition-all hover:bg-black/20 hover:text-black/60 group-hover:opacity-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-3 w-3"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/15 bg-white/80 shadow-sm">
          <SubscriptionLogo subscriptionName={subscription.name} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-col">
            <div className="truncate text-sm font-medium leading-none">
              {displayName}
            </div>
            {showCategory && (
              <div className="flex min-w-0 items-center justify-start gap-2 pt-1 text-xs text-gray-500">
                <CategoryIcon icon={subscription?.category?.icon} iconSize={4} />
                <div className="truncate">
                  {subscription?.category?.name || "Uncategorized"}
                </div>
              </div>
            )}
          </div>
        </div>
      <div className="text-right">
        <div className="relative whitespace-nowrap">
          <p className="font-medium">€{subscription.price}</p>
          <p className="text-xs text-gray-500">
            {subscription.interval === "month" ? "Monthly " : "Yearly"}
          </p>
          {subscription?.validScore && (
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 sm:absolute sm:inset-0 sm:mt-0 sm:min-w-[3rem] sm:-translate-x-16 sm:flex-col sm:items-center sm:justify-center sm:rounded sm:border sm:border-black/25 sm:p-1 sm:text-sm sm:shadow-inner">
              <div className="text-xs">Score</div>
              <div>{subscription?.score.toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
