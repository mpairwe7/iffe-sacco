"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface Notification {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  createdAt: string;
  user?: { name: string };
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export function useNotifications(limit = 10) {
  return useQuery({
    queryKey: ["notifications", limit],
    queryFn: () => apiClient.get<NotificationsResponse>("/dashboard/notifications", { limit }),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
