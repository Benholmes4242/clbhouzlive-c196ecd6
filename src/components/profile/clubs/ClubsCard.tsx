import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeader } from '@/components/ui/SectionHeader';

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
  /**
   * BRIEF_HOME_CLUB_PICKER §2.3 — the durable route to the picker. Present on
   * the owner's own profile whether or not they ever saw a prompt.
   */
  onSetHomeClub?: () => void;
  /**
   * THE CLUB THEY HAVE ASKED FOR AND ARE WAITING ON (§3.5), from
   * user_profiles.home_club_pending_name via useHomeClubStatus - a typed name of
   * a club not yet in the catalogue, not a club row.
   *
   * IT IS HERE BECAUSE AWAITING APPROVAL AND HAVING NO CLUB ARE TWO STATES AND
   * WERE RENDERING AS ONE. When HomeClubPrompt was removed this treatment left
   * with it, and a member who had already answered was told to answer again -
   * the same collapse as an error shown as a zero. This is now the only surface
   * that holds it.
   */
  pendingClubName?: string | null;
  className?: string;
}

const MAX_SECONDARY_CLUBS = 3;

const ClubsCard: React.FC<ClubsCardProps> = ({
  homeClub,
  secondaryClubs,
  isOwner,
  isPrivate = false,
  onEditClick,
  onSetHomeClub,
  pendingClubName,
  className
}) => {
  const hasClubs = homeClub || secondaryClubs.length > 0;
  const displayedSecondary = secondaryClubs.slice(0, MAX_SECONDARY_CLUBS);
  const remainingCount = secondaryClubs.length - MAX_SECONDARY_CLUBS;

  /**
   * PENDING OUTRANKS EMPTY. A member with a club on the way has answered the
   * question the empty state asks, so it must not be asked again. Their answer
   * is shown, visibly unconfirmed - the amber here is a status on the member's
   * own profile, not decoration.
   */
  if (!hasClubs && isOwner && pendingClubName) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className={cn('px-5 py-4', className)}
      >
        <div className="mb-3">
          <SectionHeader role="section" kicker="CLUBS" title="Clubs & Memberships" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Home club
          </span>
          <span
            className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-[6px]"
            style={{ background: 'rgba(247,147,30,0.14)', color: '#F7931E' }}
          >
            <Clock size={10} strokeWidth={2.5} /> Pending
          </span>
        </div>
        <p className="text-[15px] font-semibold mt-1 text-foreground">{pendingClubName}</p>
        <p className="text-[12.5px] mt-1 text-muted-foreground">
          We're adding this club. You'll be connected to it automatically - nothing more to do.
        </p>
      </motion.div>
    );
  }

  if (!hasClubs && isOwner) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className={cn('px-5 py-4', className)}
      >
        <div className="mb-3">
          <SectionHeader role="section" kicker="CLUBS" title="Clubs & Memberships" />
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Add your home club and any clubs you play at.
        </p>
        <motion.button
          onClick={onSetHomeClub ?? onEditClick}
          whileTap={{ scale: 0.985 }}
          transition={{ duration: 0.1 }}
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground min-h-[44px]',
            'hover:text-foreground hover:underline hover:decoration-muted-foreground transition-all'
          )}
        >
          <Plus className="w-4 h-4" />
          {onSetHomeClub ? 'Add home club' : 'Add clubs'}
        </motion.button>
      </motion.div>
    );
  }

  if (!hasClubs && !isOwner && isPrivate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className={cn('px-5 py-4', className)}
      >
        <div className="mb-3">
          <SectionHeader role="section" kicker="CLUBS" title="Clubs & Memberships" />
        </div>
        <p className="text-sm text-muted-foreground">
          Clubs are private.
        </p>
      </motion.div>
    );
  }

  if (!hasClubs) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className={cn('', className)}
    >
      <div className="flex items-center justify-between mb-2">
        <SectionHeader role="section" kicker="CLUBS" title="Clubs & Memberships" />
        {isOwner && onEditClick && (
          <motion.button
            onClick={onEditClick}
            whileTap={{ scale: 0.95 }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Edit clubs"
          >
            <Pencil className="w-4 h-4" strokeWidth={2} />
          </motion.button>
        )}
      </div>

      {homeClub && (
        <button
          type="button"
          onClick={isOwner && onSetHomeClub ? onSetHomeClub : undefined}
          disabled={!isOwner || !onSetHomeClub}
          className="flex flex-col items-start gap-1 text-left disabled:cursor-default"
        >
          <span
            className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F7931E]"
          >
            Home club
          </span>
          <span className="text-sm font-semibold text-foreground">{homeClub.name}</span>
        </button>
      )}

      {displayedSecondary.length > 0 && (
        <div className="mt-3 pt-2.5" style={{ borderTop: '0.5px solid rgba(255,255,255,0.10)' }}>
          <p className="text-xs font-medium text-muted-foreground mb-2">Also plays at</p>
          <div className="space-y-1">
            {displayedSecondary.map(club => (
              <p key={club.id} className="text-sm font-medium text-foreground truncate">
                {club.name}
              </p>
            ))}
            {remainingCount > 0 && (
              <button className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors min-h-[44px] flex items-center active:scale-[0.98]">
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
