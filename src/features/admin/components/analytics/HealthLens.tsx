/**
 * ANALYTICS_V3_1_HEALTH: the Health lens in the v3 grammar, matching the
 * signed-off cc3-analytics-health.html. Data is useAnalyticsHealth only.
 * The range control drives Active members' Daily figure and Growth only.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useAnalyticsHealth, type AnalyticsHealth } from '../../hooks/useAnalyticsLenses';
import { type Range, rangeDays } from './analyticsLens';
import { DASH, dateLabel, num, pct, ratio } from './analyticsFormat';
import { FIG_LABEL, Fig, Head, Panel, Slot } from './analyticsUi';
import { CC3, NUM } from '../InboxPanels';
import { btnOutline } from '../InboxQueueRow';
import { ccDelta } from '../../pages/cc3Rules';

const RANGES: Range[] = ['7d', '30d', '90d'];
const INK_30 = 'rgba(233,237,243,0.3)';
const INK_55 = 'rgba(233,237,243,0.55)';
const TONE = { mu: CC3.mute, up: CC3.good, dn: CC3.bad } as const;
const SMALL: React.CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: 0 };

export default function HealthLens({ range, onRange }: { range: Range; onRange: (r: Range) => void }) {
  const q = useAnalyticsHealth(rangeDays(range));
  return (
    <>
      <Slot q={q} height={196}>{(d) => <WeeklyGolfers d={d} />}</Slot>
      <RangeRow range={range} onRange={onRange} />
      <Slot q={q} height={100}>{(d) => <ActiveMembers d={d} />}</Slot>
      <Slot q={q} height={250}>{(d) => <HandicapEffect d={d} />}</Slot>
      <Slot q={q} height={250}>{(d) => <Cohorts d={d} />}</Slot>
      <Slot q={q} height={168}>{(d) => <Growth d={d} days={rangeDays(range)} />}</Slot>
    </>
  );
}

function RangeRow({ range, onRange }: { range: Range; onRange: (r: Range) => void }) {
  return (
    <div data-range-row style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={FIG_LABEL}>Range for activity and growth</span>
      <span style={{ display: 'inline-flex', background: CC3.inset, borderRadius: 999, padding: 3 }}>
        {RANGES.map((r) => {
          const on = r === range;
          return (
            <button key={r} type="button" onClick={() => onRange(r)} aria-pressed={on} style={{
              height: 24, padding: '0 10px', borderRadius: 999, border: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
              background: on ? CC3.ink : 'transparent', color: on ? CC3.canvas : CC3.faint, cursor: 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}>{r}</button>
          );
        })}
      </span>
    </div>
  );
}

function WeeklyGolfers({ d }: { d: AnalyticsHealth }) {
  const wg = d.weekly_golfers;
  const weeks = wg.weeks.slice(-12);
  const max = Math.max(0, ...weeks.map((w) => w.n ?? 0));
  const dl = wg.this_week != null && wg.last_week_to_date != null ? ccDelta(wg.this_week, wg.last_week_to_date) : null;
  return (
    <Panel>
      <Head title="Weekly golfers" side="north star · 12 weeks" />
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, ...NUM }}>{num(wg.this_week)}</span>
        {dl && <span data-weekly-delta={dl.tone} style={{ fontSize: 12, fontWeight: 700, color: TONE[dl.tone], ...NUM }}>{dl.text} vs last week so far</span>}
      </div>
      <div style={{ marginTop: 4, fontSize: 12, color: CC3.mute }}>Members who opened the app this week and have rounds clbhouz can analyse</div>
      <div style={{ marginTop: 14, height: 64, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 4, alignItems: 'end' }}>
        {Array.from({ length: 12 }, (_, i) => {
          const v = weeks[i - (12 - weeks.length)]?.n ?? 0;
          const h = max > 0 ? `${(v / max) * 100}%` : '2px';
          return <div key={i} style={{ height: h, minHeight: 2, background: i === 11 ? CC3.ink : INK_30, borderRadius: '3px 3px 0 0' }} />;
        })}
      </div>
      <div style={{ marginTop: 5, display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: CC3.faint }}>
        <span>12 weeks ago</span><span style={{ color: CC3.ink }}>this week</span>
      </div>
    </Panel>
  );
}

function ActiveMembers({ d }: { d: AnalyticsHealth }) {
  const a = d.activity;
  const wauPct = ratio(a.wau, a.members_ex_staff);
  const mauPct = ratio(a.mau, a.members_ex_staff);
  const sticky = ratio(a.dau_avg_30, a.mau);
  return (
    <Panel>
      <Head title="Active members" side={<>of <b style={{ color: CC3.ink, fontWeight: 700 }}>{num(a.members_ex_staff)}</b>, staff excluded</>} />
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
        <Fig label="Daily" value={num(a.dau_avg)} sub={`avg · peak ${num(a.dau_peak)}`} />
        <Fig label="Weekly" value={num(a.wau)} sub={wauPct == null ? DASH : `${wauPct}% of all`} />
        <Fig label="Monthly" value={num(a.mau)} sub={mauPct == null ? DASH : `${mauPct}% of all`} />
        <Fig label="Sticky" value={pct(sticky)} sub="daily of monthly" />
      </div>
    </Panel>
  );
}

function EffectRow({ label, value, colour, bar, n }: { label: string; value: number | null; colour: string; bar: string; n: number | null }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{label}</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: colour, textAlign: 'right', ...NUM }}>{pct(value)}</span>
      </div>
      <div style={{ marginTop: 5, height: 10, borderRadius: 3, background: CC3.track, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, value ?? 0))}%`, borderRadius: 3, background: bar }} />
      </div>
      <div style={{ marginTop: 3, fontSize: 10.5, fontWeight: 600, color: CC3.faint, ...NUM }}>{num(n)} members</div>
    </div>
  );
}

export function handicapLift(connected: number | null, notConnected: number | null): string | null {
  if (connected == null || notConnected == null || notConnected === 0) return null;
  return (connected / notConnected).toFixed(1);
}

function HandicapEffect({ d }: { d: AnalyticsHealth }) {
  const h = d.handicap;
  const m = h.median_days_to_connect;
  const lift = handicapLift(h.connected_back_pct, h.not_connected_back_pct);
  return (
    <Panel>
      <Head title="The handicap effect" side="back within 4 weeks" />
      {lift != null && (
        <div data-lift style={{ marginTop: 10, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, ...NUM }}>
          {lift}× <span style={{ ...SMALL, color: CC3.mute }}>as likely to come back once connected</span>
        </div>
      )}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <EffectRow label="Connected a handicap" value={h.connected_back_pct} colour={CC3.good} bar={CC3.good} n={h.connected_n} />
        <EffectRow label="Not connected" value={h.not_connected_back_pct} colour={CC3.ink} bar={INK_55} n={h.not_connected_n} />
      </div>
      <div style={{ marginTop: 12, paddingTop: 11, borderTop: `1px solid ${CC3.hair}`, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center' }}>
        <span>
          <span style={{ ...FIG_LABEL, display: 'block' }}>Median time to connect</span>
          <span style={{ display: 'block', marginTop: 3, fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, ...NUM }}>
            {m == null ? DASH : m === 0
              ? <>Same day <span style={{ ...SMALL, color: CC3.mute }}>of joining, for those who connect</span></>
              : <>{m === 1 ? '1 day' : `${num(m)} days`} <span style={{ ...SMALL, color: CC3.mute }}>after joining, for those who connect</span></>}
          </span>
        </span>
        <Link to="/admin-v2/users?filter=not_connected" style={{ ...btnOutline(), textDecoration: 'none', textTransform: 'uppercase', ...NUM }}>
          See the {num(h.not_connected_n)}
        </Link>
      </div>
    </Panel>
  );
}

const COHORT_COLS = '44px 26px repeat(5, minmax(0, 1fr))';

export function cohortAlpha(v: number): string {
  return Math.max(0.08, Math.min(0.9, (v / 100) * 1.25)).toFixed(2);
}

function Cohorts({ d }: { d: AnalyticsHealth }) {
  return (
    <Panel>
      <Head title="Do they stay" side="share active, by month joined" />
      <div data-cohort-head style={{ marginTop: 12, display: 'grid', gridTemplateColumns: COHORT_COLS, gap: 3, fontSize: 10, fontWeight: 700, color: CC3.faint, alignItems: 'center' }}>
        <span /><span style={{ textAlign: 'right' }}>n</span>
        {['M1', 'M2', 'M3', 'M4', 'M5'].map((m) => <span key={m} style={{ textAlign: 'center' }}>{m}</span>)}
      </div>
      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {d.cohorts.map((c, ri) => {
          const dim = c.n != null && c.n < 10;
          return (
            <div key={c.month_start ?? ri} data-cohort-row data-dim={dim ? 'true' : undefined} style={{ display: 'grid', gridTemplateColumns: COHORT_COLS, gap: 3, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700 }}>{c.month ?? DASH}</span>
              <span style={{ fontSize: 10.5, color: CC3.faint, textAlign: 'right', ...NUM }}>{num(c.n)}</span>
              {Array.from({ length: 5 }, (_, j) => {
                const v = c.n ? c.cells[j + 1] ?? null : null;
                if (v == null) return <span key={j} data-cohort-cell="empty" style={{ height: 24, borderRadius: 4, background: 'transparent', boxShadow: `inset 0 0 0 1px ${CC3.track}` }} />;
                return (
                  <span key={j} data-cohort-cell="value" style={{
                    height: 24, borderRadius: 4, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 700, ...NUM,
                    background: `rgba(233,237,243,${cohortAlpha(v)})`, color: v >= 55 ? CC3.canvas : CC3.ink,
                    opacity: dim ? 0.55 : undefined,
                  }}>{v}</span>
                );
              })}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: CC3.faint }}>M1 is the month after joining. Rows under 10 members are dimmed; they swing.</div>
    </Panel>
  );
}

function Growth({ d, days }: { d: AnalyticsHealth; days: number }) {
  const g = d.growth;
  const dl = g.joined != null && g.joined_prior != null ? ccDelta(g.joined, g.joined_prior) : null;
  const max = Math.max(1, ...g.daily.map((x) => x.n ?? 0));
  const first = g.daily[0]?.d ?? null;
  const last = g.daily[g.daily.length - 1]?.d ?? null;
  const share = g.joined && g.connected_new != null ? `${Math.round((g.connected_new / g.joined) * 100)}% of new joiners` : DASH;
  return (
    <Panel>
      <Head title="Growth" side={`last ${d.days ?? days}d`} />
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        <Fig label="Joined" value={<>{num(g.joined)}{dl && <> <span data-growth-delta={dl.tone} style={{ ...SMALL, color: TONE[dl.tone] }}>{dl.text}</span></>}</>}
          sub={`vs ${num(g.joined_prior)} before`} />
        <Fig label="Members" value={num(g.members)} sub="all time" />
        <Fig label="Connected" value={<>{num(g.connected_new)} <span style={{ ...SMALL, color: CC3.mute }}>of {num(g.joined)}</span></>} sub={share} />
      </div>
      <div style={{ marginTop: 12, height: 40, display: 'flex', gap: g.daily.length > 31 ? 1 : 2, alignItems: 'flex-end' }}>
        {g.daily.map((x, i) => {
          const v = x.n ?? 0;
          return <span key={x.d ?? i} style={{
            display: 'block', flex: 1, minWidth: 0, height: v > 0 ? `${(v / max) * 100}%` : '2%',
            borderRadius: '2px 2px 0 0', background: v > 0 ? CC3.ink : CC3.track,
          }} />;
        })}
      </div>
      <div style={{ marginTop: 5, display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: CC3.faint }}>
        <span>{dateLabel(first)}</span><span>joined per day</span><span>{dateLabel(last)}</span>
      </div>
    </Panel>
  );
}
