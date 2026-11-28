/** Briefs 48/48A: overview-only board, tiles, movers and heat card. Existing
 * tournament rows, scores, query ownership and full-board navigation stay intact. */
import { useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BoardFlag, boardCountry } from '../../_shared/BoardFlag';
import { resolveBoardEntity } from '../../_shared/boardEntity';
import type { CutInput } from '../../_shared/cutDisplay';
import { STATUS_NEGATIVE } from '../../_shared/tokens';
import { surnameOf } from '../../_shared/playerName';
import { todayFromEntry, type BoardEntry } from '../../leaderboard/BoardTable';
import { ScorecardSheet, type ScorecardSheetTarget } from '../../leaderboard/ScorecardSheet';
import { useTeeTimesAll } from '../../tournament-v2/data/useTeeTimesAll';
import { thruLabel } from '../../tournament-v2/sections/MiniBoard';
import { fmtScore } from '../../utils/fmtScore';
import type { MovementCard } from './overviewTokens';
import { HeroSectionHead, type HeroSectionHeadProps } from './HeroSectionHead';
import { leaderboardTitle, runnerUpTitle, moversTitle, liveCourseTitle } from './heroHeadRules';
import { holeAverages, initialSurname, ordinal, type LiveStage } from './liveStateRules';
import { venueTee } from './upcomingOverviewRules';
import { hybridBoardRounds, hybridCutFooter, type HybridTile } from './hybridOverviewRules';
import type { TournamentHoleAnalysis } from '../../tournament-v2/data/useTournamentHoleAnalysis';
import { tournamentRoute } from '../../routes';

