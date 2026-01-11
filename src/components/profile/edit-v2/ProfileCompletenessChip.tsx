import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
  const percentage = Math.round((completedCount / totalCount) * 100);
  
  // Find next incomplete section
  const nextIncomplete = sections.find(s => !s.complete);
  
  if (isComplete) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "w-full max-w-sm rounded-2xl p-4",
        "bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5",
        "border border-primary/10"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Complete your profile
          </h4>
          <p className="text-xs text-muted-foreground">
            {completedCount} of {totalCount} sections complete
          </p>
        </div>
        <div className="text-2xl font-bold text-primary">
          {percentage}%
        </div>
      </div>
      
      {/* Visual progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
        />
      </div>
      
      {/* Next step hint */}
      {nextIncomplete && (
        <p className="text-xs text-muted-foreground">
          Next: Add your {nextIncomplete.label.toLowerCase()}
        </p>
      )}
    </motion.div>
  );
};
