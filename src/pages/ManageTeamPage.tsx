import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, ArrowLeft, ChevronRight, Loader2, X, UserPlus, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessTeamMembers } from '@/hooks/useBusinessTeamMembers';
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
import { cn } from '@/lib/utils';
import {
  useTeamManagement,
  getAccessLevel,
  getAccessLabel,
} from '@/hooks/useTeamManagement';

export default function ManageTeamPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: business } = useBusinessProfile(businessId);
  const { data: teamMembers = [], isLoading: teamLoading } = useBusinessTeamMembers(businessId);

  useBusinessAccessRequestsRealtime(businessId);

  const isOwner = teamMembers.some(m =>
    m.profile?.id === currentUser?.id && m.role === 'owner'
  );

  const canManage = isOwner || teamMembers.some(m =>
    m.profile?.id === currentUser?.id && ['owner', 'admin'].includes(m.role)
  );

  const tm = useTeamManagement(businessId, teamMembers, { isOwner });

  const handleBack = () => navigate(-1);

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background safe-top">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button
            onClick={handleBack}
            className="min-h-[44px] min-w-[44px] flex items-center gap-1 px-2 py-2 text-sm text-muted-foreground hover:text-foreground active:opacity-70 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <button
            onClick={handleBack}
            className="min-h-[44px] min-w-[44px] flex items-center px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground active:opacity-70 transition-all"
          >
            Done
          </button>
        </div>

        <div className="text-center px-4 pb-4">
          <h1 className="text-2xl font-bold text-foreground">Manage Team</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 space-y-6">
          {/* Current team section — FIRST */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Current team</h3>

            {teamLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <div className="w-10 h-10 rounded-2xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-28 bg-muted rounded" />
                      <div className="h-3 w-20 bg-muted rounded" />
                    </div>
                    <div className="h-6 w-16 bg-muted rounded-full" />
                  </div>
                ))}
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <div className="w-14 h-14 rounded-full bg-muted border border-border flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-[15px] font-semibold text-foreground mb-1 text-center">
                  No team members yet
                </h3>
                <p className="text-[13px] text-muted-foreground text-center max-w-[260px]">
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
                      <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                        {getAccessLabel(accessLevel)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

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
                      <label key={opt.value} htmlFor={`add-page-${opt.value}`} className="flex items-start gap-3 py-3 min-h-[44px] cursor-pointer">
                        <RadioGroupItem value={opt.value} id={`add-page-${opt.value}`} className="mt-0.5" />
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
        </div>

        {/* Access Requests Section — AFTER team, compact when empty */}
        <AccessRequestsSection
          businessId={businessId || ''}
          businessName={business?.name || 'Business'}
          businessAvatarUrl={business?.logo_url}
          canManage={canManage}
        />
      </div>

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
                    <label key={opt.value} htmlFor={`edit-page-${opt.value}`} className="flex items-start gap-3 py-3 min-h-[44px] cursor-pointer">
                      <RadioGroupItem value={opt.value} id={`edit-page-${opt.value}`} className="mt-0.5" />
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
        <AlertDialogContent className="z-[10100]" overlayClassName="z-[10099]">
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
        <AlertDialogContent className="z-[10100]" overlayClassName="z-[10099]">
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
    </div>
  );
}
