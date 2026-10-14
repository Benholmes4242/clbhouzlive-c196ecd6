import React from 'react';
import { Link } from 'react-router-dom';
import { adminTheme as t } from '../../theme';
import { useAnalyticsHealth, type AnalyticsHealth } from '../../hooks/useAnalyticsLenses';
import { type Range, rangeDays } from './analyticsLens';
import { DASH, dateLabel, delta, deltaLabel, num, pct, ratio } from './analyticsFormat';
import { Fig, Head, LIT, Panel, Slot } from './analyticsUi';

const RANGES: Range[] = ['7d', '30d', '90d'];

export default function HealthLens({ range, onRange }: { range: Range; onRange: (r: Range) => void }) {
  // Range drives Daily and Growth only; the RPC still returns the fixed
  // figures (weekly golfers, wau, mau, sticky, handicap, cohorts) unchanged.
  const q = useAnalyticsHealth(rangeDays(range));
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ display: 'flex', gap: 2, padding: 2, borderRadius: 999, background: t.surface }}>
          {RANGES.map((r) => {
            const on = r === range;
            return (
              <button key={r} type="button" onClick={() => onRange(r)} aria-pressed={on} style={{
                height: 28, padding: '0 12px', borderRadius: 999, border: 0, fontSize: 11.5, fontWeight: 700,
                background: on ? t.ink : 'transparent', color: on ? t.canvas : t.inkMuted, cursor: 'pointer', fontFamily: 'inherit',
              }}>{r}</button>
            );
          })}
        </span>
      </div>
      <Slot q={q} height={196}>{(d) => <WeeklyGolfers d={d} />}</Slot>
      <Slot q={q} height={74}>{(d) => <Strip d={d} />}</Slot>
      <Slot q={q} height={232}>{(d) => <HandicapEffect d={d} />}</Slot>
      <Slot q={q} height={250}>{(d) => <Cohorts d={d} />}</Slot>
      <Slot q={q} height={168}>{(d) => <Growth d={d} days={rangeDays(range)} />}</Slot>
    </>
  );
}

function weekBarColour(i: number): string {
  if (i === 11) return t.brand;
  if (i >= 8) return t.ink;
  if (i >= 4) return LIT.inkSoft;
  return 'rgba(233,237,243,0.3)';
}

function WeeklyGolfers({ d }: { d: AnalyticsHealth }) {
  const wg = d.weekly_golfers;
  const weeks = wg.weeks.slice(-12);
  const max = Math.max(0, ...weeks.map((w) => w.n ?? 0));
  const diff = wg.this_week != null && wg.last_week_to_date != null ? wg.this_week - wg.last_week_to_date : null;
  const chip = diff == null ? null
    : diff > 0 ? { text: `+${diff} on last week`, bg: LIT.okChip, fg: t.okText }
    : diff < 0 ? { text: `${diff} on last week`, bg: LIT.dangerChip, fg: t.dangerText }
    : { text: 'same as last week', bg: LIT.neutralChip, fg: t.inkMuted };
  return (
    <Panel>
      <Head title="Weekly golfers" side="north star" />
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{num(wg.this_week)}</span>
        {chip && <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: chip.bg, color: chip.fg }}>{chip.text}</span>}
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: t.inkMuted }}>Members who opened the app this week and have rounds clbhouz can analyse</div>
      <div style={{ marginTop: 14, height: 64, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 4, alignItems: 'end' }}>
        {Array.from({ length: 12 }, (_, i) => {
          const v = weeks[i - (12 - weeks.length)]?.n ?? 0;
          const h = max > 0 ? `${(v / max) * 100}%` : '2px';
          return <div key={i} style={{ height: h, minHeight: 2, background: weekBarColour(i), borderRadius: '3px 3px 1px 1px' }} />;
        })}
      </div>
      <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 9.5, fontWeight: 700, color: t.inkFaint }}>
        <span>12 weeks ago</span><span>this week</span>
      </div>
    </Panel>
  );
}

function Strip({ d }: { d: AnalyticsHealth }) {
  const a = d.activity;
  const wauPct = ratio(a.wau, a.members_ex_staff);
  const mauPct = ratio(a.mau, a.members_ex_staff);
  const sticky = ratio(a.dau_avg_30, a.mau);
  return (
    <Panel style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
      <Fig label="Daily" value={num(a.dau_avg)} sub={`peak ${num(a.dau_peak)}`} />
      <Fig label="Weekly" value={num(a.wau)} sub={wauPct == null ? DASH : `${wauPct}% of all`} />
      <Fig label="Monthly" value={num(a.mau)} sub={mauPct == null ? DASH : `${mauPct}% of all`} />
      <Fig label="Sticky" value={pct(sticky)} sub="daily of monthly" />
    </Panel>
  );
}

