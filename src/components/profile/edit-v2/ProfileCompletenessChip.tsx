import React from 'react';
import { cn } from '@/lib/utils';

interface ProfileCompletenessChipProps {
  displayName: string;
  homeClub: string;
  handicap: string;
  bio: string;
  hasProfilePhoto: boolean;
}

export const ProfileCompletenessChip: React.FC<ProfileCompletenessChipProps> = ({
  displayName,
  homeClub,
  handicap,
  bio,
  hasProfilePhoto,
}) => {
  // Calculate completeness
  const sections = [
    { label: 'Display name', complete: displayName.trim().length > 0 },
    { label: 'Home club', complete: homeClub.trim().length > 0 },
    { label: 'Handicap', complete: handicap.trim().length > 0 },
    { label: 'Bio', complete: bio.trim().length > 0 },
    { label: 'Profile photo', complete: hasProfilePhoto },
  ];
  
  const completedCount = sections.filter(s => s.complete).length;
  const totalCount = sections.length;
  const isComplete = completedCount === totalCount;
  
  if (isComplete) return null;
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-sq-pill",
      "bg-white text-muted-foreground border border-border/40"
    )}>
      <span className="font-medium">Profile completeness</span>
      <span className="text-muted-foreground/70">·</span>
      <span>{completedCount} of {totalCount} sections done</span>
    </div>
  );
};
