/** FormTiles — five 24px finish tiles, latest on the right; fewer than five starts → dashed empty tiles on the left. */
import { tileTone, type Start } from '../playersRules';
import { P } from '../playersTokens';

const TONE: Record<string, React.CSSProperties> = {
  win: { background: P.INK, color: P.CANVAS, border: `1px solid ${P.INK}`, fontWeight: 800 },
  t10: { color: P.INK, border: '1px solid rgba(248,250,252,0.7)' },
  t25: { color: P.INK, border: `1px solid ${P.HAIR2}` },
  other: { color: P.MUTE, border: `1px solid ${P.HAIR}` },
  mc: { color: P.DIM, border: '1px solid transparent', background: 'rgba(255,255,255,0.04)' },
  none: { border: `1px dashed ${P.HAIR}` },
};

export function Tile({ tone, label, size = 24 }: { tone: keyof typeof TONE; label?: string; size?: number }) {
  return (
    <span data-form-tile={tone} style={{ width: size, height: size, borderRadius: size === 24 ? 7 : 5, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', fontSize: size === 24 ? 10 : 0, fontWeight: 700, boxSizing: 'border-box', ...TONE[tone] }}>
      {label}
    </span>
  );
}

export function FormTiles({ starts }: { starts: Start[] }) {
  const last = starts.slice(-5);
  const empty = 5 - last.length;
  return (
    <span data-form-tiles style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 24px)', gap: 3, justifyContent: 'end' }}>
      {Array.from({ length: empty }).map((_, i) => <Tile key={`e${i}`} tone="none" />)}
      {last.map((s, i) => <Tile key={i} tone={tileTone(s)} label={s.label} />)}
    </span>
  );
}
