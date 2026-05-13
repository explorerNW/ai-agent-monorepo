import { API_CONFIG } from "~/config/env";

import { AnalyticsSDK } from "./AnalyticsSDK";
const analyticsInstance = new AnalyticsSDK(
  `${API_CONFIG.BASE_URL}/api/v1/track`,
);

export default analyticsInstance;
export { analyticsInstance };
