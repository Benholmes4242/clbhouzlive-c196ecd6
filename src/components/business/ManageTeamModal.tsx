import React, { useEffect } from 'react';
import { Search, ChevronRight, Loader2, X, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
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
import {
  useTeamManagement,
  getAccessLevel,
  getAccessLabel,
} from '@/hooks/useTeamManagement';

interface ManageTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  currentTeam: TeamMember[];
  isOwner: boolean;
}

export function ManageTeamModal({ 
  open, 
  onOpenChange, 
  businessId, 
  currentTeam,
  isOwner
}: ManageTeamModalProps) {
  const tm = useTeamManagement(businessId, currentTeam, { isOwner });

  // Reset state when modal closes
  useEffect(() => {
    if (!open) tm.resetAll();
  }, [open]);

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
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or username…"
                  value={tm.searchQuery}
                  onChange={(e) => tm.handleSearch(e.target.value)}
                  className="pl-9"
                />
                {tm.searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Search results */}
              {tm.searchResults.length > 0 && !tm.selectedUser && (
                <div className="border border-border rounded-sq-md overflow-hidden bg-background">
                  {tm.searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        tm.setSelectedUser(user);
                        tm.setSelectedAccess('team');
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
              {tm.selectedUser && (
                <div className="border border-border rounded-sq-md p-4 bg-muted/20 space-y-4">
                  <div className="flex items-center gap-3">
                    <SquircleAvatar src={tm.selectedUser.profile_photo_url} alt={tm.selectedUser.display_name || 'User'} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm truncate">
                          {tm.selectedUser.display_name || tm.selectedUser.username || 'Unknown'}
                        </span>
                        {tm.selectedUser.is_verified_golfer && <VerifiedBadge size="sm" />}
                      </div>
                      {tm.selectedUser.username && (
                        <span className="text-xs text-muted-foreground">@{tm.selectedUser.username}</span>
                      )}
                    </div>
                    <button onClick={() => tm.setSelectedUser(null)} className="p-1.5 hover:bg-muted rounded-full">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Access level</Label>
                    <RadioGroup value={tm.selectedAccess} onValueChange={tm.setSelectedAccess}>
                      {tm.availableAccessOptions.map((opt) => (
                        <label key={opt.value} htmlFor={`add-modal-${opt.value}`} className="flex items-start gap-3 py-3 min-h-[44px] cursor-pointer">
                          <RadioGroupItem value={opt.value} id={`add-modal-${opt.value}`} className="mt-0.5" />
                          <div className="flex-1">
                            <span className="text-sm font-medium">{opt.label}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Display title */}
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground font-medium">Display title</Label>
                    <Input
                      placeholder="e.g. Head Professional, Director of Golf"
                      value={tm.addDisplayTitle}
                      onChange={(e) => tm.setAddDisplayTitle(e.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>

                  <Button onClick={tm.handleAddMember} disabled={tm.adding} className="w-full">
                    {tm.adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Add
                  </Button>
                </div>
              )}
            </div>

            {/* Current team section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Current team</h3>
              
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
                        onClick={() => tm.setEditingMember(member)}
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
      <Sheet open={!!tm.editingMember} onOpenChange={(open) => !open && tm.setEditingMember(null)}>
        <SheetContent side="bottom" className="rounded-t-[20px] px-5 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle>Edit access</SheetTitle>
          </SheetHeader>

          {tm.editingMember?.profile && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <SquircleAvatar src={tm.editingMember.profile.profile_photo_url} alt={tm.editingMember.profile.display_name || 'Member'} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium truncate">
                      {tm.editingMember.profile.display_name || tm.editingMember.profile.username || 'Unknown'}
                    </span>
                    {tm.editingMember.profile.is_verified_golfer && <VerifiedBadge size="sm" />}
                  </div>
                  {tm.editingMember.profile.username && (
                    <span className="text-sm text-muted-foreground">@{tm.editingMember.profile.username}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Access level</Label>
                <RadioGroup value={tm.editAccess} onValueChange={tm.setEditAccess}>
                  {tm.availableAccessOptions.map((opt) => (
                    <label key={opt.value} htmlFor={`edit-modal-${opt.value}`} className="flex items-start gap-3 py-3 min-h-[44px] cursor-pointer">
                      <RadioGroupItem value={opt.value} id={`edit-modal-${opt.value}`} className="mt-0.5" />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{opt.label}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* Display title */}
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground font-medium">Display title</Label>
                <Input
                  placeholder="e.g. Head Professional, Director of Golf"
                  value={tm.editDisplayTitle}
                  onChange={(e) => tm.setEditDisplayTitle(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-3 pt-2">
                <Button 
                  onClick={tm.handleSaveAccess} 
                  disabled={tm.saving || !tm.hasChanges} 
                  className={cn(
                    "w-full",
                    tm.hasChanges
                      ? "bg-[hsl(var(--primary))] text-primary-foreground active:scale-[0.97]"
                      : "opacity-40 bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {tm.saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save changes
                </Button>
                
                {getAccessLevel(tm.editingMember) !== 'primary_manager' && (
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      tm.setRemoveTarget(tm.editingMember);
                      tm.setShowRemoveConfirm(true);
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

      {/* Transfer ownership confirmation */}
      <AlertDialog open={tm.showTransferConfirm} onOpenChange={tm.setShowTransferConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make primary manager?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You're about to make <strong>{tm.pendingTransfer?.memberName}</strong> the primary manager of this business.
              </p>
              <p>You'll become a manager.</p>
              <p className="text-muted-foreground/80">This change can be updated later.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={tm.handleConfirmTransfer}>Confirm transfer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove confirmation */}
      <AlertDialog
        open={tm.showRemoveConfirm}
        onOpenChange={(open) => {
          tm.setShowRemoveConfirm(open);
          if (!open) tm.setRemoveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from team?</AlertDialogTitle>
            <AlertDialogDescription>
              {(tm.removeTarget?.profile?.display_name || tm.editingMember?.profile?.display_name || 'This person')} will no longer appear as part of this business team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={tm.removing}
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await tm.handleRemoveMember();
              }}
            >
              {tm.removing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Remove
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
