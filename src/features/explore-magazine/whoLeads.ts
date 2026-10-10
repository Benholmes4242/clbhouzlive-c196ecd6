import { standingOrdinal } from './ordinal';

/**
 * WHO LEADS WHAT — every size and spacing value the section writes lives here,
 * named for what it is. Colours are read from the analytical `A` ramp at the
 * call site; this module declares none. The window toggle is Rare air's
 * (RARE_AIR.toggle), read rather than copied.
 */
export const WHO_LEADS = {
  rail: { gap: 10, top: 12, bottom: 18 },
  tile: {
    width: 244,
    radius: 14,
    padTop: 12,
    padSide: 13,
    padBottom: 13,
    name: { fontSize: 10, lineHeight: 13, fontWeight: 800, letterSpacing: '0.12em' },
    figure: { fontSize: 34, fontWeight: 800, letterSpacing: '-0.035em', marginTop: 11 },
    leader: { marginTop: 10, avatar: 20, gap: 7, fontSize: 12, lineHeight: 16, fontWeight: 600 },
    margin: { marginTop: 6, fontSize: 11, lineHeight: 14 },
    rule: { marginTop: 11, height: 1 },
    you: { marginTop: 10, fontSize: 11.5, lineHeight: 16, figureWeight: 700 },
  },
  empty: { fontSize: 12.5, lineHeight: 1.45 },
} as const;

const T = WHO_LEADS.tile;

/**
 * Tile height. Signed in: 1 border + 12 pad + 13 label + 11 + 34 figure
 * + 10 + 20 leader row + 6 + 14 margin line + 11 + 1 rule + 10 + 16 you line
 * + 13 pad + 1 border = 173. Signed out drops the rule and the you line
 * (11 + 1 + 10 + 16 = 38): 135.
 */
export function whoLeadsTileHeight(signedIn: boolean): number {
  const head = 1 + T.padTop + T.name.lineHeight + T.figure.marginTop + T.figure.fontSize
    + T.leader.marginTop + T.leader.avatar + T.margin.marginTop + T.margin.lineHeight;
  const foot = signedIn ? T.rule.marginTop + T.rule.height + T.you.marginTop + T.you.lineHeight : 0;
  return head + foot + T.padBottom + 1;
}

/**
 * Placeholder = section top 24 + eyebrow 13 + 5 + title 23 + children gap 12
 * + rail top 12 + tile + rail bottom 18 = 107 + tile:
 * 280 signed in, 242 signed out.
 */
export function whoLeadsPlaceholderHeight(signedIn: boolean): number {
  return 24 + 13 + 5 + 23 + 12 + WHO_LEADS.rail.top + whoLeadsTileHeight(signedIn) + WHO_LEADS.rail.bottom;
}

export type WhoLeadsYou =
  | { kind: 'lead' }
  | { kind: 'on'; pos: string }
  | { kind: 'absent' };

/**
 * The you line's state from the metric's own board (which holds the whole
 * field). Leading = the viewer's row is at position 1, tie or not. A tied
 * position carries the page's tie treatment, a "T" prefix (CompactRow).
 */
export function whoLeadsYou(
  rows: ReadonlyArray<{ pos: number; is_tie: boolean; is_viewer: boolean | null; user_id: string }>,
  viewerId: string,
  locale: string,
): WhoLeadsYou {
  const mine = rows.find((r) => r.is_viewer) ?? rows.find((r) => r.user_id === viewerId);
  if (!mine) return { kind: 'absent' };
  if (mine.pos === 1) return { kind: 'lead' };
  const ord = standingOrdinal(mine.pos, locale);
  return { kind: 'on', pos: mine.is_tie ? `T${ord}` : ord };
}
