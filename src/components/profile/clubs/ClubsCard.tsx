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
        className={cn(
          'rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5',
          'shadow-sm',
          className
        )}
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
            'inline-flex items-center gap-1.5 text-sm font-medium text-slate-600',
            'hover:text-slate-900 hover:underline hover:decoration-slate-400 transition-all'
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
        className={cn(
          'rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5',
          'shadow-sm',
          className
        )}
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
      whileTap={{ scale: 0.985 }}
      className={cn(
        'rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5',
        'shadow-sm cursor-default',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Clubs & Memberships</h3>
        {isOwner && onEditClick && (
          <motion.button
            onClick={onEditClick}
            whileTap={{ scale: 0.95 }}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        )}
      </div>

      {/* Home Club */}
      {homeClub && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-foreground">{homeClub.name}</span>
          <span className={cn(
            'px-2 py-0.5 text-xs font-medium rounded-full',
            'border border-primary/20 bg-primary/5 text-primary'
          )}>
            Home club
          </span>
        </div>
      )}

      {/* Secondary Clubs */}
      {displayedSecondary.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <p className="text-xs text-muted-foreground mb-2">Also plays at</p>
          <div className="space-y-1.5">
            {displayedSecondary.map(club => (
              <p key={club.id} className="text-sm text-foreground/90">
                {club.name}
              </p>
            ))}
            {remainingCount > 0 && (
              <button className="text-xs text-muted-foreground/80 hover:text-muted-foreground hover:underline transition-colors">
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
