/* TEMPORARY VERIFICATION HARNESS (BRIEF_ROUND_TILE_CURVE report §3/§7).
   Renders THE SHAPE on the well's exact ground with an under-par and an over-par
   round side by side. Delete after the screenshots are taken. */
import { TrajectoryLine } from '@/features/courses/_shared/scorecard/TrajectoryLine';

const WELL = 'rgba(11,13,16,0.66)';
const OVER = '#3D424A';
const UNDER = '#4A2A2E';
const PANEL_OVER = '#31353C';
const PANEL_UNDER = '#3C2225';

const mk = (deltas: number[]) =>
  deltas.map((d, i) => ({ holeNo: i + 1, par: 4, strokes: 4 + d }));

const UNDER_ROUND = mk([0, -1, 0, 0, -1, 0, 1, -1, 0, 0, -1, 0, 0, -1, 1, 0, -1, 0]);
const OVER_ROUND = mk([1, 0, 1, 2, 0, 1, 1, 0, 2, 1, 0, 1, 1, 2, 0, 1, 1, 0]);
const CLAMP_ROUND = mk([2, 2, 2, 1, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2]);

function Well({ label, holes, over, under }: { label: string; holes: ReturnType<typeof mk>; over: string; under: string }) {
  return (
    <div style={{ width: 256, background: '#15171F', padding: '0 10px' }}>
      <div
        style={{
          marginLeft: -10,
          marginRight: -10,
          background: WELL,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.10)',
          padding: '6px 6px 9px',
        }}
      >
        <div style={{ fontSize: 8.5, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 700 }}>
          {label}
        </div>
        <div style={{ height: 34, marginTop: 4, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: '76.9%', borderTop: '1px dashed rgba(255,255,255,0.10)' }} />
          <TrajectoryLine
            holes={holes}
            surface="dark"
            height={34}
            viewWidth={244}
            showTicks={false}
            padY={0}
            strokeWidth={1.6}
            yDomain={[-6, 20]}
            fillOverColor={over}
            fillUnderColor={under}
          />
        </div>
      </div>
    </div>
  );
}

export default function CurveProbe() {
  return (
    <div style={{ background: '#15171F', minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Well label="Under (well-mixed)" holes={UNDER_ROUND} over={OVER} under={UNDER} />
        <Well label="Over (well-mixed)" holes={OVER_ROUND} over={OVER} under={UNDER} />
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <Well label="Under (panel-mixed)" holes={UNDER_ROUND} over={PANEL_OVER} under={PANEL_UNDER} />
        <Well label="Over (panel-mixed)" holes={OVER_ROUND} over={PANEL_OVER} under={PANEL_UNDER} />
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <Well label="Clamped +32" holes={CLAMP_ROUND} over={OVER} under={UNDER} />
        <Well label="Self-scaled (no domain)" holes={OVER_ROUND} over={OVER} under={UNDER} />
      </div>
    </div>
  );
}
