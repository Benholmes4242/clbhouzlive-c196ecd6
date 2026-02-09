import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TeamMember } from '@/hooks/useBusinessTeamMembers';
import { AppLog } from '@/lib/logger';

// ── Shared constants & utilities ─────────────────────────────────────

export const ACCESS_OPTIONS = [
  {
    value: 'team',
    label: 'Team',
    description: 'Can appear on the business profile.',
    requiresOwner: false,
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Can edit the profile and manage the team.',
    requiresOwner: true,
  },
  {
    value: 'primary_manager',
    label: 'Primary manager',
    description: 'Full control of this business.',
    requiresOwner: true,
  },
] as const;

/** Unified role → display label mapping (single source of truth) */
export const ROLE_LABELS: Record<string, string> = {
  owner: 'Primary manager',
  primary_manager: 'Primary manager',
  admin: 'Manager',
  manager: 'Manager',
  director: 'Director',
  coach: 'Coach',
  staff: 'Team',
  team: 'Team',
};

/** Map database role to access level key */
export function getAccessLevel(member: TeamMember): string {
  if (member.role === 'owner') return 'primary_manager';
  if (member.role === 'admin') return 'manager';
  return 'team';
}

/** Access level key → display label */
export function getAccessLabel(access: string): string {
  switch (access) {
    case 'primary_manager':
      return 'Primary manager';
    case 'manager':
      return 'Manager';
    default:
      return 'Team';
  }
}

// ── Search result type ───────────────────────────────────────────────

export interface SearchResult {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  is_verified_golfer: boolean;
}

// ── Hook ─────────────────────────────────────────────────────────────

interface UseTeamManagementOptions {
  isOwner: boolean;
}

