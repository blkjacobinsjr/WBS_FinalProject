/**
 * Filter a subscription list by category ID
 */
export function filterByCategory(subscriptions, categoryId) {
  if (!subscriptions) return [];
  if (!categoryId) return subscriptions;

  return subscriptions?.filter((s) => s?.category?._id === categoryId);
}
