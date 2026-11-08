import ApiEndpoints from "../utils/ApiEndpoints";
import useAuthRequest from "./useAuthRequest";

// TODO: Better error hanling
export default function useSubscription() {
  const { startRequest } = useAuthRequest();

  /**
   * Returns all subscriptions for the current user
   * @return {Array} subscriptions
   */
  async function getAllSubscriptions(abortController, includeInactive = false) {
    return await startRequest(
      includeInactive ? `${ApiEndpoints.subscriptions}?includeInactive=true` : ApiEndpoints.subscriptions,
      "get",
      abortController,
    );
  }

  /**
   * Returns a subscription by ID
   * @return {object} subscription
   */
  async function getSubscriptionById(id, abortController) {
    if (!id) {
      throw new Error("Invalid subscription ID");
    }

    return await startRequest(
      ApiEndpoints.subscription(id),
      "get",
      abortController,
    );
  }

  /**
   * Creates a new subscription
   * @return {object} subscription
   */
  async function createSubscription(subscription, abortController) {
    if (!subscription) {
      throw new Error("Invalid subscription");
    }

    return await startRequest(
      ApiEndpoints.subscriptions,
      "post",
      abortController,
      subscription,
    );
  }

  /**
   * Updates a subscription
   * @return {string} api lookup url to new subscription
   */
  async function updateSubscription(subscription, abortController) {
    if (!subscription) {
      throw new Error("Invalid subscription");
    }

    return await startRequest(
      ApiEndpoints.subscription(subscription._id),
      "put",
      abortController,
      subscription,
    );
  }

  /**
   * Deletes a subscription
   * @return {boolean} true if delete succeeded
   */
  async function deleteSubscription(id, abortController) {
    if (!id) {
      throw new Error("Invalid subscription ID");
    }

    return await startRequest(
      ApiEndpoints.subscription(id),
      "delete",
      abortController,
    );
  }

  return {
    getAllSubscriptions,
    getSubscriptionById,
    createSubscription,
    updateSubscription,
    deleteSubscription,
  };
}
