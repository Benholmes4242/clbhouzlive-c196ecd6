import { useTranslation } from 'react-i18next';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { RAMP_DIST } from '@/features/courses/components/holes/analytical/tokens';
import { A, FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';

const ORDER = ['eagles', 'birdie', 'par', 'bogey', 'double'] as const;
type Bucket = (typeof ORDER)[number];

const LABEL_KEY: Record<Bucket, string> = {
  eagles: 'eagle',
  birdie: 'birdie',
  par: 'par',
  bogey: 'bogey',
  double: 'double',
};

function deltas(shape: HoleShape) {
  return shape.holes.flatMap((hole) =>
    hole.par != null && hole.strokes != null
      ? [{ hole: hole.holeNo, strokes: hole.strokes, delta: hole.strokes - hole.par }]
      : [],
  );
}

export function RoundTicks({ shape }: { shape: HoleShape }) {
  const { t } = useTranslation('courses');
  const events = deltas(shape).filter(({ delta }) => delta <= -2 || delta >= 2);
  if (events.length === 0) return null;
  const max = Math.max(...events.map(({ delta }) => Math.abs(delta)));
  const standout = events.findIndex(({ delta }) => Math.abs(delta) === max);
  const named = events[standout];
  const eventName = named.strokes === 1
    ? t('amateur.stream.visual.ace', 'HOLE IN ONE ON {{n}}', { n: named.hole })
    : named.delta <= -3
      ? t('amateur.stream.visual.albatross', 'ALBATROSS ON {{n}}', { n: named.hole })
      : named.delta === -2
        ? t('amateur.stream.visual.eagle', 'EAGLE ON {{n}}', { n: named.hole })
        : named.delta >= 3
          ? t('amateur.stream.visual.triple', 'TRIPLE ON {{n}}', { n: named.hole })
          : t('amateur.stream.visual.double', 'DOUBLE ON {{n}}', { n: named.hole });

  return (
    <div style={{ width: '100%', paddingInline: 12, paddingBottom: 7 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 34 }}>
        {events.map((event, index) => {
          const clamped = Math.max(-3, Math.min(3, event.delta));
          const h = 4 + Math.abs(clamped) * 5;
          const tone = event.delta < 0 ? RAMP_DIST.eagles : event.delta === 2 ? RAMP_DIST.double : RAMP_DIST.double;
          return (
            <span key={event.hole} style={{ position: 'relative', flex: 1, height: '100%', minWidth: 0 }}>
              <span style={{ position: 'absolute', left: 0, right: 0, top: 16, height: 1, background: A.HAIRLINE }} />
              <span style={{
                position: 'absolute', left: '50%', width: index === standout ? 4 : 2,
                height: h, transform: 'translateX(-50%)', background: tone,
                border: index === standout ? `1px solid ${A.INK}` : 0,
                bottom: event.delta < 0 ? 1 : 'auto', top: event.delta > 0 ? 16 : 'auto',
              }} />
              <span style={{ position: 'absolute', top: 14, left: '50%', width: 4, height: 4, borderRadius: '50%', transform: 'translate(-50%, -50%)', background: tone }} />
            </span>
          );
        })}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 8, fontWeight: 700, color: A.INK, ...FIGS }}>{eventName}</div>
    </div>
  );
}

export function RoundDistribution({ shape }: { shape: HoleShape }) {
  const { t } = useTranslation('courses');
  const counts: Record<Bucket, number> = { eagles: 0, birdie: 0, par: 0, bogey: 0, double: 0 };
  deltas(shape).forEach(({ delta }) => {
    if (delta <= -2) counts.eagles += 1;
    else if (delta === -1) counts.birdie += 1;
    else if (delta === 0) counts.par += 1;
    else if (delta === 1) counts.bogey += 1;
    else counts.double += 1;
  });
  const visible = ORDER.filter((key) => counts[key] > 0);
  const total = visible.reduce((sum, key) => sum + counts[key], 0);
  if (total === 0) return null;
  return (
    <div style={{ width: '100%', padding: '0 12px 9px' }}>
      <div style={{ display: 'flex', gap: 2, height: 6 }}>
        {visible.map((key) => <span key={key} style={{ flex: counts[key], minWidth: 2, background: RAMP_DIST[key] }} />)}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        {visible.map((key) => (
          <span key={key} style={{ fontFamily: SANS, fontSize: 8, fontWeight: 700, color: RAMP_DIST[key], ...FIGS }}>
            {t(`amateur.stream.visual.${LABEL_KEY[key]}`, LABEL_KEY[key].toUpperCase())} {counts[key]}
          </span>
        ))}
      </div>
    </div>
  );
}