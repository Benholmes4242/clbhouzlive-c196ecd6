/** Verified elite-amateur Ranking tab. ProfilePageV2 gates on the summary read,
 * so this never mounts without a row. A failed history or events read removes
 * only its own sections — no figure is ever shown from a failed read. Chart
 * colours come from INDEX_DELTA.dark; wins use the gam gold #FBBC2E. */
import { useId, useState } from 'react';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';
import { useAmateurCareer, useAmateurEvents, useAmateurHistory, useAmateurSummary } from './useAmateurRanking';
import { amateurCareerEntries, amateurCareerTotals, axisLabel, eventMonthLabel, finishLabel, rankingChartPoints, rankingLabelY, rankingMovement, type RankingMovementPart } from './rankingTabRules';
import { wagrOrdinal } from './wagrSettingsRules';
import { Button } from '@/components/ui/button';
import { ProCollectionSheet, type CollectionPanel } from '@/features/pro-profile/ProCollectionSheets';
import '@/features/pro-profile/pro-profile.css';
import './ranking-tab.css';

const UP = INDEX_DELTA.dark.improved;
const GOLD = '#FBBC2E';
const CANVAS = '#0A0A0C';

function MovementPart({ part }: { part: RankingMovementPart }) {
  if (part.direction === 'same') return <>no change</>;
  return <span className={part.direction === 'up' ? 'amr-up' : 'amr-down'}>{part.direction === 'up' ? '▲' : '▼'} {part.amount}</span>;
}

export function ProfileRankingTab({ userId, isOwner = false }: { userId: string; isOwner?: boolean }) {
  const gradientId = useId();
  const summary = useAmateurSummary(userId);
  const ready = summary.isSuccess && summary.data != null;
  const history = useAmateurHistory(userId, ready);
  const events = useAmateurEvents(userId, ready);
  const career = useAmateurCareer(userId, ready);
  const [panel, setPanel] = useState<CollectionPanel | null>(null);
  const [expanded, setExpanded] = useState(false);
  const data = summary.data;
  if (!data) return null;
  const rows = history.isSuccess ? history.data ?? [] : [];
  const moments = career.isSuccess ? career.data ?? [] : [];
  const entries = amateurCareerEntries(rows, moments);
  const totals = history.isSuccess ? amateurCareerTotals(rows) : null;
  const movement = rankingMovement(rows);
  const points = rows.length >= 2 ? rankingChartPoints(rows) : [];
  const eventRows = events.isSuccess ? events.data ?? [] : [];
  const shown = expanded ? eventRows : eventRows.slice(0, 5);
  const first = points[0];
  const lastPoint = points[points.length - 1];
  const area = points.length >= 2
    ? `M${first.x},118 ${points.map(p => `L${p.x},${p.y}`).join(' ')} L${lastPoint.x},118 Z`
    : '';
  const tile = (label: string, value: string | number | null, gold = false) => (
    <div className="amr-tile" key={label}><b className={gold ? 'amr-gold' : undefined}>{value ?? '–'}</b><span>{label}</span></div>
  );
  return <div className="amateur-ranking-tab" data-testid="profile-ranking-tab">
    <section className="amr-section">
      <div className="amr-hl">
        <strong>#{data.rank ?? '–'}</strong>
        <div>
          <b>WORLD AMATEUR RANKING</b>
          {movement && <p><MovementPart part={movement.thisWeek} /> this week{movement.year ? <> · <MovementPart part={movement.year} /> in a year</> : null}</p>}
        </div>
      </div>
      {points.length >= 2 && <svg viewBox="0 0 350 118" width="100%" height={118} preserveAspectRatio="none" className="amr-ch">
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={UP} stopOpacity=".22" /><stop offset="1" stopColor={UP} stopOpacity="0" /></linearGradient></defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <polyline points={points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={UP} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => p.finish === '1' ? <circle key={i} cx={p.x} cy={p.y} r="2.6" fill={GOLD} stroke={CANVAS} strokeWidth="1.2" /> : null)}
        <circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill="#F8FAFC" stroke={CANVAS} strokeWidth="1.5" />
        <text x={first.x - 2} y={rankingLabelY(first.y, -16, 14)} className="amr-cl" textAnchor="start">{first.rank.toLocaleString('en-GB')}</text>
        <text x={lastPoint.x - 8} y={rankingLabelY(lastPoint.y, -8, 14)} className="amr-cl amr-hi" textAnchor="end">{lastPoint.rank.toLocaleString('en-GB')}</text>
        <text x="4" y="115" className="amr-ax">{axisLabel(rows[0].week)}</text>
        <text x="346" y="115" className="amr-ax" textAnchor="end">{axisLabel(rows[rows.length - 1].week)}</text>
      </svg>}
      <div className="amr-tiles">
        {tile('BEST RANK', data.best_rank != null ? wagrOrdinal(data.best_rank) : null)}
        {tile('WINS', totals?.wins ?? null, true)}
        {tile('TOP 10S', totals?.top10s ?? null)}
        {tile('EVENTS', totals?.events ?? null)}
      </div>
    </section>
    {events.isSuccess && <section className="amr-section">
      <div className="amr-hd"><h2>RECENT EVENTS</h2><span className="amr-src">World Amateur Golf Ranking®</span></div>
      {shown.map(event => {
        const fin = finishLabel(event.finish);
        const when = eventMonthLabel(event);
        return <div className="amr-ev" key={event.wagr_event_id}>
          <span className={`amr-fin${fin.dim ? ' amr-dim' : ''}`}>{fin.text}</span>
          <span className="amr-nm"><b>{event.event_name}</b><small>{when}{event.country ? `${when ? ' · ' : ''}${event.country}` : ''}</small></span>
          <span className="amr-pts">{event.points != null ? event.points.toFixed(2) : '–'}<i>PTS</i></span>
        </div>;
      })}
      {!expanded && eventRows.length > 5 && <button type="button" className="amr-all" onClick={() => setExpanded(true)}>See all {eventRows.length} counting events ›</button>}
    </section>}
    {(entries.length > 0 || isOwner) && <section className="amr-section" data-amateur-career>
      <div className="amr-hd"><h2>CAREER</h2>{isOwner && moments.length > 0 && <Button variant={null} size={null} className="amr-edit" onClick={() => setPanel({kind:'career',mode:'list'})}>Edit</Button>}</div>
      <div className="amr-career">{entries.map((entry,index) => <div key={entry.id} data-career-entry data-win={entry.is_win ? '' : undefined}>
        {entries[index-1]?.year !== entry.year && <b>{entry.year}</b>}
        <span>{entry.text}{entry.derived && <small>From WAGR</small>}</span>
      </div>)}</div>
      {isOwner && <div className="amr-add"><div><b>Add a career moment</b><small>County caps, club titles, team selections. Wins show in gold.</small></div><Button variant={null} size={null} className="amr-cmd" onClick={() => setPanel({kind:'career',mode:'edit'})}>Add</Button></div>}
    </section>}
    {isOwner && panel && <ProCollectionSheet panel={panel} setPanel={setPanel} userId={userId} bag={[]} partners={[]} moments={moments} amateur careerTable="amateur_career_moments" careerKey={['amateur-career',userId]}/>}
    <div className="amr-foot">Points average {data.points_average != null ? data.points_average.toFixed(2) : '–'} · last 104 weeks · updated weekly from WAGR®</div>
  </div>;
}
