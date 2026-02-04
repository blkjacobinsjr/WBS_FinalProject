import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";

import ErrorDisplay from "../components/ErrorDisplay";
import Loading from "../components/Loading";
import SubscriptionForm from "../components/SubscriptionForm";
import UsageModal from "../components/UsageModal";
import BottomTabBar from "../components/BottomTabBar";
import HomeTab from "./HomeTab";
import SubscriptionsTab from "./SubscriptionsTab";
import InsightsTab from "./InsightsTab";
import SettingsTab from "./SettingsTab";
import BulkImport from "./BulkImport";

import { useDataContext } from "../contexts/dataContext";
import useCategory from "../hooks/useCategory";
import useDashboard from "../hooks/useDashboard";
import useDataFetching from "../hooks/useDataFetching";
import useNotifications from "../hooks/useNotifications";
import useSubscription from "../hooks/useSubscription";
import useUsage from "../hooks/useUsage";
import eventEmitter from "../utils/EventEmitter";
import { createUsageBody } from "../utils/schemaBuilder";

function Dashboard() {
  // ---- PAGE INFORMATION ----
  const { pageId } = useParams();
  const { user } = useUser();

  // ---- CONTEXT ----
  const {
    subscriptions,
    setSubscriptions,
    allCategories,
    usedCategories,
    setUsedCategories,
    dashboardData,
    setDashboardData,
    setNotifications,
  } = useDataContext();

  // ---- STATE ----
  const [activeTab, setActiveTab] = useState("home");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [subscriptionFormState, setSubscriptionFormState] = useState({
    mode: null,
    subscription: {},
    showForm: false,
  });
  const [isResettingData, setIsResettingData] = useState(false);
  const [usageModalState, setUsageModalState] = useState({
    showForm: false,
    notificationId: null,
    manualSubscriptions: null,
  });

  // ---- CUSTOM HOOKS ----
  const { loading, error, errorMessage, refetchData } = useDataFetching();
  const { createUsage } = useUsage();
  const { getAllSubscriptions, deleteSubscription } = useSubscription();
  const { getUsedCategories } = useCategory();
  const { getDashboardData } = useDashboard();
  const { getAllNotifications, getAndUpdateNotificationById } =
    useNotifications();

  // ---- Event Callbacks ----
  // show subscription form
  function openSubscriptionFormCallback(subscription, mode) {
    setSubscriptionFormState({
      mode,
      subscription,
      showForm: true,
    });
  }

  // Switch Edit mode for subscription form
  function switchFormModeCallback(mode) {
    setSubscriptionFormState((prev) => {
      return {
        ...prev,
        mode,
      };
    });
  }

  // Notification has been clicked, show usageModal
  function notificationClickedCallback(id) {
    setUsageModalState({
      showForm: true,
      notificationId: id,
      manualSubscriptions: null,
    });
  }

  // ---- THE ALMIGHTY USE EFFECT ----
  useEffect(() => {
    const abortController = new AbortController();
    const notificationAbortController = new AbortController();

    // Unfortunately, every time we add usage data we need to sneakily refetch almost
    // all data, as otherwise our application doesn't show the current state of data *buuuuuuh!*
    async function sneakyDataRefetch() {
      try {
        const [
          updatedSubscriptions,
          updatedUsedCategories,
          updatedDashboardData,
          updatedNotifications,
        ] = await Promise.all([
          getAllSubscriptions(abortController),
          getUsedCategories(abortController),
          getDashboardData(abortController),
          getAllNotifications(abortController),
        ]);

        setSubscriptions(updatedSubscriptions);
        setUsedCategories(updatedUsedCategories);
        setDashboardData(updatedDashboardData);

        // HACK: For some reason, all data is correctly refetched, but a single notification
        // keeps getting stuck in context... so remove notification if all that's coming back is
        // just one...
        if (updatedNotifications?.length === 1) {
          setNotifications([]);
        } else {
          setNotifications(updatedNotifications);
        }
      } catch (error) {
        console.error(`Error refetching subscriptions: ${errorMessage}`);
      }
    }

    // Rerequest notifications only, as re-rendering the whole UI for removing a notification
    // seems pretty excessive
    async function refetchNotifications() {
      try {
        const notifications = await getAllNotifications(
          notificationAbortController,
        );
        setNotifications(notifications);
      } catch (error) {
        console.error(`Error refetching notifications: ${errorMessage}`);
      }
    }

    // creating new usage data
    async function createUsageData(subscriptionId, score) {
      try {
        const usageBody = createUsageBody(subscriptionId, score);

        await createUsage(usageBody, abortController);
      } catch (error) {
        console.error(`Error creating usage data: ${errorMessage}`);
      }
    }

    // dismissing a single notification as read
    // TODO: With this, a user can skip feedback for usage, but if we don't want to allow
    // this we would probably need to remove the 'mark as read' option...
    async function updateNotification(notificationId) {
      try {
        // TODO: Check what this actually returns ...
        const updateNotification = await getAndUpdateNotificationById(
          notificationId,
          abortController,
        );

        refetchNotifications();
      } catch (error) {
        console.error(`Error creating usage data: ${errorMessage}`);
      }
    }

    // All event handlers that require backend communcation need to be
    // inside the use effect because we need the abortionController
    // TODO: We could create a new controller withint the event handler maybe?

    // Need this one in here for the abort controller
    function refetchCallback() {
      refetchData(abortController);
    }

    // mark a single notification as read
    function notificationReadCallback(id) {
      updateNotification(id);
    }

    async function openUsageQuizCallback() {
      try {
        const latest = await getAllSubscriptions(new AbortController());
        setUsageModalState({
          showForm: true,
          notificationId: null,
          manualSubscriptions: latest || [],
        });
      } catch (error) {
        setUsageModalState({
          showForm: true,
          notificationId: null,
          manualSubscriptions: subscriptions || [],
        });
      }
    }

    // Debounce refetch to avoid multiple rapid calls during quiz
    let refetchTimeout = null;
    function debouncedRefetch() {
      if (refetchTimeout) clearTimeout(refetchTimeout);
      refetchTimeout = setTimeout(() => {
        sneakyDataRefetch();
      }, 500);
    }

    // Create new usage Data and mark notification this feedback came from as read
    async function usageScoreSelectedCallback(subscriptionId, score) {
      // create usage data - await to ensure it's saved before any refetch
      await createUsageData(subscriptionId, score);

      // Debounced refetch - only fires 500ms after last score submission
      debouncedRefetch();

      // NOTE: We don't need to mark a notification as read here, as every posted usage data
      // invalidates all notifications associated with a single subscription
    }

    // Optimistic delete with undo - stores pending delete timeouts
    const pendingDeletes = new Map();

    function deleteSubscriptionCallback(subscription) {
      // 1. Optimistically remove from UI immediately
      setSubscriptions((prev) => prev.filter((s) => s._id !== subscription._id));

      // 2. Set up delayed actual deletion (5 seconds)
      const timeoutId = setTimeout(async () => {
        pendingDeletes.delete(subscription._id);
        try {
          await deleteSubscription(subscription._id, abortController);
          sneakyDataRefetch(); // Refresh all data after actual delete
        } catch (error) {
          // If delete fails, restore the subscription
          setSubscriptions((prev) => [...prev, subscription]);
          toast.error("Failed to delete subscription");
        }
      }, 5000);

      pendingDeletes.set(subscription._id, { timeoutId, subscription });

      // 3. Show toast with Undo button
      toast("Subscription deleted", {
        action: {
          label: "Undo",
          onClick: () => {
            const pending = pendingDeletes.get(subscription._id);
            if (pending) {
              clearTimeout(pending.timeoutId);
              pendingDeletes.delete(subscription._id);
              setSubscriptions((prev) => [...prev, subscription]);
            }
          },
        },
        duration: 5000,
      });
    }

    // register event listeners
    // Switch tab event handler
    function switchTabCallback(tabId) {
      setActiveTab(tabId);
    }

    eventEmitter.on("refetchData", refetchCallback);
    eventEmitter.on("openSubscriptionForm", openSubscriptionFormCallback);
    eventEmitter.on("changeFormMode", switchFormModeCallback);
    eventEmitter.on("markNotificationAsRead", notificationReadCallback);
    eventEmitter.on("notificationClicked", notificationClickedCallback);
    eventEmitter.on("useScoreSelected", usageScoreSelectedCallback);
    eventEmitter.on("openUsageQuiz", openUsageQuizCallback);
    eventEmitter.on("deleteSubscription", deleteSubscriptionCallback);
    eventEmitter.on("switchTab", switchTabCallback);

    return () => {
      abortController.abort();
      notificationAbortController.abort();
      // Clear any pending deletes on unmount
      pendingDeletes.forEach(({ timeoutId }) => clearTimeout(timeoutId));
      eventEmitter.off("refetchData", refetchCallback);
      eventEmitter.off("openSubscriptionForm", openSubscriptionFormCallback);
      eventEmitter.off("changeFormMode", switchFormModeCallback);
      eventEmitter.off("markNotificationAsRead", notificationReadCallback);
      eventEmitter.off("notificationClicked", notificationClickedCallback);
      eventEmitter.off("useScoreSelected", usageScoreSelectedCallback);
      eventEmitter.off("openUsageQuiz", openUsageQuizCallback);
      eventEmitter.off("deleteSubscription", deleteSubscriptionCallback);
      eventEmitter.off("switchTab", switchTabCallback);
    };
  }, []);

  // ---- MORE FUNCTIONS ----
  async function handleResetData() {
    setIsResettingData(true);

    try {
      const current = await getAllSubscriptions(new AbortController());
      const deletions = (current || [])
        .filter((sub) => sub?._id)
        .map((sub) =>
          deleteSubscription(sub._id, new AbortController()),
        );

      await Promise.allSettled(deletions);

      const [updatedSubscriptions, updatedUsedCategories, updatedDashboardData] =
        await Promise.all([
          getAllSubscriptions(new AbortController()),
          getUsedCategories(new AbortController()),
          getDashboardData(new AbortController()),
        ]);

      setSubscriptions(updatedSubscriptions || []);
      setUsedCategories(updatedUsedCategories || []);
      setDashboardData(updatedDashboardData || {});

      toast.success("Data reset");
    } catch (error) {
      toast.error("Reset failed");
    } finally {
      setIsResettingData(false);
    }
  }

  // quick helper function to keep JSX less cluttered
  function checkDataLoadingSuccessful() {
    const loadingSuccessful =
      subscriptions?.length >= 0 &&
      usedCategories?.length >= 0 &&
      allCategories?.length >= 0 &&
      Object.keys(dashboardData).length > 0;

    return loadingSuccessful;
  }

  // Render tab content based on activeTab
  function renderTabContent() {
    if (showBulkImport) {
      return (
        <BulkImport
          embedded={true}
          redirectOnComplete={false}
          onBack={() => setShowBulkImport(false)}
          onComplete={() => {
            setShowBulkImport(false);
            setActiveTab("subscriptions");
          }}
        />
      );
    }

    switch (activeTab) {
      case "home":
        return <HomeTab />;
      case "subscriptions":
        return (
          <SubscriptionsTab onOpenBulkImport={() => setShowBulkImport(true)} />
        );
      case "insights":
        return <InsightsTab />;
      case "settings":
        return (
          <SettingsTab
            onResetData={handleResetData}
            isResettingData={isResettingData}
          />
        );
      default:
        return <HomeTab />;
    }
  }

  // Main return block for the Dashboard component
  return (
    <div className="apple-bg min-h-screen w-full">
      {loading && <Loading />}

      {!loading && error && <ErrorDisplay message={errorMessage} />}

      {!loading && !error && checkDataLoadingSuccessful() && (
        <div className="mx-auto flex min-h-screen max-w-lg flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-black/10 bg-white/60 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-black/60">
            <div className="flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-2">
                <img
                  src="/subzero_logo_icon.png"
                  className="h-7 w-7"
                  alt="Logo"
                />
                <span className="text-sm font-semibold text-black/80 dark:text-white/80">
                  Subzero
                </span>
              </Link>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto px-4 py-4">
            {renderTabContent()}
          </main>

          {/* Bottom Tab Bar */}
          {!showBulkImport && (
            <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
          )}
        </div>
      )}

      {/* Subscription Add Form */}
      {!loading && !error && checkDataLoadingSuccessful() && (
        <SubscriptionForm
          mode={subscriptionFormState.mode}
          subscription={subscriptionFormState.subscription}
          opened={subscriptionFormState.showForm}
          onClose={() =>
            setSubscriptionFormState((prev) => {
              return { ...prev, showForm: false };
            })
          }
        />
      )}

      {/* Usage Modal */}
      <UsageModal
        opened={usageModalState.showForm}
        notificationId={usageModalState.notificationId}
        manualSubscriptions={usageModalState.manualSubscriptions}
        onClose={() =>
          setUsageModalState((prev) => {
            return { ...prev, showForm: false };
          })
        }
      />
    </div>
  );
}

export default Dashboard;
