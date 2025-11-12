import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePanelRole } from "@/hooks/usePanelRole";

export function AdminLanding() {
  const { role, loading } = usePanelRole();
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (role === "full") nav("/admin/overview", { replace: true });
    else if (role === "limited") nav("/admin/golf-courses", { replace: true });
    else if (role === "unknown") {
      // Network error - stay here and show error
      return;
    } else {
      // Confirmed non-admin
      nav("/", { replace: true });
    }
  }, [role, loading, nav]);

  if (role === "unknown") {
    return (
      <div className="min-h-screen overflow-x-hidden flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm font-medium">Can't verify admin access</p>
            <p className="text-xs text-muted-foreground mt-2">Network or CORS error. Please refresh and try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden flex items-center justify-center">
      <div className="p-8 text-sm text-muted-foreground">Verifying admin access…</div>
    </div>
  );
}
