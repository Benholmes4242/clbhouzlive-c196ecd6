import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { FriendRoundRow } from './FriendRoundRow';
import { buildInsightMap, referenceLine } from './friendRoundParts';
import { relativeDay } from './courseled/discoverWhen';
import { useRoundHoleShapes } from './courseled/hooks/useRoundHoleShapes';
import {
  DEFAULT_WEEK_SCOPE,
  orderForWeek,
  usePlayedCourseIds,
  useGolfThisWeek,
  useWeekScopeCourses,
  type WeekScope,
} from './courseled/hooks/useGolfThisWeek';
import { useCourseCardMeta } from './courseled/hooks/useCourseCardMeta';
import {
  useWeekRegionCounts,
  type RegionSelection,
} from './courseled/hooks/useWeekRegionCounts';
import { WeekScopePills } from './courseled/WeekFilters';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import { TITLE as TITLE_METRICS } from '@/lib/tokens/type';
import { A } from '@/features/courses/components/holes/analytical/tokens';


/**
 * GOLF THIS WEEK — SEE ALL (BRIEF_GOLF_THIS_WEEK §5.2).
 *
 * THE FRIENDS RAIL'S SHEET, not a third pattern: same BottomSheet presentation,
 * same dismissal, same header treatment, same sticky day headers and the same
 * FriendRoundRow. The only additions the brief asks for are the scope pills,
 * which carry through so the lens can be changed inside the sheet.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
  /** THE SHEET INHERITS THE RAIL'S SCOPE AND AREA — never its own filter state. */
  scope?: WeekScope;
  onScopeChange?: (scope: WeekScope) => void;
  region?: RegionSelection | null;
  onRowPress: (scoreId: string | null, userId: string) => void;
}

export function GolfThisWeekSheet({
  open,
  onClose,
  userId,
  scope = DEFAULT_WEEK_SCOPE,
  onScopeChange,
  region = null,
  onRowPress,
}: Props) {
  const { t } = useTranslation('courses');
  const scopeCourses = useWeekScopeCourses(userId, scope);
  const roundsQuery = useGolfThisWeek(userId, scope, scopeCourses.courseIds);
  const all = roundsQuery.data ?? [];
  const courseIds = useMemo(
    () => all.map((r) => r.course_id).filter((v): v is string => !!v),
    [all],
  );
  const played = usePlayedCourseIds(userId);
  const playedSet = useMemo(() => new Set(played.ids), [played.ids]);
  const meta = useCourseCardMeta(courseIds).data;
  const regions = useWeekRegionCounts(all, meta);
  const rounds = useMemo(
    () => orderForWeek(all.filter((r) => regions.matches(r, region)), playedSet),
    [all, regions, region, playedSet],
  );
  const total = rounds.length;

  const insights = useMemo(() => buildInsightMap(rounds, t as never), [rounds, t]);
  const scoreIds = useMemo(() => rounds.map((r) => r.score_id), [rounds]);
  const holeShapes = useRoundHoleShapes(scoreIds);

  const days = useMemo(() => {
    const map = new Map<string, CircleRoundRow[]>();
    for (const r of rounds) {
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
      ariaLabelledBy="golf-this-week-title"
      variant="dark"
      surfaceColor={A.CANVAS}
      style={{
        height: 'auto',
        maxHeight: '85dvh',
        display: 'flex',
        flexDirection: 'column',
        background: A.CANVAS,
      }}
    >
      <div
        style={{
          padding: '10px 16px 12px',
          background: A.CANVAS,
          borderBottom: `1px solid ${A.BORDER}`,
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: A.MUTE,
            marginBottom: 4,
          }}
        >
          {t('discover.golfThisWeek.overline', 'THIS WEEK')} {'\u00B7'} {total}{' '}
          {total === 1
            ? t('discover.friendsRounds.entrySingular', 'ROUND')
            : t('discover.friendsRounds.entryPlural', 'ROUNDS')}
        </div>
        <div id="golf-this-week-title" style={{ ...TITLE_METRICS, color: A.INK }}>
          {t('discover.golfThisWeek.heading', 'Golf this week')}
        </div>
      </div>

      {/* THE LENS CARRIES THROUGH (§5.2). Wrapper keeps the pill row flush to
          the sheet edges and prevents the first pill being clipped by a
          non-stretching flex item. */}
      <div
        style={{
          background: A.CANVAS,
          borderBottom: `1px solid ${A.BORDER}`,
        }}
      >
        <WeekScopePills
          scope={scope}
          onChange={(s) => onScopeChange?.(s)}
          style={{ padding: '12px 16px', width: '100%', boxSizing: 'border-box' }}
        />
      </div>


      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: A.CANVAS,
        }}
      >
        {days.map(([key, list], dayIdx) => (
          <div key={key || `day-${dayIdx}`}>
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
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ color: A.MUTE }}>
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
                onPress={() => onRowPress(r.score_id, r.user_id)}
              />
            ))}
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}

export default GolfThisWeekSheet;
