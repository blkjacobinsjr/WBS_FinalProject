import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react"; // Added useRef import
import { useDataContext } from "../contexts/dataContext";
import eventEmitter from "../utils/EventEmitter";
import SubscriptionListCard from "./SubscriptionListCard";

export default function SearchModal() {
  // ---- CONTEXT ----
  const { subscriptions } = useDataContext();

  // ---- STATE ----
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [correctModifierKey, setCorrectModifierKey] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  function handleInputChange(event) {
    event.preventDefault();
    const currentInput = event.target.value;

    // set state to show / hide results
    setSearchInput(currentInput);

    if (currentInput) {
      const results = subscriptions?.filter((s) =>
        s.name.toLowerCase().includes(currentInput.toLowerCase()),
      );

      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }

  // close search modal and open subscription
  function searchResultClickHandler(subscription) {
    setSearchInput("");
    setIsOpen(false);
    eventEmitter.emit("openSubscriptionForm", subscription, "show");
  }

  // Set up keyboard shortcut and such
  useEffect(() => {
    const isMac = navigator.userAgent.indexOf("Mac") > -1;
    const displayKey = isMac ? "\u2318" : "CTRL";
    setCorrectModifierKey(displayKey);

    function handleKeyDown(event) {
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;

      if (modifierKey && event.key === "k") {
        event.preventDefault();
        setIsOpen(true);
      }

      // clear search input when modal is closed
      if (event.key === "Escape") {
        setSearchInput("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full max-w-lg items-center space-x-2 rounded-lg border border-black/25 bg-white/50 px-3 py-1.5 shadow hover:border-black/50 focus:outline-none"
      >
        <svg
          className="-ml-1 flex-none text-gray-500"
          width="24"
          height="24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m19 19-3.5-3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
          <circle
            cx="11"
            cy="11"
            r="6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></circle>
        </svg>
        <span className="flex-1 text-left text-sm text-gray-500">
          Search...
        </span>
        <span className="hidden flex-none text-xs font-semibold text-gray-500 sm:flex">
          <span className="rounded border border-black/20 bg-gray-300/25 px-2 py-1 text-xs font-semibold shadow-inner">
            {correctModifierKey}
          </span>
          <span className="px-1">+</span>
          <span className="rounded border border-black/20 bg-gray-300/25 px-2 py-1 text-xs font-semibold shadow-inner">
            K
          </span>
        </span>
      </button>

      <Transition show={isOpen} as={Fragment} className="w-full">
        <Dialog
          as="div"
          className="fixed inset-0 z-50 flex h-full w-full items-start justify-center pt-20 sm:pt-32"
          onClose={() => setIsOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="w-full duration-200"
            enterFrom="scale-100 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="duration-200 ease-in"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-100 opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur" />
          </Transition.Child>

          <Transition.Child
            enter="duration-200 ease-out"
            enterFrom="scale-95 opacity-0"
            enterTo="flex w-full scale-100 justify-center opacity-100"
          leave="duration-200 ease-in"
          leaveFrom="flex w-full scale-100 justify-center opacity-100"
          leaveTo="flex w-full scale-95 justify-center opacity-0"
        >
            <div className="w-[92vw] max-w-lg rounded-xl border-black/25 bg-white px-4 py-2 shadow-xl">
              <form className="flex items-center">
                <svg
                  className="h-5 w-5 text-gray-700"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>

                <input
                  className="w-full py-4 pl-12 placeholder-gray-300 outline-none"
                  type="text"
                  placeholder="Search..."
                  value={searchInput}
                  onChange={handleInputChange}
                />

                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded border border-black/20 bg-gray-300/25 px-2 py-1 text-sm font-semibold uppercase shadow-inner"
                  type="button"
                >
                  Esc
                </button>
              </form>

              {/* Show results if input and results */}
              {searchInput && searchResults?.length > 0 && (
                <div className="mb-2 grid gap-2 rounded-lg bg-gray-300/25 p-2 shadow-inner">
                  {searchResults.map((sr, index) => (
                    <SubscriptionListCard
                      key={index}
                      subscription={sr}
                      clickHandler={() => searchResultClickHandler(sr)}
                    />
                  ))}
                </div>
              )}

              {/* Show 'no results' if input but no results... */}
              {searchInput && searchResults?.length === 0 && (
                <div className="mb-2 grid gap-2 rounded-lg bg-gray-300/25 p-2 text-center text-gray-500 shadow-inner">
                  No results found that match your search
                </div>
              )}
            </div>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}
