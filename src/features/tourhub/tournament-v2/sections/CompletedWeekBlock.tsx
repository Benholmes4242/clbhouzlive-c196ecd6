/**
 * COMPLETED STATE — the shared block both pages render for a finished
 * stroke-play event: HOW IT WAS WON → <SURNAME> ON EACH HOLE TYPE → THE TOP
 * THREE → Full leaderboard → THE WEEK. Figures come from
 * get_tournament_week_facts (useTournamentWeekFacts); the top three reads the
 * leaderboard rows the caller already holds. No dividers anywhere.
 */
import React from 'react';
import { Trophy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { BoardEntry } from '../../leaderboard/BoardTable';
import { copy, score } from '../data/tournamentRules';
import { holeTypeCells, holeTypeHeading, pathCells, topThreeRows, weekCells, type FactCell, type WeekFacts } from '../data/weekFactsRules';
import { HERO_POS_TYPE, HERO_TOT_TYPE } from './HeroBoardRows';
import { getScoreColor } from '../../_shared/scoreColor';
import './heroRoundPanel.css';
import './completedWeek.css';

function Cell({ c }: { c: FactCell }) {
  const color = getScoreColor(c.toPar ?? 0, 'dark', 'ink-neutral');
  return (
    <div className="cw-cell" data-cw-cell={c.key}>
      <b style={{ ...HERO_TOT_TYPE, color }}>
        {c.pos ? <><i style={HERO_POS_TYPE}>{c.pos}</i><strong style={{ fontWeight: 'inherit', color }}>{c.value}</strong></> : c.value}
      </b>
      <span data-long-label={c.longLabel || undefined}>{c.label}</span>
    </div>
  );
}

export function CompletedWeekBlock({ facts, rows, onFullBoard }: { facts: WeekFacts; rows: BoardEntry[]; onFullBoard?: () => void }) {
  const path = pathCells(facts);
  const holes = holeTypeCells(facts);
  const week = weekCells(facts);
  const last = facts.rounds || facts.path.length;
  const top = topThreeRows(rows, facts.champion_player_id, last);
  return (
    <div className="cw-block" data-completed-week>
      {path.length > 0 ? <>
        <h3 className="cw-kick">{copy('wasWon')}</h3>
        <div className="cw-figs cw-path" data-cw-section="path" style={{ ['--cw-n' as string]: path.length }}>{path.map((c) => <Cell key={c.key} c={c} />)}</div>
      </> : null}
      {holes ? <>
        <h4 className="cw-sub">{holeTypeHeading(facts)}</h4>
        <div className="cw-figs" data-cw-section="holes" style={{ ['--cw-n' as string]: holes.length }}>{holes.map((c) => <Cell key={c.key} c={c} />)}</div>
      </> : null}
      {top.length > 0 ? <>
        <div className="cw-hrow" data-cw-section="top">
          <h3 className="cw-kick">{copy('wkTopThree')}</h3>
          <span>{`R${last}`}</span><span>TOT</span>
        </div>
        {top.map((r) => (
          <div className="cw-lr" key={r.id} data-cw-top-row>
            <span className="cw-p" style={HERO_POS_TYPE}>{r.winner ? <Trophy size={13} className="recap-trophy" aria-hidden /> : r.pos}</span>
            <span className="cw-n">{r.name}</span>
            <span className="cw-r" style={{ color: getScoreColor(r.last, 'dark', 'ink-neutral') }}>{r.last == null ? '' : score(r.last)}</span>
            <span className="cw-v" style={{ ...HERO_TOT_TYPE, color: getScoreColor(r.total, 'dark', 'ink-neutral') }}>{r.total == null ? '' : score(r.total)}</span>
          </div>
        ))}
      </> : null}
      {onFullBoard ? (
        <div className="hero-expand-board">
          <Button variant="ghost" className="hero-full-leaderboard" data-hero-full-leaderboard data-field-size={rows.length} onClick={onFullBoard}>
            {copy('wkFullLeaderboard')}
            <span className="hero-full-leaderboard-count">{copy('wkFieldSize', { n: rows.length })}<b aria-hidden="true">›</b></span>
          </Button>
        </div>
      ) : null}
      {week.length > 0 ? <>
        <h3 className="cw-kick">{copy('wkWeek')}</h3>
        <div className="cw-grid" data-cw-section="week">{week.map((c) => <Cell key={c.key} c={c} />)}</div>
      </> : null}
    </div>
  );
}
