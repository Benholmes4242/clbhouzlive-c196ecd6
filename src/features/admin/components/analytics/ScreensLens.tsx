/** Screens v3 owns its presentation only; staff filtering stays with the existing RPCs.
 * The per-active-member denominator reuses Health's canonical 30-day query/cache key.
 */
import React, { useMemo, useState } from 'react';
import { CC3, NUM } from '../InboxPanels';
import { useAnalyticsHealth, useAnalyticsScreens, type AnalyticsScreens } from '../../hooks/useAnalyticsLenses';
import { dateLabel, dur, num } from './analyticsFormat';
import { Fig, FooterButton, Head, Muted, Panel, Slot } from './analyticsUi';

export default function ScreensLens() {
  const q = useAnalyticsScreens();
  const health = useAnalyticsHealth(30);
  return (
    <Slot q={q} height={74}>
      {(d) => <ScreensBody d={d} mau={health.data?.activity.mau} />}
    </Slot>
  );
}

/** 'All', then areas by total time, with 'Unlisted' always last. */
export function areaOrder(rows: AnalyticsScreens['rows']): string[] {
  const tot = new Map<string, number>();
  rows.forEach((r) => tot.set(r.area, (tot.get(r.area) ?? 0) + (r.secs ?? 0)));
  const areas = [...tot.keys()].filter((a) => a !== 'Unlisted').sort((a, b) => (tot.get(b)! - tot.get(a)!));
  if (tot.has('Unlisted')) areas.push('Unlisted');
  return ['All', ...areas];
}

function ScreensBody({ d, mau }: { d: AnalyticsScreens; mau: number | null | undefined }) {
  const [area, setArea] = useState('All');
  const [allRows, setAllRows] = useState(false);
  const [allDead, setAllDead] = useState(false);
  const days = d.days ?? 30;
  const areas = useMemo(() => areaOrder(d.rows), [d.rows]);
  const filtered = area === 'All' ? d.rows : d.rows.filter((r) => r.area === area);
  const shown = allRows ? filtered : filtered.slice(0, 7);
  const maxSecs = Math.max(0, ...d.rows.map((r) => r.secs ?? 0));
  const unused = d.unused ?? d.unused_rows.length;
  const dead = allDead ? d.unused_rows : d.unused_rows.slice(0, 4);
  const perActive = mau != null && mau > 0 && d.views != null ? num(Math.round(d.views / mau)) : '\u2014';
  const hair = `1px solid ${CC3.hair}`;

  return (
    <>
      <Panel>
        <Head title="Screens" side={<span style={NUM}>last {days}d, members only</span>} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginTop: 12 }}>
          <Fig label="Used" value={num(d.used)} sub="screens" />
          <Fig label="Unused" value={num(d.unused)} valueColor={CC3.ink} sub="screens" />
          <Fig label="Views" value={num(d.views)} sub={`${perActive} per active member`} />
          <Fig label="Typical" value={dur(d.typical_secs)} sub="per screen view" />
        </div>
      </Panel>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {areas.map((a) => {
          const on = a === area;
          return (
            <button key={a} type="button" aria-pressed={on} onClick={() => { setArea(on ? 'All' : a); setAllRows(false); }} style={{
              height: 28, padding: '0 11px', borderRadius: 999, border: 0, fontSize: 11.5, fontWeight: 600,
              background: on ? CC3.ink : CC3.surface, color: on ? CC3.canvas : CC3.mute, cursor: 'pointer', fontFamily: 'inherit',
            }}>{a}</button>
          );
        })}
      </div>

      <Panel list>
        <Head title="Where members spend time" side="time · members" inset />
        {shown.map((r) => (
          <div key={r.route} style={{ padding: '10px 14px', borderTop: hair }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto 30px', columnGap: 10, alignItems: 'baseline' }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, lineHeight: 1.25, overflowWrap: 'anywhere' }}>{r.label}</span>
                <span style={{ display: 'block', fontSize: 11, color: CC3.faint, marginTop: 2, lineHeight: 1.35, overflowWrap: 'anywhere', ...NUM }}>{r.area} · {num(r.views)} views{r.members != null && r.members > 0 ? ` · ${dur(r.secs == null ? null : r.secs / r.members)} each` : ''}</span>
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 700, ...NUM }}>{dur(r.secs)}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: CC3.mute, textAlign: 'right', ...NUM }}>{num(r.members)}</span>
            </div>
            <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: CC3.track }}>
              <div style={{ height: '100%', width: `${maxSecs > 0 ? ((r.secs ?? 0) / maxSecs) * 100 : 0}%`, borderRadius: 2, background: CC3.ink }} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && <Muted style={{ padding: 14, borderTop: hair, color: CC3.faint }}>No screens in this area</Muted>}
        {filtered.length > 7 && (
          <FooterButton onClick={() => setAllRows((v) => !v)}>
            <span style={NUM}>{allRows ? 'Show fewer' : `${filtered.length - 7} more screens`}</span>
          </FooterButton>
        )}
      </Panel>

      <Panel list>
        <Head title="Nobody opened" side={<span style={NUM}><b style={{ color: CC3.ink, fontWeight: 700 }}>{num(unused)}</b> in {days} days</span>} inset />
        <div style={{ padding: '0 14px 10px', marginTop: -6, fontSize: 11.5, color: CC3.mute }}>Candidates to retire, or to link from somewhere members go</div>
        {unused === 0 ? (
          <Muted style={{ padding: '9px 16px 10px', borderTop: hair, ...NUM }}>Every screen was opened in {days} days.</Muted>
        ) : (
          <>
            {dead.map((r) => (
              <div key={r.route} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 12, alignItems: 'center', padding: '10px 14px', borderTop: hair }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, lineHeight: 1.25, overflowWrap: 'anywhere' }}>{r.label}</span>
                  <span style={{ display: 'block', fontSize: 11, color: CC3.faint, marginTop: 2, lineHeight: 1.35, overflowWrap: 'anywhere' }}>{r.route}</span>
                </span>
                <span style={{ fontSize: 11, color: CC3.faint, whiteSpace: 'nowrap', ...NUM }}>{r.last_seen ? `last ${dateLabel(r.last_seen)}` : 'never'}</span>
              </div>
            ))}
            {unused > 4 && (
              <FooterButton onClick={() => setAllDead((v) => !v)}>
                <span style={NUM}>{allDead ? 'Show fewer' : `${num(unused - 4)} more · ${num(d.dev_hidden)} dev screens hidden`}</span>
              </FooterButton>
            )}
          </>
        )}
      </Panel>
    </>
  );
}
