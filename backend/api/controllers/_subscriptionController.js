import Subscription from "../models/_subscriptionSchema.js";
import Notification from "../models/_notificatonSchema.js";
import Usage from "../models/_usageSchema.js";
import { fullSubscriptionData } from "../data/_aggregates.js";
import { startSession } from "mongoose";

// ---- GET /api/subscriptions ----
export async function getAllSubscriptions(req, res, next) {
  // NOTE: Let's assume for now that users don't have more than a hundred
  // subscriptions, so we can rather safely forgoe pagination
  const { userId } = req.auth;

  console.info(
    new Date().toISOString(),
    "getAllSubscriptions, request for user",
    userId,
  );

  // NOTE: We will rarely if ever need to only get subscription data, so let's
  // always fetch 'supscription data plus'
  const fullDataAggregate = fullSubscriptionData(userId);

  const subscriptions = await Subscription.aggregate(fullDataAggregate);

  // const subscriptions = await Subscription.find({ userId }).populate(
  //   "category",
  // );

  res.status(200).json(subscriptions);
}

// ---- POST /api/subscriptions ----
export async function postSubscription(req, res, next) {
  const {
    body,
    auth: { userId },
  } = req;

  console.info(
    new Date().toISOString(),
    "postSubscription, request for user",
    userId,
    "with body",
    body,
  );

  const postThis = { ...body, userId };

  const { _id: newSubId } = await Subscription.create(postThis);

  if (!newSubId) {
    return res.status(500).send("Something went wrong. Please try later.");
  }

  const location = `${req.protocol}://${req.get(
    "host",
  )}/api/subscriptions/${newSubId}`;

  // Create notification today + 1 week for usage
  const { _id: newNotificationId } = await Notification.create({
    userId,
    type: "usage",
    subscriptionId: newSubId,
  });

  if (!newNotificationId) {
    console.warn(`Unable to create notification for subscription ${newSubId}`);
  }

  res.status(201).location(location).end();
}

// ---- GET /api/subscriptions/:id ----
export async function getSubscriptionById(req, res, next) {
  const { userId } = req.auth;
  const { id } = req.params;

  console.info(
    new Date().toISOString(),
    "getSubscriptionById, request for user",
    userId,
    "with id",
    id,
  );

  const subscription = await Subscription.findOne({ _id: id, userId }).populate(
    "category",
  );

  if (!subscription) {
    return res.status(404).send(`Subscription ${id} not found.`);
  }

  res.status(200).json(subscription);
}

// ---- PUT /api/subscriptions/:id ----
export async function putSubscriptionById(req, res, next) {
  const { id } = req.params;
  const {
    body,
    auth: { userId },
  } = req;

  console.info(
    new Date().toISOString(),
    "putSubscriptionById, request for user",
    userId,
    "with id",
    id,
    "and body",
    body,
  );

  const putThis = { ...body };

  if (Object.hasOwn(putThis, "userId")) {
    putThis.userId = userId;
  }

  const updatedSub = await Subscription.findOneAndUpdate(
    { _id: id, userId },
    putThis,
    { new: true },
  );

  if (!updatedSub) {
    return res.status(404).send(`Subscription ${id} not found.`);
  }

  res.status(200).json(updatedSub);
}

// ---- DELETE /api/subscriptions/:id ----
export async function deleteSubscriptionById(req, res, next) {
  const { userId } = req.auth;
  const { id } = req.params;

  console.info(
    new Date().toISOString(),
    "deleteSubscriptionById, request for user",
    userId,
    "with id",
    id,
  );

  const result = await Subscription.deleteOne({ _id: id, userId });

  if (result.deletedCount === 0) {
    return res.status(404).send(`Subscription ${id} not found.`);
  }

  if (result.acknowledged) {
    // if deleted successfully, we also need to delete all related information:
    // Usages
    // Notifications
    const deleteSession = await startSession();
    deleteSession.startTransaction();

    try {
      await Usage.deleteMany({ subscriptionId: id, userId }, { deleteSession });
      await Notification.deleteMany(
        { subscriptionId: id, userId },
        { deleteSession },
      );

      await deleteSession.commitTransaction();
      deleteSession.endSession();
    } catch (error) {
      await deleteSession.abortTransaction();
      deleteSession.endSession();

      console.error(
        `Error during deletion of related information for subscription ${id}`,
        error,
      );
    }

    return res.status(204).end();
  }
}
