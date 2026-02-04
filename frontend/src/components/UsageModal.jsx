import { Dialog, RadioGroup, Transition } from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useDataContext } from "../contexts/dataContext";
import eventEmitter from "../utils/EventEmitter";

export default function UsageModal({
  opened,
  onClose,
  notificationId,
  manualSubscriptions = null,
}) {
  const { notifications } = useDataContext();

  const [selectedScore, setSelectedScore] = useState(null);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [unratedNotifications, setUnratedNotifications] = useState([]);
  const [initialTotal, setInitialTotal] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const currentIndex = unratedNotifications?.findIndex(
    (n) => n?._id === currentNotification?._id
  );
  const progress =
    initialTotal > 0 ? Math.round((completedCount / initialTotal) * 100) : 0;

  useEffect(() => {
    if (!opened) {
      setIsInitialized(false);
    }
  }, [opened]);

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
      (n) => n._id === notificationId
    );

    const openedWithNotification =
      notifications?.findIndex((n) => n._id === notificationId) > -1;

    if (openedWithNotification) {
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
      setCurrentNotification(notifications?.at(0));
      setUnratedNotifications(notifications);
      setInitialTotal(notifications?.length || 0);
      setCompletedCount(0);
    }
    setIsInitialized(true);
  }, [opened, notificationId, notifications, manualSubscriptions, isInitialized]);

  const autoAdvanceRef = useRef(null);
  useEffect(() => {
    if (selectedScore && unratedNotifications.length > 0) {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = setTimeout(() => {
        handleChangeSubscriptionClick(1);
      }, 350);
    }
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, [selectedScore]);

  function handleChangeSubscriptionClick(direction) {
    if (direction !== 1 && direction !== -1) return;

    if (selectedScore) {
      const selectedSubscriptionId =
        unratedNotifications[currentIndex].subscriptionId._id;

      eventEmitter.emit(
        "useScoreSelected",
        selectedSubscriptionId,
        selectedScore
      );

      const filtered = unratedNotifications.filter(
        (n) => n._id !== currentNotification._id
      );
      setUnratedNotifications(filtered);
      setCompletedCount((prev) => prev + 1);

      if (filtered.length === 0) {
        setTimeout(() => onClose(), 300);
        return;
      }

      const nextIndex = Math.min(currentIndex, filtered.length - 1);
      setCurrentNotification(filtered[nextIndex]);
      setSelectedScore(null);
      return;
    }

    if (unratedNotifications.length > 1) {
      const newIndex = currentIndex + direction;
      if (newIndex > unratedNotifications.length - 1) {
        setCurrentNotification(unratedNotifications[0]);
      } else if (newIndex < 0) {
        setCurrentNotification(
          unratedNotifications[unratedNotifications.length - 1]
        );
      } else {
        setCurrentNotification(unratedNotifications[newIndex]);
      }
      setSelectedScore(null);
    }
  }

  function handleDoneClick() {
    if (selectedScore) {
      eventEmitter.emit(
        "useScoreSelected",
        currentNotification.subscriptionId._id,
        selectedScore
      );
    }
    onClose();
  }

  return (
    <Transition show={opened} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        {/* Full-screen sheet */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="translate-y-full"
          enterTo="translate-y-0"
          leave="ease-in duration-200"
          leaveFrom="translate-y-0"
          leaveTo="translate-y-full"
        >
          <Dialog.Panel className="fixed inset-0 flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/5 bg-white/60 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-black/60">
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5 text-black/70 dark:text-white/70"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
              <Dialog.Title className="text-base font-semibold text-black/80 dark:text-white/80">
                Usage Quiz
              </Dialog.Title>
              <button
                onClick={handleDoneClick}
                className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                Done
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              {/* Progress */}
              {initialTotal > 1 && (
                <div className="mb-6 rounded-2xl bg-white/40 p-4 backdrop-blur-sm dark:bg-white/10">
                  <div className="flex items-center justify-between text-xs text-black/50 dark:text-white/50">
                    <span>Progress</span>
                    <span>
                      {completedCount}/{initialTotal}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Current subscription */}
              {currentNotification?.subscriptionId ? (
                <>
                  <div className="mb-6 rounded-2xl bg-white/40 p-5 backdrop-blur-sm dark:bg-white/10">
                    <p className="text-center text-lg font-semibold text-black/80 dark:text-white/80">
                      {currentNotification.subscriptionId.name}
                    </p>
                    {currentNotification.subscriptionId.price && (
                      <p className="mt-1 text-center text-sm text-black/50 dark:text-white/50">
                        €{currentNotification.subscriptionId.price}/
                        {currentNotification.subscriptionId.interval || "month"}
                      </p>
                    )}
                  </div>

                  <p className="mb-4 text-center text-sm text-black/50 dark:text-white/50">
                    How often do you use this?
                  </p>

                  {/* Rating options */}
                  <RadioGroup
                    value={selectedScore}
                    onChange={setSelectedScore}
                    className="space-y-3"
                  >
                    <RadioGroup.Option
                      value="5"
                      className={({ checked }) =>
                        `cursor-pointer rounded-2xl p-4 transition-all active:scale-[0.98] ${
                          checked
                            ? "bg-green-500 text-white"
                            : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        }`
                      }
                    >
                      {({ checked }) => (
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Often</span>
                          <span className="text-sm opacity-70">Daily or weekly</span>
                        </div>
                      )}
                    </RadioGroup.Option>

                    <RadioGroup.Option
                      value="3"
                      className={({ checked }) =>
                        `cursor-pointer rounded-2xl p-4 transition-all active:scale-[0.98] ${
                          checked
                            ? "bg-orange-500 text-white"
                            : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                        }`
                      }
                    >
                      {({ checked }) => (
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Sometimes</span>
                          <span className="text-sm opacity-70">Monthly</span>
                        </div>
                      )}
                    </RadioGroup.Option>

                    <RadioGroup.Option
                      value="1"
                      className={({ checked }) =>
                        `cursor-pointer rounded-2xl p-4 transition-all active:scale-[0.98] ${
                          checked
                            ? "bg-red-500 text-white"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`
                      }
                    >
                      {({ checked }) => (
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Rarely</span>
                          <span className="text-sm opacity-70">Almost never</span>
                        </div>
                      )}
                    </RadioGroup.Option>
                  </RadioGroup>

                  {/* Skip button */}
                  {unratedNotifications?.length > 1 && (
                    <button
                      onClick={() => handleChangeSubscriptionClick(1)}
                      className="mt-4 w-full rounded-2xl bg-black/5 py-3 text-sm font-medium text-black/60 transition-all active:scale-[0.98] dark:bg-white/10 dark:text-white/60"
                    >
                      Skip for now
                    </button>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white/40 py-12 backdrop-blur-sm dark:bg-white/10">
                  <p className="text-sm text-black/50 dark:text-white/50">
                    No subscriptions to rate
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 rounded-full bg-black px-6 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Safe area */}
            <div className="h-[env(safe-area-inset-bottom)]" />
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}
