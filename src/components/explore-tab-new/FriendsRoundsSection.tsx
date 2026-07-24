import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { SectionHead } from './SectionHead';
import { FriendRoundRow } from './FriendRoundRow';
import { FriendsRoundsSeeAllSheet } from './FriendsRoundsSeeAllSheet';
import { useFriendsLatestRounds } from '@/hooks/gam/useFriendsLatestRounds';
import type { ScorecardOpener } from './useScorecardOpener';

interface Props {
  userId: string | undefined;
  opener: ScorecardOpener;
}

/**
 * Discover "Friends' latest rounds" section.
 * Mounted at the top of the Almanac; a family with TheRecordBook below.
 */
export function FriendsRoundsSection({ userId, opener }: Props) {
  const { t } = useTranslation('courses');
  const { data: rounds, isLoading } = useFriendsLatestRounds(userId, { limit: 4 });
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleRowPress = useCallback(
    (scoreId: string | null, userId: string) => {
      if (scoreId) opener.openByScore(scoreId, null, userId);
      else opener.openProfile(userId);
    },
    [opener],
  );

  if (!userId) return null;
  if (isLoading) return null;
  if (!rounds || rounds.length === 0) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <SectionHead
        overline={t('discover.friendsRounds.overline', 'YOUR CIRCLE')}
        title={t('discover.friendsRounds.title', "Friends' latest rounds")}
        meta={t('discover.friendsRounds.viewAll', 'View all ›')}
        onMeta={() => setSheetOpen(true)}
      />
      <div>
        {rounds.map((r, i) => (
          <FriendRoundRow
            key={r.round_id}
            row={r}
            isLast={i === rounds.length - 1}
            onPress={() => handleRowPress(r.score_id, r.user_id)}
          />
        ))}
      </div>
      <FriendsRoundsSeeAllSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        userId={userId}
        onRowPress={handleRowPress}
      />
    </div>
  );
}

export default FriendsRoundsSection;
