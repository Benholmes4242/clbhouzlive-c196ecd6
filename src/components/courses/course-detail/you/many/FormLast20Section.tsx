/**
 * BRIEF_YOU_TAB_1 P4.2 — Your form here, the played state. The figure is
 * lastN (P1.6, the ONE last-20); the comparison is the twenty before, named.
 * The sparkline is the existing TrendLine from YourFormHere.
 */
import React from 'react';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { formatDate } from '@/i18n/format';
import { ABOUT_KICKER } from '../../about/AboutSection';
import { TrendLine } from '../YourFormHere';
import { LAST_N, round1, type YouRoundInput } from '@/lib/courseYou/youDerivations';
import { Said, Sec, Verd, words } from './manyBits';

interface Props {
  last: { avg: number; rounds: YouRoundInput[] } | null;
  previous: number | null;
  firstTwenty: number | null;
  onOpenRound: (scoreId: string) => void;
}

const f1 = (v: number) => round1(v).toFixed(1);

const halves = (v: number) => {
  const h = Math.round(Math.abs(v) * 2) / 2;
  const whole = Math.floor(h);
  return h % 1 ? `${whole === 0 ? 'half a' : `${words(whole)} and a half`}` : words(whole);
};

const FormLast20Section: React.FC<Props> = ({ last, previous, firstTwenty, onOpenRound }) => {
  const [sel, setSel] = React.useState<number | null>(null);
  if (!last) return null;
  const drawn = [...last.rounds].reverse();
  const values = drawn.map((r) => r.grossScore as number);
  const best = Math.min(...values);
  const worst = Math.max(...values);
  const flat = previous != null && Math.abs(last.avg - previous) < 0.5;
  const belowFirst = firstTwenty != null && previous != null ? firstTwenty - (last.avg + previous) / 2 : null;
  return (
    <Sec kicker="Your form here" title={`Last ${LAST_N} rounds`}>
      <Verd size={34} marginTop={13} value={f1(last.avg)} line1={`your last ${LAST_N} here`}
        line2={previous != null ? `the ${words(LAST_N)} before averaged ${f1(previous)}` : undefined} />
      <TrendLine
        values={values}
        selected={sel}
        onSelect={(i) => { if (sel === i) { onOpenRound(drawn[i].whsScoreId); } setSel(i); }}
        label={(i) => `${formatDate(drawn[i].playDate)}, ${drawn[i].grossScore}`}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
        <span style={{ ...ABOUT_KICKER, fontSize: 10, letterSpacing: '0.1em', color: A.FAINT }}>Best {best}</span>
        <span style={{ ...ABOUT_KICKER, fontSize: 10, letterSpacing: '0.1em', color: A.FAINT }}>Worst {worst}</span>
      </div>
      {flat ? (
        <Said quiet>
          Flat across {words(LAST_N * 2)} rounds
          {belowFirst != null && belowFirst >= 0.5 ? `, and ${halves(belowFirst)} shots below your first ${words(LAST_N)}. You improved, then held it.` : '.'}
        </Said>
      ) : null}
    </Sec>
  );
};

export default FormLast20Section;
