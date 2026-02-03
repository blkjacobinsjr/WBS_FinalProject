import { useDataContext } from "../contexts/dataContext";
import StatsCard from "./StatsCard";

export default function CategroyStats({ category }) {
  const { subscriptions } = useDataContext();

  const subscriptionsInCategory = subscriptions
    ?.filter((s) => s.category._id === category?._id && s.validScore)
    .sort((a, b) => (a.score >= b.score ? 1 : -1));

  const canShowMostAndLeastUsed =
    subscriptionsInCategory?.length === category?.subscriptionCount &&
    subscriptionsInCategory?.length > 1;

  const mostUsed = canShowMostAndLeastUsed
    ? subscriptionsInCategory[0]
    : { name: "Insufficient Data" };
  const leastUsed = canShowMostAndLeastUsed
    ? subscriptionsInCategory[subscriptionsInCategory.length - 1]
    : { name: "Insufficient Data" };

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard title="Total Cost" width="w-full">
        {category?.totalCost.toFixed(2)}
      </StatsCard>
      <StatsCard title="Potential Savings" width="w-full">
        {category?.potentialSavings.toFixed(2)}
      </StatsCard>
      <StatsCard title="Most Used" width="w-full">
        {mostUsed.name}
      </StatsCard>
      <StatsCard title="Least Used" width="w-full">
        {leastUsed.name}
      </StatsCard>
    </div>
  );
}
