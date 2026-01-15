import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, ArrowLeft, ChevronRight, Loader2, X, UserPlus, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useBusinessTeamMembers, TeamMember } from '@/hooks/useBusinessTeamMembers';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessAccessRequestsRealtime } from '@/hooks/useBusinessAccessRequestsRealtime';
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
import { AccessRequestsSection } from '@/components/business/AccessRequestsSection';
import { AppLog } from '@/lib/logger';

interface SearchResult {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  is_verified_golfer: boolean;
}

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

function getAccessLevel(member: TeamMember): string {
  if (member.role === 'owner') return 'primary_manager';
  if (member.role === 'admin') return 'manager';
  return 'team';
}

function getAccessLabel(access: string): string {
  switch (access) {
    case 'primary_manager': return 'Primary manager';
    case 'manager': return 'Manager';
    default: return 'Team';
  }
}

export default function ManageTeamPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });
  
  const { data: business } = useBusinessProfile(businessId);
  const { data: teamMembers = [], isLoading: teamLoading } = useBusinessTeamMembers(businessId);
  
  // Ticket 2: Subscribe to realtime updates for access requests
  useBusinessAccessRequestsRealtime(businessId);
  
  // Determine if current user is owner
  const isOwner = teamMembers.some(m => 
    m.profile?.id === currentUser?.id && m.role === 'owner'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [selectedAccess, setSelectedAccess] = useState<string>('team');
  const [adding, setAdding] = useState(false);
  
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editAccess, setEditAccess] = useState<string>('team');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<{user: SearchResult | null, memberName: string} | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (editingMember) {
      setEditAccess(getAccessLevel(editingMember));
    }
  }, [editingMember]);

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

      const teamUserIds = new Set(teamMembers.map(m => m.profile?.id));
      const filtered = (data || []).filter((u: SearchResult) => !teamUserIds.has(u.id));
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  }, [teamMembers]);

  const handleAddMember = async () => {
    if (!selectedUser || !selectedAccess || !businessId) return;

    if (selectedAccess === 'primary_manager') {
      setPendingTransfer({ user: selectedUser, memberName: selectedUser.display_name || selectedUser.username || 'this person' });
      setShowTransferConfirm(true);
      return;
    }

    await executeAdd(selectedUser, selectedAccess);
  };

  const executeAdd = async (user: SearchResult, access: string) => {
    if (!businessId) return;
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
    if (!editingMember?.profile || !businessId) return;

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
    if (!editingMember?.profile || !businessId) return;

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
    const target = removeTarget ?? editingMember;

    if (!target?.profile || !businessId) {
      AppLog.warn('ManageTeamPage', 'Remove cancelled: missing target or businessId');
      toast.error('No team member selected');
      setShowRemoveConfirm(false);
      setRemoveTarget(null);
      return;
    }

    setRemoving(true);

    try {
      const { data, error } = await supabase.rpc('remove_from_business_team', {
        p_business_id: businessId,
        p_user_profile_id: target.profile.id,
      });

      if (error) throw error;

      toast.success(`${target.profile.display_name || 'Member'} removed from team`);

      // Close overlays
      setShowRemoveConfirm(false);
      setRemoveTarget(null);

      // Wait for AlertDialog animation to complete before closing Sheet
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Close the sheet (if open)
      setEditingMember(null);

      // Wait another frame before invalidating to ensure DOM cleanup
      await new Promise((resolve) => requestAnimationFrame(resolve));

      queryClient.invalidateQueries({ queryKey: ['business-team-members', businessId] });
    } catch (error: any) {
      AppLog.error('ManageTeamPage', 'Remove failed', error);
      toast.error(error?.message || 'Failed to remove team member');
    } finally {
      setRemoving(false);
    }
  };

  const handleConfirmTransfer = async () => {
    setShowTransferConfirm(false);
    
    if (pendingTransfer?.user) {
      await executeAdd(pendingTransfer.user, 'primary_manager');
    } else if (editingMember?.profile) {
      await executeSaveAccess();
    }
    
    setPendingTransfer(null);
  };

  const availableAccessOptions = ACCESS_OPTIONS.filter(opt => isOwner || !opt.requiresOwner);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Header - matching World's Top 100 page pattern */}
      <header className="sticky top-0 z-10 bg-background safe-top">
        {/* Top row: Back link left, Done button right */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          
          <button
            onClick={handleBack}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Done
          </button>
        </div>
        
        {/* Title - centered below */}
        <div className="text-center px-4 pb-4">
          <h1 className="text-2xl font-bold text-foreground">Manage Team</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Access Requests Section */}
        <AccessRequestsSection
          businessId={businessId || ''}
          businessName={business?.name || 'Business'}
          businessAvatarUrl={business?.logo_url}
          canManage={isOwner || teamMembers.some(m => m.profile?.id === currentUser?.id && ['owner', 'admin'].includes(m.role))}
        />

        <div className="px-4 py-5 space-y-6">

        {/* Add people section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Add people</h3>
          
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
                  <SquircleAvatar src={user.profile_photo_url} alt={user.display_name || 'User'} size={40} />
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
                <SquircleAvatar src={selectedUser.profile_photo_url} alt={selectedUser.display_name || 'User'} size={44} />
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
                <button onClick={() => setSelectedUser(null)} className="p-1.5 hover:bg-muted rounded-full">
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
          <h3 className="text-sm font-medium text-foreground">Current team</h3>
          
          {teamLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-10 h-10 rounded-2xl bg-[#e2e8f0]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-28 bg-[#e2e8f0] rounded" />
                    <div className="h-3 w-20 bg-[#e2e8f0] rounded" />
                  </div>
                  <div className="h-6 w-16 bg-[#e2e8f0] rounded-full" />
                </div>
              ))}
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4">
              {/* Icon in gradient circle */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-[#64748b]" />
              </div>
              
              <h3 className="text-[15px] font-semibold text-[#1e293b] mb-1 text-center">
                No team members yet
              </h3>
              <p className="text-[13px] text-[#64748b] text-center max-w-[260px]">
                Add people to help manage this business.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {teamMembers.map((member) => {
                const profile = member.profile;
                if (!profile) return null;

                const accessLevel = getAccessLevel(member);

                return (
                  <button
                    key={member.id}
                    onClick={() => setEditingMember(member)}
                    className="w-full flex items-center gap-3 p-3 rounded-sq-md hover:bg-muted/50 transition-colors text-left"
                  >
                    <SquircleAvatar src={profile.profile_photo_url} alt={profile.display_name || 'Member'} size={40} />
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
                    <span className="text-xs text-[#64748b] bg-[#f1f5f9] px-2.5 py-1 rounded-full">
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
      </div>

      {/* Edit Access Sheet */}
      <Sheet open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <SheetContent side="bottom" className="rounded-t-[20px] px-5 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle>Edit access</SheetTitle>
          </SheetHeader>

          {editingMember?.profile && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <SquircleAvatar src={editingMember.profile.profile_photo_url} alt={editingMember.profile.display_name || 'Member'} size={48} />
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

              <div className="space-y-3 pt-2">
                <Button 
                  onClick={handleSaveAccess} 
                  disabled={saving || editAccess === getAccessLevel(editingMember)} 
                  className="w-full"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save changes
                </Button>
                
                {getAccessLevel(editingMember) !== 'primary_manager' && (
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRemoveTarget(editingMember);
                      setShowRemoveConfirm(true);
                    }}
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

      {/* Transfer ownership confirmation - z-[10100] to appear above Sheet */}
      <AlertDialog open={showTransferConfirm} onOpenChange={setShowTransferConfirm}>
        <AlertDialogContent className="z-[10100]" overlayClassName="z-[10099]">
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

      {/* Remove confirmation - Ticket C: z-[10100] to appear above Sheet z-[10050] */}
      <AlertDialog
        open={showRemoveConfirm}
        onOpenChange={(open) => {
          setShowRemoveConfirm(open);
          if (!open) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent className="z-[10100]" overlayClassName="z-[10099]">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from team?</AlertDialogTitle>
            <AlertDialogDescription>
              {(removeTarget?.profile?.display_name || editingMember?.profile?.display_name || 'This person')} will no longer appear as part of this business team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button 
              type="button"
              variant="destructive"
              disabled={removing}
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await handleRemoveMember();
              }}
            >
              {removing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Remove
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
