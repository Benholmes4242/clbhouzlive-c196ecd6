import React from 'react';
import { adminTheme as t } from '../../theme';
import { useAnalyticsJourneys, type Funnel } from '../../hooks/useAnalyticsLenses';
import { DASH, num, showTrackingGap, trackingGapCopy } from './analyticsFormat';
import { Head, LIT, Panel, Slot } from './analyticsUi';

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
      borderRadius: 16, padding: '12px 14px', background: 'rgba(249,200,116,0.08)',
      boxShadow: 'inset 0 0 0 1px rgba(249,200,116,0.3)', display: 'grid', gridTemplateColumns: '18px minmax(0, 1fr)', columnGap: 10,
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={t.warnText} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginTop: 2 }}>
        <path d="M8 2.5l6 11H2l6-11z" /><path d="M8 7v3" /><path d="M8 12.2v.1" />
      </svg>
      <span>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: t.warnText }}>Tracking gap: sign-up</span>
        <span style={{ display: 'block', marginTop: 3, fontSize: 12, lineHeight: 1.45, color: t.inkMuted }}>{trackingGapCopy(joined, starts)}</span>
      </span>
    </section>
  );
}

const endTone = (p: number) => (p >= 50 ? t.okText : p >= 25 ? t.warnText : t.dangerText);
const convTone = (p: number) => (p >= 60 ? t.okText : p >= 30 ? t.warnText : t.dangerText);

function FunnelPanel({ f }: { f: Funnel }) {
  const first = f.steps[0]?.n ?? 0;
  const last = f.steps[f.steps.length - 1]?.n ?? 0;
  const end = first > 0 ? Math.round((100 * last) / first) : null;
  return (
    <Panel>
      <Head title={f.title} side={end == null ? DASH : `${end}% end to end`}
        sideStyle={{ fontWeight: 700, color: end == null ? t.inkFaint : endTone(end) }} />
      <div style={{ marginTop: 4, fontSize: 11.5, color: t.inkMuted }}>{f.sub}</div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
        {f.steps.map((st, i) => {
          const n = st.n ?? 0;
          const prev = i > 0 ? f.steps[i - 1].n ?? 0 : 0;
          const conv = i > 0 && prev > 0 ? Math.round((100 * n) / prev) : null;
          // A step larger than the one above is a data fault: drawn, not clamped, amber.
          const convColour = conv == null ? t.inkFaint : n > prev ? t.warnText : convTone(conv);
          const w = first > 0 ? Math.max(2, Math.round((100 * n) / first)) : 2;
          return (
            <div key={`${st.label}-${i}`}>
              {i > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0 5px 10px', fontSize: 10.5, fontWeight: 700, color: t.inkFaint }}>
                  <span style={{ width: 1, height: 14, background: LIT.rule }} />
                  <span style={{ color: convColour }}>{conv == null ? DASH : `${conv}% continue`}</span>
                  <span>{st.wait ? `· ${st.wait}` : ''}</span>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{st.label}</span>
                <span style={{ fontSize: 16, fontWeight: 800 }}>{num(st.n)}</span>
              </div>
              <div style={{ marginTop: 5, height: 8, borderRadius: 3, background: LIT.track }}>
                <div style={{ height: '100%', width: `${Math.min(w, 100)}%`, borderRadius: 3, background: i === 0 ? LIT.inkSoft : t.brand }} />
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
