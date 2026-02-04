import ApiEndpoints from "../utils/ApiEndpoints";
import useAuthRequest from "./useAuthRequest";

export default function useOcr() {
  const { startRequest } = useAuthRequest();

  async function processOcr(payload, abortController) {
    return await startRequest(ApiEndpoints.ocr, "post", abortController, payload);
  }

  return { processOcr };
}
