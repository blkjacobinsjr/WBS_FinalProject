import { Popover } from "@headlessui/react";
import NotificationsCard from "./NotificationsCard";
import { useDataContext } from "../contexts/dataContext";
import { useEffect, useState } from "react";

export default function Notifications() {
  // STOP PINGING ANIMATION AFTER HOW MANY SECONDS
  const STOP_PING_AFTER_SECONDS = 16;

  // ---- CONTEXT ----
  const { notifications } = useDataContext();

  // ---- STATE ----
  const [animatePing, setAnimatePing] = useState(true);

  // set timeout to stop ping animation
  useEffect(() => {
    function stopAnimationCallback() {
      setAnimatePing(false);
    }

    const timeout = setTimeout(
      stopAnimationCallback,
      STOP_PING_AFTER_SECONDS * 1000,
    );

    return () => clearTimeout(timeout);
  }, [notifications]);

  return (
    <Popover className="relative">
      <Popover.Button className="relative rounded-full border border-black/25 bg-white/25 p-1 hover:bg-white/75">
        {/* SVG Icon */}
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
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {/* Notifications */}
        {notifications?.length > 0 && (
          <div className="absolute bottom-0 right-0 flex h-4 w-4 -translate-y-5 translate-x-1 items-center justify-center rounded-full bg-sky-500 text-xs text-white">
            {notifications?.length}
            <span
              className={`absolute inline-flex h-full w-full ${
                animatePing ? "animate-ping bg-sky-500" : ""
              } rounded-full opacity-75`}
            ></span>
          </div>
        )}
      </Popover.Button>

      <Popover.Panel className="absolute right-0 z-10 mt-2 w-[90vw] max-w-sm rounded-xl border border-black/25 bg-white p-2 shadow-xl sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
        <div className="grid gap-2">
          {/* Notifications to show */}
          {notifications?.length > 0 &&
            notifications?.map((notification) => (
              <NotificationsCard
                key={notification._id}
                notification={notification}
              />
            ))}

          {/* Nothing to show */}
          {notifications?.length === 0 && (
            <div className="p-2 text-center text-sm text-gray-500">
              You currently have no notifications.
            </div>
          )}
        </div>
      </Popover.Panel>
    </Popover>
  );
}
