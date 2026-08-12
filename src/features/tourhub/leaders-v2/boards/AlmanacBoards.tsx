/**
 * AlmanacBoards - Tour Leaders boards.
 *
 * Two anatomies, dispatched by metric SHAPE (never by name):
 *
 *   StatBoardRows - the one row grammar for every ranked-by-a-number board:
 *                   rank (+ movement on world_rank only), 26px avatar, name,
 *                   value, and the gap to the leader beneath the value.
 *   WinnersCircle - horizontal chip rail for wins / top_10. This is the one
 *                   exception and it is deliberate: those metrics are
 *                   tie-heavy (many players share 1 win), so a ranked
 *                   vertical list would be a column of identical numbers.
 *                   A rail of chips reads as a set, which is what it is.
 *                   Do not "unify" it into StatBoardRows.
 *
 * AMBER ON THIS PAGE MEANS THE ACTION, AND NOTHING ELSE. It appears twice per
 * section: the kicker and the "Full list" Action. First place is carried by
 * being first plus figure weight - it does not get a colour, a gradient, a
 * larger avatar or a ring.
 *
 * No alternating row fill and no rule between rows: the column grid is
 * load-bearing, so no cell may size to its content.
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import CountryFlag from '@/components/ui/country-flag';
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';
import { MovementFigure } from '../../_shared/movement';
import {
  FONT,
  INK,
  INK_FAINT,
  INK_MUTE,
  SLATE_50,
} from '../../_shared/tokens';
import type { LeaderCategoryDef, LeaderRow } from '../data/useLeaderCategories';
import type { LivePlayerMap } from '../../players-v2/data/useLivePlayerIds';

// -- Page-local tokens -------------------------------------------------
const HAIRLINE = 'rgba(15,23,42,0.08)';
const PAD_X = 14;
const LIVE_GREEN = '#10B981';

const KICKER: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: INK,
  lineHeight: 1,
};

const LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  lineHeight: 1,
};

interface BoardBaseProps {
  category: LeaderCategoryDef;
  liveMap: LivePlayerMap;
  onOpen: () => void;
  /** Shared tap handler: tracks then navigates. Owned by LeadersTab. */
  onPlayerTap: (playerId: string, rank: number) => void;
}

