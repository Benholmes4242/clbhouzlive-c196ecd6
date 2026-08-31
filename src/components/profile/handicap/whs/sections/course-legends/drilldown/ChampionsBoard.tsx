/**
 * BRIEF_CHAMPIONS_BOARD — one category, one ranked board, a picker above it.
 *
 * What transfers from the tour board: the tight tabular row, fixed column
 * widths, tabular figures, a right-aligned headline figure, the under-par
 * colour law, position numerals with tie handling (1, T3, T3, 5) and the
 * viewer's own row in amber.
 *
 * What does not: PER-ROUND COLUMNS (a course record is ONE round, there is
 * nothing to put in R1-R4) and MOVEMENT on all-time categories (nothing moves
 * for months, so the column would be a column of dashes — it is ABSENT, not
 * empty, and the test is the category's window, never its name).
 *
 * The picker shows every category at once, each pill carrying its holder's
 * mark, because on a five-record board a picker that hides its options makes
 * four records invisible. An unclaimed category is shown DISABLED, not hidden:
 * an unclaimed record is an invitation.
 *
 * Reuses BoardAvatar from _shared/boardParts. No SQL, no query change.
 */
import React, { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { A, LABEL, NUM, SANS } from '@/features/courses/components/holes/analytical/tokens';
import {
  ChampionsRow,
  ChampionsColumnHeader,
  categoryWindowDays as sharedCategoryWindowDays,
  hasToPar,
  positionsFor,
} from './_shared/boardParts';
import type { LegendCategory, LegendWindow } from '@/lib/gam/types';

export interface ChampionsBoardCategory {
  key: LegendCategory;
  label: string;
  short: string;
  icon: LucideIcon;
  unit: string;
}

export interface ChampionsBoardRow {
  rank: number;
  name: string;
  photoUrl: string | null;
  value: number;
  valueDisplay: string;
  attained_at: string;
  isSelf: boolean;
  userId?: string | null;
  rank30d?: number | null;
  delta?: number | null;
}

interface Props {
  categories: ChampionsBoardCategory[];
  grouped: Map<LegendCategory, { rows: ChampionsBoardRow[]; total: number }>;
  window: LegendWindow;
  /** Course par — the only way a gross mark can state a to-par. */
  coursePar: number | null;
  /** Rows shown before the viewer is pinned at the foot. */
  visibleRows?: number;
  onOpenFull?: (cat: LegendCategory) => void;
}

/** 90-DAY vs ALL-TIME is read from the category's window, not its name. */
export function categoryWindowDays(cat: LegendCategory): number | null {
  return sharedCategoryWindowDays(cat);
}


export const ChampionsBoard: React.FC<Props> = ({
  categories,
  grouped,
  window: legendWindow,
  coursePar,
  visibleRows = 10,
  onOpenFull,
}) => {
  const { t } = useTranslation('courses');

  const defaultCat = useMemo(() => {
    const gross = categories.find(
      (c) => c.key === `lowest_gross_${legendWindow === '90d' ? '90d' : 'all_time'}`,
    );
    const claimed = categories.find((c) => (grouped.get(c.key)?.rows.length ?? 0) > 0);
    return (gross && (grouped.get(gross.key)?.rows.length ?? 0) > 0 ? gross : claimed ?? gross ?? categories[0])
      ?.key;
  }, [categories, grouped, legendWindow]);

  const [selected, setSelected] = useState<LegendCategory | undefined>(defaultCat);
  const active = categories.find((c) => c.key === (selected ?? defaultCat)) ?? categories[0];
  if (!active) return null;

  const entry = grouped.get(active.key);
  const rows = entry?.rows ?? [];
  const positions = positionsFor(rows);
  const showMovement = categoryWindowDays(active.key) != null;
  const showToPar = hasToPar(active.key) && coursePar != null;

  const shown = rows.slice(0, visibleRows);
  const selfIndex = rows.findIndex((r) => r.isSelf);
  const pinSelf = selfIndex >= visibleRows;

  const windowLabel =
    legendWindow === '90d' ? t('champions.board.last90Days') : t('champions.board.allTime');

  const roundsTotal = useMemo(() => {
    const roundsCat = categories.find((c) => String(c.key).startsWith('most_rounds'));
    const r = roundsCat ? grouped.get(roundsCat.key)?.rows ?? [] : [];
    return r.reduce((s, x) => s + (x.value || 0), 0);
  }, [categories, grouped]);

  const renderRow = (row: ChampionsBoardRow, pos: string, first: boolean, pinned = false) => (
    <ChampionsRow
      key={`${row.userId ?? row.name}-${pos}-${pinned ? 'pin' : 'row'}`}
      row={row}
      pos={pos}
      showMovement={showMovement}
      showToPar={showToPar}
      coursePar={coursePar}
      rule={!first}
    />
  );

  return (
    <div style={{ background: A.PANEL, fontFamily: SANS, paddingBottom: 4 }}>
      {/* PICKER — every category at once, each pill carrying its holder's mark. */}
      <div
        className="champions-board-pills"
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          padding: '14px 16px 12px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <style>{`.champions-board-pills::-webkit-scrollbar{display:none}`}</style>
        {categories.map((cat) => {
          const catRows = grouped.get(cat.key)?.rows ?? [];
          const unclaimed = catRows.length === 0;
          const isActive = cat.key === active.key;
          return (
            <button
              key={cat.key}
              type="button"
              disabled={unclaimed}
              onClick={() => !unclaimed && setSelected(cat.key)}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 11px',
                borderRadius: 999,
                border: `1px solid ${isActive ? A.INK : A.BORDER}`,
                background: isActive ? A.INK : 'transparent',
                color: isActive ? A.CANVAS : unclaimed ? A.DIM : A.MUTE,
                fontFamily: SANS,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.01em',
                whiteSpace: 'nowrap',
                cursor: unclaimed ? 'default' : 'pointer',
                opacity: unclaimed ? 0.55 : 1,
              }}
            >
              {cat.short}
              <span
                style={{
                  ...NUM,
                  fontSize: 11,
                  fontWeight: 700,
                  color: isActive ? A.CANVAS : unclaimed ? A.DIM : A.INK,
                }}
              >
                {unclaimed ? t('champions.board.unclaimedShort') : catRows[0].valueDisplay}
              </span>
            </button>
          );
        })}
      </div>

      {/* MASTHEAD + STAT RAIL. The window is load-bearing: a member must know
          whether this is the all-time record or the last three months. */}
      <div style={{ padding: '0 16px 10px' }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: A.INK,
          }}
        >
          {active.label}
        </div>
        <div
          style={{
            ...LABEL,
            marginTop: 5,
            color: A.DIM,
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          <span>{t('champions.board.members', { count: entry?.total ?? rows.length })}</span>
          {roundsTotal > 0 && <span>{t('champions.board.rounds', { count: roundsTotal })}</span>}
          <span style={{ color: A.MUTE }}>{windowLabel}</span>
        </div>
      </div>

      {/* COLUMN HEADERS. POS is centred over the numerals alone; movement,
          where present, is an unheaded column outside it. */}
      <ChampionsColumnHeader
        showMovement={showMovement}
        posLabel={t('champions.board.pos')}
        memberLabel={t('champions.board.member')}
        whenLabel={t('champions.board.when')}
        markLabel={t('champions.board.mark')}
      />

      {shown.map((row, i) => renderRow(row, positions[i], i === 0))}

      {/* The viewer, pinned at the foot with their REAL position and name. */}
      {pinSelf && (
        <div style={{ borderTop: `1px solid ${A.HAIRLINE}` }}>
          {renderRow(rows[selfIndex], positions[selfIndex], true, true)}
        </div>
      )}

      {onOpenFull && rows.length > shown.length && (
        <button
          type="button"
          onClick={() => onOpenFull(active.key)}
          style={{
            width: '100%',
            padding: '11px 16px',
            background: 'transparent',
            border: 'none',
            borderTop: `1px solid ${A.HAIRLINE}`,
            textAlign: 'left',
            ...LABEL,
            color: A.AMBER,
            cursor: 'pointer',
          }}
        >
          {t('champions.board.seeAll', { count: entry?.total ?? rows.length })}
        </button>
      )}
    </div>
  );
};

export default ChampionsBoard;
