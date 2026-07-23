import { Outlet } from 'react-router-dom';
import { useMessagingResume } from '@/hooks/messaging/useMessagingResume';

/**
 * Messaging shell layout — mounts once for the /messages* route tree and
 * hosts the foreground-resume handler that revives realtime channels and
 * invalidates messaging + unread-count caches on visibility/focus resume.
 */
export default function MessagingShell() {
  useMessagingResume();
  return <Outlet />;
}
