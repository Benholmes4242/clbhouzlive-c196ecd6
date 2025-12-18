import React, { useState, useCallback, useEffect } from 'react';
import { Search, ChevronRight, Loader2, X, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TeamMember } from '@/hooks/useBusinessTeamMembers';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ManageTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  currentTeam: TeamMember[];
  isOwner: boolean;
}

interface SearchResult {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  is_verified_golfer: boolean;
}

// Access levels with user-friendly labels
const ACCESS_OPTIONS = [
  { 
    value: 'team', 
    label: 'Team', 
    description: 'Can appear on the business profile.',
    requiresOwner: false 
  },
  { 
    value: 'manager', 
    label: 'Manager', 
    description: 'Can edit the profile and manage the team.',
    requiresOwner: true 
  },
  { 
    value: 'primary_manager', 
    label: 'Primary manager', 
    description: 'Full control of this business.',
    requiresOwner: true 
  },
];

// Map database role to access level
function getAccessLevel(member: TeamMember): string {
  // Check business_members role first (permissions table)
  // If they're in business_members with owner role -> primary_manager
  // If they're in business_members with admin role -> manager
  // Otherwise -> team (just in directory)
  if (member.role === 'owner') return 'primary_manager';
  if (member.role === 'admin') return 'manager';
  return 'team';
}

// Access level display label
function getAccessLabel(access: string): string {
  switch (access) {
    case 'primary_manager': return 'Primary manager';
    case 'manager': return 'Manager';
    default: return 'Team';
  }
}