export function HybridHead(props: HeroSectionHeadProps) { return <div className="ov48-head"><HeroSectionHead {...props} action={props.action?.replace(/\s*›$/, '')} /></div>; }
export function HybridTiles({ cells }: { cells: HybridTile[] }) {
  if (!cells.length) return null;
  const ring = cells.some(c => c.finished != null);
  return <div className="ov48-tiles" data-overview-hybrid-tiles style={{ gridTemplateColumns: ring && cells.length > 1 ? `1.4fr repeat(${cells.length - 1},minmax(0,1fr))` : `repeat(${cells.length},minmax(0,1fr))` }}>
    {cells.map(c => <div key={c.key} className={c.finished != null ? 'ov48-tile ov48-ring-tile' : 'ov48-tile'} data-hybrid-tile={c.key}>
      {c.finished != null ? <svg viewBox="0 0 64 64" aria-label={`${c.finished} of ${c.playing ?? 0} finished`}><circle cx="32" cy="32" r="26" fill="none" stroke="var(--ov48-track)" strokeWidth="6" /><circle cx="32" cy="32" r="26" fill="none" stroke="var(--ov48-live)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${Math.min(1, (c.playing ?? 0) > 0 ? c.finished / (c.playing ?? 1) : 0) * 163.36} 163.36`} transform="rotate(-90 32 32)" /></svg> : null}
      <div><b className={c.under ? 'ov48-under' : c.key === 'Next hole' ? 'ov48-live-value' : undefined}>{c.value}{c.finished != null ? <small>/{c.playing}</small> : null}</b><div className="ov48-tile-label">{c.label}</div></div>
    </div>)}
  </div>;
}
export function HybridBoard({ tournamentId, entries, round, completed = false, stage, nextRound, zone, winnerId, cut, onFullBoard, onRowTap }: { tournamentId: string; entries: BoardEntry[]; round: number; completed?: boolean; stage?: LiveStage; nextRound?: number | null; zone?: string | null; winnerId?: string | null; cut: CutInput; onFullBoard?: () => void; onRowTap?: (id: string) => void }) {
  const { t } = useTranslation('tourhub'); const [target, setTarget] = useState<ScorecardSheetTarget | null>(null);
  const teeQuery = useTeeTimesAll(tournamentId, nextRound ?? 1, { enabled: !completed && stage === 'between' && nextRound != null });
  const tees = new Map<string, string>();
  if (stage === 'between' && teeQuery.isSuccess) for (const g of teeQuery.data ?? []) for (const p of g.players) { const v = venueTee(g.teeTime, zone ?? null); if (v) tees.set(p.id, v.time); }
  const rounds = hybridBoardRounds(round, completed); const rows = entries.slice(0, 10);
  const columns = completed ? `28px minmax(0,1fr) ${rounds.map(() => '26px').join(' ')} 40px` : `28px minmax(0,1fr) 30px ${rounds.map(() => '28px').join(' ')} 42px`;
  const narrow = completed ? `28px minmax(0,1fr) ${rounds.slice(-2).map(() => '26px').join(' ')} 40px` : `26px minmax(0,1fr) 28px ${rounds.length ? '28px ' : ''}40px`;
  const team = entries.some(e => !!e.team);
  const title = completed ? runnerUpTitle(t as never, entries.filter(e => e.score != null && e.position != null).map(e => ({ name: surnameOf(e.player?.full_name ?? resolveBoardEntity(e, false).lines.join(' / ')), total: e.score as number, champion: e.id === winnerId })), entries.filter(e => e.score === rows[0]?.score).length > 1) : leaderboardTitle(t as never, entries.map(e => ({ name: surnameOf(e.player?.full_name ?? resolveBoardEntity(e, false).lines.join(' / ')), score: e.score, status: e.status })));
  const footer = hybridCutFooter(cut, entries);
  const hidden = (n: number) => completed ? n < Math.max(1, round - 1) : n !== round;
  return <section data-overview-hybrid-board>
    <HybridHead eyebrow={completed ? 'Final leaderboard' : 'Leaderboard'} title={title} live={!completed && stage !== 'between' && stage !== 'suspended'} action={onFullBoard ? `All ${completed ? entries.filter(e => e.position != null && !['MC', 'CUT', 'WD', 'DQ', 'DNS'].includes((e.status ?? '').toUpperCase())).length : entries.length} ›` : undefined} onAction={onFullBoard} />
    <div className="ov48-card" style={{ '--ov48-columns': columns, '--ov48-narrow-columns': narrow } as CSSProperties}>
      <div className="ov48-board-grid ov48-board-header"><span>POS</span><span>{team ? 'TEAM' : 'PLAYER'}</span>{!completed ? <span>THRU</span> : null}{rounds.map(n => <span key={n} className={hidden(n) ? 'ov48-round-hidden' : undefined}>R{n}</span>)}<span>TOT</span></div>
      {rows.map(e => {
        const name = e.team ? resolveBoardEntity(e, false, 'surname').lines.join(' / ') : e.player?.full_name ?? '';
        const countries = e.team ? [...new Set((e.team.members ?? []).map(m => boardCountry(m.player)).filter((c): c is string => !!c))] : [boardCountry(e.player)].filter((c): c is string => !!c);
        const today = todayFromEntry(e, round); const pid = e.player?.id ?? null;
        const pos = ['MC', 'CUT', 'WD', 'DQ'].includes((e.status ?? '').toUpperCase()) ? e.status : e.position != null ? `${e.position_tied ? 'T' : ''}${e.position}` : '';
        const onOpen = () => { if (!pid) return; onRowTap?.(pid); setTarget({ playerId: pid, playerName: name, countryCode: boardCountry(e.player), position: e.position, positionTied: e.position_tied, total: e.score, today, thru: e.thru ?? null, status: e.status }); };
        const content = <><span className="ov48-board-pos">{completed && e.id === winnerId ? <Trophy size={13} className="ov48-gold" aria-label="Champion" /> : pos}</span><span className="ov48-who"><span className="ov48-name">{name}</span><span className="ov48-flags">{countries.map(country => <BoardFlag key={country} country={country} />)}</span></span>{!completed ? <span className="ov48-thru">{stage === 'between' && tees.size > 0 ? pid ? tees.get(pid) ?? '' : '' : thruLabel(e, today)}</span> : null}{rounds.map(n => { const v = todayFromEntry(e, n); return <span key={n} className={`ov48-round${hidden(n) ? ' ov48-round-hidden' : ''}${v != null && v < 0 ? ' ov48-under' : ''}`} data-level={v === 0 ? '' : undefined}>{v == null ? '' : fmtScore(v)}</span>; })}<span className={e.score != null && e.score < 0 ? 'ov48-total ov48-under' : 'ov48-total'}>{e.score == null ? '' : fmtScore(e.score)}</span></>;
        return pid ? <Button key={e.id} variant={null} size={null} className="ov48-board-grid ov48-board-row" data-hero-board-row={e.id} data-hybrid-board-row onClick={onOpen} aria-label={name}>{content}</Button> : <div key={e.id} className="ov48-board-grid ov48-board-row" data-hero-board-row={e.id} data-hybrid-board-row>{content}</div>;
      })}
      {footer ? <div className="ov48-cut" data-hybrid-cut={footer.kind}><span>{footer.kind === 'projected' ? 'Projected cut' : 'Cut'}</span><b>{footer.line} · {footer.count} {footer.kind === 'projected' ? 'players' : 'made it'}</b></div> : null}
    </div><ScorecardSheet open={!!target} onClose={() => setTarget(null)} tournamentId={tournamentId} target={target} />
  </section>;
}
export function HybridMovers({ cards, round, weekday }: { cards: MovementCard[]; round: number; weekday?: string | null }) {
  const { t } = useTranslation('tourhub'); if (!cards.length) return null;
  return <section data-overview-movement><HybridHead eyebrow={t('overview.biggestMovers', { round })} title={moversTitle(t as never, cards.map(c => ({ name: surnameOf(c.name), delta: c.delta })))} /><div className="ov48-movers">{cards.map(c => <div className="ov48-mover" key={c.key} data-overview-movement-card><div className="ov48-mover-value"><span data-movement-dir={c.delta > 0 ? 'up' : 'down'} style={{ color: c.delta > 0 ? 'var(--ov48-live)' : STATUS_NEGATIVE }}>{c.delta > 0 ? '▲' : '▼'}</span><span data-movement-places>{Math.abs(c.delta)}</span></div><b className="ov48-mover-name">{initialSurname(c.name)}</b>{c.toPar != null ? <span className={c.toPar < 0 ? 'ov48-mover-score ov48-under' : 'ov48-mover-score'}>{fmtScore(c.toPar)} {weekday ?? 'today'}</span> : null}</div>)}</div></section>;
}
export function HybridCourse({ analysis, tournamentId, completed = false, roundCount }: { analysis: TournamentHoleAnalysis | null; tournamentId: string; completed?: boolean; roundCount?: number }) {
  const { t } = useTranslation('tourhub'); const navigate = useNavigate();
  if (!analysis?.available) return null; const avg = holeAverages(analysis.holes);
  const values = avg.holes.filter(h => h.value != null); if (!values.length) return null;
  const max = Math.max(...values.map(h => Math.abs(h.value ?? 0)));
  const hard = [...values].sort((a, b) => (b.value ?? 0) - (a.value ?? 0)).slice(0, 3);
  const easy = [...values].sort((a, b) => (a.value ?? 0) - (b.value ?? 0)).slice(0, 3);
  const total = avg.total; const title = total == null ? '' : completed ? Math.abs(total) < .005 ? 'Played level for the week' : `Played ${Math.abs(total).toFixed(2)} ${total > 0 ? 'over' : 'under'} par for the week` : liveCourseTitle(t as never, total, false).title;
  const target = tournamentRoute(tournamentId, { kind: 'overview' });
  return <section data-overview-course data-hybrid-course><HybridHead eyebrow="The course" title={title} action="Guide" onAction={() => navigate(`${target.to}?section=course`, { state: target.state })} /><div className="ov48-card ov48-heat-card"><div className="ov48-heat-grid">{avg.holes.map(h => { const under = h.value != null && h.value < 0; const alpha = h.value == null || h.value === 0 || max === 0 ? 8 : 100 * (under ? .15 + .6 * Math.abs(h.value) / max : .08 + .8 * h.value / max); return <div key={h.hole} className="ov48-heat-hole" data-hole={h.hole} data-under={under ? '' : undefined} style={{ '--ov48-heat-alpha': `${alpha}%` } as CSSProperties}><i /><span>{h.hole}</span></div>; })}</div><div className="ov48-heat-split">{[['HARDEST', hard], ['EASIEST', easy]].map(([label, holes]) => <div key={label as string}><div className="ov48-heat-label">{label as string} {completed ? 'THIS WEEK' : 'TODAY'}</div>{(holes as typeof hard).map(h => <div className="ov48-heat-row" key={h.hole}><span>{ordinal(h.hole)}</span><b className={(h.value ?? 0) < 0 ? 'ov48-under' : undefined}>{h.value != null ? `${h.value < 0 ? '−' : '+'}${Math.abs(h.value).toFixed(2)}` : ''}</b></div>)}</div>)}</div><div className="ov48-heat-key">{completed ? `Field average to par over ${roundCount ?? analysis.rounds_present.length} rounds.` : 'Field average to par.'} Lighter is harder, red is under par.</div></div></section>;
}