/**
 * ProfileSheetV2 · Your form (D). Five bars, last five rounds, oldest left.
 *
 * THE SIGN DRIVES THE AXIS, THE COLOUR CARRIES THE MEANING. A minus hangs BELOW
 * the index line because it is a minus; it is green because beating your
 * handicap is good. A plus rises above in muted ink. Every bar prints its own
 * figure. Fewer than five renders only what exists, left-aligned; fewer than
 * two and the card does not render.
 */
import React from 'react';
import { A, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { playDateStandalone } from '@/components/explore-tab-new/courseled/discoverWhen';
import { fmtSigned, formSummary, type FormBar } from '../sheetState';
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
  const sum = formSummary(bars);
  return (
    <div data-card="form" style={CARD}>
      <CardHead label="Your form" right={
        <span style={{ fontSize: 11.5, fontWeight: 700, color: A.MUTE }}>
          Last five vs index {'\u00B7'}{' '}
          <b style={{ color: sum.better ? A.IMPROVED : A.MUTE }}>
            {sum.better === null ? 'level' : `${sum.n} ${sum.better ? 'better' : 'worse'}`}
          </b>
        </span>
      } />
      <div style={{ display: 'flex', gap: GAP, height: PLOT_H, marginTop: 11, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: MID, height: 1, background: A.HAIRLINE }} />
        {bars.map((b) => {
          const g = barGeometry(b.value, maxAbs);
          const tone = g.below ? A.IMPROVED : A.DIM;
          return (
            <div key={b.id} data-form-bar data-below={g.below ? 'true' : 'false'} style={{ flex: `0 0 ${SLOT}`, minWidth: 0, position: 'relative' }}>
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
      <Door label="Your rounds" onClick={() => onNavigate('/handicap')} />
    </div>
  );
};

export default FormCard;
