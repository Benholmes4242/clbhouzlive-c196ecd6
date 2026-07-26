import { useMemo } from 'react';
import { StatRow, type StatRowChip } from './StatRow';
import { LedgerSubline } from './PinIcon';
import { RoundFeatChips } from './RoundFeatChips';
import { deriveRoundFeats } from '@/lib/gam/roundFeats';

import { rowToPar, toParText, type FeatRow, type FeatTier, type RecordsMode } from './hooks/useRegionFeats';
import { TOPAR_UNDER_LIGHT } from '@/features/tourhub/_shared/tokens';

function formatHolderName(raw?: string | null): string {
  const s = (raw ?? '').trim();
  if (!s) return 'A golfer';
  if (s.includes(', ')) {
    const [before, after] = s.split(', ').map((x) => x.trim());
    if (before && after) return `${after} ${before}`;
  }
  return s;
}

function relDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startToday - that) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

interface Props {
  row: FeatRow;
  tier: FeatTier;
  onTap?: () => void;
  index?: number;
  medals?: number | null;
  mode?: RecordsMode;
  bestToPar?: number | null;
  maxCount?: number | null;
  isLast?: boolean;
  /** Forwarded to StatRow. Default preserves legacy sizing. */
  density?: 'default' | 'compact';
}

/**
 * FeatListRow — delegates to the canonical StatRow for the TierSeeAllSheet.
 * Preserves per-tier semantics (to-par red, ACE/ALBATROSS chip, rank-1 watermark).
 */
export function FeatListRow({ row, tier, onTap, index = 0, mode, isLast = false, density }: Props) {
  const holder = useMemo(() => formatHolderName(row.holder_name), [row.holder_name]);
  const rank = index + 1;
  const isRecordsRow = tier === 'records';
  const isBirdieHauls = tier === 'birdie_hauls';
  const isLegendary = tier === 'legendary';
  const isEagles = tier === 'eagles';
  const isStableford = row.category === 'best_stableford_all_time';
  const d = isRecordsRow ? rowToPar(row) : null;
  const showToParPrimary = isRecordsRow && d != null && !isStableford;
  const when = relDate(row.play_date ?? row.attained_at ?? null);

  const { value, label, statColor } = useMemo(() => {
    const digits = (s: string | null | undefined): string => {
      const m = (s ?? '').match(/\d+/);
      return m ? m[0] : '';
    };
    if (tier === 'records') {
      if (showToParPrimary && d != null) {
        return {
          value: toParText(d),
          label: 'TO PAR',
          statColor: d < 0 ? TOPAR_UNDER_LIGHT : undefined,
        };
      }
      const v = row.value != null ? String(row.value) : digits(row.feat_value);
      return { value: v || '—', label: 'GROSS', statColor: undefined as string | undefined };
    }
    if (tier === 'eagles' || tier === 'legendary') {
      const v = digits(row.feat_value) || (row.value != null ? String(row.value) : '');
      return { value: v || '—', label: 'HOLE', statColor: undefined as string | undefined };
    }
    // birdie_hauls
    const v = (row.feat_value ?? (row.value != null ? String(row.value) : '')).replace(/[^\d.]/g, '');
    return { value: v || '—', label: 'BIRDIES', statColor: undefined as string | undefined };
  }, [tier, row.feat_value, row.value, showToParPrimary, d]);

  // Legendary chip (ACE / ALBATROSS) replaces the stat value.
  const legendaryChip: StatRowChip | undefined =
    isLegendary && (row.feat_type === 'ace' || row.feat_type === 'albatross')
      ? {
          label: row.feat_type === 'ace' ? 'HOLE IN ONE' : 'ALBATROSS',
          tone: row.feat_type === 'ace' ? 'ace' : 'albatross',
        }
      : undefined;

  // Rank number asserts "ranked #N by achievement" — only correct on all-time
  // leaderboards. Records are recency-only; birdie hauls rank only in alltime.
  const isRanked = isBirdieHauls && mode === 'alltime';
  const showWatermark = isRanked && rank === 1;

  // Subline: course name; age moves to the name line.
  const showDate = !!when && !isRanked;
  const subline = <LedgerSubline courseName={row.course_name} />;

  // Record book only: feat chips from the stats joined into the cached payload.
  // Rows without stats simply render no chip row.
  const feats = useMemo(
    () => (isRecordsRow ? deriveRoundFeats(row) : []),
    [isRecordsRow, row],
  );


  return (
    <StatRow
      rank={isRanked ? rank : undefined}
      avatarUrl={row.holder_avatar}
      avatarUserId={row.user_id ?? null}
      name={holder}
      nameMeta={when || undefined}
      subline={subline}
      featChips={feats.length > 0 ? <RoundFeatChips feats={feats} /> : undefined}
      statValue={legendaryChip ? undefined : value}
      statLabel={legendaryChip ? undefined : label}
      statColor={statColor}
      chip={legendaryChip}
      showWatermark={showWatermark}
      isLast={isLast}
      onPress={onTap}
      density={density}
    />
  );
}

export default FeatListRow;
