import { useInAppNotifications } from '@/hooks/useInAppNotifications';

/**
 * Single global mount for the realtime notifications subscription.
 * Placed inside AuthWrapper + ActiveActorProvider + QueryClientProvider so
 * the hook has session/actor/query context. Do NOT mount per page — this
 * component is the ONLY caller of useInAppNotifications app-wide.
 */
export function InAppNotificationsMount() {
  useInAppNotifications();
  return null;
}

export default InAppNotificationsMount;
