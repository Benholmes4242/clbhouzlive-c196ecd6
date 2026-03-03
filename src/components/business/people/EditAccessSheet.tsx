import React from 'react';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { TeamMember } from '@/hooks/useBusinessTeamMembers';
import { getAccessLevel } from '@/hooks/useTeamManagement';
import { cn } from '@/lib/utils';

interface AccessOption {
  value: string;
  label: string;
  description: string;
  requiresOwner: boolean;
}

interface EditAccessSheetProps {
  member: TeamMember | null;
  onOpenChange: (open: boolean) => void;
  editAccess: string;
  setEditAccess: (access: string) => void;
  editDisplayTitle: string;
  setEditDisplayTitle: (title: string) => void;
  availableAccessOptions: readonly AccessOption[];
  hasChanges: boolean;
  saving: boolean;
  onSave: () => void;
  onRemove?: () => void;
  removing?: boolean;
  /** Unique prefix for radio IDs to avoid collisions */
  idPrefix?: string;
}

export function EditAccessSheet({
  member,
  onOpenChange,
  editAccess,
  setEditAccess,
  editDisplayTitle,
  setEditDisplayTitle,
  availableAccessOptions,
  hasChanges,
  saving,
  onSave,
  onRemove,
  removing = false,
  idPrefix = 'edit',
}: EditAccessSheetProps) {
  const profile = member?.profile;
  const isPrimaryManager = member ? getAccessLevel(member) === 'primary_manager' : false;

  return (
    <Sheet open={!!member} onOpenChange={(open) => !open && onOpenChange(false)}>
      <SheetContent side="bottom" className="rounded-t-[20px] px-5 pb-8">
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-9 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="pb-4">
          <SheetTitle>Edit access</SheetTitle>
        </SheetHeader>

        {profile && (
          <div className="space-y-6">
            {/* User display */}
            <div className="flex items-center gap-3">
              <SquircleAvatar src={profile.profile_photo_url} alt={profile.display_name || 'Member'} size={48} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium truncate">
                    {profile.display_name || profile.username || 'Unknown'}
                  </span>
                  {profile.is_verified_golfer && <VerifiedBadge size="sm" />}
                </div>
                {profile.username && (
                  <span className="text-sm text-muted-foreground">@{profile.username}</span>
                )}
              </div>
            </div>

            {/* Access level */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Access level</Label>
              <RadioGroup value={editAccess} onValueChange={setEditAccess}>
                {availableAccessOptions.map((opt) => (
                  <label key={opt.value} htmlFor={`${idPrefix}-${opt.value}`} className="flex items-start gap-3 py-3 min-h-[44px] cursor-pointer">
                    <RadioGroupItem value={opt.value} id={`${idPrefix}-${opt.value}`} className="mt-0.5" />
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
                value={editDisplayTitle}
                onChange={(e) => setEditDisplayTitle(e.target.value)}
                className="min-h-[44px]"
              />
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={onSave}
                disabled={saving || !hasChanges}
                className={cn(
                  "w-full",
                  hasChanges
                    ? "bg-[hsl(var(--primary))] text-primary-foreground active:scale-[0.97]"
                    : "opacity-40 bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save changes
              </Button>

              {!isPrimaryManager && onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={removing}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {removing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Remove from team
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
