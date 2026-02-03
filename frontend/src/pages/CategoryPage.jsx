import CategroyStats from "../components/CategroyStats";
import SubscriptionList from "../components/SubscriptionList";
import CategoryPieChart from "../components/charts/CategoryPieChart";
import CategoryRadarChart from "../components/charts/CategoryRadarChart";
import { useDataContext } from "../contexts/dataContext";

export default function CategoryPage({ categoryId }) {
  const { usedCategories } = useDataContext();

  const category = usedCategories?.find((c) => c._id === categoryId);

  return (
    <div>
      <CategroyStats category={category} />
      <div className="grid gap-2 pt-2 lg:grid-cols-2">
        <SubscriptionList categoryId={categoryId} itemsPerPage={10} />
        <div className="h-full min-h-[25vh] w-full p-4 sm:p-6">
          {category?.subscriptionCount > 3 && (
            <div className="min-h-[220px] sm:min-h-[260px]">
              <CategoryRadarChart categoryId={categoryId} />
            </div>
          )}

          {category?.subscriptionCount > 1 && (
            <div className="flex min-h-[220px] w-full items-center justify-center sm:min-h-[260px]">
              <CategoryPieChart categoryId={categoryId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
