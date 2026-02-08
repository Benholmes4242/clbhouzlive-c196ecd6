import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Club {
  id: string;
  name: string;
  isPrimary?: boolean;
}

interface ClubsCardProps {
  homeClub: Club | null;
  secondaryClubs: Club[];
  isOwner: boolean;
  isPrivate?: boolean;
  onEditClick?: () => void;
  className?: string;
}

const MAX_SECONDARY_CLUBS = 3;

const ClubsCard: React.FC<ClubsCardProps> = ({
  homeClub,
  secondaryClubs,
  isOwner,
  isPrivate = false,
  onEditClick,
  className
}) => {
  const hasClubs = homeClub || secondaryClubs.length > 0;
  const displayedSecondary = secondaryClubs.slice(0, MAX_SECONDARY_CLUBS);
  const remainingCount = secondaryClubs.length - MAX_SECONDARY_CLUBS;

  // Empty state: Owner with no clubs
  if (!hasClubs && isOwner) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className={cn('px-5 py-4', className)}
      >
        <h3 className="text-base font-semibold text-foreground mb-3">Clubs & Memberships</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add your home club and any clubs you play at.
        </p>
        <motion.button
          onClick={onEditClick}
          whileTap={{ scale: 0.985 }}
          transition={{ duration: 0.1 }}
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground',
            'hover:text-foreground hover:underline hover:decoration-muted-foreground transition-all'
          )}
        >
          <Plus className="w-4 h-4" />
          Add clubs
        </motion.button>
      </motion.div>
    );
  }

  // Empty state: Non-owner viewing private clubs
  if (!hasClubs && !isOwner && isPrivate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className={cn('px-5 py-4', className)}
      >
        <h3 className="text-base font-semibold text-foreground mb-3">Clubs & Memberships</h3>
        <p className="text-sm text-muted-foreground">
          Clubs are private.
        </p>
      </motion.div>
    );
  }

  // If no clubs and not owner and not marked private, don't render
  if (!hasClubs) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className={cn('', className)}
    >
      {/* Header - reduced mb: mb-4 → mb-2 (8px from label to first club) */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-foreground">Clubs & Memberships</h3>
        {isOwner && onEditClick && (
          <motion.button
            onClick={onEditClick}
            whileTap={{ scale: 0.95 }}
            className="p-2 -m-0.5 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Edit clubs"
          >
            <Pencil className="w-4 h-4" strokeWidth={2} />
          </motion.button>
        )}
      </div>

      {/* Home Club */}
      {homeClub && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{homeClub.name}</span>
          <span className={cn(
            'px-2 py-0.5 text-xs font-medium rounded-full',
            'border border-primary/20 bg-primary/5 text-primary'
          )}>
            Home club
          </span>
        </div>
      )}

      {/* Secondary Clubs - reduced spacing between entries */}
      {displayedSecondary.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Also plays at</p>
          {/* Reduced gap: space-y-1.5 → space-y-1 (8px between entries) */}
          <div className="space-y-1">
            {displayedSecondary.map(club => (
              <p key={club.id} className="text-sm font-medium text-foreground truncate">
                {club.name}
              </p>
            ))}
            {remainingCount > 0 && (
              <button className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors">
                + {remainingCount} more
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ClubsCard;
