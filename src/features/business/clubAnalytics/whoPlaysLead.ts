/** CB96 — Who plays here lead, from handicap_bands in RPC order (lowest index first). Pure. */
export interface WhoPlaysBandInput { label: string; rounds: number }
export interface WhoPlaysLead {
  title: string | null;
  line: { kind: 'share'; y: number; q: number } | { kind: 'none'; y: number } | null;
  /** Indexes of bands in the least-seen group. */
  few: number[];
}
type Bound = number | 'plus';
export function bandLowerBound(label: string): Bound | null {
  const l = label.trim();
  if (/^plus\b/i.test(l)) return 'plus';
  if (/^scratch\b/i.test(l)) return 0;
  const m = /^(\d+(?:\.\d+)?)\b/.exec(l);
  return m ? Number(m[1]) : null;
}
export function whoPlaysLead(bands: WhoPlaysBandInput[]): WhoPlaysLead {
  const none: WhoPlaysLead = { title: null, line: null, few: [] };
  const bounds = bands.map(b => bandLowerBound(b.label));
  if (bands.length === 0 || bounds.some(b => b === null)) return none;
  const T = bands.reduce((s, b) => s + b.rounds, 0);
  if (T === 0) return none;
  let run = 0, k = -1;
  for (let i = 0; i < bands.length; i++) { run += bands[i].rounds; if (run >= 0.6 * T) { k = i; break; } }
  let title: string;
  const p = Math.round((run / T) * 100);
  if (k === 0 && bounds[0] === 'plus') title = `${p}% of rounds come from plus-handicap golfers`;
  else if (k < 0 || k >= bands.length - 1) title = 'Rounds by the handicap index played off';
  else title = `${p}% of rounds come from golfers off under ${bounds[k + 1]}`;
  const few: number[] = []; let g = 0;
  for (let i = bands.length - 1; i >= 0; i--) {
    if ((g + bands[i].rounds) / T >= 0.1) break;
    g += bands[i].rounds; few.unshift(i);
  }
  if (few.length === 0) return { title, line: null, few };
  const yb = bounds[few[0]];
  const y = yb === 'plus' ? 0 : (yb as number);
  return { title, few, line: g > 0 ? { kind: 'share', y, q: Math.round((g / T) * 100) } : { kind: 'none', y } };
}