// -- Section header: kicker left, sample size right, one line ----------
function SectionHead({ overline, poolSize }: { overline: string; poolSize: number }) {
  const { t } = useTranslation('tourhub');
  return (
    <div
      style={{
        padding: `0 ${PAD_X}px 8px`,
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div style={{ ...KICKER, minWidth: 0, flex: 1 }}>{overline}</div>
      {poolSize > 0 && (
        <div style={{ ...LABEL, color: INK_FAINT, flexShrink: 0 }}>
          {t('leaders.fromN', { count: poolSize })}
        </div>
      )}
    </div>
  );
}

// -- The quiet Action, below the rows ----------------------------------
function FullListAction({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation('tourhub');
  return (
    <div style={{ padding: `8px ${PAD_X}px 0` }}>
      <button
        type="button"
        onClick={onOpen}
        style={{
          ...LABEL,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: INK,
          fontFamily: FONT,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {t('leaders.fullList')}
        <ChevronRight size={12} />
      </button>
    </div>
  );
}

// -- Shared row atoms --------------------------------------------------
function PlayerCell({
  row,
  size,
  nameSize,
  nameWeight,
  liveMap,
  onTap,
}: {
  row: LeaderRow;
  size: number;
  nameSize: number;
  nameWeight: number;
  liveMap: LivePlayerMap;
  onTap: (pid: string) => void;
}) {
  const live = liveMap[row.playerId];
  const candidates = resolvePlayerAvatarCandidates({
    name: row.name,
    photoUrl: row.photoUrl,
    tourSlug: row.tourCode ?? 'pga',
  });
  return (
    <button
      type="button"
      onClick={() => onTap(row.playerId)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        minWidth: 0,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        fontFamily: FONT,
        textAlign: 'left',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <SquircleAvatar
          size={size}
          srcCandidates={candidates}
          alt={row.name}
          userId={row.playerId}
          hairlineRing
          ringColor={LIGHT_HAIRLINE}
        />
        {live && (
          <span
            style={{
              position: 'absolute',
              top: 1,
              right: 1,
              width: Math.max(6, Math.round(size * 0.22)),
              height: Math.max(6, Math.round(size * 0.22)),
              borderRadius: '50%',
              background: LIVE_GREEN,
              boxShadow: `0 0 0 1.5px ${SLATE_50}`,
            }}
          />
        )}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          minWidth: 0,
          flex: 1,
        }}
      >
        <span
          style={{
            fontSize: nameSize,
            fontWeight: nameWeight,
            color: INK,
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.name}
        </span>
        <CountryFlag country={row.country} size="sm" />
      </div>
    </button>
  );
}

// == StatBoardRows =====================================================
// One row grammar for every ranked-by-a-number board. Top 3; the Full list
// Action is the route to more.
function StatBoardRowsInner({
  category,
  liveMap,
  onOpen,
  onPlayerTap,
  overline,
  showMovement,
}: BoardBaseProps & { overline: string; showMovement?: boolean }) {
  const { t } = useTranslation('tourhub');
  const top = category.rows.slice(0, 3);
  if (!top.length) return null;

  return (
    <section style={{ fontFamily: FONT }}>
      <SectionHead overline={overline} poolSize={category.poolSize} />
      {top.map((r, i) => (
        <div
          key={r.playerId || `s-${i}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: `11px ${PAD_X}px`,
          }}
        >
          <div
            style={{
              width: 24,
              flex: '0 0 24px',
              fontSize: 12,
              fontWeight: 500,
              color: INK_MUTE,
              fontVariantNumeric: 'tabular-nums lining-nums',
              textAlign: 'right',
            }}
          >
            {r.rankLabel}
          </div>
          {showMovement && (
            <div style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, lineHeight: 1 }}>
              <MovementFigure movement={r.movement} nullPlaceholder="none" variant="inline" />
            </div>
          )}
          <PlayerCell
            row={r}
            size={26}
            nameSize={13}
            nameWeight={600}
            liveMap={liveMap}
            onTap={(pid) => onPlayerTap(pid, r.rank)}
          />
          <div style={{ width: 96, flex: '0 0 96px', textAlign: 'right' }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: INK,
                fontVariantNumeric: 'tabular-nums lining-nums',
                lineHeight: 1,
              }}
            >
              {r.valueFormatted}
            </div>
            {/* Leader row renders nothing here: rank 1 already says it. */}
            {r.behindFormatted && (
              <div
                style={{
                  ...LABEL,
                  marginTop: 3,
                  color: INK_FAINT,
                  whiteSpace: 'nowrap',
                  fontVariantNumeric: 'tabular-nums lining-nums',
                }}
              >
                {t('leaders.behind', { gap: r.behindFormatted })}
              </div>
            )}
          </div>
        </div>
      ))}
      <FullListAction onOpen={onOpen} />
    </section>
  );
}
export const StatBoardRows = memo(StatBoardRowsInner);

// == WinnersCircle =====================================================
function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
}

function WinnersCircleInner({ category, onOpen, onPlayerTap }: BoardBaseProps) {
  const { t } = useTranslation('tourhub');
  const chips = category.rows.filter((r) => (r.value ?? 0) >= 1);
  if (!chips.length) return null;

  return (
    <section style={{ fontFamily: FONT }}>
      <SectionHead overline={t(category.shortKey)} poolSize={category.poolSize} />
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          padding: `4px ${PAD_X}px 6px`,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {chips.map((r, i) => {
          const isLeader = i === 0;
          const candidates = resolvePlayerAvatarCandidates({
            name: r.name,
            photoUrl: r.photoUrl,
            tourSlug: r.tourCode ?? 'pga',
          });
          return (
            <button
              key={r.playerId || `wc-${i}`}
              type="button"
              onClick={() => onPlayerTap(r.playerId, r.rank)}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 10px 5px 5px',
                background: '#FFFFFF',
                borderRadius: 999,
                border: `0.5px solid ${HAIRLINE}`,
                fontFamily: FONT,
                cursor: 'pointer',
              }}
            >
              <SquircleAvatar
                size={24}
                srcCandidates={candidates}
                alt={r.name}
                userId={r.playerId}
                hairlineRing
                ringColor={LIGHT_HAIRLINE}
              />
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: INK,
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                }}
              >
                {surname(r.name)}
              </span>
              <span
                style={{
                  minWidth: 20,
                  height: 20,
                  padding: '0 6px',
                  borderRadius: 999,
                  background: isLeader ? INK : 'rgba(15,23,42,0.06)',
                  color: isLeader ? '#FFFFFF' : INK,
                  fontSize: 11,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {r.valueFormatted}
              </span>
            </button>
          );
        })}
      </div>
      <FullListAction onOpen={onOpen} />
    </section>
  );
}
export const WinnersCircle = memo(WinnersCircleInner);

// -- Anatomy router ----------------------------------------------------
// Maps category key -> anatomy by metric SHAPE, not name.
export type Anatomy = 'stat' | 'winners';

export const ANATOMY_BY_KEY: Record<string, Anatomy> = {
  world_rank: 'stat',
  points: 'stat',
  earnings: 'stat',
  drive_avg: 'stat',
  drive_acc: 'stat',
  gir_pct: 'stat',
  sand_saves_pct: 'stat',
  strokes_gained_tee_green: 'stat',
  strokes_gained_putting: 'stat',
  scoring_avg: 'stat',
  putt_avg: 'stat',
  wins: 'winners',
  top_10: 'winners',
};
