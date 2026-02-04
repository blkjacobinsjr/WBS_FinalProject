import { useState } from "react";
import { useDataContext } from "../contexts/dataContext";
import eventEmitter from "../utils/EventEmitter";
import SubscriptionListCard from "./SubscriptionListCard";
import { filterByCategory } from "../utils/filterHelper";
import PaginationButton from "./PaginationButton";

export default function SubscriptionList({
  itemsPerPage = 3,
  categoryId = null,
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

    if (newPage >= 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  }

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
          />
        ))}
      </div>

      {/* Pagination */}
      {/* Previous Button */}
      <div className="flex justify-center space-x-2 bg-opacity-50 py-4">
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
        {totalPages > 1 &&
          Array.from({ length: totalPages }, (_, i) => (
            <PaginationButton
              key={i}
              isActive={true}
              isCurrent={i + 1 === currentPage}
              clickHandler={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </PaginationButton>
          ))}

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
