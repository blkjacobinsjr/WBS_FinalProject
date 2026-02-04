import eventEmitter from "../utils/EventEmitter";

export default function SubscriptionCard({ subscription }) {
  // ---- Functions ----
  function openSubscriptionForm() {
    eventEmitter.emit("openSubscriptionForm", subscription, "show");
  }

  function handleDelete(e) {
    e.stopPropagation();
    eventEmitter.emit("deleteSubscription", subscription);
  }

  return (
    <>
      <div className="group relative ml-2 mr-2 mt-2">
        {/* Delete button - shown on hover */}
        <button
          onClick={handleDelete}
          className="absolute -right-1 -top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-md transition-opacity hover:bg-red-600 group-hover:opacity-100"
          title="Delete subscription"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="h-3.5 w-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <button
          className="flex items-center justify-center rounded-lg bg-gray-100 p-4 overflow-hidden"
          onClick={openSubscriptionForm}
          style={{ width: '200px' }}
        >
        {/* Adjusted ml-10 to ml-6 to decrease the gap next to each card by 20px */}
        <div className="self-center">
          {/* This div will create a grey circle around the icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-8 w-8 rounded-full bg-gray-500/50 p-1"
            style={{ width: '50px', height: '50px' }} 
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 13.5H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
            />
          </svg>
        </div>
        <div className="flex flex-col overflow-x-hidden" style={{ width: '100%', maxWidth: '300px' }}> 
          <h3 className="text-lg font-medium overflow-ellipsis overflow-hidden whitespace-nowrap">{subscription?.name}</h3>
          <p className="text-gray-600 overflow-ellipsis overflow-hidden whitespace-nowrap">
            {subscription?.active ? "Active" : "Inactive"}
          </p>
          <p className="text-lg font-semibold overflow-ellipsis overflow-hidden whitespace-nowrap">EUR {subscription?.price}</p>
        </div>
        </button>
      </div>
    </>
  );
}
