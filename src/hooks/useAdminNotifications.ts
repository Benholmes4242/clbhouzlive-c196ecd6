import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePanelRole } from "@/hooks/usePanelRole";

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  audience: string;
  link: string | null;
  created_at: string;
  read_by: string[];
}

export function useAdminNotifications() {
  const queryClient = useQueryClient();
  const { role } = usePanelRole();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const { data: notifications = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("id, type, title, message, metadata, audience, link, created_at, read_by")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as AdminNotification[];
    },
    enabled: !!role && role !== "none",
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  // Filter notifications based on audience
  const filteredNotifications = notifications.filter((n) => {
    if (n.audience === "all") return true;
    if (n.audience === "full" && role === "full") return true;
    if (n.audience === "limited" && role === "limited") return true;
    return false;
  });

  // Unread count
  const unreadCount = filteredNotifications.filter(
    (n) => currentUserId && !n.read_by.includes(currentUserId)
  ).length;

  // Mark as read mutation
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!currentUserId) return;
      
      const notification = notifications.find((n) => n.id === notificationId);
      if (!notification) return;
      
      if (notification.read_by.includes(currentUserId)) return;

      const newReadBy = [...notification.read_by, currentUserId];
      
      const { error } = await supabase
        .from("admin_notifications")
        .update({ read_by: newReadBy })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!currentUserId) return;
    
    const unreadNotifications = filteredNotifications.filter(
      (n) => !n.read_by.includes(currentUserId)
    );

    for (const n of unreadNotifications) {
      await markAsRead.mutateAsync(n.id);
    }
  }, [currentUserId, filteredNotifications, markAsRead]);

  // Check if notification is read
  const isRead = useCallback(
    (notification: AdminNotification) => {
      return currentUserId ? notification.read_by.includes(currentUserId) : false;
    },
    [currentUserId]
  );

  return {
    notifications: filteredNotifications,
    unreadCount,
    isLoading,
    error,
    refetch,
    markAsRead: markAsRead.mutate,
    markAllAsRead,
    isRead,
  };
}
