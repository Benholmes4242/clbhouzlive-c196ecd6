import React, { useState } from 'react';
import { ChevronRight, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type TeamRole = 'owner' | 'admin' | 'director' | 'coach' | 'staff' | 'team' | 'manager' | 'primary_manager';

interface TeamRowProps {
  id: string;
  displayName: string | null;
  username: string | null;
  profilePhotoUrl: string | null;
  isVerified?: boolean;
  role: string;
  canManage?: boolean;
  onProfileClick: () => void;
  onEditAccess?: () => void;
  onRemove?: () => void;
}

// Role display labels
const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  primary_manager: 'Primary Manager',
  director: 'Director',
  admin: 'Admin',
  manager: 'Manager',
  coach: 'Coach',
  staff: 'Team',
  team: 'Team',
};

// Role pill styles
const roleStyles: Record<string, string> = {
  owner: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  primary_manager: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  director: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  admin: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
  manager: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
  coach: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  staff: 'bg-muted text-foreground/70 border-border/60',
  team: 'bg-muted text-foreground/70 border-border/60',
};

export function TeamRow({
  displayName,
  username,
  profilePhotoUrl,
  isVerified = false,
  role,
  canManage = false,
  onProfileClick,
  onEditAccess,
  onRemove,
}: TeamRowProps) {
  const name = displayName || username || 'Unknown';
  const roleLabel = ROLE_LABELS[role] || 'Team';
  const pillStyle = roleStyles[role] || roleStyles.team;

  return (
    <div className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-muted/30 transition-colors">
      {/* Clickable profile area */}
      <button
        type="button"
        onClick={onProfileClick}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        {/* Avatar */}
        <div className="h-12 w-12 rounded-sq-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
          <SquircleAvatar
            src={profilePhotoUrl}
            alt={name}
            size={48}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Line 1: Name + verified */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground truncate">{name}</span>
            {isVerified && <VerifiedBadge size="sm" />}
          </div>

          {/* Line 2: Role pill */}
          <div className="mt-1">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full border inline-flex",
              pillStyle
            )}>
              {roleLabel}
            </span>
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
              className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground"
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
          className="text-muted-foreground/50 shrink-0"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
