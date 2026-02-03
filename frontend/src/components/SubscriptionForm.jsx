import { Dialog, Listbox, Transition } from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDataContext } from "../contexts/dataContext";
import useSubscription from "../hooks/useSubscription";
import eventEmitter from "../utils/EventEmitter";
import CategoryIcon from "./CategoryIcon";
import { createSubscriptionBody } from "../utils/schemaBuilder";
import LoadingButton from "./LoadingButton";

export default function SubscriptionForm({
  mode,
  subscription,
  opened,
  onClose,
}) {
  // ---- Data Context ----
  const { allCategories } = useDataContext();

  // ---- Some settings ----
  const billingCycles = ["month", "year"];
  const noneCategoryId = "65085704f18207c1481e6642";

  // ---- State ----
  const [selectedCategory, setSelectedCategory] = useState();
  const [selectedBillingCycle, setSelectedBillingCycle] = useState();
  const [pendingAction, setPendingAction] = useState(null);

  // ---- HOOKS ----
  const { createSubscription, updateSubscription, deleteSubscription } =
    useSubscription();

  // ---- REFS ----
  const nameRef = useRef();
  const priceRef = useRef();

  // We need to set initial state in useEffect, otherwise we don't get the correct
  // info from our subscription when we need it
  useEffect(() => {
    setSelectedCategory(
      subscription?.category ??
        allCategories.find((c) => c._id === noneCategoryId),
    );
    setSelectedBillingCycle(subscription?.interval ?? "month");
  }, [allCategories, subscription]);

  // ---- FUNCTIONS ----
  // switch to another form mode
  function switchMode(mode) {
    eventEmitter.emit("changeFormMode", mode);
  }

  // create temp. subscription from current form data
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
      selectedBillingCycle,
    );

    return formSubscription;
  }

  // Sub should be added
  async function handleAddSubscription() {
    // TODO: Better validation, i.e. show user which fields are missing
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
        abortController,
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

  // Change in edit mode needs to be saved
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

  // Sub should be deleted
  async function handleDeleteSubscription() {
    if (!subscription._id) return;

    setPendingAction("delete");

    try {
      const abortController = new AbortController();

      const { successful } = await deleteSubscription(
        subscription._id,
        abortController,
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

  return (
    <Transition show={opened} as={Fragment} className="w-full">
      <Dialog
        className="fixed inset-0 z-10 flex items-center justify-center"
        open={opened}
        onClose={onClose}
      >
        {/* Backdrop overlay */}
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

        {/* Dialog Content */}
        <Transition.Child
          enter="duration-200 ease-out"
          enterFrom="scale-95 opacity-0"
          enterTo="flex w-full scale-100 justify-center opacity-100"
          leave="duration-200 ease-in"
          leaveFrom="flex w-full scale-100 justify-center opacity-100"
          leaveTo="flex w-full scale-95 justify-center opacity-0"
        >
          <Dialog.Panel className="z-20 w-[92vw] max-w-lg rounded-lg bg-white p-6 opacity-90 sm:p-10">
            {/* Title Bar */}
            <Dialog.Title className="mb-8 text-center text-xl font-semibold uppercase">
              {mode} Subscription
            </Dialog.Title>

            {/* Subscription Form */}
            <div className="grid grid-cols-1 items-start gap-x-8 gap-y-4 sm:grid-cols-[max-content_1fr]">
              {/* Subscription Name */}
              <label htmlFor="name">Name</label>
              {(mode === "add" || mode === "edit") && (
                <input
                  ref={nameRef}
                  type="text"
                  name="name"
                  placeholder="Subscription Name"
                  defaultValue={subscription?.name}
                  className="block w-full rounded-md border-0 py-1.5 pl-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              )}

              {mode === "show" && (
                <div className="text-sm font-medium leading-none text-gray-900">
                  {subscription?.name}
                </div>
              )}

              {/* Price */}
              <label htmlFor="price">Price</label>
              {(mode === "add" || mode === "edit") && (
                <input
                  ref={priceRef}
                  type="text"
                  name="price"
                  placeholder="Price in EUR"
                  defaultValue={subscription?.price}
                  className="block w-full rounded-md border-0 py-1.5 pl-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              )}

              {mode === "show" && (
                <div className="text-sm font-medium leading-none text-gray-900">
                  {subscription?.price}
                </div>
              )}

              {/* Category */}
              <label
                htmlFor="category"
                className="text-sm font-medium leading-none text-gray-600"
              >
                Category
              </label>

              {(mode === "add" || mode === "edit") && (
                <div className="relative inline-block w-full">
                  <Listbox
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    name="category"
                  >
                    <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                      <span className="flex items-center">
                        <CategoryIcon
                          icon={selectedCategory?.icon}
                          className="h-5 w-5 flex-shrink-0 text-gray-400"
                          aria-hidden="true"
                        />
                        <span className="ml-3 block truncate">
                          {selectedCategory?.name}
                        </span>
                      </span>
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full min-w-fit overflow-y-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {allCategories?.map((category) => (
                        <Listbox.Option
                          key={category._id}
                          value={category}
                          className="relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-300/25"
                        >
                          <span className="flex items-center">
                            <CategoryIcon
                              icon={category?.icon}
                              className="h-5 w-5 flex-shrink-0 text-gray-400"
                              aria-hidden="true"
                            />
                            <span className="ml-3 block font-normal">
                              {category?.name}
                            </span>
                          </span>
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Listbox>
                </div>
              )}

              {mode === "show" && (
                <div className="flex items-center">
                  <CategoryIcon
                    icon={subscription?.category?.icon}
                    className="h-5 w-5 flex-shrink-0 text-gray-400"
                    aria-hidden="true"
                  />
                  <div className="ml-3 text-sm font-medium leading-none text-gray-900">
                    {subscription?.category?.name}
                  </div>
                </div>
              )}

              {/* Billing Cycle */}
              <label
                htmlFor="billing_cycle"
                className="text-sm font-medium leading-none text-gray-600"
              >
                Billing Cycle
              </label>

              {(mode === "add" || mode === "edit") && (
                <div className="relative inline-block w-full">
                  <Listbox
                    value={selectedBillingCycle}
                    onChange={setSelectedBillingCycle}
                    name="billingCycle"
                  >
                    <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                      per {selectedBillingCycle}
                    </Listbox.Button>

                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {billingCycles.map((cycle) => (
                        <Listbox.Option
                          key={cycle}
                          value={cycle}
                          className="relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-300/25"
                        >
                          per {cycle}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Listbox>
                </div>
              )}

              {mode === "show" && (
                <div className="text-sm font-medium leading-none text-gray-900">
                  per {subscription?.interval}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-1 gap-2 pt-8 sm:auto-cols-fr sm:grid-flow-col">
              {mode === "edit" && (
                <LoadingButton
                  isLoading={pendingAction === "delete"}
                  className="inline-flex justify-center rounded-md bg-red-500 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  onClick={handleDeleteSubscription}
                >
                  Delete
                </LoadingButton>
              )}

              {mode !== "edit" && mode !== "add" && (
                <LoadingButton
                  className="inline-flex justify-center rounded-md bg-gray-300/50 px-3 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-500/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  onClick={() => switchMode("edit")}
                >
                  Edit
                </LoadingButton>
              )}

              {mode === "edit" && (
                <>
                  <LoadingButton
                    isLoading={pendingAction === "save"}
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={handleSaveEditSubscription}
                  >
                    Save
                  </LoadingButton>
                </>
              )}

              {mode !== "edit" && mode !== "show" && (
                <LoadingButton
                  isLoading={pendingAction === "add"}
                  className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-none outline-none transition-transform hover:bg-indigo-800 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={handleAddSubscription}
                >
                  Add
                </LoadingButton>
              )}

              <LoadingButton
                className="inline-flex justify-center rounded-md border border-transparent bg-gray-500 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                onClick={() => onClose()}
              >
                {mode === "show" ? "Close" : "Cancel"}
              </LoadingButton>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}
