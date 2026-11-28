/** Journeys uses only the existing journeys RPC payload; drop comparisons use rounded step conversion, with earlier ties winning. */
import React from 'react';
import { useAnalyticsJourneys, type Funnel, type FunnelStep } from '../../hooks/useAnalyticsLenses';
import { CC3, NUM } from '../InboxPanels';
import { DASH, num, showTrackingGap, trackingGapCopy } from './analyticsFormat';
import { Head, Panel, Slot } from './analyticsUi';

export default function JourneysLens() {
  const q = useAnalyticsJourneys();
  return (
    <Slot q={q} height={360}>
      {(d) => (
        <>
          {showTrackingGap(d.gap.joined, d.gap.signup_starts) && (
            <TrackingGap joined={d.gap.joined!} starts={d.gap.signup_starts ?? 0} />
          )}
          {d.funnels.map((f) => <FunnelPanel key={f.key} f={f} />)}
        </>
      )}
    </Slot>
  );
}

export function TrackingGap({ joined, starts }: { joined: number; starts: number }) {
  return (
    <section role="note" style={{
      borderRadius: 16, padding: '12px 14px', background: 'rgba(255,123,114,0.06)',
      boxShadow: 'inset 0 0 0 1px rgba(255,123,114,0.45)', display: 'grid', gridTemplateColumns: '18px minmax(0, 1fr)', columnGap: 10,
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={CC3.bad} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginTop: 2 }}>
        <path d="M8 2.5l6 11H2l6-11z" /><path d="M8 7v3" /><path d="M8 12.2v.1" />
      </svg>
      <span>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: CC3.bad }}>Tracking gap: sign-up</span>
        <span style={{ display: 'block', marginTop: 3, fontSize: 12, lineHeight: 1.45, color: CC3.mute, ...NUM }}>{trackingGapCopy(joined, starts)}</span>
      </span>
    </section>
  );
}

export function biggestDrop(steps: readonly FunnelStep[]): number | null {
  let index: number | null = null;
  let lowest = Infinity;
  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1].n ?? 0;
    const n = steps[i].n ?? 0;
    if (prev <= 0 || n > prev) continue;
    const conversion = Math.round(n / prev * 100);
    if (conversion < lowest) { index = i; lowest = conversion; }
  }
  return index;
}

function FunnelPanel({ f }: { f: Funnel }) {
  const first = f.steps[0]?.n ?? 0;
  const last = f.steps[f.steps.length - 1]?.n ?? 0;
  const end = first > 0 ? Math.round((100 * last) / first) : null;
  const drop = biggestDrop(f.steps);
  const previous = drop == null ? null : f.steps[drop - 1];
  const dropped = drop == null ? null : f.steps[drop];
  const lost = previous && dropped ? (previous.n ?? 0) - (dropped.n ?? 0) : 0;
  const conversion = previous && dropped ? Math.round((dropped.n ?? 0) / previous.n! * 100) : 0;
  return (
    <Panel>
      <Head title={f.title} side={end == null ? DASH : <><span style={{ color: CC3.ink, fontWeight: 700, ...NUM }}>{end}%</span> end to end</>}
        sideStyle={{ color: CC3.faint, ...NUM }} />
      <div style={{ marginTop: 4, fontSize: 11.5, color: CC3.mute }}>{f.sub}</div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
        {f.steps.map((st, i) => {
          const n = st.n ?? 0;
          const prev = i > 0 ? f.steps[i - 1].n ?? 0 : 0;
          const conv = i > 0 && prev > 0 ? Math.round((100 * n) / prev) : null;
          const fault = i > 0 && n > prev;
          const isDrop = i === drop;
          const w = first > 0 ? Math.min(100, Math.max(2, (100 * n) / first)) : 2;
          return (
            <div key={`${st.label}-${i}`}>
              {i > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '5px 0 5px 10px', fontSize: 10.5, fontWeight: 700, color: CC3.faint }}>
                  <span style={{ width: 1, height: 14, background: CC3.line }} />
                  <span style={{ color: fault || isDrop ? CC3.bad : CC3.mute, ...NUM }}>{conv == null ? DASH : `${conv}% continue`}{fault ? ' · data fault' : ''}</span>
                  {st.wait && <span style={NUM}>· {st.wait}</span>}
                  {isDrop && <span style={{ color: CC3.bad }}>· biggest drop</span>}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: CC3.ink, overflowWrap: 'anywhere' }}>{st.label}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: CC3.ink, ...NUM }}>{num(st.n)}</span>
              </div>
              <div style={{ marginTop: 5, height: 8, borderRadius: 3, background: CC3.track, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${w}%`, borderRadius: 3, background: i === 0 ? 'rgba(233,237,243,0.3)' : CC3.ink }} />
              </div>
            </div>
          );
        })}
      </div>
      {previous && dropped && (
        <div style={{ marginTop: 10, padding: '9px 10px', borderRadius: 10, background: CC3.inset, fontSize: 11.5, color: CC3.mute, lineHeight: 1.4, ...NUM }}>
          <span style={{ color: CC3.ink, fontWeight: 700 }}>{num(lost)} lost</span>{` between ${previous.label.toLowerCase()} and ${dropped.label.toLowerCase()}, ${100 - conversion}% of those who got that far.`}
        </div>
      )}
    </Panel>
  );
}
