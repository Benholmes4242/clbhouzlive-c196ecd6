import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePanelRole } from "@/hooks/usePanelRole";

export function AdminLanding() {
  const { role, loading } = usePanelRole();
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (role === "full") nav("/admin/overview", { replace: true });
    else if (role === "limited") nav("/admin", { replace: true }); // limited stays on landing for now
    else nav("/", { replace: true });
  }, [role, loading, nav]);

  return (
    <div className="min-h-screen overflow-x-hidden flex items-center justify-center">
      <div className="p-8 text-sm text-muted-foreground">Verifying admin access…</div>
    </div>
  );
}
