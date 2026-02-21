import { useDataContext } from "../../contexts/dataContext";
import { filterByCategory } from "../../utils/filterHelper";
import SubscriptionLogo from "../SubscriptionLogos";

export default function CategoryPieChart({ categoryId }) {
  const { subscriptions } = useDataContext();
  const filteredSubscriptions = filterByCategory(subscriptions, categoryId);

  // Sort descending by price
  const sortedData = [...filteredSubscriptions]
    .sort((a, b) => b.monthlyPrice - a.monthlyPrice)
    .slice(0, 10); // Show top 10 to keep it space-efficient

  const maxPrice = sortedData.length > 0 ? sortedData[0].monthlyPrice : 0;
  const colors = [
    "from-indigo-500 to-purple-500",
    "from-pink-500 to-rose-500",
    "from-teal-400 to-emerald-500",
    "from-blue-400 to-cyan-500",
    "from-amber-400 to-orange-500",
  ];

  if (sortedData.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-black/40 dark:text-white/40">
        No subscriptions found
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-y-auto pr-2 pb-2 scrollbar-hide">
      {sortedData.map((sub, index) => {
        const percent = maxPrice > 0 ? (sub.monthlyPrice / maxPrice) * 100 : 0;
        const colorClass = colors[index % colors.length];
        const displayName = sub.name.replace(/^(?:PAYPAL\s*\*?\s*|APPLE\s*\.?\s*COM\/BILL\s*|GOOGLE\s*\*?\s*)/i, "").trim() || sub.name;

        return (
          <div key={sub._id} className="flex flex-col gap-1.5 p-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-white/90">
                  <SubscriptionLogo subscriptionName={displayName} />
                </div>
                <span className="truncate max-w-[120px] text-black/80 dark:text-white/80">
                  {displayName}
                </span>
              </div>
              <span className="text-black/60 dark:text-white/60">
                €{sub.monthlyPrice.toFixed(2)}
              </span>
            </div>
            {/* The Bar */}
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
              <div
                className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${colorClass} opacity-90`}
                style={{ width: `${percent}%`, transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
              />
              <div
                className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${colorClass} mix-blend-overlay`}
                style={{ width: `${percent}%`, filter: "blur(4px)" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
