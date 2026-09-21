import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMonthShort } from '@/i18n/format';
import { formatPosition, formatScore, type PlayerTournamentResult } from '../../hooks/usePlayerResults';
import { isFinish, isNonStarter } from '../../_shared/resultStatus';
import { getScoreColor } from '../../_shared/scoreColor';
import { AMBER, HAIRLINE_INK_8, INK, INK_FAINT, SLATE_50 } from '../../_shared/tokens';

// A position on the shape means a real finish: MDF plots normally, CUT/MC/WD/DQ
// plot on the floor line. DNS is filtered out entirely before plotting — a
// player who never teed off has no result. See _shared/resultStatus.ts.
const positionOf = (result: PlayerTournamentResult) => (isFinish(result.status) ? result.position : null);

export function FormSection({ results }: { results: PlayerTournamentResult[] }) {
  const { t } = useTranslation('tourhub');
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const season = [...results].filter((result) => !isNonStarter(result.status)).reverse();
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
  const selectedIndex = selectedPoint == null ? plotted.length - 1 : Math.min(selectedPoint, plotted.length - 1);
  const selected = plotted[selectedIndex];
  const selectedDate = new Date(selected.result.tournament_end_date);
  const dateLabel = Number.isNaN(selectedDate.getTime())
    ? ''
    : `${selectedDate.getDate()} ${formatMonthShort(selectedDate)}`.toUpperCase();
  const selectNearestPoint = (clientX: number, svg: SVGSVGElement) => {
    const bounds = svg.getBoundingClientRect();
    const chartX = ((clientX - bounds.left) / bounds.width) * width;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    plotted.forEach((point, index) => {
      const distance = Math.abs(point.x - chartX);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    setSelectedPoint(nearestIndex);
  };
  return (
    <section style={{ background: SLATE_50, padding: '18px 16px 14px' }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: INK, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{t('player.form.eyebrow')}</p>
      <p style={{ margin: 0, fontSize: 12, color: INK_FAINT }}>{t('player.form.caption')}</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t('player.form.chartLabel')}
        tabIndex={0}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          selectNearestPoint(event.clientX, event.currentTarget);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            selectNearestPoint(event.clientX, event.currentTarget);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            setSelectedPoint(Math.max(0, selectedIndex - 1));
          } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            setSelectedPoint(Math.min(plotted.length - 1, selectedIndex + 1));
          }
        }}
        style={{ display: 'block', width: '100%', height: 120, marginTop: 8, overflow: 'visible', touchAction: 'none' }}
      >
        <line x1={left} x2={right} y1="104" y2="104" stroke={HAIRLINE_INK_8} />
        <path d={path} fill="none" stroke={INK_FAINT} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <line x1={selected.x} x2={selected.x} y1="4" y2="108" stroke={INK_FAINT} strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {plotted.map(({ result, position, x, y }) => position === 1 ? (
          <path key={result.id} d={`M${x},${y - 5} L${x + 5},${y} L${x},${y + 5} L${x - 5},${y} Z`} fill={AMBER} />
        ) : (
          <circle key={result.id} cx={x} cy={y} r={position == null ? 2.5 : 3.5} fill={position == null ? INK_FAINT : SLATE_50} stroke={position == null ? INK_FAINT : INK} strokeWidth="1.5" />
        ))}
      </svg>
      <div style={{ height: 28, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK_FAINT }}>{dateLabel}</span>
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13.5, fontWeight: 600, color: INK }}>{selected.result.tournament_name}</span>
        <span style={{ flexShrink: 0, fontSize: 13.5, fontWeight: 800, color: INK }}>{formatPosition(selected.result.position, selected.result.position_tied, selected.result.status)}</span>
        <span style={{ flexShrink: 0, fontSize: 13.5, fontWeight: 700, color: getScoreColor(selected.result.score, 'dark') }}>{formatScore(selected.result.score)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: INK_FAINT }}><span>{t('player.form.seasonStart')}</span><span>{t('player.form.latest')}</span></div>
    </section>
  );
}