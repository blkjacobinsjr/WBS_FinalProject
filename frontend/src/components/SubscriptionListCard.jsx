import CategoryIcon from "./CategoryIcon";
import SubscriptionLogo from "./SubscriptionLogos";

export default function SubscriptionListCard({
  subscription,
  clickHandler,
  showCategory = true,
}) {
  return (
    <div
      className="grid w-full min-w-0 cursor-pointer grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-white/50 bg-white/25 p-2 hover:bg-white/50"
      key={subscription?._id}
      onClick={clickHandler}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-black/25 bg-gray-300/50">
        <SubscriptionLogo subscriptionName={subscription.name} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-col">
          <div className="truncate text-sm font-medium leading-none">
            {subscription.name}
          </div>
          {showCategory && (
            <div className="flex min-w-0 items-center justify-start gap-2 pt-1 text-xs text-gray-500">
              {/* {subscription.active ? "Active" : "Inactive"} */}
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
