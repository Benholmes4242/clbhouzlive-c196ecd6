import { isPerfEnabled } from './navTiming';

let t0 = 0;
const marks: { section: string; event: string; tile?: number; t: number }[] = [];
const now = () => Math.round(performance.now() - t0);

export function wrtStart() {
  if (!isPerfEnabled()) return;
  t0 = performance.now();
  marks.length = 0;
  console.info('[wrt] page-open t0');
}

export function wrtMark(section: string, event: string, tile?: number, extra?: string) {
  if (!isPerfEnabled() || !t0) return;
  const t = now();
  marks.push({ section, event, tile, t });

  if (event === 'tile-decoded') {
    const revealedAt = marks.find((m) => m.event === 'page-revealed')?.t;
    if (revealedAt != null && t > revealedAt + 50) {
      console.info(`[wrt] LATE ${section}#${tile} decoded ${t}ms (+${t - revealedAt} after reveal)`);
    }
  }

  if (event === 'page-revealed') {
    console.info(`[wrt] PAGE REVEALED ${t}ms${extra ? ` (${extra})` : ''}`);
    const sections = [...new Set(marks.map((m) => m.section).filter((s) => s !== 'page'))];
    for (const s of sections) {
      const settled = marks.find((m) => m.section === s && m.event === 'settled')?.t ?? '-';
      const tiles = marks
        .filter((m) => m.section === s && m.event === 'tile-decoded')
        .map((m) => `${m.tile}:${m.t}`)
        .join(' ');
      console.info(`[wrt] ${s.padEnd(18)} settled@${settled} tiles ${tiles || '-'}`);
    }
  }
}
