import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  A,
  FIGS,
  LABEL,
  NUM,
  Panel,
  SANS,
  TITLE,
} from '@/features/courses/components/holes/analytical/tokens';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getInitialsFromName } from '@/lib/avatarFallback';
import { useFriendsLatestRounds, type FriendRoundRow } from '@/hooks/gam/useFriendsLatestRounds';
import { FriendsRoundsSeeAllSheet } from '../FriendsRoundsSeeAllSheet';
import { wireWhen } from '../hooks/useDiscoverWire';

/**
 * YourCircle — friends' latest rounds, 5 rows, "View all" opening a 75dvh
 * sheet. Same three-line discipline as the wire: the name and time share a
 * line, the course gets its own, and the figure block is centred with its unit
 * beneath.
 */

const ROWS = 5;
const CIRCLE_GRID = '30px 1fr 52px';

interface Props {
  userId: string | undefined;
  onRowPress: (scoreId: string | null, userId: string) => void;
}

function CircleSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '30px 1fr', gap: 11 }}>
          <div style={{ width: 30, height: 30, borderRadius: '34%', background: A.TRACK }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 11, width: '40%', borderRadius: 3, background: A.TRACK }} />
            <div style={{ height: 10, width: '58%', borderRadius: 3, background: A.TRACK }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CircleRow({ row, onPress }: { row: FriendRoundRow; onPress: () => void }) {
  const { t } = useTranslation('courses');
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        width: '100%',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: CIRCLE_GRID,
        alignItems: 'center',
        gap: 11,
        padding: '9px 0',
        fontFamily: SANS,
        textAlign: 'left',
        ...FIGS,
      }}
    >
      <SquircleAvatar
        size={30}
        src={row.profile_photo_url}
        alt={row.display_name}
        userId={row.user_id}
        fallback={getInitialsFromName(row.display_name)}
        hairlineRing
      />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: A.INK,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.display_name}
          </span>
          <span style={{ ...LABEL, fontSize: 8.5, flex: 'none' }}>{wireWhen(row.play_date)}</span>
        </span>
        {row.course_name && (
          <span
            style={{
              display: 'block',
              fontSize: 12,
              color: A.MUTE,
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.course_name}
          </span>
        )}
      </span>
      {row.gross != null && (
        <span style={{ textAlign: 'center' }}>
          <span style={{ ...NUM, fontSize: 15, color: A.INK, display: 'block' }}>{row.gross}</span>
          <span style={{ ...LABEL, fontSize: 8, display: 'block', marginTop: 1 }}>
            {t('discover.wire.unit.gross', 'gross')}
          </span>
        </span>
      )}
    </button>
  );
}

export function YourCircle({ userId, onRowPress }: Props) {
  const { t } = useTranslation('courses');
  const { data: rounds, isLoading } = useFriendsLatestRounds(userId, { limit: ROWS });
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleRow = useCallback(
    (scoreId: string | null, uid: string) => onRowPress(scoreId, uid),
    [onRowPress],
  );

  if (!userId) return null;
  // Empty only once the data has arrived; nothing to say means no panel.
  if (!isLoading && (!rounds || rounds.length === 0)) return null;

  return (
    <>
      <Panel>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
            marginBottom: 6,
          }}
        >
          <span style={TITLE}>{t('discover.yourCircle', 'Your circle')}</span>
          {!isLoading && (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
                fontFamily: SANS,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                ...LABEL,
                color: A.INK,
              }}
            >
              {t('discover.viewAll', 'View all')}
              <span aria-hidden="true" style={{ fontWeight: 800 }}>
                {'\u203A'}
              </span>
            </button>
          )}
        </header>

        {isLoading ? (
          <CircleSkeleton />
        ) : (
          (rounds ?? []).map((r) => (
            <CircleRow key={r.round_id} row={r} onPress={() => handleRow(r.score_id, r.user_id)} />
          ))
        )}
      </Panel>

      <FriendsRoundsSeeAllSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        userId={userId}
        onRowPress={handleRow}
      />
    </>
  );
}

export default YourCircle;
