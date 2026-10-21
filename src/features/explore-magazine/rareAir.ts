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
    height: 20, // 20 not 24: keeps the centred toggle clear of the eyebrow now the title row is tight
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
  rail: { gap: 10, side: 16, top: 14, bottom: 18, endSpacer: 14, fade: 30 },
  tile: {
    width: 190,
    radius: 14,
    paddingBottom: 12,
    accentHeight: 2,
    accentFloor: 0.08,
    accentCeilingRounds: 5000,
    accentFrom: 'rgba(247,147,30,0.45)',
    accentTo: 'rgba(247,147,30,0.9)',
    bodyPadding: '10px 11px 0',
    nameRow: 14,
    name: { fontSize: 9, fontWeight: 800, letterSpacing: '0.12em' },
    pill: { fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', border: 'rgba(247,147,30,0.45)', padding: '1px 5px' },
    count: { fontSize: 26, fontWeight: 800, letterSpacing: '-0.035em', marginTop: 8 },
    rate: { fontSize: 10.5, lineHeight: 14, marginTop: 8 },
    hairlineMargin: '9px 11px 0',
    latest: { padding: '8px 11px 0', gap: 8, whoSize: 11, whoLine: 15, whereSize: 10, whereLine: 13, chevron: 13 },
  },
  /** The window's events below which a rate comparison is noise. */
  compareFloor: 10,
} as const;

const T = RARE_AIR.tile;
/** Accent + body top + name + count gap/line + rate gap/two lines + hairline gap/line
 * + latest top/two lines + bottom padding + borders:
 * 2 + 10 + 14 + 8 + 26 + 8 + 28 + 9 + 1 + 8 + 15 + 13 + 12 + 2 = 156.
 */
export const RARE_AIR_TILE_HEIGHT =
  T.accentHeight + parseFloat(T.bodyPadding) + T.nameRow + T.count.marginTop + T.count.fontSize + T.rate.marginTop + 2 * T.rate.lineHeight
  + parseFloat(T.hairlineMargin) + 1 + parseFloat(T.latest.padding) + T.latest.whoLine + T.latest.whereLine + T.paddingBottom + 2;

/**
 * CB21.1 phone-first estimate, not a width-independent layout measurement.
 * The lede and you-slab line counts are unknowable before their data loads.
 * Assume a two-line lede (12.5 × 1.45 × 2 = 36.25) and a one-line slab
 * (12 × 1.45 = 17.4). Each extra lede line adds 18.125px (roughly 18px);
 * each extra slab line adds 17.4px. Fewer lines subtract the same amounts.
 * Wide viewports run tall: the measured ordinary case at 628/1280 has a
 * one-line lede, so the placeholder overestimates by about 18.125px.
 * CSS subpixel quantisation can add hundredths of a pixel to these errors.
 *
 * Every term is on screen: Section top 18 + eyebrow 11 + title gap 5
 * + title line 19 × 1.1 = 20.9 + lede gap 8 + two lede lines 36.25
 * + children gap 12 + (signed-in slab top padding 10 + line 17.4
 * + bottom padding 10 + below-slab margin 12 = 49.4)
 * + rail top padding 14 + tile 156 + rail bottom padding 18.
 * No kicker remains. Totals: 299.15 signed out, 348.55 signed in.
 * Section's external bottom margin is not part of either border-box height.
 */
export function rareAirPlaceholderHeight(signedIn: boolean): number {
  const R = RARE_AIR.rail;
  const Y = RARE_AIR.you;
  const slab = signedIn ? 2 * parseFloat(Y.padding) + Y.fontSize * Y.lineHeight + Y.marginTop : 0;
  return 18 + 11 + 5 + 19 * 1.1 + 8 + 2 * RARE_AIR.lede.fontSize * RARE_AIR.lede.lineHeight + 12 + slab + R.top + RARE_AIR_TILE_HEIGHT + R.bottom;
}

/** Rail-only stable partition; never mutate the page's totals-owning rows. */
export function rareAirRailRows(rows: FeatYearRow[]): FeatYearRow[] {
  return [...rows].sort((a, b) => Number(b.events > 0) - Number(a.events > 0));
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
