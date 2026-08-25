import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FriendRoundRow } from './FriendRoundRow';
import { buildInsightMap, referenceLine } from './friendRoundParts';
import { relativeDay } from './courseled/discoverWhen';
import { useRoundHoleShapes } from './courseled/hooks/useRoundHoleShapes';
import { useCircleLatestRounds, type CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import { TITLE as TITLE_METRICS } from '@/lib/tokens/type';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SF_STACK } from '@/components/manage/ui';

const FONT = SF_STACK;

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
  onRowPress: (scoreId: string | null, userId: string) => void;
}

const SHEET_LIMIT = 30;

export function FriendsRoundsSeeAllSheet({ open, onClose, userId, onRowPress }: Props) {
  const { t } = useTranslation('courses');
  const { data: rounds } = useCircleLatestRounds(userId, {
    limit: SHEET_LIMIT,
    allowMultiplePerFriend: true,
    /* CIRCLE ONLY (CORRECTION_WHOS_BEEN_PLAYING_RATIO §2.3). */
    includeSuggested: false,
  });
  const total = rounds?.length ?? 0;
  // Insight resolution spans the whole list so one kind cannot flood the sheet.
  const insights = useMemo(() => buildInsightMap(rounds ?? [], t as never), [rounds, t]);

  /* ONE BATCHED HOLE-SHAPE READ FOR THE WHOLE SHEET (§1.2). Thirty rows asking
     for their own shape would be thirty round trips. */
  const scoreIds = useMemo(() => (rounds ?? []).map((r) => r.score_id), [rounds]);
  const holeShapes = useRoundHoleShapes(scoreIds);

  /* GROUPED BY CALENDAR DAY of play_date, most recent first, order within a day
     untouched (§2.4). The label comes from the ONE Discover relative-day helper
     — beyond a week it reads "Last week" then "3w ago". */
  const days = useMemo(() => {
    const map = new Map<string, CircleRoundRow[]>();
    for (const r of rounds ?? []) {
      const key = String(r.play_date ?? '').slice(0, 10);
      const list = map.get(key);
      if (list) list.push(r);
      else map.set(key, [r]);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0));
  }, [rounds]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="friends-rounds-title"
      variant="light"
      surfaceColor={A.CANVAS}
      style={{
        height: 'auto',
        maxHeight: '85dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        background: A.CANVAS,
      }}
    >
      <div style={{ padding: '10px 16px 12px', background: A.CANVAS, borderBottom: `1px solid ${A.BORDER}` }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: A.INK,
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
            color: A.INK,
          }}
        >
          {t('discover.whosBeenPlaying', "Who's been playing")}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: A.CANVAS,
        }}
      >
        {days.length > 0 ? (
          days.map(([key, list], dayIdx) => (
            <div key={key || `day-${dayIdx}`}>
              {/* STICKY DAY HEADER, carrying that day's round count (§2.1–2.2).
                  It needs the sheet canvas as its own background or rows show
                  through as they pass beneath (§4.2). */}
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '8px 16px 7px',
                  background: A.CANVAS,
                  borderBottom: `1px solid ${A.BORDER}`,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                }}
              >
                <span style={{ color: A.INK }}>
                  {key ? relativeDay(key, t as never, 'long') : ''}
                </span>
                <span className="tabular-nums" style={{ color: A.MUTE }}>
                  {list.length}{' '}
                  {list.length === 1
                    ? t('discover.friendsRounds.entrySingular', 'ROUND')
                    : t('discover.friendsRounds.entryPlural', 'ROUNDS')}
                </span>
              </div>

              {list.map((r, i) => (
                <FriendRoundRow
                  key={r.round_id}
                  row={r}
                  insight={insights.get(r.round_id)?.text ?? referenceLine(r, t)}
                  shape={holeShapes?.get(r.score_id ?? '') ?? null}
                  isLast={i === list.length - 1}
                  onPress={() => {
                    // Do NOT close the sheet — leaving it mounted beneath the
                    // scorecard lets the user return to their scroll position on
                    // dismiss. Matches TierSeeAllSheet.tsx.
                    onRowPress(r.score_id, r.user_id);
                  }}
                />
              ))}
            </div>
          ))
        ) : (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: A.MUTE, fontSize: 13 }}>
            {t('discover.friendsRounds.empty', 'No recent friend rounds yet.')}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

export default FriendsRoundsSeeAllSheet;
