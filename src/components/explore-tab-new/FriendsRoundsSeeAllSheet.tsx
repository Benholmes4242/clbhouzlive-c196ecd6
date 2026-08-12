import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FriendRoundRow } from './FriendRoundRow';
import { buildInsightMap } from './friendRoundParts';
import { useFriendsLatestRounds } from '@/hooks/gam/useFriendsLatestRounds';
import { TITLE as TITLE_METRICS } from '@/lib/tokens/type';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const SLATE_50 = '#F8FAFC';
const INK = '#0F172A';
const EYEBROW_INK = '#0E1216';
const HAIRLINE = '#E2E8F0';

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
  onRowPress: (scoreId: string | null, userId: string) => void;
}

const SHEET_LIMIT = 30;

export function FriendsRoundsSeeAllSheet({ open, onClose, userId, onRowPress }: Props) {
  const { t } = useTranslation('courses');
  const { data: rounds } = useFriendsLatestRounds(userId, {
    limit: SHEET_LIMIT,
    allowMultiplePerFriend: true,
  });
  const total = rounds?.length ?? 0;
  // Insight resolution spans the whole list so one kind cannot flood the sheet.
  const insights = useMemo(() => buildInsightMap(rounds ?? [], t as never), [rounds, t]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="friends-rounds-title"
      variant="light"
      surfaceColor={SLATE_50}
      style={{
        height: '75dvh',
        maxHeight: '75dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        background: SLATE_50,
      }}
    >
      <div style={{ padding: '10px 16px 12px', background: SLATE_50, borderBottom: `1px solid ${HAIRLINE}` }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: EYEBROW_INK,
            marginBottom: 4,
          }}
        >
          {t('discover.friendsRounds.overline', 'YOUR CIRCLE')} {'\u00B7'} {total}{' '}
          {total === 1
            ? t('discover.friendsRounds.entrySingular', 'ROUND')
            : t('discover.friendsRounds.entryPlural', 'ROUNDS')}
        </div>
        <div
          id="friends-rounds-title"
          style={{
            ...TITLE_METRICS,
            color: INK,
          }}
        >
          {t('discover.friendsRounds.title', "Friends' latest rounds")}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: SLATE_50,
        }}
      >
        {rounds && rounds.length > 0 ? (
          rounds.map((r, i) => (
            <FriendRoundRow
              key={r.round_id}
              row={r}
              insight={insights.get(r.round_id)?.text ?? null}
              isLast={i === rounds.length - 1}
              onPress={() => {
                // Do NOT close the sheet — leaving it mounted beneath the
                // scorecard lets the user return to their scroll position on
                // dismiss. Matches TierSeeAllSheet.tsx.
                onRowPress(r.score_id, r.user_id);
              }}
            />
          ))

        ) : (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
            {t('discover.friendsRounds.empty', 'No recent friend rounds yet.')}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

export default FriendsRoundsSeeAllSheet;