export function useTeamManagement(
  businessId: string | undefined,
  currentTeam: TeamMember[],
  { isOwner }: UseTeamManagementOptions,
) {
  const queryClient = useQueryClient();

  // ── Search ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // ── Add flow ──
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [selectedAccess, setSelectedAccess] = useState<string>('team');
  const [addDisplayTitle, setAddDisplayTitle] = useState('');
  const [adding, setAdding] = useState(false);

  // ── Edit flow ──
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editAccess, setEditAccess] = useState<string>('team');
  const [editDisplayTitle, setEditDisplayTitle] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Remove flow ──
  const [removing, setRemoving] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  // ── Transfer flow ──
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<{
    user: SearchResult | null;
    memberName: string;
  } | null>(null);

  // ── Derived ──
  const availableAccessOptions = ACCESS_OPTIONS.filter(
    (opt) => isOwner || !opt.requiresOwner,
  );

  // Sync edit state when editing member changes
  useEffect(() => {
    if (editingMember) {
      setEditAccess(getAccessLevel(editingMember));
      setEditDisplayTitle(editingMember.display_title || '');
    }
  }, [editingMember]);

  // ── Helpers ──

  const invalidateTeam = () => {
    if (!businessId) return;
    queryClient.invalidateQueries({ queryKey: ['business-team-members', businessId] });
    queryClient.invalidateQueries({ queryKey: ['business-membership', businessId] });
  };

  const saveDisplayTitle = async (
    userProfileId: string,
    title: string | null,
  ) => {
    if (!businessId) return;
    const { error } = await (supabase
      .from('business_team_members') as any)
      .update({ display_title: title })
      .eq('business_id', businessId)
      .eq('user_profile_id', userProfileId);
    if (error) throw error;
  };

  const resetAddFlow = () => {
    setSelectedUser(null);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedAccess('team');
    setAddDisplayTitle('');
  };

  // ── Search ──

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const { data, error } = await supabase.rpc('search_users_for_team', {
          p_query: query,
          p_limit: 10,
        });
        if (error) throw error;

        const teamUserIds = new Set(currentTeam.map((m) => m.profile?.id));
        setSearchResults(
          (data || []).filter((u: SearchResult) => !teamUserIds.has(u.id)),
        );
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearching(false);
      }
    },
    [currentTeam],
  );

  // ── Add member ──

  const executeAdd = async (user: SearchResult, access: string, displayTitle?: string) => {
    if (!businessId) return;
    setAdding(true);
    try {
      const { error } = await supabase.rpc('set_business_access', {
        p_business_id: businessId,
        p_user_profile_id: user.id,
        p_access: access,
      });
      if (error) throw error;

      // Save display title if provided
      if (displayTitle?.trim()) {
        await saveDisplayTitle(user.id, displayTitle.trim());
      }

      toast.success(`${user.display_name || user.username} added to team`);
      resetAddFlow();
      invalidateTeam();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add team member');
    } finally {
      setAdding(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser || !selectedAccess) return;

    if (selectedAccess === 'primary_manager') {
      setPendingTransfer({
        user: selectedUser,
        memberName:
          selectedUser.display_name || selectedUser.username || 'this person',
      });
      setShowTransferConfirm(true);
      return;
    }

    await executeAdd(selectedUser, selectedAccess, addDisplayTitle);
  };

  // ── Save access (edit) ──

  const executeSaveAccess = async () => {
    if (!editingMember?.profile || !businessId) return;

    setSaving(true);
    try {
      const accessChanged = editAccess !== getAccessLevel(editingMember);
      const titleChanged =
        (editDisplayTitle.trim() || null) !== (editingMember.display_title || null);

      if (accessChanged) {
        const { error } = await supabase.rpc('set_business_access', {
          p_business_id: businessId,
          p_user_profile_id: editingMember.profile.id,
          p_access: editAccess,
        });
        if (error) throw error;
      }

      if (titleChanged) {
        await saveDisplayTitle(
          editingMember.profile.id,
          editDisplayTitle.trim() || null,
        );
      }

      toast.success('Changes saved');
      setEditingMember(null);
      invalidateTeam();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccess = async () => {
    if (!editingMember?.profile) return;

    if (
      editAccess === 'primary_manager' &&
      getAccessLevel(editingMember) !== 'primary_manager'
    ) {
      setPendingTransfer({
        user: null,
        memberName:
          editingMember.profile.display_name ||
          editingMember.profile.username ||
          'this person',
      });
      setShowTransferConfirm(true);
      return;
    }

    await executeSaveAccess();
  };

  // Check if anything has changed for the save button
  const hasChanges = editingMember
    ? editAccess !== getAccessLevel(editingMember) ||
      (editDisplayTitle.trim() || null) !== (editingMember.display_title || null)
    : false;

  // ── Remove member ──

  const handleRemoveMember = async () => {
    const target = removeTarget ?? editingMember;

    if (!target?.profile || !businessId) {
      AppLog.warn('useTeamManagement', 'Remove cancelled: missing target');
      toast.error('No team member selected');
      setShowRemoveConfirm(false);
      setRemoveTarget(null);
      return;
    }

    setRemoving(true);
    try {
      const { error } = await supabase.rpc('remove_from_business_team', {
        p_business_id: businessId,
        p_user_profile_id: target.profile.id,
      });
      if (error) throw error;

      toast.success(
        `${target.profile.display_name || 'Member'} removed from team`,
      );

      setShowRemoveConfirm(false);
      setRemoveTarget(null);

      // Wait for dialog animation
      await new Promise((r) => setTimeout(r, 150));
      setEditingMember(null);
      await new Promise((r) => requestAnimationFrame(r));

      invalidateTeam();
    } catch (error: any) {
      AppLog.error('useTeamManagement', 'Remove failed', error);
      toast.error(error?.message || 'Failed to remove team member');
    } finally {
      setRemoving(false);
    }
  };

  // ── Transfer ownership ──

  const handleConfirmTransfer = async () => {
    setShowTransferConfirm(false);

    if (pendingTransfer?.user) {
      await executeAdd(pendingTransfer.user, 'primary_manager', addDisplayTitle);
    } else if (editingMember?.profile) {
      await executeSaveAccess();
    }

    setPendingTransfer(null);
  };

  // ── Reset (for modal close) ──

  const resetAll = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setSelectedAccess('team');
    setAddDisplayTitle('');
    setEditingMember(null);
  };

  return {
    // Search
    searchQuery,
    handleSearch,
    searchResults,
    searching,
    // Add flow
    selectedUser,
    setSelectedUser,
    selectedAccess,
    setSelectedAccess,
    addDisplayTitle,
    setAddDisplayTitle,
    handleAddMember,
    adding,
    resetAddFlow,
    // Edit flow
    editingMember,
    setEditingMember,
    editAccess,
    setEditAccess,
    editDisplayTitle,
    setEditDisplayTitle,
    handleSaveAccess,
    saving,
    hasChanges,
    // Remove flow
    handleRemoveMember,
    removing,
    showRemoveConfirm,
    setShowRemoveConfirm,
    removeTarget,
    setRemoveTarget,
    // Transfer flow
    showTransferConfirm,
    setShowTransferConfirm,
    pendingTransfer,
    handleConfirmTransfer,
    // Computed
    availableAccessOptions,
    // Reset
    resetAll,
  };
}
