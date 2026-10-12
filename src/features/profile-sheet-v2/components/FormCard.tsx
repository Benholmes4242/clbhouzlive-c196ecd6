/**
 * ProfileSheetV2 · Your form (D). Five bars, last five rounds, oldest left.
 *
 * THE SIGN DRIVES THE AXIS; THE EFFECT DRIVES THE COLOUR (V3 D). A minus hangs
 * BELOW the index line, a plus rises above. A bar is green when its round
 * LOWERED the index (FormBar.movement), grey when it did not — whichever side it
 * sits, because a round above the index can still cut it. Every bar prints its own
 * figure. Fewer than five renders only what exists, left-aligned; fewer than
 * two and the card does not render.
 */
import React from 'react';
import { A, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { playDateStandalone } from '@/components/explore-tab-new/courseled/discoverWhen';
import { fmtSigned, formBarLowered, type FormBar, ROUNDS_DOOR_ROUTE } from '../sheetState';
import { CARD, CardHead, Door } from './sheetCardParts';

const PLOT_H = 78;
const MID = 39;
const GAP = 8;
const SLOT = `calc((100% - ${GAP * 4}px) / 5)`;

export function barGeometry(value: number, maxAbs: number): { top: number; height: number; labelTop: number; below: boolean } {
  const perStroke = Math.min(10, 30 / Math.max(maxAbs, 0.1));
  const height = Math.max(2, Math.abs(value) * perStroke);
  const below = value < 0;
  return below
    ? { top: MID, height, labelTop: MID + height + 4, below }
    : { top: MID - height, height, labelTop: MID - height - 15, below };
}

const FormCard: React.FC<{ bars: FormBar[]; onNavigate: (r: string) => void }> = ({ bars, onNavigate }) => {
  if (bars.length < 2) return null;
  const maxAbs = Math.max(...bars.map((b) => Math.abs(b.value)));
  return (
    <div data-card="form" style={CARD}>
      <CardHead label="Your form" />
      <div style={{ display: 'flex', gap: GAP, height: PLOT_H, marginTop: 11, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: MID, height: 1, background: A.HAIRLINE }} />
        {bars.map((b) => {
          const g = barGeometry(b.value, maxAbs);
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
      <div style={{ display: 'flex', gap: GAP, marginTop: 6 }}>
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
      <Door label="Your rounds" onClick={() => onNavigate(ROUNDS_DOOR_ROUTE)} />
    </div>
  );
};

export default FormCard;
