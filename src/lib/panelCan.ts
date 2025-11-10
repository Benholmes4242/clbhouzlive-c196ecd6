import type { PanelRole } from "@/hooks/usePanelRole";

export const panelCan = (role: PanelRole) => ({
  viewUsers: role === "limited" || role === "full",
  manageAdmins: role === "full",
  dangerousOps: role === "full",
});
