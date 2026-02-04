import ApiEndpoints from "../utils/ApiEndpoints";
import useAuthRequest from "./useAuthRequest";

export default function useAiCleaner() {
  const { startRequest } = useAuthRequest();

  async function cleanTransactions(lines, abortController) {
    return await startRequest(
      ApiEndpoints.aiCleanTransactions(),
      "post",
      abortController,
      { lines },
    );
  }

  return { cleanTransactions };
}
