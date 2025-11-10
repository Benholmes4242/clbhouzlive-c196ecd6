import { usePanelRole } from "@/hooks/usePanelRole";
import { panelCan } from "@/lib/panelCan";
import { useAdmin } from "@/hooks/useAdmin";
import { UsersTable } from "@/components/admin/users/UsersTable";

export function AdminUsersPage() {
  const { role } = usePanelRole();
  const can = panelCan(role);
  const { users } = useAdmin();

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="p-4 sm:p-6 space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            All application users (visible to Limited + Full admins).
          </p>
        </div>

        <UsersTable users={users} readOnly={!can.dangerousOps} />
      </div>
    </div>
  );
}
