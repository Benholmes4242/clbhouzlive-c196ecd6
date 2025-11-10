import { ReactNode } from "react";
import { usePanelRole } from "@/hooks/usePanelRole";
import { panelCan } from "@/lib/panelCan";

export function PanelGuard({
  need,
  children,
}: {
  need: "users" | "admins";
  children: ReactNode;
}) {
  const { role, loading } = usePanelRole();
  if (loading) return <div className="p-8 text-sm text-muted-foreground">Verifying admin access…</div>;

  const can = panelCan(role);
  const ok = need === "users" ? can.viewUsers : need === "admins" ? can.manageAdmins : false;

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
