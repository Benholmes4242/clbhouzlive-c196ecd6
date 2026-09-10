import React from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';
import { CHART } from '../../charts/tokens';
import { FriendRoundRow } from './FriendRoundRow';

interface Props {
  open: boolean;
  onClose: () => void;
  rounds: WhsFriendActivityWithImage[];
  onOpenRound: (round: WhsFriendActivityWithImage) => void;
  onInvite: (round: WhsFriendActivityWithImage) => void;
  invitingId: string | null;
}

export const FriendsRoundsSheet: React.FC<Props> = ({
  open,
  onClose,
  rounds,
  onOpenRound,
  onInvite,
  invitingId,
}) => {
  const { t } = useTranslation('common');

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      height="85dvh"
      maxHeight="85dvh"
      contentStyle={{ background: CHART.CANVAS, color: CHART.INK, overflow: 'hidden' }}
      ariaLabel={t('handicap.friendsRounds.sheetTitle')}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <SheetHeader
          title={t('handicap.friendsRounds.sheetTitle')}
          subtitle={t('handicap.friendsRounds.meta')}
          onClose={onClose}
          variant="dark"
        />
        <div
          data-friends-rounds-scroll
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            willChange: 'transform',
            padding: '0 20px max(env(safe-area-inset-bottom, 0px), 24px)',
          }}
        >
          {rounds.map((round) => (
            <FriendRoundRow
              key={`${round.friend_row_id}:${round.last_round_score_id ?? round.last_round_played_at}`}
              round={round}
              onOpenRound={onOpenRound}
              onInvite={onInvite}
              inviting={invitingId === round.friend_row_id}
            />
          ))}
        </div>
      </div>
    </BottomSheet>
  );
};