function EffectRow({ label, value, colour, bar, n }: { label: string; value: number | null; colour?: string; bar: string; n: number | null }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{label}</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: colour }}>{pct(value)}</span>
      </div>
      <div style={{ marginTop: 5, height: 10, borderRadius: 3, background: LIT.track }}>
        <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, value ?? 0))}%`, borderRadius: 3, background: bar }} />
      </div>
      <div style={{ marginTop: 3, fontSize: 10.5, color: t.inkFaint }}>{num(n)} members</div>
    </div>
  );
}

function HandicapEffect({ d }: { d: AnalyticsHealth }) {
  const h = d.handicap;
  const m = h.median_days_to_connect;
  return (
    <Panel>
      <Head title="The handicap effect" side="back in 4 weeks" />
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <EffectRow label="Connected a handicap" value={h.connected_back_pct} colour={t.okText} bar={t.ok} n={h.connected_n} />
        <EffectRow label="Not connected" value={h.not_connected_back_pct} bar={LIT.inkSoft} n={h.not_connected_n} />
      </div>
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${t.hairline}`, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center' }}>
        <span>
          <span style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.inkFaint }}>Median time to connect</span>
          <span style={{ display: 'block', marginTop: 2, fontSize: 16, fontWeight: 800 }}>
            {m == null ? DASH : m === 0 ? 'Same day' : (
              <>{m === 1 ? '1 day' : `${num(m)} days`} <span style={{ fontSize: 11, fontWeight: 700, color: t.inkMuted }}>after joining</span></>
            )}
          </span>
        </span>
        <Link to="/admin-v2/users?filter=not_connected" style={{
          height: 32, padding: '0 12px', borderRadius: 999, border: `1px solid ${t.line}`, display: 'inline-flex',
          alignItems: 'center', fontSize: 11.5, fontWeight: 700, color: t.ink, textDecoration: 'none',
        }}>See the {num(h.not_connected_n)}</Link>
      </div>
    </Panel>
  );
}

const COHORT_COLS = '52px 26px repeat(6, minmax(0, 1fr))';

function Cohorts({ d }: { d: AnalyticsHealth }) {
  return (
    <Panel>
      <Head title="Do they stay" side="share active, by month joined" />
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: COHORT_COLS, gap: 3, fontSize: 10, fontWeight: 700, color: t.inkFaint, alignItems: 'center' }}>
        <span /><span style={{ textAlign: 'right' }}>n</span>
        {['M0', 'M1', 'M2', 'M3', 'M4', 'M5'].map((m) => <span key={m} style={{ textAlign: 'center' }}>{m}</span>)}
      </div>
      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {d.cohorts.map((c, ri) => (
          <div key={c.month_start ?? ri} style={{ display: 'grid', gridTemplateColumns: COHORT_COLS, gap: 3, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700 }}>{c.month ?? DASH}</span>
            <span style={{ fontSize: 10.5, color: t.inkFaint, textAlign: 'right' }}>{num(c.n)}</span>
            {Array.from({ length: 6 }, (_, i) => {
              const v = c.n ? c.cells[i] ?? null : null;
              if (v == null) return <span key={i} style={{ height: 24, borderRadius: 4, background: 'rgba(255,255,255,0.03)' }} />;
              return (
                <span key={i} style={{
                  height: 24, borderRadius: 4, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 800,
                  background: `rgba(255,168,58,${Math.max(0.08, Math.min(1, v / 100)).toFixed(2)})`,
                  color: v >= 55 ? t.canvas : t.ink,
                }}>{v}</span>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: t.inkFaint }}>M1 is the month after joining. Small cohorts swing, so n sits beside each row.</div>
    </Panel>
  );
}

function Growth({ d, days }: { d: AnalyticsHealth; days: number }) {
  const g = d.growth;
  const dl = delta(g.joined, g.joined_prior);
  const max = Math.max(1, ...g.daily.map((x) => x.n ?? 0));
  const first = g.daily[0]?.d ?? null;
  const last = g.daily[g.daily.length - 1]?.d ?? null;
  return (
    <Panel>
      <Head title="Growth" side={`last ${d.days ?? days}d`} />
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        <Fig label="Joined" value={<>{num(g.joined)}{dl != null && <> <span style={{ fontSize: 11, fontWeight: 700, color: dl > 0 ? t.okText : dl < 0 ? t.dangerText : t.inkMuted }}>{deltaLabel(dl)}</span></>}</>}
          sub={`vs ${num(g.joined_prior)} before`} />
        <Fig label="Members" value={num(g.members)} sub="all time" />
        <Fig label="Connected" value={<>{num(g.connected_new)} <span style={{ fontSize: 11, fontWeight: 700, color: t.inkMuted }}>of {num(g.joined)}</span></>} sub="new joiners" />
      </div>
      <div style={{ marginTop: 12, height: 40, display: 'flex', gap: g.daily.length > 31 ? 1 : 2, alignItems: 'flex-end' }}>
        {g.daily.map((x, i) => {
          const v = x.n ?? 0;
          return <span key={x.d ?? i} style={{
            display: 'block', flex: 1, minWidth: 0, height: v > 0 ? `${(v / max) * 100}%` : '2%',
            borderRadius: '2px 2px 0 0', background: v > 0 ? t.ink : LIT.trackSoft,
          }} />;
        })}
      </div>
      <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 9.5, fontWeight: 700, color: t.inkFaint }}>
        <span>{dateLabel(first)}</span><span>joined per day</span><span>{dateLabel(last)}</span>
      </div>
    </Panel>
  );
}
