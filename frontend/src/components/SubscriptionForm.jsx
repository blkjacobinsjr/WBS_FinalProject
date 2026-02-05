import { Dialog, Listbox, Transition } from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDataContext } from "../contexts/dataContext";
import useSubscription from "../hooks/useSubscription";
import eventEmitter from "../utils/EventEmitter";
import CategoryIcon from "./CategoryIcon";
import { createSubscriptionBody } from "../utils/schemaBuilder";
import { resolveCancelLink } from "../utils/cancelProviders";
import LoadingButton from "./LoadingButton";

export default function SubscriptionForm({
  mode,
  subscription,
  opened,
  onClose,
}) {
  const { allCategories } = useDataContext();

  const billingCycles = ["month", "year"];
  const noneCategoryId = "65085704f18207c1481e6642";

  const [selectedCategory, setSelectedCategory] = useState();
  const [selectedBillingCycle, setSelectedBillingCycle] = useState();
  const [pendingAction, setPendingAction] = useState(null);

  const { createSubscription, updateSubscription, deleteSubscription } =
    useSubscription();

  const nameRef = useRef();
  const priceRef = useRef();

  useEffect(() => {
    setSelectedCategory(
      subscription?.category ??
        allCategories.find((c) => c._id === noneCategoryId)
    );
    setSelectedBillingCycle(subscription?.interval ?? "month");
  }, [allCategories, subscription]);

  function switchMode(mode) {
    eventEmitter.emit("changeFormMode", mode);
  }

  function createSubscriptionDataFromForm() {
    const cleanPrice = parseFloat(priceRef.current.value.replace(",", "."));

    if (isNaN(cleanPrice)) {
      toast.error("Price must be a valid number");
      return;
    }

    const formSubscription = createSubscriptionBody(
      nameRef.current.value,
      cleanPrice,
      selectedCategory._id,
      selectedBillingCycle
    );

    return formSubscription;
  }

  async function handleAddSubscription() {
    if (!nameRef.current?.value || !priceRef.current?.value) {
      toast.error("Enter a name and price");
      return;
    }

    const newSubscription = createSubscriptionDataFromForm();
    if (!newSubscription) return;

    setPendingAction("add");

    try {
      const abortController = new AbortController();
      const { successful } = await createSubscription(
        newSubscription,
        abortController
      );

      if (!successful) {
        throw new Error("Unable to save subscription");
      }
      toast.success("Subscription added");
    } catch (error) {
      toast.error(error.message);
    } finally {
      eventEmitter.emit("refetchData");
      setPendingAction(null);
    }

    onClose();
  }

  async function handleSaveEditSubscription() {
    if (!subscription._id) return;

    const updatedSubscription = createSubscriptionDataFromForm();
    if (!updatedSubscription) return;
    updatedSubscription._id = subscription._id;

    setPendingAction("save");

    try {
      const abortController = new AbortController();
      await updateSubscription(updatedSubscription, abortController);
      toast.success("Subscription saved");
    } catch (error) {
      toast.error(error.message);
    } finally {
      eventEmitter.emit("refetchData");
      setPendingAction(null);
    }

    onClose();
  }

  async function handleDeleteSubscription() {
    if (!subscription._id) return;

    setPendingAction("delete");

    try {
      const abortController = new AbortController();

      const { successful } = await deleteSubscription(
        subscription._id,
        abortController
      );

      if (!successful) {
        throw new Error("Unable to delete subscription");
      }
      toast.success("Subscription deleted");
    } catch (error) {
      toast.error(error.message);
    } finally {
      eventEmitter.emit("refetchData");
      setPendingAction(null);
    }

    onClose();
  }

  const title =
    mode === "add"
      ? "Add Subscription"
      : mode === "edit"
      ? "Edit Subscription"
      : subscription?.name || "Subscription";

  const cancelInfo =
    mode === "show" && subscription?.name
      ? resolveCancelLink(subscription.name)
      : null;

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
                {title}
              </Dialog.Title>
              {mode === "add" && (
                <LoadingButton
                  isLoading={pendingAction === "add"}
                  onClick={handleAddSubscription}
                  className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                >
                  Save
                </LoadingButton>
              )}
              {mode === "edit" && (
                <LoadingButton
                  isLoading={pendingAction === "save"}
                  onClick={handleSaveEditSubscription}
                  className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                >
                  Save
                </LoadingButton>
              )}
              {mode === "show" && (
                <button
                  onClick={() => switchMode("edit")}
                  className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                >
                  Edit
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              {/* Name & Price Card */}
              <div className="mb-4 rounded-2xl bg-white/40 p-4 backdrop-blur-sm dark:bg-white/10">
                {(mode === "add" || mode === "edit") ? (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-black/50 dark:text-white/50">
                        Name
                      </label>
                      <input
                        ref={nameRef}
                        type="text"
                        placeholder="Subscription name"
                        defaultValue={subscription?.name}
                        className="w-full rounded-xl border-0 bg-black/5 px-4 py-3 text-base text-black/80 placeholder-black/30 focus:outline-none focus:ring-2 focus:ring-black/20 dark:bg-white/10 dark:text-white/80 dark:placeholder-white/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-black/50 dark:text-white/50">
                        Price (EUR)
                      </label>
                      <input
                        ref={priceRef}
                        type="text"
                        placeholder="0.00"
                        defaultValue={subscription?.price}
                        className="w-full rounded-xl border-0 bg-black/5 px-4 py-3 text-base text-black/80 placeholder-black/30 focus:outline-none focus:ring-2 focus:ring-black/20 dark:bg-white/10 dark:text-white/80 dark:placeholder-white/30"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-xl font-semibold text-black/80 dark:text-white/80">
                      {subscription?.name}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-black dark:text-white">
                      €{subscription?.price}
                      <span className="text-sm font-normal text-black/50 dark:text-white/50">
                        /{subscription?.interval || "month"}
                      </span>
                    </p>
                    <p className="mt-2 text-xs text-black/40 dark:text-white/40">
                      {subscription?.interval === "year"
                        ? `= €${(subscription.price / 12).toFixed(2)}/month`
                        : `= €${(subscription.price * 12).toFixed(0)}/year`}
                      {" · "}
                      {Math.round((subscription?.interval === "year" ? subscription.price : subscription.price * 12) / 50)} dinners out
                    </p>
                  </div>
                )}
              </div>

              {/* Details Card */}
              <div className="mb-4 rounded-2xl bg-white/40 backdrop-blur-sm dark:bg-white/10">
                {/* Category */}
                <div className="flex items-center justify-between border-b border-black/5 px-4 py-4 dark:border-white/10">
                  <span className="text-sm text-black/60 dark:text-white/60">
                    Category
                  </span>
                  {(mode === "add" || mode === "edit") ? (
                    <Listbox
                      value={selectedCategory}
                      onChange={setSelectedCategory}
                    >
                      <div className="relative">
                        <Listbox.Button className="flex items-center gap-2 text-sm font-medium text-black/80 dark:text-white/80">
                          <CategoryIcon
                            icon={selectedCategory?.icon}
                            className="h-5 w-5 text-black/40 dark:text-white/40"
                          />
                          {selectedCategory?.name}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="h-4 w-4 text-black/40 dark:text-white/40"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                            />
                          </svg>
                        </Listbox.Button>
                        <Listbox.Options className="absolute right-0 z-10 mt-2 max-h-60 w-48 overflow-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-black/5 dark:bg-gray-800">
                          {allCategories?.map((category) => (
                            <Listbox.Option
                              key={category._id}
                              value={category}
                              className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10"
                            >
                              <CategoryIcon
                                icon={category?.icon}
                                className="h-5 w-5 text-black/40 dark:text-white/40"
                              />
                              <span className="text-sm text-black/80 dark:text-white/80">
                                {category?.name}
                              </span>
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-medium text-black/80 dark:text-white/80">
                      <CategoryIcon
                        icon={subscription?.category?.icon}
                        className="h-5 w-5 text-black/40 dark:text-white/40"
                      />
                      {subscription?.category?.name}
                    </div>
                  )}
                </div>

                {/* Billing Cycle */}
                <div className="flex items-center justify-between px-4 py-4">
                  <span className="text-sm text-black/60 dark:text-white/60">
                    Billing Cycle
                  </span>
                  {(mode === "add" || mode === "edit") ? (
                    <Listbox
                      value={selectedBillingCycle}
                      onChange={setSelectedBillingCycle}
                    >
                      <div className="relative">
                        <Listbox.Button className="flex items-center gap-2 text-sm font-medium text-black/80 dark:text-white/80">
                          Every {selectedBillingCycle}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="h-4 w-4 text-black/40 dark:text-white/40"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                            />
                          </svg>
                        </Listbox.Button>
                        <Listbox.Options className="absolute right-0 z-10 mt-2 w-32 overflow-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-black/5 dark:bg-gray-800">
                          {billingCycles.map((cycle) => (
                            <Listbox.Option
                              key={cycle}
                              value={cycle}
                              className="cursor-pointer px-4 py-2 text-sm text-black/80 hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/10"
                            >
                              Every {cycle}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  ) : (
                    <span className="text-sm font-medium text-black/80 dark:text-white/80">
                      Every {subscription?.interval}
                    </span>
                  )}
                </div>
              </div>

              {/* Cancel Subscription - Show mode only */}
              {mode === "show" && cancelInfo?.link && (
                <a
                  href={cancelInfo.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 px-4 py-4 shadow-lg transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-white/20 p-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-5 w-5 text-white"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Cancel & Reclaim €{subscription?.interval === "year" ? subscription?.price : (subscription?.price * 12).toFixed(0)}/yr
                      </p>
                      <p className="text-xs text-white/70">
                        Takes 2 min · {cancelInfo.source || subscription.name}
                      </p>
                    </div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-5 w-5 text-white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </a>
              )}

              {/* Delete button - Edit mode only */}
              {mode === "edit" && (
                <LoadingButton
                  isLoading={pendingAction === "delete"}
                  onClick={handleDeleteSubscription}
                  className="w-full rounded-2xl bg-red-500 py-4 text-sm font-medium text-white transition-all active:scale-[0.98]"
                >
                  Delete Subscription
                </LoadingButton>
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
