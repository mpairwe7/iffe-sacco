import { apiClient } from "@/lib/api-client";
import type { Setting } from "@iffe/shared";

export const settingsApi = {
  getSettings: () => apiClient.get<Setting[]>("/settings"),
  getSetting: (key: string) => apiClient.get<Setting>(`/settings/${key}`),
  updateSetting: (key: string, value: unknown) =>
    apiClient.put<Setting>(`/settings/${key}`, { value }),
  deleteSetting: (key: string) => apiClient.del<void>(`/settings/${key}`),
};
