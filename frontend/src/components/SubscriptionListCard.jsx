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
    <div className="relative overflow-hidden rounded-md">
      {/* Delete background revealed on swipe */}
      {enableDelete && (
        <div className="absolute inset-y-0 right-0 flex w-32 items-center justify-end bg-red-500 pr-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="white"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </div>
      )}

      {/* Card content */}
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
        <div className="flex items-center gap-2 text-right">
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

          {/* Desktop delete button - hidden on mobile, shown on hover */}
          {enableDelete && (
            <button
              onClick={handleDelete}
              className="hidden h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-500 opacity-0 transition-opacity hover:bg-red-200 group-hover:opacity-100 sm:flex"
              title="Delete subscription"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
