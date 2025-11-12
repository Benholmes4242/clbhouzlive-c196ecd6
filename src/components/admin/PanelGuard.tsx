import { ReactNode, useEffect } from "react";
import { usePanelRole } from "@/hooks/usePanelRole";
import { panelCan } from "@/lib/panelCan";

export function PanelGuard({
  need,
  children,
}: {
  need: "users" | "admins";
  children: ReactNode;
}) {
  const { role, loading, refresh } = usePanelRole();
  const can = panelCan(role);
  const ok = need === "users" ? can.viewUsers : need === "admins" ? can.manageAdmins : false;

  // Revalidate on tab focus, but keep the page mounted
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  // While validating, show overlay but keep page mounted
  if (loading) {
    return (
      <>
        {children}
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 backdrop-blur-sm">
          <div className="rounded-lg border bg-card px-6 py-4 text-sm text-foreground">
            Validating admin access…
          </div>
        </div>
      </>
    );
  }

  // Network error - show banner but keep page mounted
  if (role === "unknown") {
    return (
      <>
        {children}
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm">
          <div className="max-w-md p-6 rounded-lg border bg-card space-y-3">
            <h2 className="text-lg font-semibold">Can't verify admin access</h2>
            <p className="text-sm text-muted-foreground">Network or CORS error. Please refresh and try again.</p>
          </div>
        </div>
      </>
    );
  }

  if (!ok) {
    return (
      <div role="alert" className="p-6 max-w-md mx-auto">
        <h2 className="text-lg font-semibold">Access denied</h2>
        <p className="text-sm text-muted-foreground">You don't have permission to view this section.</p>
      </div>
    );
  }
  return <>{children}</>;
}
