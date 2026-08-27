import { GAM } from '../../../gam/tokens';
import React from 'react';
import { Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MovementCell } from './_shared/MovementCell';

/**
 * Shared column widths for champion boards. Header row, champion banner
 * and every list row use these so the 30D glyph and score digits sit in
 * fixed columns — no per-row eyeballing. Ranks column absorbs slack via
 * the 1fr name column, so trailing columns remain anchored to the right.
 */
export const CHAMPS_COL_30D_FULL = 40;
/* Widened 56 -> 62 when the header unit label went to READ 11: a long
   unit ('STROKES') measured ~56px at that size and had no slack. */
export const CHAMPS_COL_SCORE_FULL = 62;
export const CHAMPS_COL_30D_COMPACT = 40;
export const CHAMPS_COL_SCORE_COMPACT = 48;
export const CHAMPS_GRID_FULL = `24px 40px 1fr ${CHAMPS_COL_30D_FULL}px ${CHAMPS_COL_SCORE_FULL}px`;
export const CHAMPS_GRID_COMPACT = `18px 32px 1fr ${CHAMPS_COL_30D_COMPACT}px ${CHAMPS_COL_SCORE_COMPACT}px`;
export const CHAMPS_GRID_GAP_FULL = 14;
/**
 * Grid template with an OPTIONAL movement track. When a board's whole rendered
 * set has no 30d movement (every row a dash), the column collapses entirely -
 * no header label, no reserved width. Header, champion banner and list rows
 * must all be built from this one function or they fall out of alignment.
 */
export function champsGrid(compact: boolean, withMovement: boolean): string {
  const rank = compact ? '18px' : '24px';
  const avatar = compact ? '32px' : '40px';
  const mv = compact ? CHAMPS_COL_30D_COMPACT : CHAMPS_COL_30D_FULL;
  const score = compact ? CHAMPS_COL_SCORE_COMPACT : CHAMPS_COL_SCORE_FULL;
  return `${rank} ${avatar} 1fr ${withMovement ? `${mv}px ` : ''}${score}px`;
}
export const CHAMPS_GRID_GAP_COMPACT = 12;
export const CHAMPS_ROW_PADDING_X = 16;

interface ChampionsListRowProps {
  rank: number;
  name: string;
  photoUrl: string | null;
  valueDisplay: string;
  unitLabel: string;
  isSelf: boolean;
  isChampion: boolean;
  gapToChampion: string | null;
  holdDuration: string | null;
  isNew?: boolean;
  /** Member UUID — feeds SquircleAvatar's deterministic-initial fallback colour. */
  userId?: string | null;
  /** Real display name, used for fallback initials when `name` is "You". */
  fallbackName?: string;
  /** Compact variant for inline duel-card top-5 lists. */
  compact?: boolean;
  /** Backdrop theme. Default 'dark' preserves handicap drilldown look. */
  theme?: 'light' | 'dark';
  /** 30-day movement inputs. delta is null when rank_30d is null (NEW). */
  rank30d?: number | null;
  delta?: number | null;
  /** False collapses the 30d movement column (track + cell) for the whole set. */
  showMovement?: boolean;
}


