import { Dialog, RadioGroup, Transition } from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useDataContext } from "../contexts/dataContext"; // Context for data
import eventEmitter from "../utils/EventEmitter"; // Event emitter for handling events

// UsageTab now expects a subscriptions prop
export default function UsageModal({
  opened,
  onClose,
  notificationId,
  manualSubscriptions = null,
}) {
  // ---- CONTEXT ----
  const { notifications } = useDataContext();

  // ---- STATE ----
  const [selectedScore, setSelectedScore] = useState(null);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [unratedNotifications, setUnratedNotifications] = useState([]);
  const [initialTotal, setInitialTotal] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // ---- DERIVED STATE ----
  const currentIndex = unratedNotifications?.findIndex(
    (n) => n?._id === currentNotification?._id,
  );
  const totalCount = unratedNotifications?.length || 0;
  const progress = initialTotal > 0
    ? Math.round((completedCount / initialTotal) * 100)
    : 0;

  // Reset initialized state when modal closes
  useEffect(() => {
    if (!opened) {
      setIsInitialized(false);
    }
  }, [opened]);

  // ---- USE EFFECT ----
  // Initialize only once when modal opens - don't re-run when notifications change
  useEffect(() => {
    if (!opened || isInitialized) return;

    if (Array.isArray(manualSubscriptions) && manualSubscriptions.length > 0) {
      const manualList = manualSubscriptions.map((subscription) => ({
        _id: subscription?._id,
        subscriptionId: subscription,
      }));
      setCurrentNotification(manualList[0]);
      setUnratedNotifications(manualList);
      setInitialTotal(manualList.length);
      setCompletedCount(0);
      setIsInitialized(true);
      return;
    }

    const initialNotification = notifications?.find(
      (n) => n._id === notificationId,
    );

    // We can potentially have a state in which the notificationId the modal was opened with
    // does not exist anymore, so we need to check if the notificationId is in the
    // notifications array first before filtering and reordering the list (as we don't need
    // any reordering if we already rated the original notification)
    const openedWithNotification =
      notifications?.findIndex((n) => n._id === notificationId) > -1;

    if (openedWithNotification) {
      // Depending on which notification the user clicked we need to reorder our notifications
      // to go through
      const remainingNotifications =
        notifications?.filter((n) => n._id !== notificationId) ?? [];

      const initialUnratedNotificatons = [
        initialNotification,
        ...remainingNotifications,
      ];

      setCurrentNotification(initialNotification);
      setUnratedNotifications(initialUnratedNotificatons);
      setInitialTotal(initialUnratedNotificatons.length);
      setCompletedCount(0);
    } else {
      // if the notification we initially opened the modal with is gone, just use the first
      // notification and the array itself
      setCurrentNotification(notifications?.at(0));
      setUnratedNotifications(notifications);
      setInitialTotal(notifications?.length || 0);
      setCompletedCount(0);
    }
    setIsInitialized(true);
  }, [opened, notificationId, notifications, manualSubscriptions, isInitialized]);

  // Auto-advance when user selects a score
  const autoAdvanceRef = useRef(null);
  useEffect(() => {
    if (selectedScore && unratedNotifications.length > 0) {
      // Clear any pending auto-advance
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);

      // Auto-advance after brief visual feedback
      autoAdvanceRef.current = setTimeout(() => {
        handleChangeSubscriptionClick(1);
      }, 350);
    }
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, [selectedScore]);

  // go throug all notifications currently active
  function handleChangeSubscriptionClick(direction) {
    if (direction !== 1 && direction !== -1) return;

    let remainingAfterSubmit = unratedNotifications.length;

    if (selectedScore) {
      const selectedSubscriptionId =
        unratedNotifications[currentIndex].subscriptionId._id;

      // we need to send a new event: 'usageRatingSent' -> set Rating for ID and mark Notification as read
      eventEmitter.emit(
        "useScoreSelected",
        selectedSubscriptionId,
        selectedScore,
      );

      // remove from unrated subscription
      const filtered = unratedNotifications.filter(
        (n) => n._id !== currentNotification._id,
      );
      setUnratedNotifications(filtered);
      remainingAfterSubmit = filtered.length;

      // increment completed count for progress bar
      setCompletedCount((prev) => prev + 1);

      // if this was the last one, close modal
      if (filtered.length === 0) {
        setTimeout(() => onClose(), 300);
        return;
      }

      // move to next item in the filtered list
      const nextIndex = Math.min(currentIndex, filtered.length - 1);
      setCurrentNotification(filtered[nextIndex]);
      setSelectedScore(null);
      return;
    }

    // just move to next or previous if nothing is selected (skip)
    if (unratedNotifications.length > 1) {
      // direction can be +/- 1 so check both edges
      const newIndex = currentIndex + direction;

      if (newIndex > unratedNotifications.length - 1) {
        setCurrentNotification(unratedNotifications[0]);
      } else if (newIndex < 0) {
        setCurrentNotification(
          unratedNotifications[unratedNotifications.length - 1],
        );
      } else {
        setCurrentNotification(unratedNotifications[newIndex]);
      }

      setSelectedScore(null);
    }
  }

  // User clicks 'done'
  // Saves score if one is selected, just closed otherwise
  function handleDoneClick() {
    if (selectedScore) {
      submitSelectedScore(
        currentNotification.subscriptionId._id,
        selectedScore,
      );
    }

    onClose();
  }

  // Actually send the event to save the usage score and dismiss the related notification
  function submitSelectedScore(subscriptionId, score) {
    // Reset radiogroup
    setSelectedScore(null);

    eventEmitter.emit("useScoreSelected", subscriptionId, score);
  }

  // Render the modal
  return (
    <Transition show={opened} as={Fragment} className="w-full">
      <Dialog
        as="div"
        className="fixed inset-0 z-10 flex items-center justify-center"
        open={opened}
        onClose={onClose}
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
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur" />
        </Transition.Child>

        <Transition.Child
          enter="duration-200 ease-out"
          enterFrom="scale-95 opacity-0"
          enterTo="flex w-full scale-100 justify-center opacity-100"
          leave="duration-200 ease-in"
          leaveFrom="flex w-full scale-100 justify-center opacity-100"
          leaveTo="flex w-full scale-95 justify-center opacity-0"
        >
          <Dialog.Panel className="z-20 w-[92vw] max-w-lg rounded-lg bg-white p-6 opacity-90 sm:p-10">
            {/* Progress indicator */}
            {initialTotal > 1 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{completedCount + 1} of {initialTotal}</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                  <div
                    className="h-1.5 rounded-full bg-black transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <Dialog.Title
              as="h3"
              className="text-lg font-medium leading-6 text-gray-900"
            >
              How often do you use{" "}
              <span className="font-bold">
                {currentNotification?.subscriptionId?.name || "this subscription"}
              </span>
              ?
            </Dialog.Title>

            <div className="mt-2">
              {!currentNotification?.subscriptionId ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-500">
                    No subscriptions to rate. Add some subscriptions first!
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 rounded bg-black px-4 py-2 font-bold text-white hover:bg-gray-800"
                  >
                    Close
                  </button>
                </div>
              ) : (
              <>
              <p className="text-sm text-gray-500">
                Don&apos;t think, just select!
              </p>
              <RadioGroup
                onChange={(event) => setSelectedScore(event)}
                className="mt-4"
                value={selectedScore}
              >
                <RadioGroup.Option
                  value="5"
                  className={({ checked }) =>
                    `bg-green-300 ${checked ? "ring-2 ring-sky-500" : ""}
                    mb-4 relative px-4 py-3 shadow focus:outline-none cursor-pointer flex w-full flex-row items-center justify-start gap-4 rounded-lg p-4 hover:opacity-75 outline-none focus:ring-2  transform active:scale-90 transition-transform`
                  }
                >
                  {({ checked }) => (
                    <RadioGroup.Label
                      className={
                        (checked ? "text-white" : "text-gray-900") +
                        " cursor-pointer font-bold"
                      }
                    >
                      Often
                    </RadioGroup.Label>
                  )}
                </RadioGroup.Option>
                <RadioGroup.Option
                  value="3"
                  className={({ checked }) =>
                    `bg-orange-300 ${checked ? "ring-2 ring-sky-500" : ""}
                    mb-4 relative px-4 py-3 shadow focus:outline-none cursor-pointer flex w-full flex-row items-center justify-start gap-4 rounded-lg p-4 hover:opacity-75 outline-none focus:ring-2  transform active:scale-90 transition-transform`
                  }
                >
                  {({ checked }) => (
                    <RadioGroup.Label
                      className={
                        (checked ? "text-white" : "text-gray-900") +
                        " cursor-pointer font-bold"
                      }
                    >
                      Sometimes
                    </RadioGroup.Label>
                  )}
                </RadioGroup.Option>
                <RadioGroup.Option
                  value="1"
                  className={({ checked }) =>
                    `bg-red-300 ${checked ? "ring-2 ring-sky-500" : ""}
                    mb-4 relative px-4 py-3 shadow focus:outline-none cursor-pointer flex w-full flex-row items-center justify-start gap-4 rounded-lg p-4 hover:opacity-75 outline-none focus:ring-2  transform active:scale-90 transition-transform`
                  }
                >
                  {({ checked }) => (
                    <RadioGroup.Label
                      className={
                        (checked ? "text-white" : "text-gray-900") +
                        " cursor-pointer font-bold"
                      }
                    >
                      Rarely
                    </RadioGroup.Label>
                  )}
                </RadioGroup.Option>
              </RadioGroup>
              <div className="flex w-full flex-row items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={handleDoneClick}
                    className="mt-4 rounded bg-gray-500 px-4 py-2 font-bold text-white hover:bg-gray-700"
                  >
                    Done
                  </button>
                  {unratedNotifications?.length > 1 && (
                    <button
                      onClick={() => handleChangeSubscriptionClick(1)}
                      className="mt-4 rounded border border-gray-300 bg-white px-4 py-2 font-bold text-gray-600 hover:bg-gray-100"
                    >
                      Skip
                    </button>
                  )}
                </div>
                {unratedNotifications?.length > 1 && (
                  <div className="flex flex-row justify-end gap-2">
                    <button
                      onClick={() => handleChangeSubscriptionClick(-1)}
                      className="mt-4 flex items-center justify-center gap-1 rounded bg-gray-500 px-4 py-2 font-bold text-white hover:bg-gray-700"
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
                          d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleChangeSubscriptionClick(1)}
                      className="mt-4 flex items-center justify-center gap-1 rounded bg-gray-500 px-4 py-2 font-bold text-white hover:bg-gray-700"
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
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              </>
              )}
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}
