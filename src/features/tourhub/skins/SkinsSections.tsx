/** Brief 47 — skins game sections: fact band, The skins table, Hole by hole
 * and the Also this week rows. Every figure comes from one SkinsResult
 * (skinsRules.ts); row taps open the canonical ScorecardSheet. */
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ScorecardSheet, type ScorecardSheetTarget } from '../leaderboard/ScorecardSheet';
import { BoardFlag, boardCountry } from '../_shared/BoardFlag';
import type { BoardEntry } from '../leaderboard/BoardTable';
import { skinsBiggestPot, skinsHolesLabel, skinsPlayoffNote, skinsPositions, type SkinsResult } from './skinsRules';
import './skins.css';
export { SkinsProgress } from './SkinsProgress';

const DASH = '–';

export function SkinsFactBand({ result, final = false }: { result: SkinsResult; final?: boolean }) {
  /* Brief 47A: the finished band — total awarded (playoff included), ties, biggest hole pot, playoff pot. */
  const cells: Array<[string, string]> = final ? [
    ['Skins', String(result.skinsWon)],
    ['Holes tied', String(result.holesTied)],
    ['Biggest pot', String(skinsBiggestPot(result))],
    ['Playoff', result.playoff ? String(result.playoff.pot) : DASH],
  ] : [
    ['Skins won', String(result.skinsWon)],
    ['Carrying', String(result.carrying)],
    ['Next hole', result.nextWorth == null ? DASH : String(result.nextWorth)],
    ['Holes tied', String(result.holesTied)],
  ];
  return <div className="skins-band" data-skins-band>{cells.map(([label, value]) => <div key={label} data-skins-fact={label}><b>{value}</b><i>{label}</i></div>)}</div>;
}

function targetOf(e: BoardEntry): ScorecardSheetTarget | null {
  if (!e.player?.id) return null;
  return { playerId: e.player.id, playerName: e.player.full_name, countryCode: e.player.country_code ?? null, position: e.position, total: e.score, today: null, thru: e.thru ?? null, status: e.status ?? null };
}

export function SkinsTable({ result, entryById, tournamentId, limit, compact = false, overviewHybrid = false }: { result: SkinsResult; entryById: Map<string, BoardEntry>; tournamentId: string; limit?: number; compact?: boolean; overviewHybrid?: boolean }) {
  const [target, setTarget] = useState<ScorecardSheetTarget | null>(null);
  const players = limit != null ? result.players.slice(0, limit) : result.players;
  const pos = skinsPositions(result.players);
  return <>
    <div className="skins-table" data-skins-table data-compact={compact ? '' : undefined}>
      <div className="skins-th"><span /><span />{!compact && <span>HOLES WON</span>}<span>SKINS</span></div>
      {players.map((p, i) => {
        const entry = entryById.get(p.id);
        const t = entry ? targetOf(entry) : null;
        // Same inert/tappable RowTag pattern as HeroBoardRows; layout stays inline, not a single-class Button rule.
        const RowTag = t ? Button : 'div';
        return <RowTag key={p.id} {...(t ? { type: 'button' as const, variant: 'ghost' as const, role: 'button', tabIndex: 0, 'aria-haspopup': 'dialog' as const } : { role: 'group' })}
          className={t ? 'active:bg-white/[0.06] transition-colors' : undefined} data-skins-row={p.id} data-skins-tr
          aria-label={`${p.name}, ${p.skins} skins`} onClick={t ? () => setTarget(t) : undefined}
          style={{ display: 'grid', gridTemplateColumns: compact ? '26px minmax(0,1fr) 48px' : overviewHybrid ? '26px minmax(0,1fr) 112px 40px' : '26px minmax(0,1fr) 92px 48px', gap: overviewHybrid ? 4 : 8, alignItems: 'center', width: '100%', minHeight: 44, height: 'auto', padding: 0, border: 0, borderTop: '1px solid rgba(255,255,255,.06)', borderRadius: 0, background: 'transparent', color: '#F8FAFC', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, textAlign: 'left', cursor: t ? 'pointer' : 'default' }}>
          <span>{pos[i] ?? ''}</span>
          <span className="skins-who"><span className="skins-nm">{p.name}</span><BoardFlag country={boardCountry(entry?.player)} /></span>
          {!compact && <span className="skins-hw">{skinsHolesLabel(p)}</span>}
          <span className="skins-sk">{p.skins}</span>
        </RowTag>;
      })}
    </div>
    <ScorecardSheet open={!!target} onClose={() => setTarget(null)} tournamentId={tournamentId} target={target} />
  </>;
}

function Nine({ result, from, label }: { result: SkinsResult; from: number; label: string }) {
  const holes = result.holes.filter((h) => h.hole >= from && h.hole < from + 9);
  if (holes.length === 0) return null;
  const pad = Array.from({ length: 9 - holes.length }, (_, i) => <span key={`pad-${i}`} />);
  return <div className="skins-nine" data-skins-nine={label}>
    <div className="skins-nl">{label}</div>
    <div className="skins-g skins-hd"><span />{holes.map((h) => <span key={h.hole}>{h.hole}</span>)}{pad}</div>
    <div className="skins-g skins-par"><span>PAR</span>{holes.map((h) => <span key={h.hole}>{h.par ?? ''}</span>)}{pad}</div>
    <div className="skins-g skins-skr"><span>SKINS</span>{holes.map((h) => h.state === 'won'
      ? <span key={h.hole} className="won" data-skins-cell="won">{h.pot}</span>
      : h.state === 'carried' ? <span key={h.hole} className="cy" data-skins-cell="carried">→</span>
      : h.state === 'next' ? <span key={h.hole} className="nx" data-skins-cell="next">{h.pot}</span>
      : <span key={h.hole} data-skins-cell="later" />)}{pad}</div>
    {result.players.map((p) => <div key={p.id} className="skins-g skins-pr" data-skins-player={p.id}>
      <span className="pn">{p.surname}</span>
      {holes.map((h) => {
        const s = p.strokes.get(h.hole);
        if (s == null) return <span key={h.hole} className="tbd">·</span>;
        return <span key={h.hole} className={h.winner === p.id ? 'win' : ''} data-skins-win={h.winner === p.id ? '' : undefined}>{s}</span>;
      })}{pad}
    </div>)}
  </div>;
}

export function SkinsHoleByHole({ result }: { result: SkinsResult }) {
  return <>
    <Nine result={result} from={1} label="OUT" />
    <Nine result={result} from={10} label="IN" />
    {result.playoff ? <div className="skins-po" data-skins-playoff><b>Playoff</b><span>{skinsPlayoffNote(result)}</span></div> : null}
    <div className="skins-key" data-skins-key><span><i className="skins-kw" />Won the hole</span><span><i className="skins-kc">→</i>Tied, carried</span><span>Skins row: what each hole paid</span></div>
  </>;
}

export function SkinsGutter({ children }: { children: ReactNode }) { return <div className="skins-gutter">{children}</div>; }