export const ChampionsListRow: React.FC<ChampionsListRowProps> = ({
  rank,
  name,
  photoUrl,
  valueDisplay,
  unitLabel,
  isSelf,
  isChampion,
  gapToChampion,
  holdDuration,
  isNew = false,
  userId,
  fallbackName,
  compact = false,
  theme = 'dark',
  rank30d,
  delta,
  showMovement = true,
}) => {
  const { t } = useTranslation('courses');
  const isLight = theme === 'light';
  // "Absent from the 30d board" is treated as NEW; extend the badge trigger
  // so newcomers 8-30 days old are also flagged. Keeps the delta cell blank
  // and lets the pill carry the meaning.
  const showNew = isNew || rank30d == null;

  const rowBg = isLight
    ? (isSelf
        ? 'rgba(247,147,30,0.06)'
        : isChampion
          ? 'rgba(247,147,30,0.08)'
          : '#FFFFFF')
    : (isSelf
        ? 'rgba(255,255,255,0.06)'
        : isChampion
          ? '#20242E'
          : '#1B1E27');

  const dividerColor = isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.06)';
  const rankColor = isLight ? '#94A3B8' : 'rgba(255,255,255,0.30)';
  const nameColor = isLight ? '#0F172A' : 'rgba(255,255,255,0.96)';
  const subColor = isLight ? '#64748B' : 'rgba(255,255,255,0.55)';
  const valueColor = isLight ? '#0F172A' : 'rgba(255,255,255,0.96)';
  const avatarRing = isLight ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.22)';

  const avatarSize = 34;

  /* SquircleAvatar owns the deterministic-initial fallback and lazy image
     loading. hairlineRing + ringColor reproduces the 1px traced ring this row
     drew by hand, so champion and non-champion rows look as they did. */
  const avatar = (
    <SquircleAvatar
      size={avatarSize}
      src={photoUrl}
      alt={fallbackName || (name === 'You' ? '' : name)}
      userId={userId}
      hairlineRing
      ringColor={avatarRing}
    />
  );

  /* A gap of zero is not news — it is a shared crown. formatGapFromChampion
     returns a STRING ("+0" for higher-better, "0" for lower-better), so the
     test is numeric, not a compare against either literal. */
  const gapIsZero = gapToChampion != null && Number.parseFloat(gapToChampion) === 0;

  /* SUBLINE, NOT A COLUMN. The inline duel board (_shared/boardParts.tsx)
     prints the same gap as a paired figure beside the score because it has no
     room for the word "champion". This full-width list does, so it keeps the
     sentence. Deliberate divergence, not drift. */
  const subText = isChampion
    ? holdDuration
    : gapIsZero
      ? t('champions.jointChampion')
      : gapToChampion
        ? `${gapToChampion.replace('-', '−')} from champion`
        : '';

  const padY = compact ? '7px' : '10px';
  const nameSize = 14.5;
  const valueSize = 17;

  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: champsGrid(compact, showMovement),
        gap: compact ? CHAMPS_GRID_GAP_COMPACT : CHAMPS_GRID_GAP_FULL,
        alignItems: 'center',
        padding: `${padY} ${CHAMPS_ROW_PADDING_X}px`,
        background: rowBg,
        boxShadow: `inset 0 -0.5px 0 ${dividerColor}`,
      }}
    >
      {rank === 1 ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', lineHeight: 0 }} aria-label="Champion">
          <Crown size={15} strokeWidth={2.5} fill={GAM.GOLD} style={{ color: GAM.DEEP_AMBER, flexShrink: 0 }} />
        </div>
      ) : (
        <div
          style={{
            fontFamily: GAM.FONT_SF,
            fontSize: compact ? 13 : 15,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums lining-nums',
            color: rankColor,
            lineHeight: 1,
            textAlign: 'right',
          }}
        >
          {rank}
        </div>
      )}

      {avatar}

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: nameSize,
            fontWeight: isChampion ? 700 : 600,
            color: nameColor,
            letterSpacing: '-0.014em',
            lineHeight: 1.25,
            marginBottom: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: subColor,
            fontWeight: 500,
            letterSpacing: '-0.003em',
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {subText}
        </div>
      </div>

      {/* 30D column — fixed width, centered. Omitted when the set has no movement. */}
      {showMovement && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MovementCell delta={delta} rank30d={rank30d} theme={theme} size={compact ? 'chip' : 'row'} />
        </div>
      )}

      {/* SCORE column — fixed width, centered */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span
          style={{
            fontFamily: GAM.FONT_SF,
            fontSize: valueSize,
            fontWeight: 700,
            color: valueColor,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums lining-nums',
            lineHeight: 1,
          }}
        >
          {valueDisplay}
        </span>
      </div>
    </div>
  );
};

export default ChampionsListRow;
