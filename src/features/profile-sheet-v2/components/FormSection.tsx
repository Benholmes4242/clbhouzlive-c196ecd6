/**
 * ProfileSheetV2 · "Last five rounds" — the lower half of the merged
 * "How you're playing" card (BRIEF_SHEET_V6 D). Not a card of its own and it
 * owns no door: the card's one door is "View handicap".
 *
 * THE SIGN DRIVES THE AXIS; THE EFFECT DRIVES THE COLOUR (V3 D). A minus hangs
 * BELOW the index line, a plus rises above. A bar is green when its round
 * LOWERED the index (FormBar.movement), grey when it did not — whichever side it
 * sits, because a round above the index can still cut it. Every bar prints its own
 * figure. Fewer than five renders only what exists, left-aligned; fewer than
 * two and the section does not render.
 */
import React from 'react';
import { A, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { playDateStandalone } from '@/components/explore-tab-new/courseled/discoverWhen';
import { fmtSigned, formBarLowered, type FormBar } from '../sheetState';
import { CARD_LABEL } from './sheetCardParts';

const GAP = 8;
const BAR_INSET = 0.14;
// BRIEF_FORM_PLOT F.2 — floors so the line never sits flush (spec file absent;
// below floor 4 is implied by the brief's 40px all-above case).
export const FLOOR_ABOVE = 4;
export const FLOOR_BELOW = 4;

/** F.2 — plot height and line position measured from the bars in hand. */
export function plotMetrics(values: number[]): { plotH: number; mid: number } {
  const maxAbs = Math.max(...values.map(Math.abs));
  let above = FLOOR_ABOVE;
  let below = FLOOR_BELOW;
  for (const v of values) {
    const h = barGeometry(v, maxAbs, 0).height;
    if (v < 0) below = Math.max(below, h + 15);
    else above = Math.max(above, h + 14);
  }
  return { plotH: above + below, mid: above };
}

/**
 * F.1 — baseline insets, so the line starts where the first bar starts and ends
 * where the last bar ends. Slots stay one fifth wide (fewer bars left-align), so
 * the right inset also absorbs the empty slots.
 */
export function baselineInsets(n: number): { left: string; right: string } {
  const inset = `(${SLOT_EXPR}) * ${BAR_INSET}`;
  const used = `(${SLOT_EXPR}) * ${n} + ${GAP * (n - 1)}px`;
  return { left: `calc(${inset})`, right: `calc(100% - (${used}) + ${inset})` };
}
const SLOT_EXPR = `(100% - ${GAP * 4}px) / 5`;
const SLOT = `calc((100% - ${GAP * 4}px) / 5)`;

export function barGeometry(value: number, maxAbs: number, MID: number): { top: number; height: number; labelTop: number; below: boolean } {
  const perStroke = Math.min(8, 22 / Math.max(maxAbs, 0.1));
  const height = Math.max(2, Math.abs(value) * perStroke);
  const below = value < 0;
  return below
    ? { top: MID, height, labelTop: MID + height + 3, below }
    : { top: MID - height, height, labelTop: MID - height - 14, below };
}

const FormSection: React.FC<{ bars: FormBar[] }> = ({ bars }) => {
  if (bars.length < 2) return null;
  const maxAbs = Math.max(...bars.map((b) => Math.abs(b.value)));
  const { plotH, mid } = plotMetrics(bars.map((b) => b.value));
  const line = baselineInsets(bars.length);
  return (
    <div data-form-section>
      <div style={CARD_LABEL}>Last five rounds</div>
      <div style={{ display: 'flex', gap: GAP, height: plotH, marginTop: 9, position: 'relative' }}>
        <div style={{ position: 'absolute', left: line.left, right: line.right, top: mid, height: 1, background: A.HAIRLINE }} />
        {bars.map((b) => {
          const g = barGeometry(b.value, maxAbs, mid);
          const lowered = formBarLowered(b);
          const tone = lowered ? A.IMPROVED : A.DIM;
          return (
            <div key={b.id} data-form-bar data-below={g.below ? 'true' : 'false'} data-lowered={lowered ? 'true' : 'false'} style={{ flex: `0 0 ${SLOT}`, minWidth: 0, position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14%', right: '14%', top: g.top, height: g.height, borderRadius: 3, background: tone }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: g.labelTop, textAlign: 'center', fontSize: 10, fontWeight: 800, color: tone, ...FIGS }}>
                {fmtSigned(b.value)}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: GAP, marginTop: 4 }}>
        {bars.map((b) => (
          <span key={b.id} style={{
            flex: `0 0 ${SLOT}`, minWidth: 0, textAlign: 'center', fontSize: 9, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase', color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden',
          }}>{playDateStandalone(b.date)}</span>
        ))}
      </div>
      <div data-form-key style={{ display: 'flex', alignItems: 'center', marginTop: 10, fontSize: 11, lineHeight: 1.45, color: A.MUTE }}>
        <span aria-hidden style={{ width: 8, height: 8, borderRadius: 2, background: A.IMPROVED, marginRight: 5, flex: 'none' }} />
        Green rounds lowered your index.
      </div>
    </div>
  );
};

export default FormSection;
