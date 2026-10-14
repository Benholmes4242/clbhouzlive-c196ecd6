import React from 'react';
import { adminTheme as t } from '../../theme';
import { useAnalyticsBehaviour, type AnalyticsBehaviour } from '../../hooks/useAnalyticsLenses';
import { DAY_NAMES, DASH, num, pct, wait } from './analyticsFormat';
import { Fig, Head, LIT, Muted, Panel, ROW_RULE, Slot } from './analyticsUi';

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
    <Panel style={{ padding: '14px 0 6px' }}>
      <div style={{ padding: '0 16px 10px' }}>
        <Head title="What keeps members" side="users · back in 4 wks" />
        <div style={{ marginTop: 4, fontSize: 11.5, color: t.inkMuted }}>
          Average member: <span style={{ color: t.ink, fontWeight: 700 }}>{pct(avg)}</span> come back. Each feature's users against that line.
        </div>
      </div>
      {f.rows.length === 0 ? (
        <Muted style={{ padding: '9px 16px', borderTop: ROW_RULE }}>Not enough members yet to compare features.</Muted>
      ) : f.rows.map((r) => {
        const lift = avg && r.ret != null ? r.ret / avg : null;
        const tone = liftTone(lift);
        return (
          <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '96px minmax(0, 1fr) 40px 40px', columnGap: 8, alignItems: 'center', padding: '9px 16px', borderTop: ROW_RULE }}>
            <span>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700 }}>{r.name}</span>
              <span style={{ display: 'block', fontSize: 10.5, color: t.inkFaint }}>{num(r.users)} users</span>
            </span>
            <span style={{ position: 'relative', height: 10, borderRadius: 3, background: LIT.track }}>
              <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.max(0, Math.min(100, r.ret ?? 0))}%`, borderRadius: 3, background: tone === 'good' ? t.ok : t.ink }} />
              {avg != null && <span style={{ position: 'absolute', left: `${Math.max(0, Math.min(100, avg))}%`, top: -3, bottom: -3, width: 2, background: t.inkFaint }} />}
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 800, textAlign: 'right' }}>{pct(r.ret)}</span>
            <span style={{ fontSize: 11, fontWeight: 800, textAlign: 'right', color: tone === 'good' ? t.okText : tone === 'bad' ? t.dangerText : t.inkMuted }}>
              {lift == null ? DASH : `${lift.toFixed(1)}x`}
            </span>
          </div>
        );
      })}
      <div style={{ padding: '8px 16px 6px', fontSize: 11, color: t.inkFaint }}>Shows who uses what, not proof a feature makes them stay.</div>
    </Panel>
  );
}

function Rhythm({ d }: { d: AnalyticsBehaviour }) {
  const { grid, busiest, weekend_pct } = d.rhythm;
  const max = Math.max(0, ...grid.flat());
  return (
    <Panel>
      <Head title="Golf rhythm" side="time in app by hour" />
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {grid.map((row, di) => (
          <div key={di} style={{ display: 'grid', gridTemplateColumns: '30px repeat(12, minmax(0, 1fr))', gap: 3, alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: t.inkFaint }}>{DAY_NAMES[di]}</span>
            {row.map((secs, si) => {
              const level = secs === 0 || max === 0 ? 0 : Math.ceil((6 * secs) / max);
              return <span key={si} style={{ height: 18, borderRadius: 3, background: level === 0 ? 'rgba(255,255,255,0.04)' : `rgba(255,168,58,${(0.12 + level * 0.145).toFixed(2)})` }} />;
            })}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 4, display: 'grid', gridTemplateColumns: '30px repeat(4, minmax(0, 1fr))', gap: 3, fontSize: 9.5, fontWeight: 700, color: t.inkFaint }}>
        <span /><span>00</span><span>06</span><span>12</span><span>18</span>
      </div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: ROW_RULE, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        <Fig label="Busiest" size={16} value={busiest ? `${DAY_NAMES[busiest.dow] ?? DASH} ${String(busiest.slot * 2).padStart(2, '0')}:00` : DASH} />
        <Fig label="Weekend share" size={16} value={pct(weekend_pct)} />
      </div>
    </Panel>
  );
}

function AfterRound({ d }: { d: AnalyticsBehaviour }) {
  const a = d.after_round;
  const top = a.first_screens[0]?.pct ?? 0;
  return (
    <Panel>
      <Head title="After a round" side="rounds synced 30d" />
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        <Fig label="Rounds" size={20} value={num(a.rounds)} />
        <Fig label="Opened in 24h" size={20} value={pct(a.opened_pct)} valueColor={t.okText} />
        <Fig label="Median wait" size={20} value={wait(a.median_wait_secs)} />
      </div>
      <div style={{ marginTop: 14, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.inkFaint }}>First screen they open</div>
      {a.first_screens.length === 0 ? (
        <Muted style={{ marginTop: 8 }}>No rounds synced in 30 days.</Muted>
      ) : (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {a.first_screens.slice(0, 4).map((f) => (
            <div key={f.label} style={{ display: 'grid', gridTemplateColumns: '96px minmax(0, 1fr) 36px', columnGap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{f.label}</span>
              <span style={{ height: 10, borderRadius: 3, background: LIT.track }}>
                <span style={{ display: 'block', height: '100%', width: `${top > 0 ? Math.min(100, ((f.pct ?? 0) / top) * 100) : 0}%`, borderRadius: 3, background: t.ink }} />
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, textAlign: 'right' }}>{pct(f.pct)}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

const SHARE_COLOURS = ['#E9EDF3', '#FFA83A', 'rgba(233,237,243,0.6)', 'rgba(255,168,58,0.55)'];
const ELSE_COLOUR = 'rgba(233,237,243,0.25)';

function TimeShare({ d }: { d: AnalyticsBehaviour }) {
  const rows = d.time_share;
  const colour = (area: string, i: number) => (area === 'Everything else' ? ELSE_COLOUR : SHARE_COLOURS[i] ?? ELSE_COLOUR);
  return (
    <Panel>
      <Head title="Where the time goes" side="all members · 30d" />
      {rows.length === 0 ? (
        <Muted style={{ marginTop: 12 }}>No screen time recorded in 30 days.</Muted>
      ) : (
        <>
          <div style={{ marginTop: 12, display: 'flex', height: 14, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
            {rows.map((r, i) => (
              <div key={r.area} style={r.area === 'Everything else'
                ? { flex: 1, background: ELSE_COLOUR }
                : { width: `${r.pct ?? 0}%`, background: colour(r.area, i) }} />
            ))}
          </div>
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px 12px', fontSize: 12 }}>
            {rows.map((r, i) => (
              <span key={r.area} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: colour(r.area, i), marginRight: 6 }} />{r.area}</span>
                <span style={{ fontWeight: 800 }}>{pct(r.pct)}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
