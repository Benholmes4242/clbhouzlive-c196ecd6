import { useTranslation } from 'react-i18next';
import type { PlayerTournamentResult } from '../../hooks/usePlayerResults';
import { AMBER, HAIRLINE_INK_8, INK, INK_FAINT, SLATE_50 } from '../../_shared/tokens';

const positionOf = (result: PlayerTournamentResult) => {
  const status = result.status?.toUpperCase();
  return status === 'MC' || status === 'CUT' || status === 'WD' || status === 'DQ' ? null : result.position;
};

export function FormSection({ results }: { results: PlayerTournamentResult[] }) {
  const { t } = useTranslation('tourhub');
  const season = [...results].reverse();
  if (season.length < 2) return null;
  const width = 600;
  const height = 120;
  const left = 12;
  const right = width - 12;
  const plotted = season.map((result, index) => {
    const position = positionOf(result);
    const x = season.length === 1 ? left : left + (index / (season.length - 1)) * (right - left);
    const y = position == null ? 104 : 12 + (Math.min(position, 70) / 70) * 78;
    return { result, position, x, y };
  });
  const path = plotted.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  return (
    <section style={{ background: SLATE_50, padding: '18px 16px 14px' }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: INK, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{t('player.form.eyebrow')}</p>
      <p style={{ margin: 0, fontSize: 12, color: INK_FAINT }}>{t('player.form.caption')}</p>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={t('player.form.chartLabel')} style={{ display: 'block', width: '100%', height: 120, marginTop: 8, overflow: 'visible' }}>
        <line x1={left} x2={right} y1="104" y2="104" stroke={HAIRLINE_INK_8} />
        <path d={path} fill="none" stroke={INK_FAINT} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        {plotted.map(({ result, position, x, y }) => position === 1 ? (
          <path key={result.id} d={`M${x},${y - 5} L${x + 5},${y} L${x},${y + 5} L${x - 5},${y} Z`} fill={AMBER} />
        ) : (
          <circle key={result.id} cx={x} cy={y} r={position == null ? 2.5 : 3.5} fill={position == null ? INK_FAINT : SLATE_50} stroke={position == null ? INK_FAINT : INK} strokeWidth="1.5" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: INK_FAINT }}><span>{t('player.form.seasonStart')}</span><span>{t('player.form.latest')}</span></div>
    </section>
  );
}