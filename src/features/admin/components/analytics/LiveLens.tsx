import React from 'react';
import { Link } from 'react-router-dom';
import { adminTheme as t } from '../../theme';
import { useAnalyticsLive, type AnalyticsLive, type LivePerson } from '../../hooks/useAnalyticsLenses';
import { DASH, londonHM, num, onFor } from './analyticsFormat';
import { Fig, Head, Muted, Panel, ROW_RULE, Slot } from './analyticsUi';

export default function LiveLens({ staff, onStaff }: { staff: boolean; onStaff: (v: boolean) => void }) {
  const q = useAnalyticsLive(staff, true);
  return (
    <>
      <Slot q={q} height={200}>{(d) => <Now d={d} staff={staff} onStaff={onStaff} />}</Slot>
      <Slot q={q} height={180}>{(d) => <WhoIsIn people={d.people} />}</Slot>
      <Slot q={q} height={140}>{(d) => <Last30 d={d} />}</Slot>
      <Slot q={q} height={200}>{(d) => <Busy tops={d.tops} />}</Slot>
      <div style={{ padding: '0 4px', fontSize: 11, lineHeight: 1.5, color: t.inkFaint }}>
        In the app means a screen view or tap in the last 5 minutes. Staff accounts are left out of every count on this page unless the switch is on.
      </div>
    </>
  );
}

function Now({ d, staff, onStaff }: { d: AnalyticsLive; staff: boolean; onStaff: (v: boolean) => void }) {
  const unit = staff && (d.staff_now ?? 0) > 0 ? `people, ${d.staff_now} staff` : d.now === 1 ? 'member' : 'members';
  return (
    <Panel style={{ padding: '18px 16px 16px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.inkFaint }}>In the app now</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
        <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{num(d.now)}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: t.inkMuted }}>{unit}</span>
      </div>
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, paddingTop: 12, borderTop: ROW_RULE }}>
        <Fig label="Today" value={num(d.today)} sub="members" />
        <Fig label="Peak today" value={num(d.peak)} sub={d.peak_at ? `at ${d.peak_at}` : DASH} />
        <Fig label="Same time" value={num(d.same_time_last_week)} sub={d.last_week_day ? `last ${d.last_week_day}` : DASH} />
      </div>
      <button type="button" role="switch" aria-checked={staff} onClick={() => onStaff(!staff)} style={{
        marginTop: 14, width: '100%', height: 40, borderRadius: 12, border: 0, background: 'rgba(255,255,255,0.05)', color: t.ink,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', fontSize: 12.5, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <span>Include staff accounts</span>
        <span style={{ width: 38, height: 22, borderRadius: 11, position: 'relative', display: 'block', background: staff ? t.ok : 'rgba(255,255,255,0.16)' }}>
          <span style={{ position: 'absolute', top: 2, left: staff ? 18 : 2, width: 18, height: 18, borderRadius: 9, background: t.ink, transition: 'left 120ms' }} />
        </span>
      </button>
    </Panel>
  );
}

function initials(p: LivePerson): string {
  const src = (p.display_name || p.username || '?').trim();
  const parts = src.split(/\s+/).filter(Boolean);
  const s = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : src.slice(0, 2);
  return s.toUpperCase();
}

function WhoIsIn({ people }: { people: LivePerson[] }) {
  let memberIdx = 0;
  return (
    <Panel list>
      <Head title="Who is in" side="screen · on it for" inset />
      {people.length === 0 ? (
        <Muted style={{ padding: '10px 16px 12px', borderTop: ROW_RULE }}>Quiet right now.</Muted>
      ) : people.map((p) => {
        const bg = p.is_staff ? t.inkFaint : (memberIdx++ % 2 === 0 ? t.brand : t.okText);
        const name = p.display_name || (p.username ? `@${p.username}` : DASH);
        const screen = p.screen == null ? DASH : p.detail ? `${p.screen} - ${p.detail}` : p.screen;
        return (
          <Link key={p.id} to={`/admin-v2/users?member=${p.id}`} style={{
            display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center',
            padding: '10px 16px', borderTop: ROW_RULE, color: t.ink, textDecoration: 'none',
          }}>
            {p.photo ? (
              <img src={p.photo} alt="" style={{ width: 34, height: 34, borderRadius: 17, objectFit: 'cover' }} />
            ) : (
              <span style={{ width: 34, height: 34, borderRadius: 17, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, color: t.canvas, background: bg }}>{initials(p)}</span>
            )}
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700 }}>
                {name}
                {p.is_staff && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.inkFaint, padding: '2px 6px', borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>Staff</span>}
              </span>
              <span style={{ display: 'block', fontSize: 11, color: t.inkMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{screen}</span>
            </span>
            <span style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 800 }}>{onFor(p.on_secs)}</span>
              <span style={{ display: 'block', fontSize: 10, color: t.inkFaint }}>{p.session_secs == null ? DASH : `${Math.floor(p.session_secs / 60)} min in`}</span>
            </span>
          </Link>
        );
      })}
    </Panel>
  );
}

function Last30({ d }: { d: AnalyticsLive }) {
  const bars = d.bars.slice(-30);
  const max = Math.max(0, ...bars);
  const at = d.computed_at ? new Date(d.computed_at).getTime() : NaN;
  const ago = (m: number) => (Number.isNaN(at) ? DASH : londonHM(at - m * 60_000));
  return (
    <Panel>
      <Head title="Last 30 minutes" side={`${num(d.views_30m)} screen views`} />
      <div style={{ marginTop: 14, height: 72, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
        {bars.map((v, i) => (
          <div key={i} style={{
            flex: 1, borderRadius: '2px 2px 0 0', minHeight: 2,
            height: `${max > 0 ? Math.max(3, Math.round((100 * v) / max)) : 3}%`,
            background: i >= bars.length - 5 ? t.brand : 'rgba(233,237,243,0.35)',
          }} />
        ))}
      </div>
      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: t.inkFaint }}>
        <span>{ago(30)}</span><span>{ago(15)}</span><span>now</span>
      </div>
    </Panel>
  );
}

function Busy({ tops }: { tops: AnalyticsLive['tops'] }) {
  const first = tops[0]?.n ?? 0;
  return (
    <Panel list>
      <Head title="Busy right now" side="views · 30 min" inset />
      {tops.length === 0 ? (
        <Muted style={{ padding: '10px 16px 12px', borderTop: ROW_RULE }}>No screen views in 30 minutes.</Muted>
      ) : tops.slice(0, 4).map((r) => (
        <div key={r.label} style={{ padding: '10px 16px', borderTop: ROW_RULE }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{r.label}</span>
            <span style={{ fontSize: 13, fontWeight: 800 }}>{num(r.n)}</span>
          </div>
          <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
            <div style={{ height: '100%', width: `${first > 0 ? ((r.n ?? 0) / first) * 100 : 0}%`, borderRadius: 2, background: t.ink }} />
          </div>
        </div>
      ))}
    </Panel>
  );
}
