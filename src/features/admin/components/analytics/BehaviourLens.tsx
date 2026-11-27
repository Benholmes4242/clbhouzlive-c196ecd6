/**
 * ANALYTICS_V3_2_BEHAVIOUR: the Behaviour lens in the v3 grammar, matching the
 * signed-off cc3-analytics-behaviour.html. Data is useAnalyticsBehaviour only.
 */
import React from 'react';
import { useAnalyticsBehaviour, type AnalyticsBehaviour } from '../../hooks/useAnalyticsLenses';
import { DAY_NAMES, DASH, num, pct, wait } from './analyticsFormat';
import { FIG_LABEL, Fig, Head, Muted, Panel, Slot } from './analyticsUi';
import { CC3, NUM } from '../InboxPanels';

const HAIR = `1px solid ${CC3.hair}`;
const SMALL_SAMPLE = 10;

export default function BehaviourLens() {
  const q = useAnalyticsBehaviour();
  return (
    <>
      <Slot q={q} height={420}>{(d) => <Features d={d} />}</Slot>
      <Slot q={q} height={262}>{(d) => <Rhythm d={d} />}</Slot>
      <Slot q={q} height={248}>{(d) => <AfterRound d={d} />}</Slot>
      <Slot q={q} height={150}>{(d) => <TimeShare d={d} />}</Slot>
    </>
  );
}

/** Thresholds read the RAW ratio: 61/41 = 1.49 labels '1.5x' but is not green. */
export function liftTone(lift: number | null): 'good' | 'bad' | 'flat' {
  if (lift == null) return 'flat';
  if (lift >= 1.5) return 'good';
  if (lift < 1) return 'bad';
  return 'flat';
}

