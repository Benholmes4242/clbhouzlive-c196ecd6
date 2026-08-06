import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useFriendsLatestRounds, type FriendRoundRow } from '@/hooks/gam/useFriendsLatestRounds';
import { featChipBase, RoundFeatChips } from '../RoundFeatChips';
import { CourseImageFallback } from './CourseImageFallback';
import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import { countNewSince, isNewSince, useReportNewCount } from './newSince';
import {
  A,
  CARD_SHELL,
  Eyebrow,
  NEW_CARD_RING,
  ImageChip,
  InkAction,
  NUMF,
  SANS,
  SCRIM_SOFT,
} from './tokens';

/**
 * Section 1 — WHERE YOUR FRIENDS PLAYED (BRIEF, section 1).
 *
 * A horizontal rail: a week of heavy play grows sideways, never down. One card
 * per friend-round, newest first, capped at ten. The card is the course; the
 * body row carries the friend, the canonical feat chips and the gross.
 *
 * A hole in one puts the GOLD ring on the when-chip — the only gold on the card.
 * No friends or no rounds: the section does not render at all.
 */

const RAIL_CAP = 10;

interface Props {
  userId: string | undefined;
  /** Last-seen stamp for the new-since markers; null marks nothing. */
  lastSeen?: number | null;
  onCardPress: (row: FriendRoundRow) => void;
  onSeeAll: () => void;
}

function relativeDay(iso: string, t: (k: string, o?: any) => string): string {
  const then = new Date(`${iso}T12:00:00`).getTime();
  const days = Math.round((Date.now() - then) / 86_400_000);
  if (days <= 0) return t('discover.when.today', 'Today');
  if (days === 1) return t('discover.when.yesterday', 'Yesterday');
  if (days < 7) {
    return new Date(then).toLocaleDateString(undefined, { weekday: 'short' });
  }
  if (days < 14) return t('discover.when.lastWeek', 'Last week');
  return t('discover.when.weeksAgo', { defaultValue: '{{count}}w ago', count: Math.floor(days / 7) });
}

export function FriendsPlayedRail({ userId, lastSeen = null, onCardPress, onSeeAll }: Props) {
  const { t } = useTranslation('courses');
  const { data: rounds } = useFriendsLatestRounds(userId, {
    limit: RAIL_CAP,
    allowMultiplePerFriend: true,
  });

  const rows = useMemo(() => (rounds ?? []).slice(0, RAIL_CAP), [rounds]);
  const courseIds = useMemo(
    () => rows.map((r) => r.course_id).filter((v): v is string => !!v),
    [rows],
  );
  const { data: meta } = useCourseCardMeta(courseIds);

  // NEW SINCE: the rail already orders by play_date, so play_date is the
  // arrival stamp this section compares.
  const newCount = countNewSince(rows, (r) => r.play_date, lastSeen);
  useReportNewCount('friends', newCount);

  if (rows.length === 0) return null;

  return (
    <section>
      <Eyebrow
        dot={newCount > 0}
        aside={<InkAction onClick={onSeeAll}>{t('discover.seeAll', 'See all')}</InkAction>}
      >
        {t('discover.friendsPlayed', 'Where your friends played')}
      </Eyebrow>

      <div
        className="scrollbar-hide"
        style={{ display: 'flex', alignItems: 'stretch', gap: 10, overflowX: 'auto' }}
      >
        {rows.map((r) => {
          const m = r.course_id ? meta?.get(r.course_id) : undefined;
          const hasAce = r.feats.some((f) => f.key === 'holes_in_one');
          const isNew = isNewSince(r.play_date, lastSeen);
          return (
            <button
              key={r.round_id}
              type="button"
              onClick={() => onCardPress(r)}
              style={{
                ...CARD_SHELL,
                ...(isNew ? NEW_CARD_RING : null),
                width: 224,
                flexShrink: 0,
                padding: 0,
                textAlign: 'left',
                fontFamily: SANS,
                cursor: 'pointer',
              }}
            >
              <CourseImageFallback
                courseId={r.course_id}
                courseName={m?.name ?? r.course_name}
                imageUrl={m?.imageUrl}
                style={{ height: 99 }}
              >
                <div style={{ position: 'absolute', inset: 0, background: SCRIM_SOFT }} />
                <ImageChip gold={hasAce}>{relativeDay(r.play_date, t)}</ImageChip>
                <div
                  style={{
                    position: 'absolute',
                    left: 10,
                    right: 10,
                    bottom: 7,
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: '#fff',
                      letterSpacing: '-0.015em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m?.name ?? r.course_name ?? t('discover.unknownCourse', 'Course')}
                  </span>
                </div>
              </CourseImageFallback>


              <div
                style={{
                  padding: '9px 11px',
                  minHeight: 52,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                }}
              >
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: A.INK,
                      letterSpacing: '-0.005em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.15,
                    }}
                  >
                    {r.display_name}
                  </span>
                  {(r.feats.length > 0 ||
                    (r.hcp_delta != null && Math.abs(r.hcp_delta) >= 0.05)) && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {r.hcp_delta != null && Math.abs(r.hcp_delta) >= 0.05 && (
                        <span
                          style={{
                            ...featChipBase,
                            background:
                              r.hcp_delta < 0 ? 'rgba(14,138,87,0.10)' : 'rgba(210,34,45,0.10)',
                            color: r.hcp_delta < 0 ? '#0e8a57' : '#D2222D',
                          }}
                        >
                          {r.hcp_delta < 0 ? '\u2193' : '\u2191'}{' '}
                          {Math.abs(r.hcp_delta).toFixed(1)}
                        </span>
                      )}
                      {r.feats.length > 0 && <RoundFeatChips feats={r.feats} maxChips={1} />}
                    </span>
                  )}
                </div>

                {r.gross != null && (
                  <span
                    style={{
                      ...NUMF,
                      flexShrink: 0,
                      fontSize: 15,
                      color: A.INK,
                      lineHeight: 1.15,
                    }}
                  >
                    {r.gross}
                  </span>
                )}

              </div>

            </button>
          );
        })}
      </div>
    </section>
  );
}

export default FriendsPlayedRail;
