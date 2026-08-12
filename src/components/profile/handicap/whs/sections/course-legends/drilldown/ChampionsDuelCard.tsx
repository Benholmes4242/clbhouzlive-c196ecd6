/**
 * ChampionsBoardPanel (file kept as ChampionsDuelCard for callsite stability).
 *
 * The duel graphic is gone: two avatars either side of a crossed-swords icon
 * over a track with more faces on it was an illustration of a rivalry.
 * CHAMPION / YOU / TO THE CROWN is the rivalry, and the gap - the single most
 * useful number on the board - is now a headline figure rather than 12px grey
 * under a bar.
 *
 * One Panel per category: three-up, gauge, rows, footer action.
 * Amber means the viewing member and nothing else.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';
import type { LegendCategory } from '@/lib/gam/types';
import { chaseProgress } from './_shared/duelTension';
import { formatGapFromChampion } from './_shared/helpers';
import { formatLegendGap } from '@/lib/gam/visuals';
import { ProBenchmarkBand } from './ProBenchmarkBand';
import type { ProProfile, ProBandBase } from './_shared/proBenchmark';
import {
  A,
  Panel,
  StatRow,
  Action,
  SANS,
} from '@/features/courses/components/holes/analytical/tokens';
import {
  BoardHeaderRow,
  BoardRow,
  CrownGauge,
  ordinalSuffix,
} from './_shared/boardParts';

export interface DuelRow {
  rank: number;
  name: string;
  photoUrl: string | null;
  valueDisplay: string;
  value: number;
  isSelf: boolean;
  gapToChampion: string | null;
  userId?: string | null;
  /** 30-day movement inputs. */
  rank30d?: number | null;
  delta?: number | null;
}

interface ChampionsDuelCardProps {
  category: LegendCategory;
  categoryLabel: string;
  categoryIcon: LucideIcon;
  rows: DuelRow[];
  yourRank: number | null;
  holdDuration: string;
  totalCount: number;
  onFullLeaderboardTap: () => void;
  /** Column-header unit for the value column, e.g. "Gross", "Eagles". */
  unitLabel?: string;
  proBenchmark?: {
    pro: ProProfile;
    base: ProBandBase;
    value: string;
    sub: string;
    chaseLine?: string;
  } | null;
  /** Accepted for signature compat. This tab is light-only. */
  theme?: 'light' | 'dark';
  /** Accepted for signature compat; the analytical treatment has no bands. */
  banded?: boolean;
  /** Optional title override — replaces the category label in the panel header. */
  titleOverride?: string;
  /** Optional CTA sentence rendered beneath the rows. */
  chaseCta?: string;
  /** Accepted for signature compat; panels have no top hairline. */
  suppressTopBorder?: boolean;
}

const CAPTION: React.CSSProperties = {
  fontSize: 12.5,
  lineHeight: 1.5,
  color: A.MUTE,
  margin: '12px 0 0',
};

function firstName(name: string): string {
  if (!name) return name;
  return name.split(' ')[0];
}

/** Unit word only, taken from the shared gap formatter ("6 strokes" → "strokes"). */
function gapUnitWord(cat: LegendCategory, gap: number): string {
  return formatLegendGap(cat, gap).replace(/^[\d.,+\-\u2212]+\s*/, '');
}

export const ChampionsDuelCard: React.FC<ChampionsDuelCardProps> = ({
  category,
  categoryLabel,
  rows,
  yourRank,
  totalCount,
  onFullLeaderboardTap,
  unitLabel,
  proBenchmark,
  titleOverride,
  chaseCta,
}) => {
  const { t } = useTranslation('courses');

  const champion = rows[0] ?? null;
  const selfRow = rows.find((r) => r.isSelf) ?? null;
  const standsAlone = rows.length === 1;
  const topRows = rows.slice(0, 5);

  const gapRaw = selfRow && champion ? selfRow.value - champion.value : null;
  const level = selfRow != null && champion != null && Math.abs(gapRaw ?? 0) < 0.005;

  // Direction: chaseProgress is category-aware (count categories use the
  // ratio, value categories use the gap closing toward the champion), so a
  // gross record of 71 against 65 reads as a partial gauge, never 109%.
  const pct =
    selfRow && champion ? chaseProgress(category, champion.value, selfRow.value) * 100 : 0;

  // The gap string comes from the shared helper — never computed inline here.
  const gapSigned =
    selfRow && champion ? formatGapFromChampion(category, selfRow.value, champion.value) : null;
  const gapFigure = gapSigned ? gapSigned.replace(/^[+\-\u2212]/, '') : '';
  const gapUnit = gapRaw != null ? gapUnitWord(category, gapRaw) : '';

  const thirdCell = level
    ? { label: t('champions.toTheCrown'), value: t('champions.level'), tone: A.AMBER }
    : selfRow
      ? { label: t('champions.toTheCrown'), value: gapFigure, sub: gapUnit }
      : {
          label: t('champions.toTheCrown'),
          value: (
            <span style={{ fontSize: 12, fontWeight: 600, color: A.MUTE, letterSpacing: 0 }}>
              {t('champions.entryRequirement')}
            </span>
          ),
        };

  return (
    <div style={{ padding: '0 14px 12px', fontFamily: SANS }}>
      <Panel
        title={titleOverride ?? categoryLabel}
        aside={
          yourRank != null
            ? t('champions.youreNth', { rank: yourRank, suffix: ordinalSuffix(yourRank) })
            : undefined
        }
      >
        <StatRow
          items={[
            {
              label: t('champions.champion'),
              value: champion?.valueDisplay ?? '',
              sub: champion ? firstName(champion.name) : undefined,
            },
            {
              label: t('champions.you'),
              value: selfRow?.valueDisplay ?? '',
              tone: A.AMBER,
              sub: selfRow ? unitLabel || undefined : undefined,
            },
            thirdCell,
          ]}
        />

        {selfRow && champion && (
          <CrownGauge
            pct={pct}
            level={level}
            youLabel={t('champions.you')}
            crownLabel={t('champions.crown')}
          />
        )}

        <div style={{ marginTop: selfRow && champion ? 14 : 18 }}>
          <BoardHeaderRow
            rankLabel={t('champions.colRank')}
            memberLabel={t('champions.colMember')}
            movementLabel={t('champions.col30d')}
            unitLabel={unitLabel || categoryLabel}
          />
          {topRows.map((r, i) => (
            <BoardRow
              key={`${r.rank}-${r.name}`}
              rule={i > 0}
              row={{
                rank: r.rank,
                name: r.name,
                photoUrl: r.photoUrl,
                valueDisplay: r.valueDisplay,
                isSelf: r.isSelf,
                rank30d: r.rank30d,
                delta: r.delta,
              }}
            />
          ))}
        </div>

        {standsAlone && <p style={CAPTION}>{t('champions.standsAlone')}</p>}
        {!standsAlone && chaseCta && <p style={{ ...CAPTION, fontVariantNumeric: 'tabular-nums lining-nums' }}>{chaseCta}</p>}

        <Action
          label={
            totalCount > topRows.length
              ? `${t('champions.fullLeaderboard')} \u00B7 ${totalCount}`
              : t('champions.fullLeaderboard')
          }
          onClick={onFullLeaderboardTap}
          style={{ width: '100%', fontVariantNumeric: 'tabular-nums lining-nums', marginTop: 6 }}
        />

        {proBenchmark && (
          <ProBenchmarkBand
            pro={proBenchmark.pro}
            base={proBenchmark.base}
            value={proBenchmark.value}
            sub={proBenchmark.sub}
          />
        )}
      </Panel>
    </div>
  );
};

export default ChampionsDuelCard;
