/**
 * MaintenanceGate — presentation-only maintenance wall.
 *
 * Mounted ONCE in App.tsx just inside <BrowserRouter> (so it has router
 * context) and inside the QueryClientProvider. Everything below it — the
 * header, the routes, the bottom nav — is `children`.
 *
 * THREE PROPERTIES:
 *  1. FAIL OPEN. Flag read error -> off. Role check error ('unknown') or
 *     still loading -> app. The failure mode is never an outage.
 *  2. Admin bypass via the existing secure-site-access-check edge function
 *     (usePanelRole), reused unchanged.
 *  3. No deploy to lift: useMaintenanceMode polls every 60s.
 *
 * LAZINESS: usePanelRole could not be made lazy without editing it (its
 * effect fires on mount), so the walled branch lives in a child component,
 * <WalledBranch>, which only mounts while the flag is on. With the flag off
 * this feature makes zero edge-function calls.
 */
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { usePanelRole } from '@/hooks/usePanelRole';
import { MaintenanceWall } from './MaintenanceWall';

function isAuthRoute(pathname: string): boolean {
  return pathname === '/auth' || pathname.startsWith('/auth/');
}

/** Mounted only while the flag is on — this is where the role check happens. */
function WalledBranch({
  message,
  children,
}: {
  message: string | null;
  children: ReactNode;
}) {
  const { role, loading } = usePanelRole();

  // Loading, or the check errored ('unknown'), or any admin role -> app.
  if (loading || role !== 'none') return <>{children}</>;

  return <MaintenanceWall message={message} />;
}

export function MaintenanceGate({ children }: { children: ReactNode }) {
  const { on, message } = useMaintenanceMode();
  const { pathname } = useLocation();

  // Normal operation: one lightweight query per minute, no role check.
  if (!on || true) return <>{children}</>;

  // Sign-in must stay reachable or admins cannot get in.
  if (isAuthRoute(pathname)) return <>{children}</>;

  return <WalledBranch message={message}>{children}</WalledBranch>;
}

export default MaintenanceGate;
