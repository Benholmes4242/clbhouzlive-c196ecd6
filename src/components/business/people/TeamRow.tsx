import React from 'react';
import { ChevronRight, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { ROLE_LABELS } from '@/hooks/useTeamManagement';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TeamRowProps {
  id: string;
  displayName: string | null;
  username: string | null;
  profilePhotoUrl: string | null;
  isVerified?: boolean;
  role: string;
  displayTitle?: string | null;
  canManage?: boolean;
  onProfileClick: () => void;
  onEditAccess?: () => void;
  onRemove?: () => void;
}

export function TeamRow({
  displayName,
  username,
  profilePhotoUrl,
  isVerified = false,
  role,
  displayTitle,
  canManage = false,
  onProfileClick,
  onEditAccess,
  onRemove,
}: TeamRowProps) {
  const name = displayName || username || 'Unknown';
  const roleLabel = ROLE_LABELS[role] || 'Team';
  const hasCustomTitle = !!displayTitle?.trim();

  return (
    <div className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 active:scale-[0.98] transition-all">
      {/* Clickable profile area */}
      <button
        type="button"
        onClick={onProfileClick}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        {/* Avatar — 64px for premium showcase */}
        <div className="h-16 w-16 rounded-sq-md overflow-hidden flex items-center justify-center shrink-0">
          <SquircleAvatar
            src={profilePhotoUrl}
            alt={name}
            size={64}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Line 1: Name + verified */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground truncate">{name}</span>
            {isVerified && <VerifiedBadge size="sm" />}
          </div>

          {/* Line 2: Custom title OR role pill */}
          <div className="mt-0.5">
            {hasCustomTitle ? (
              <span className="text-sm text-muted-foreground">{displayTitle}</span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full border inline-flex bg-muted text-muted-foreground border-border/60">
                {roleLabel}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Right side: Kebab menu or Chevron */}
      {canManage && (onEditAccess || onRemove) ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-muted/50 text-muted-foreground"
              aria-label="More options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEditAccess && (
              <DropdownMenuItem onClick={onEditAccess}>
                Edit access
              </DropdownMenuItem>
            )}
            {onRemove && role !== 'owner' && (
              <DropdownMenuItem
                onClick={onRemove}
                className="text-destructive focus:text-destructive"
              >
                Remove from team
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button
          type="button"
          onClick={onProfileClick}
          className="text-muted-foreground/50 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