function Features({ d }: { d: AnalyticsBehaviour }) {
  const f = d.features;
  const avg = f.avg_ret;
  return (
    <Panel list>
      <Head inset title="What keeps members" side="users · back in 4 wks · lift" />
      <div style={{ padding: '0 14px 10px', marginTop: -6, fontSize: 11.5, color: CC3.mute }}>
        Average member: <span style={{ color: CC3.ink, fontWeight: 700, ...NUM }}>{pct(avg)}</span> come back. The mark on each bar is that average.
      </div>
      {f.rows.length === 0 ? (
        <Muted style={{ padding: '9px 14px', borderTop: HAIR }}>Not enough members yet to compare features.</Muted>
      ) : f.rows.map((r) => {
        const lift = avg && r.ret != null ? r.ret / avg : null;
        const tone = liftTone(lift);
        const small = r.users != null && r.users < SMALL_SAMPLE;
        const liftColour = small ? CC3.faint : tone === 'good' ? CC3.good : tone === 'bad' ? CC3.bad : CC3.mute;
        return (
          <div key={r.name} data-feature-row data-small={small ? 'true' : undefined} style={{
            display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 92px 38px 34px', columnGap: 8, alignItems: 'center',
            padding: '9px 14px', borderTop: HAIR, opacity: small ? 0.6 : undefined,
          }}>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 600, lineHeight: 1.25, overflowWrap: 'anywhere' }}>{r.name}</span>
              <span style={{ display: 'block', marginTop: 2, fontSize: 11, lineHeight: 1.35, color: CC3.faint, ...NUM }}>{num(r.users)} users{small ? ' · small sample' : ''}</span>
            </span>
            <span style={{ position: 'relative', height: 10, borderRadius: 3, background: CC3.track }}>
              <span data-bar-tone={!small && tone === 'good' ? 'good' : 'ink'} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.max(0, Math.min(100, r.ret ?? 0))}%`, borderRadius: 3, background: !small && tone === 'good' ? CC3.good : CC3.ink }} />
              {avg != null && <span style={{ position: 'absolute', left: `${Math.max(0, Math.min(100, avg))}%`, top: -3, bottom: -3, width: 2, borderRadius: 1, background: CC3.mute }} />}
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 700, textAlign: 'right', ...NUM }}>{pct(r.ret)}</span>
            <span data-tone={small ? 'faint' : tone} style={{ fontSize: 11, fontWeight: 700, textAlign: 'right', color: liftColour, ...NUM }}>
              {lift == null ? DASH : `${lift.toFixed(1)}×`}
            </span>
          </div>
        );
      })}
      <div style={{ padding: '10px 14px', borderTop: HAIR, fontSize: 10.5, fontWeight: 600, color: CC3.faint }}>Shows who uses what, not proof a feature makes them stay. Green from 1.5×, red under 1×.</div>
    </Panel>
  );
}

/** "Wed 20:00 to 22:00"; the last block rolls to 00:00. */
export function busiestLabel(b: { dow: number; slot: number } | null): string {
  if (!b) return DASH;
  const hh = (h: number) => `${String(h % 24).padStart(2, '0')}:00`;
  return `${DAY_NAMES[b.dow] ?? DASH} ${hh(b.slot * 2)} to ${hh(b.slot * 2 + 2)}`;
}

const HOURS = ['00', '', '', '06', '', '', '12', '', '', '18', '', ''];
const HEAT_COLS = '30px repeat(12, minmax(0, 1fr))';

function Rhythm({ d }: { d: AnalyticsBehaviour }) {
  const { grid, busiest, weekend_pct } = d.rhythm;
  const max = Math.max(0, ...grid.flat());
  const dayLabel: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: CC3.faint };
  return (
    <Panel>
      <Head title="Golf rhythm" side="time in app, 2-hour blocks" />
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {grid.map((row, di) => (
          <div key={di} style={{ display: 'grid', gridTemplateColumns: HEAT_COLS, gap: 3, alignItems: 'center' }}>
            <span style={{ ...dayLabel, letterSpacing: '0.02em' }}>{DAY_NAMES[di]}</span>
            {row.map((secs, si) => {
              const level = secs === 0 || max === 0 ? 0 : Math.ceil((6 * secs) / max);
              return <span key={si} style={{ display: 'block', height: 18, borderRadius: 3, background: level === 0 ? 'rgba(255,255,255,0.035)' : `rgba(233,237,243,${(0.08 + level * 0.14).toFixed(2)})` }} />;
            })}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 4, display: 'grid', gridTemplateColumns: HEAT_COLS, gap: 3, alignItems: 'center' }}>
        <span />{HOURS.map((h, i) => <span key={i} style={dayLabel}>{h}</span>)}
      </div>
      <div style={{ marginTop: 12, paddingTop: 11, borderTop: HAIR, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        <Fig label="Busiest" size={16} value={busiestLabel(busiest)} />
        <Fig label="Weekend share" size={16} value={pct(weekend_pct)} sub="29% if every day were equal" />
      </div>
    </Panel>
  );
}

function AfterRound({ d }: { d: AnalyticsBehaviour }) {
  const a = d.after_round;
  const top = a.first_screens[0]?.pct ?? 0;
  const opened = a.rounds != null && a.opened_pct != null ? `${Math.round((a.rounds * a.opened_pct) / 100)} of ${num(a.rounds)} rounds` : DASH;
  return (
    <Panel>
      <Head title="After a round" side="rounds synced, 30d" />
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        <Fig label="Rounds" value={num(a.rounds)} />
        <Fig label="Opened in 24h" value={pct(a.opened_pct)} valueColor={CC3.ink} sub={opened} />
        <Fig label="Median wait" value={wait(a.median_wait_secs)} sub="sync to opening" />
      </div>
      <div style={{ marginTop: 12, paddingTop: 11, borderTop: HAIR }}>
        <span style={FIG_LABEL}>First screen they open</span>
        {a.first_screens.length === 0 ? (
          <Muted style={{ marginTop: 10 }}>No rounds synced in 30 days.</Muted>
        ) : (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {a.first_screens.slice(0, 4).map((f) => (
              <div key={f.label} style={{ display: 'grid', gridTemplateColumns: '96px minmax(0, 1fr) 36px', columnGap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, overflowWrap: 'anywhere' }}>{f.label}</span>
                <span style={{ height: 10, borderRadius: 3, background: CC3.track, overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${top > 0 ? Math.min(100, ((f.pct ?? 0) / top) * 100) : 0}%`, borderRadius: 3, background: CC3.ink }} />
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'right', ...NUM }}>{pct(f.pct)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

export const SHARE_COLOURS = [CC3.ink, 'rgba(233,237,243,0.7)', 'rgba(233,237,243,0.45)', 'rgba(233,237,243,0.25)'];
export const ELSE_COLOUR = CC3.track;
export function shareColour(area: string, i: number): string {
  return area === 'Everything else' ? ELSE_COLOUR : SHARE_COLOURS[i] ?? ELSE_COLOUR;
}

function TimeShare({ d }: { d: AnalyticsBehaviour }) {
  const rows = d.time_share;
  return (
    <Panel>
      <Head title="Where the time goes" side="all members, 30d" />
      {rows.length === 0 ? (
        <Muted style={{ marginTop: 12 }}>No screen time recorded in 30 days.</Muted>
      ) : (
        <>
          <div style={{ marginTop: 12, display: 'flex', height: 12, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
            {rows.map((r, i) => (
              <div key={r.area} data-share={r.area} data-colour={shareColour(r.area, i)} style={{ height: '100%', width: `${r.pct ?? 0}%`, background: shareColour(r.area, i) }} />
            ))}
          </div>
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px 14px' }}>
            {rows.map((r, i) => (
              <span key={r.area} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, minWidth: 0 }}>
                <span style={{
                  flex: 'none', display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: shareColour(r.area, i),
                  boxShadow: r.area === 'Everything else' ? `inset 0 0 0 1px ${CC3.line}` : undefined,
                }} />
                <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{r.area}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 700, ...NUM }}>{pct(r.pct)}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
