import type { PanelRole } from "@/hooks/usePanelRole";

export const panelCan = (role: PanelRole) => {
  const isFull = role === "full";
  const isLimited = role === "limited";
  const isMod = role === "moderator";
  const modCapable = isMod || isLimited || isFull;
  return {
    // existing (unchanged behaviour)
    viewUsers:        isLimited || isFull,
    manageAdmins:     isFull,
    dangerousOps:     isFull,

    // moderation
    viewModeration:   modCapable,
    actModeration:    modCapable, // warn, dismiss, soft-hide, temp suspend
    suspendMaxDays:   isFull ? Infinity : (isLimited ? Infinity : (isMod ? 30 : 0)),

    // destructive (direct vs request handled in later phases)
    permanentBanDirect:  isFull, // limited -> approval request (later)
    hardDeleteDirect:    isFull, // limited -> approval request (later)
    approveRequests:     isFull,
    manageRoles:         isFull,
  };
};