export function ManageTeamModal({ 
  open, 
  onOpenChange, 
  businessId, 
  currentTeam,
  isOwner 
}: ManageTeamModalProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Add flow state
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [selectedAccess, setSelectedAccess] = useState<string>('team');
  const [adding, setAdding] = useState(false);
  
  // Edit flow state
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editAccess, setEditAccess] = useState<string>('team');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  
  // Ownership transfer confirmation
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<{user: SearchResult | null, memberName: string} | null>(null);
  
  // Remove confirmation
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setSelectedAccess('team');
      setEditingMember(null);
    }
  }, [open]);

  // Initialize edit access when editing member changes
  useEffect(() => {
    if (editingMember) {
      setEditAccess(getAccessLevel(editingMember));
    }
  }, [editingMember]);

  // Debounced search
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase.rpc('search_users_for_team', {
        p_query: query,
        p_limit: 10
      });

      if (error) throw error;

      // Filter out users already on the team
      const teamUserIds = new Set(currentTeam.map(m => m.profile?.id));
      const filtered = (data || []).filter((u: SearchResult) => !teamUserIds.has(u.id));
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  }, [currentTeam]);

  const handleAddMember = async () => {
    if (!selectedUser || !selectedAccess) return;

    // Check for ownership transfer
    if (selectedAccess === 'primary_manager') {
      setPendingTransfer({ user: selectedUser, memberName: selectedUser.display_name || selectedUser.username || 'this person' });
      setShowTransferConfirm(true);
      return;
    }

    await executeAdd(selectedUser, selectedAccess);
  };

  const executeAdd = async (user: SearchResult, access: string) => {
    setAdding(true);
    try {
      const { error } = await supabase.rpc('set_business_access', {
        p_business_id: businessId,
        p_user_profile_id: user.id,
        p_access: access
      });

      if (error) throw error;

      toast.success(`${user.display_name || user.username} added to team`);
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedAccess('team');
      queryClient.invalidateQueries({ queryKey: ['business-team-members', businessId] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to add team member');
    } finally {
      setAdding(false);
    }
  };

  const handleSaveAccess = async () => {
    if (!editingMember?.profile) return;

    // Check for ownership transfer
    if (editAccess === 'primary_manager' && getAccessLevel(editingMember) !== 'primary_manager') {
      setPendingTransfer({ 
        user: null, 
        memberName: editingMember.profile.display_name || editingMember.profile.username || 'this person' 
      });
      setShowTransferConfirm(true);
      return;
    }

    await executeSaveAccess();
  };

  const executeSaveAccess = async () => {
    if (!editingMember?.profile) return;

    setSaving(true);
    try {
      const { error } = await supabase.rpc('set_business_access', {
        p_business_id: businessId,
        p_user_profile_id: editingMember.profile.id,
        p_access: editAccess
      });

      if (error) throw error;

      toast.success('Access level updated');
      setEditingMember(null);
      queryClient.invalidateQueries({ queryKey: ['business-team-members', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-membership', businessId] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update access');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!editingMember?.profile) return;

    setRemoving(true);
    try {
      const { error } = await supabase.rpc('remove_from_business_team', {
        p_business_id: businessId,
        p_user_profile_id: editingMember.profile.id
      });

      if (error) throw error;

      toast.success(`${editingMember.profile.display_name || 'Member'} removed from team`);
      setEditingMember(null);
      setShowRemoveConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['business-team-members', businessId] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove team member');
    } finally {
      setRemoving(false);
    }
  };

  const handleConfirmTransfer = async () => {
    setShowTransferConfirm(false);
    
    if (pendingTransfer?.user) {
      // Adding new user as primary manager
      await executeAdd(pendingTransfer.user, 'primary_manager');
    } else if (editingMember?.profile) {
      // Updating existing member to primary manager
      await executeSaveAccess();
    }
    
    setPendingTransfer(null);
  };

  const availableAccessOptions = ACCESS_OPTIONS.filter(opt => isOwner || !opt.requiresOwner);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-semibold">Manage team</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Control who can edit this profile and appear as part of the team.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {/* Add people section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Add people</h3>
              
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or username…"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Search results */}
              {searchResults.length > 0 && !selectedUser && (
                <div className="border border-border rounded-sq-md overflow-hidden bg-background">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setSelectedAccess('team');
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                    >
                      <SquircleAvatar
                        src={user.profile_photo_url}
                        alt={user.display_name || 'User'}
                        size={40}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-sm truncate">
                            {user.display_name || user.username || 'Unknown'}
                          </span>
                          {user.is_verified_golfer && <VerifiedBadge size="sm" />}
                        </div>
                        {user.username && (
                          <span className="text-xs text-muted-foreground">@{user.username}</span>
                        )}
                      </div>
                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}

              {/* Add to team card */}
              {selectedUser && (
                <div className="border border-border rounded-sq-md p-4 bg-muted/20 space-y-4">
                  <div className="flex items-center gap-3">
                    <SquircleAvatar
                      src={selectedUser.profile_photo_url}
                      alt={selectedUser.display_name || 'User'}
                      size={44}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm truncate">
                          {selectedUser.display_name || selectedUser.username || 'Unknown'}
                        </span>
                        {selectedUser.is_verified_golfer && <VerifiedBadge size="sm" />}
                      </div>
                      {selectedUser.username && (
                        <span className="text-xs text-muted-foreground">@{selectedUser.username}</span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="p-1.5 hover:bg-muted rounded-full"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Access level</Label>
                    <RadioGroup value={selectedAccess} onValueChange={setSelectedAccess}>
                      {availableAccessOptions.map((opt) => (
                        <div key={opt.value} className="flex items-start gap-3 py-2">
                          <RadioGroupItem value={opt.value} id={`add-${opt.value}`} className="mt-0.5" />
                          <Label htmlFor={`add-${opt.value}`} className="flex-1 cursor-pointer">
                            <span className="text-sm font-medium">{opt.label}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <Button onClick={handleAddMember} disabled={adding} className="w-full">
                    {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Add
                  </Button>
                </div>
              )}
            </div>

            {/* Current team section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">
                Current team
              </h3>
              
              {currentTeam.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No team members yet
                </p>
              ) : (
                <div className="space-y-1">
                  {currentTeam.map((member) => {
                    const profile = member.profile;
                    if (!profile) return null;

                    const accessLevel = getAccessLevel(member);

                    return (
                      <button
                        key={member.id}
                        onClick={() => setEditingMember(member)}
                        className="w-full flex items-center gap-3 p-3 rounded-sq-md hover:bg-muted/50 transition-colors text-left"
                      >
                        <SquircleAvatar
                          src={profile.profile_photo_url}
                          alt={profile.display_name || 'Member'}
                          size={40}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-sm truncate">
                              {profile.display_name || profile.username || 'Unknown'}
                            </span>
                            {profile.is_verified_golfer && <VerifiedBadge size="sm" />}
                          </div>
                          {profile.username && (
                            <span className="text-xs text-muted-foreground">@{profile.username}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-sq-pill">
                          {getAccessLabel(accessLevel)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Access Sheet */}
      <Sheet open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <SheetContent side="bottom" className="rounded-t-[20px] px-5 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle>Edit access</SheetTitle>
          </SheetHeader>

          {editingMember?.profile && (
            <div className="space-y-6">
              {/* Person info */}
              <div className="flex items-center gap-3">
                <SquircleAvatar
                  src={editingMember.profile.profile_photo_url}
                  alt={editingMember.profile.display_name || 'Member'}
                  size={48}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium truncate">
                      {editingMember.profile.display_name || editingMember.profile.username || 'Unknown'}
                    </span>
                    {editingMember.profile.is_verified_golfer && <VerifiedBadge size="sm" />}
                  </div>
                  {editingMember.profile.username && (
                    <span className="text-sm text-muted-foreground">@{editingMember.profile.username}</span>
                  )}
                </div>
              </div>

              {/* Access level selector */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Access level</Label>
                <RadioGroup value={editAccess} onValueChange={setEditAccess}>
                  {availableAccessOptions.map((opt) => (
                    <div key={opt.value} className="flex items-start gap-3 py-2.5">
                      <RadioGroupItem value={opt.value} id={`edit-${opt.value}`} className="mt-0.5" />
                      <Label htmlFor={`edit-${opt.value}`} className="flex-1 cursor-pointer">
                        <span className="text-sm font-medium">{opt.label}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <Button 
                  onClick={handleSaveAccess} 
                  disabled={saving || editAccess === getAccessLevel(editingMember)} 
                  className="w-full"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save changes
                </Button>
                
                {/* Can't remove primary manager or yourself */}
                {getAccessLevel(editingMember) !== 'primary_manager' && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowRemoveConfirm(true)}
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Remove from team
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Transfer ownership confirmation */}
      <AlertDialog open={showTransferConfirm} onOpenChange={setShowTransferConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make primary manager?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You're about to make <strong>{pendingTransfer?.memberName}</strong> the primary manager of this business.
              </p>
              <p>You'll become a manager.</p>
              <p className="text-muted-foreground/80">This change can be updated later.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingTransfer(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmTransfer}>Confirm transfer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove confirmation */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from team?</AlertDialogTitle>
            <AlertDialogDescription>
              {editingMember?.profile?.display_name || 'This person'} will no longer appear as part of this business team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
