import { Dialog, RadioGroup, Transition } from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useDataContext } from "../contexts/dataContext";
import eventEmitter from "../utils/EventEmitter";

export default function FrequencyQuizModal({
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
      }, 400);
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

  const frequencyOptions = [
    { value: 5, label: "Daily", desc: "Use it every day", emoji: "🔥" },
    { value: 4, label: "Weekly", desc: "A few times a week", emoji: "📅" },
    { value: 3, label: "Monthly", desc: "A few times a month", emoji: "📆" },
    { value: 2, label: "Rarely", desc: "Once in a while", emoji: "🌙" },
    { value: 1, label: "Never", desc: "Haven't used it", emoji: "❄️" },
  ];

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
              {/* Intro text - only show at start */}
              {completedCount === 0 && initialTotal > 0 && (
                <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-4 dark:from-blue-900/20 dark:to-cyan-900/20">
                  <p className="text-center text-xs text-blue-900/70 dark:text-blue-100/70">
                    Rate how often you actually use each subscription.
                    <br />
                    This helps identify what to keep vs. cancel.
                  </p>
                </div>
              )}

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
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Current subscription */}
              {currentNotification?.subscriptionId ? (
                <>
                  <div className="mb-6 rounded-2xl bg-white/40 p-6 backdrop-blur-sm dark:bg-white/10">
                    <p className="text-center text-xl font-bold text-black/80 dark:text-white/80">
                      {currentNotification.subscriptionId.name}
                    </p>
                    {currentNotification.subscriptionId.price && (
                      <p className="mt-2 text-center text-sm text-black/50 dark:text-white/50">
                        €{currentNotification.subscriptionId.price}/
                        {currentNotification.subscriptionId.interval || "month"}
                      </p>
                    )}
                  </div>

                  <p className="mb-4 text-center text-sm font-medium text-black/60 dark:text-white/60">
                    How often do you use this?
                  </p>

                  {/* Rating options - Frequency-based */}
                  <RadioGroup
                    value={selectedScore}
                    onChange={(val) => setSelectedScore(Number(val))}
                    className="space-y-2"
                  >
                    {frequencyOptions.map((option) => (
                      <RadioGroup.Option
                        key={option.value}
                        value={option.value}
                        className={({ checked }) =>
                          `cursor-pointer rounded-2xl p-4 transition-all active:scale-[0.98] ${
                            checked
                              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                              : "bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300"
                          }`
                        }
                      >
                        {({ checked }) => (
                          <div className="flex items-center gap-3">
                            <div className={`text-xl ${checked ? "" : "grayscale"}`}>
                              {option.emoji}
                            </div>
                            <div className="flex-1">
                              <span className="font-bold">{option.label}</span>
                              <p className={`mt-0.5 text-xs ${checked ? "text-white/80" : "opacity-60"}`}>
                                {option.desc}
                              </p>
                            </div>
                          </div>
                        )}
                      </RadioGroup.Option>
                    ))}
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
                  <div className="mb-4 text-4xl">🎉</div>
                  <p className="text-sm font-medium text-black/70 dark:text-white/70">
                    All done!
                  </p>
                  <p className="mt-1 text-xs text-black/50 dark:text-white/50">
                    Check Insights to see your results
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 rounded-full bg-black px-6 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                  >
                    See Results
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
