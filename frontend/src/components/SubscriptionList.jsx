import { useState } from "react";
import { useDataContext } from "../contexts/dataContext";
import eventEmitter from "../utils/EventEmitter";
import SubscriptionListCard from "./SubscriptionListCard";
import { filterByCategory } from "../utils/filterHelper";
import PaginationButton from "./PaginationButton";

export default function SubscriptionList({
  itemsPerPage = 3,
  categoryId = null,
  animateOnMount = false,
}) {
  const { subscriptions } = useDataContext();
  const [currentPage, setCurrentPage] = useState(1);
  const filteredSubscriptions = filterByCategory(subscriptions, categoryId);

  // Calculate the total number of pages
  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);

  // Some more calculations
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Get the subscriptions for the current page
  const currentSubscriptions = filteredSubscriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  function handleRelativeButtonClick(change) {
    const newPage = currentPage + change;

    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  }

  function buildPageItems() {
    if (totalPages <= 1) return [];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set([
      1,
      totalPages,
      currentPage - 1,
      currentPage,
      currentPage + 1,
    ]);

    const sorted = Array.from(pages)
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);

    const items = [];
    let prev = null;
    for (const page of sorted) {
      if (prev !== null && page - prev > 1) {
        items.push("ellipsis");
      }
      items.push(page);
      prev = page;
    }

    return items;
  }

  const pageItems = buildPageItems();

  return (
    <div className="flex h-full min-w-0 flex-col justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        {currentSubscriptions?.map((subscription, index) => (
          <SubscriptionListCard
            key={subscription?._id || `${subscription?.name}-${index}`}
            subscription={subscription}
            showCategory={categoryId ? false : true}
            clickHandler={() =>
              eventEmitter.emit("openSubscriptionForm", subscription, "show")
            }
            className={animateOnMount ? "stagger-in" : ""}
            style={
              animateOnMount
                ? { animationDelay: `${Math.min(index * 60, 600)}ms` }
                : undefined
            }
          />
        ))}
      </div>

      {/* Pagination */}
      {/* Previous Button */}
      <div className="flex flex-wrap items-center justify-center gap-2 bg-opacity-50 py-4">
        {totalPages > 1 && (
          <PaginationButton
            isActive={hasPrevious}
            isCurrent={false}
            clickHandler={() => handleRelativeButtonClick(-1)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </PaginationButton>
        )}

        {/* Page Buttons */}
        {pageItems.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-xs font-semibold text-gray-500"
            >
              ...
            </span>
          ) : (
            <PaginationButton
              key={item}
              isActive={true}
              isCurrent={item === currentPage}
              clickHandler={() => setCurrentPage(item)}
            >
              {item}
            </PaginationButton>
          ),
        )}

        {/* Next Button */}
        {totalPages > 1 && (
          <PaginationButton
            isActive={hasNext}
            isCurrent={false}
            clickHandler={() => handleRelativeButtonClick(1)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </PaginationButton>
        )}
      </div>
    </div>
  );
}
