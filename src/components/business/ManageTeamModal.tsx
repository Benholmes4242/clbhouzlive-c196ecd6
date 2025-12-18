import React, { useState, useCallback } from 'react';
import { X, Search, UserPlus, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TeamMember } from '@/hooks/useBusinessTeamMembers';
import { cn } from '@/lib/utils';

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

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner', requiresOwner: true },
  { value: 'admin', label: 'Admin', requiresOwner: true },
  { value: 'director', label: 'Director', requiresOwner: false },
  { value: 'coach', label: 'Coach', requiresOwner: false },
  { value: 'staff', label: 'Staff', requiresOwner: false },
];

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
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('staff');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

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
    if (!selectedUser || !selectedRole) return;

    setAdding(true);
    try {
      const { error } = await supabase.rpc('upsert_business_team_member', {
        p_business_id: businessId,
        p_user_profile_id: selectedUser.id,
        p_role: selectedRole
      });

      if (error) throw error;

      toast.success(`${selectedUser.display_name || selectedUser.username} added to team`);
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedRole('staff');
      queryClient.invalidateQueries({ queryKey: ['business-team-members', businessId] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to add team member');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    setRemoving(userId);
    try {
      const { error } = await supabase.rpc('delete_business_team_member', {
        p_business_id: businessId,
        p_user_profile_id: userId
      });

      if (error) throw error;

      toast.success(`${userName} removed from team`);
      queryClient.invalidateQueries({ queryKey: ['business-team-members', businessId] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove team member');
    } finally {
      setRemoving(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.rpc('upsert_business_team_member', {
        p_business_id: businessId,
        p_user_profile_id: userId,
        p_role: newRole
      });

      if (error) throw error;

      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['business-team-members', businessId] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  const availableRoles = ROLE_OPTIONS.filter(r => isOwner || !r.requiresOwner);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Team</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Add new member section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Add team member</h3>
            
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or username..."
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
                    onClick={() => setSelectedUser(user)}
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
                  </button>
                ))}
              </div>
            )}

            {/* Selected user + role picker */}
            {selectedUser && (
              <div className="border border-border rounded-sq-md p-3 bg-muted/30 space-y-3">
                <div className="flex items-center gap-3">
                  <SquircleAvatar
                    src={selectedUser.profile_photo_url}
                    alt={selectedUser.display_name || 'User'}
                    size={40}
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
                    className="p-1 hover:bg-muted rounded-full"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddMember} disabled={adding}>
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Current team section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">
              Current team ({currentTeam.length})
            </h3>
            
            {currentTeam.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No team members yet
              </p>
            ) : (
              <div className="space-y-2">
                {currentTeam.map((member) => {
                  const profile = member.profile;
                  if (!profile) return null;

                  const canEditRole = isOwner || (member.role !== 'owner' && member.role !== 'admin');
                  const canRemove = isOwner || (member.role !== 'owner' && member.role !== 'admin');

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 border border-border rounded-sq-md bg-background"
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
                      </div>
                      
                      <Select 
                        value={member.role} 
                        onValueChange={(val) => handleUpdateRole(profile.id, val)}
                        disabled={!canEditRole}
                      >
                        <SelectTrigger className="w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <button
                        onClick={() => handleRemoveMember(profile.id, profile.display_name || 'Member')}
                        disabled={!canRemove || removing === profile.id}
                        className={cn(
                          "p-2 rounded-sq-sm transition-colors",
                          canRemove 
                            ? "hover:bg-destructive/10 text-destructive" 
                            : "text-muted-foreground/30 cursor-not-allowed"
                        )}
                      >
                        {removing === profile.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
