import { useState } from "react";
import { useDataContext } from "../contexts/dataContext";
import SubscriptionListCard from "../components/SubscriptionListCard";
import eventEmitter from "../utils/EventEmitter";

export default function SubscriptionsTab({ onOpenBulkImport }) {
  const { subscriptions, usedCategories } = useDataContext();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter subscriptions
  const filteredSubs = subscriptions?.filter((sub) => {
    const matchesCategory =
      selectedCategory === "all" || sub.category?._id === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      sub.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  function handleSubscriptionClick(subscription) {
    eventEmitter.emit("openSubscriptionForm", subscription, "show");
  }

  function handleAddSubscription() {
    eventEmitter.emit("openSubscriptionForm", null, "add");
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Search Bar */}
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-black/30 dark:text-white/30"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search subscriptions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border-0 bg-white/40 py-3 pl-10 pr-4 text-sm text-black/80 placeholder-black/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:bg-white/10 dark:text-white dark:placeholder-white/30 dark:focus:ring-purple-500/30"
        />
      </div>

      {/* Category Pills */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all active:scale-95 ${
            selectedCategory === "all"
              ? "bg-black text-white dark:bg-purple-500 dark:text-white"
              : "bg-black/5 text-black/60 hover:bg-black/10 dark:bg-white/10 dark:text-white/60 dark:hover:bg-white/20"
          }`}
        >
          All
        </button>
        {usedCategories?.map((cat) => (
          <button
            key={cat._id}
            onClick={() => setSelectedCategory(cat._id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all active:scale-95 ${
              selectedCategory === cat._id
                ? "bg-black text-white dark:bg-purple-500 dark:text-white"
                : "bg-black/5 text-black/60 hover:bg-black/10 dark:bg-white/10 dark:text-white/60 dark:hover:bg-white/20"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Add Subscription Button */}
      <button
        onClick={handleAddSubscription}
        className="flex items-center justify-center gap-2 rounded-xl bg-black py-3 font-medium text-white transition-all active:scale-[0.98] dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 dark:text-white"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        Add Subscription
      </button>

      {/* Subscription List */}
      {filteredSubs.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
            Active ({filteredSubs.length})
          </p>
          <div className="flex flex-col gap-2">
            {filteredSubs.map((sub) => (
              <SubscriptionListCard
                key={sub._id}
                subscription={sub}
                clickHandler={() => handleSubscriptionClick(sub)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredSubs.length === 0 && subscriptions?.length > 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-black/50 dark:text-white/50">
            No subscriptions match your filter
          </p>
        </div>
      )}

      {/* Bulk Import Card */}
      <button
        onClick={onOpenBulkImport}
        className="flex items-center gap-3 rounded-xl bg-white/40 p-4 text-left backdrop-blur-sm transition-all active:scale-[0.98] dark:bg-white/10"
      >
        <div className="rounded-full bg-black/5 p-2 dark:bg-white/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5 text-black/60 dark:text-white/60"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-black/80 dark:text-white/80">
            Import from bank statement
          </p>
          <p className="text-xs text-black/40 dark:text-white/40">
            Auto-detect subscriptions from PDF
          </p>
        </div>
      </button>
    </div>
  );
}
