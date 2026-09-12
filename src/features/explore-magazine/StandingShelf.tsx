import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { StandoutTile } from '@/components/explore-tab-new/courseled/StandoutTile';
import { A, NUMF, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { rememberAmateurScroll } from '@/features/amateur/amateurScrollMemory';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { ShelfShell } from './ExploreShells';
import { ExploreShelf } from './ExploreShelf';
import { relativeDay } from './exploreCopy';
import { useViewerStanding, type StandingRow } from './useViewerStanding';

/**
 * "WHERE YOU STAND" (BRIEF_EXPLORE_MAGAZINE §2b, PHASE B1).
 *
 * One tile per course the viewer has played, ordered by the board's most recent
 * change, so what just moved is first. The figure is the viewer's rank ordinal
 * and the unit is the REAL field size (get_board_page's pool_members, not a
 * paged count) — open the course Champions tab and the two must agree.
 *
 * MOVEMENT IS NOT A SCORE. A figure with an arrow reports direction: green is
 * better, red is worse. That is a different scale from a to-par figure, where
 * under par is red. The movement red here is deliberately NOT the to-par red
 * (#E24B3F) — see MOVEMENT below.
 *
 * NO REFERENCE, NO CHIP. delta null (first-ever visit, or a board with nothing
 * at or before the stamp) and delta 0 (the board did not move) both draw
 * nothing. An unresolved reference is never rendered as "no change".
 *
 * EMPTY RENDERS NOTHING. A viewer with no played courses gets no shelf at all
 * in the All view — no heading over nothing. The Scores connect sentence is
 * Phase B2 and is not smuggled in here.
 */

/** §2b tile geometry — one fixed size for the whole rail. */
const TILE = { w: 206, h: 118 };
/** How many tiles the rail draws before the see-all carries the rest. */
const RENDERED = 12;

/**
 * MOVEMENT TOKENS (§2b). CONTRADICTION, REPORTED: the existing over-photo
 * movement green in StandoutTile's delta chip is #4ADE80. The brief names
 * #57E69A / #F0655A for this shelf, so those are used and the divergence is
 * filed rather than silently "corrected" either way. The red is a full step
 * away from TOPAR_UNDER_DARK #E24B3F, which is the point: a member must never
 * read a rank drop as an under-par score.
 */
const MOVEMENT = { up: '#57E69A', down: '#F0655A' } as const;

/** English ordinals. Other locales take the plain figure: a suffixed ordinal is
 *  not a translatable pattern, and an invented one is worse than a number. */
function ordinal(n: number, locale: string): string {
  if (!locale.toLowerCase().startsWith('en')) return String(n);
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function MovementChip({ delta }: { delta: number }) {
  const up = delta > 0;
  return (
    <span
      style={{
        ...NUMF,
        fontFamily: SANS,
        fontSize: 11,
        color: up ? MOVEMENT.up : MOVEMENT.down,
        whiteSpace: 'nowrap',
      }}
    >
      {up ? '\u2191' : '\u2193'}
      {Math.abs(delta)}
    </span>
  );
}

function useStandingCopy() {
  const { t, i18n } = useTranslation('courses');
  return useMemo(
    () => ({
      heading: t('amateur.stream.shelf.standing', 'Where you stand'),
      boardLabel: t('amateur.stream.standing.board', 'Lowest gross'),
      unit: (count: number) => t('amateur.stream.standing.of', 'of {{count}}', { count }),
      lastChange: (when: string) => t('amateur.stream.standing.lastChange', 'last change {{when}}', { when }),
      seeAll: (count: number) => t('amateur.stream.seeAll', 'See all {{count}}', { count }),
      you: t('amateur.stream.you', 'You'),
      locale: i18n.language || 'en',
    }),
    [t, i18n.language],
  );
}

/** The subline: board label and when the board last moved. The interpunct is
 *  composed HERE and never lives inside a locale string. */
function sublineFor(row: StandingRow, copy: ReturnType<typeof useStandingCopy>): string {
  const when = relativeDay(row.last_change_at);
  return when ? `${copy.boardLabel} \u00B7 ${copy.lastChange(when)}` : copy.boardLabel;
}

export function StandingShelf({ viewerId, pos }: { viewerId: string | undefined; pos: number }) {
  const navigate = useNavigate();
  const copy = useStandingCopy();
  const standing = useViewerStanding(viewerId);
  const [sheetOpen, setSheetOpen] = useState(false);

  const tiles = useMemo(() => standing.rows.slice(0, RENDERED), [standing.rows]);

  const open = (row: StandingRow) => {
    analyticsEvents.track('amateur_standing_tile_tapped', { rank: row.rank_now, delta: row.delta });
    rememberAmateurScroll();
    setSheetOpen(false);
    navigate(`/courses/${row.course_id}?tab=champions`);
  };

  /* A HOLD, NOT A GUESS, while the read is in flight — the rail's own shape. */
  if (!standing.isFetched) return <ShelfShell tileW={TILE.w} tileH={TILE.h} />;
  /* Unresolved (no function yet, or an unreadable read) and genuinely empty both
     render nothing. Neither is "of 0". */
  if (standing.unresolved || standing.rows.length === 0) return null;

  return (
    <>
      <ExploreShelf
        heading={copy.heading}
        /* SEE-ALL ONLY WHEN THERE IS MORE THAN IS SHOWN: the thin member with
           one course sees no control, because the total equals the rail. */
        seeAllLabel={standing.total > tiles.length ? copy.seeAll(standing.total) : null}
        onSeen={() => analyticsEvents.track('amateur_shelf_seen', { kind: 'standing', pos })}
        onSeeAll={() => {
          analyticsEvents.track('amateur_standing_see_all_opened', {});
          /* A SHEET, NOT A ROUTE: the member is coming back to the stream. */
          setSheetOpen(true);
        }}
      >
        {tiles.map((row) => (
          <div key={row.course_id} style={{ flex: `0 0 ${TILE.w}px`, width: TILE.w }}>
            <StandoutTile
              courseId={row.course_id}
              courseName={row.course_name}
              imageUrl={row.image_url}
              region={row.region ?? row.sub_country}
              photo={TILE.h}
              figure={ordinal(row.rank_now, copy.locale)}
              unit={copy.unit(row.field_now)}
              whenLabel={relativeDay(row.last_change_at) ?? ''}
              who={copy.you}
              isOwn
              subline={sublineFor(row, copy)}
              trailing={row.delta != null && row.delta !== 0 ? <MovementChip delta={row.delta} /> : undefined}
              onPress={() => open(row)}
            />
          </div>
        ))}
      </ExploreShelf>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} maxHeight="75dvh">
        <div style={{ fontFamily: SANS, padding: '4px 16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, paddingBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em', color: A.INK }}>
              {copy.heading}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: A.MUTE }}>
              {standing.total}
            </span>
          </div>
          {standing.rows.map((row) => (
            <button
              key={row.course_id}
              type="button"
              onClick={() => open(row)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                border: 0,
                background: 'transparent',
                padding: '11px 0',
                borderTop: `0.5px solid ${A.HAIR}`,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <span style={{ ...NUMF, fontSize: 14, color: A.INK, minWidth: 44 }}>
                {ordinal(row.rank_now, copy.locale)}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    color: A.INK,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.course_name ?? ''}
                </span>
                <span style={{ display: 'block', fontSize: 12, color: A.MUTE }}>
                  {copy.unit(row.field_now)}
                  {' \u00B7 '}
                  {sublineFor(row, copy)}
                </span>
              </span>
              {row.delta != null && row.delta !== 0 ? <MovementChip delta={row.delta} /> : null}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

export default StandingShelf;
