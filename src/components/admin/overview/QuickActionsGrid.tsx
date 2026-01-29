import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePanelRole } from "@/hooks/usePanelRole";
import { panelCan } from "@/lib/panelCan";
import {
  UserPlus,
  MapPin,
  ClipboardCheck,
  Upload,
  Users,
} from "lucide-react";

interface QuickAction {
  label: string;
  icon: React.ElementType;
  path: string;
  requiresFull?: boolean;
}

const ACTIONS: QuickAction[] = [
  { label: "Invite Admin", icon: UserPlus, path: "/admin/invites", requiresFull: true },
  { label: "Add Golf Course", icon: MapPin, path: "/admin/golf-courses/create", requiresFull: false },
  { label: "Run Import", icon: Upload, path: "/admin/import", requiresFull: true },
  { label: "Verification Queue", icon: ClipboardCheck, path: "/admin/verification", requiresFull: false },
  { label: "Manage Users", icon: Users, path: "/admin/users", requiresFull: false },
];

export function QuickActionsGrid() {
  const navigate = useNavigate();
  const { role } = usePanelRole();
  const can = panelCan(role);

  // Filter actions based on role
  const visibleActions = ACTIONS.filter((action) => {
    if (action.requiresFull && !can.dangerousOps) return false;
    return true;
  });

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {visibleActions.map((action) => (
          <Button
            key={action.path}
            variant="outline"
            size="sm"
            className="h-auto py-3 px-3 flex flex-col items-center gap-2 text-xs font-normal"
            onClick={() => navigate(action.path)}
          >
            <action.icon className="h-4 w-4" />
            <span className="text-center leading-tight">{action.label}</span>
          </Button>
        ))}
    </div>
  );
}
