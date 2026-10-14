import React, { useMemo, useState } from 'react';
import { adminTheme as t } from '../../theme';
import { useAnalyticsScreens, type AnalyticsScreens } from '../../hooks/useAnalyticsLenses';
import { dateLabel, dur, num } from './analyticsFormat';
import { Fig, FooterButton, Head, LIT, Muted, Panel, ROW_RULE, Slot } from './analyticsUi';

export default function ScreensLens() {
  const q = useAnalyticsScreens();
  return (
    <Slot q={q} height={74}>
      {(d) => <ScreensBody d={d} />}
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

function ScreensBody({ d }: { d: AnalyticsScreens }) {
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

  return (
    <>
      <Panel style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
        <Fig label="Used" value={num(d.used)} sub="screens" />
        <Fig label="Unused" value={num(d.unused)} valueColor={t.warnText} sub={`${days} days`} />
        <Fig label="Views" value={num(d.views)} sub={`${days} days`} />
        <Fig label="Typical" value={dur(d.typical_secs)} sub="per screen" />
      </Panel>

      <div className="admin-analytics-chips" style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {areas.map((a) => {
          const on = a === area;
          return (
            <button key={a} type="button" aria-pressed={on} onClick={() => { setArea(a); setAllRows(false); }} style={{
              flex: 'none', height: 34, padding: '0 14px', borderRadius: 999, border: 0, fontSize: 12, fontWeight: 700,
              background: on ? t.ink : t.surface, color: on ? t.canvas : t.ink, cursor: 'pointer', fontFamily: 'inherit',
            }}>{a}</button>
          );
        })}
        <style>{`.admin-analytics-chips::-webkit-scrollbar{display:none}`}</style>
      </div>

      <Panel list>
        <Head title="Where members spend time" side="time · members" inset />
        {shown.map((r) => (
          <div key={r.route} style={{ padding: '10px 16px', borderTop: ROW_RULE }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', columnGap: 12, alignItems: 'baseline' }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
                <span style={{ display: 'block', fontSize: 10.5, color: t.inkFaint }}>{r.area} · {num(r.views)} views</span>
              </span>
              <span style={{ fontSize: 13, fontWeight: 800 }}>{dur(r.secs)}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: t.inkMuted, width: 26, textAlign: 'right' }}>{num(r.members)}</span>
            </div>
            <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: LIT.trackSoft }}>
              <div style={{ height: '100%', width: `${maxSecs > 0 ? ((r.secs ?? 0) / maxSecs) * 100 : 0}%`, borderRadius: 2, background: t.ink }} />
            </div>
          </div>
        ))}
        {filtered.length > 7 && (
          <FooterButton onClick={() => setAllRows((v) => !v)}>
            {allRows ? 'Show fewer' : `${filtered.length - 7} more screens`}
          </FooterButton>
        )}
      </Panel>

      <Panel list>
        <div style={{ padding: '0 16px 10px' }}>
          <Head title="Nobody opened" side={`${num(unused)} in ${days} days`} sideStyle={{ fontWeight: 700, color: t.warnText }} />
          <div style={{ marginTop: 4, fontSize: 11.5, color: t.inkMuted }}>Candidates to retire or to link from somewhere members go</div>
        </div>
        {unused === 0 ? (
          <Muted style={{ padding: '9px 16px 10px', borderTop: ROW_RULE }}>Every screen was opened in {days} days.</Muted>
        ) : (
          <>
            {dead.map((r) => (
              <div key={r.route} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center', padding: '9px 16px', borderTop: ROW_RULE }}>
                <span>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>{r.label}</span>
                  <span style={{ display: 'block', fontSize: 10.5, color: t.inkFaint, fontFamily: 'ui-monospace, Menlo, monospace' }}>{r.route}</span>
                </span>
                <span style={{ fontSize: 11, color: t.inkFaint }}>{r.last_seen ? `last ${dateLabel(r.last_seen)}` : 'never'}</span>
              </div>
            ))}
            {unused > 4 && (
              <FooterButton onClick={() => setAllDead((v) => !v)}>
                {allDead ? 'Show fewer' : `${num(unused - 4)} more · ${num(d.dev_hidden)} dev screens hidden`}
              </FooterButton>
            )}
          </>
        )}
      </Panel>
    </>
  );
}
