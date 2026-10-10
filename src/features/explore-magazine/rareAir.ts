import { A } from '@/features/courses/components/holes/analytical/tokens';
import type { FeatKind, FeatYearRow } from './useFeatsWindow';

/**
 * RARE AIR — every size, colour and spacing value the section writes lives
 * here, named for what it is. The shared Rail, RAIL_CARD and medal tokens are
 * not this section's and are not read.
 */
export const RARE_AIR = {
  toggle: {
    gap: 3,
    padding: 3,
    height: 24,
    sidePadding: 10,
    fontSize: 11.5,
    background: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.10)',
    fill: 'rgba(255,255,255,0.12)',
  },
  lede: { fontSize: 12.5, lineHeight: 1.45 },
  you: {
    marginTop: 12,
    radius: 11,
    background: 'rgba(255,255,255,0.05)',
    bar: 2.5,
    padding: '10px 12px',
    fontSize: 12,
    lineHeight: 1.45,
  },
  label: { fontSize: 9.5, fontWeight: 800, letterSpacing: '0.11em', padding: '2px 16px 0', lineHeight: 13 },
  rail: { gap: 10, side: 16, top: 12, bottom: 18, endSpacer: 14, fade: 30 },
  tile: {
    width: 244,
    radius: 14,
    paddingBottom: 13,
    accentHeight: 2,
    accentFloor: 0.08,
    accentCeilingRounds: 5000,
    accentFrom: 'rgba(247,147,30,0.45)',
    accentTo: 'rgba(247,147,30,0.9)',
    bodyPadding: '12px 13px 0',
    nameRow: 14,
    name: { fontSize: 10, fontWeight: 800, letterSpacing: '0.12em' },
    pill: { fontSize: 8.5, fontWeight: 800, letterSpacing: '0.1em', border: 'rgba(247,147,30,0.45)', padding: '1px 5px' },
    count: { fontSize: 34, fontWeight: 800, letterSpacing: '-0.035em', marginTop: 11 },
    rate: { fontSize: 11.5, lineHeight: 15, marginTop: 8 },
    hairlineMargin: '11px 13px 0',
    latest: { padding: '10px 13px 0', gap: 8, whoSize: 12, whoLine: 16, whereSize: 11, whereLine: 14, chevron: 13 },
  },
  /** The window's events below which a rate comparison is noise. */
  compareFloor: 10,
} as const;

const T = RARE_AIR.tile;
/** 2 + 12 + 14 + 11 + 34 + 8 + 30 + 11 + 1 + 10 + 16 + 14 + 13 + 2 (borders) = 178. */
export const RARE_AIR_TILE_HEIGHT =
  T.accentHeight + 12 + T.nameRow + T.count.marginTop + T.count.fontSize + T.rate.marginTop + 2 * T.rate.lineHeight
  + 11 + 1 + 10 + T.latest.whoLine + T.latest.whereLine + T.paddingBottom + 2;

/**
 * Placeholder = section top 24 + eyebrow 13 + 5 + title 23 + lede 8 + 18
 * + children gap 12 + (you slab 38 when signed in) + label 13 + rail 12 + tile + 18.
 */
export function rareAirPlaceholderHeight(signedIn: boolean): number {
  const R = RARE_AIR.rail;
  const slab = signedIn ? 10 + Math.round(RARE_AIR.you.fontSize * RARE_AIR.you.lineHeight) + 10 + RARE_AIR.you.marginTop : 0;
  return 24 + 13 + 5 + 23 + 8 + 18 + 12 + slab + RARE_AIR.label.lineHeight + R.top + RARE_AIR_TILE_HEIGHT + R.bottom
    - (signedIn ? RARE_AIR.you.marginTop : 0);
}

/** Rounds per occurrence, from the ALL-TIME row. null when there are no events. */
export function roundsPerOccurrence(all: FeatYearRow | undefined): number | null {
  if (!all || all.events <= 0) return null;
  return all.denominator_unit === 'holes' ? all.total_holes / all.events / 18 : all.total_rounds / all.events;
}

/** Share of the rarity bar's track: log10(rpo)/log10(5000), floored at 0.08; 0 = no fill. */
export function rarityShare(all: FeatYearRow | undefined): number {
  const rpo = roundsPerOccurrence(all);
  if (rpo == null) return 0;
  const raw = Math.log10(Math.max(rpo, 1)) / Math.log10(T.accentCeilingRounds);
  return Math.min(1, Math.max(T.accentFloor, raw));
}

export type FeatComparison = { kind: 'commoner' | 'rarer'; pct: number } | { kind: 'tooFew' } | null;

/** Year view only: the window's rate against the all-time rate, same unit. */
export function compareRates(win: FeatYearRow | undefined, all: FeatYearRow | undefined): FeatComparison {
  if (!win || !all) return null;
  if (win.events < RARE_AIR.compareFloor) return { kind: 'tooFew' };
  if (all.events <= 0 || win.denominator <= 0 || all.denominator <= 0) return null;
  const ratio = (win.events / win.denominator) / (all.events / all.denominator);
  const pct = Math.round(Math.abs(ratio - 1) * 100);
  if (pct === 0) return null;
  return ratio > 1 ? { kind: 'commoner', pct } : { kind: 'rarer', pct };
}

export const FEAT_I18N: Record<FeatKind, string> = {
  ace: 'ace',
  albatross: 'albatross',
  eagle: 'eagle',
  clean_card: 'cleanCard',
};

export { A };
