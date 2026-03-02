import eventEmitter from "../utils/EventEmitter";
import useAppHaptics from "../hooks/useAppHaptics";

export default function NotificationsCard({ notification }) {
  const haptics = useAppHaptics();
  const subscription = notification?.subscriptionId;

  return (
    <>
      <div className="flex w-full items-center justify-start rounded-lg border border-black/25">
        <button
          className="h-full w-full rounded-l-lg p-2 text-left hover:bg-gray-300/25"
          onClick={() => {
            haptics.confirm();
            eventEmitter.emit("notificationClicked", notification?._id);
          }}
        >
          <div className="text-xs text-gray-500">How often do you use...</div>
          <div>{subscription.name}</div>
          {/* Only for debugging purposes */}
          {/* <div className="text-xs text-gray-500">{notification?._id}</div> */}
        </button>
        <button
          className="flex h-full items-center justify-center place-self-end rounded-r-lg p-2 hover:bg-gray-300/25"
          onClick={() => {
            haptics.selection();
            eventEmitter.emit("markNotificationAsRead", notification?._id);
          }}
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
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>
    </>
  );
}
