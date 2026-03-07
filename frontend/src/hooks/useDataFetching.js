import { useEffect, useState } from "react";
import { useDataContext } from "../contexts/dataContext";
import useDashboard from "./useDashboard";

export default function useDataFetching() {
  // ---- Data Context ----
  const {
    setSubscriptions,
    setAllCategories,
    setUsedCategories,
    setDashboardData,
    setNotifications,
  } = useDataContext();

  // ---- Data Fetching ----
  const { getDashboardBootstrap } = useDashboard();

  // ---- State ----
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Fetch / Refetch function ----
  async function fetchData(abortController) {
    setLoading(true);
    setError(false);
    setErrorMessage("");
    try {
      const bootstrapData = await getDashboardBootstrap(abortController);

      if (!bootstrapData) {
        return;
      }

      setSubscriptions(bootstrapData.subscriptions ?? []);
      setDashboardData(bootstrapData.dashboardData ?? {});
      setUsedCategories(bootstrapData.usedCategories ?? []);
      setNotifications(bootstrapData.notifications ?? []);
      setAllCategories(bootstrapData.allCategories ?? []);
    } catch (error) {
      setError(true);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    // Probably not the best way, but let's use one abort controller for all fetching
    const abortController = new AbortController();

    fetchData(abortController);

    return () => abortController.abort();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  return { loading, error, errorMessage, refetchData: fetchData };
}
