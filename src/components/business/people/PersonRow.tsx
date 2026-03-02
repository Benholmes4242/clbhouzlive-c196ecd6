import React from 'react';
import { ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface PersonRowProps {
  id: string;
  displayName: string | null;
  username: string | null;
  profilePhotoUrl: string | null;
  isVerified?: boolean;
  handicap?: number | null;
  showHandicap?: boolean;
  homeClub?: string | null;
  alsoPlaysAt?: string[];
  onClick: () => void;
}

export function PersonRow({
  displayName,
  username,
  profilePhotoUrl,
  isVerified = false,
  handicap,
  showHandicap = true,
  homeClub,
  alsoPlaysAt = [],
  onClick,
}: PersonRowProps) {
  const name = displayName || username || 'Unknown';
  const showHcp = showHandicap && handicap != null;
  
  // Format "Also plays at" text
  const alsoPlaysAtText = alsoPlaysAt.length > 0
    ? `Also plays at ${alsoPlaysAt.join(', ')}`
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/30 active:bg-muted/40 transition-colors min-h-[44px]"
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
          <span className="font-semibold text-foreground truncate">{name}</span>
          {isVerified && <VerifiedBadge size="sm" />}
        </div>

        {/* Line 2: HCP + Home club */}
        {(showHcp || homeClub) && (
          <div className="text-sm text-muted-foreground mt-0.5">
            {showHcp && <>HCP {handicap!.toFixed(1)}</>}
            {showHcp && homeClub && <> · </>}
            {homeClub && <span>{homeClub}</span>}
          </div>
        )}

        {/* Line 3: Also plays at (allow wrap) */}
        {alsoPlaysAtText && (
          <div className="text-xs text-muted-foreground/80 leading-snug mt-0.5">
            {alsoPlaysAtText}
          </div>
        )}
      </div>

      {/* Chevron */}
      <div className="text-muted-foreground/50 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">
        <ChevronRight className="h-5 w-5" />
      </div>
    </button>
  );
}
