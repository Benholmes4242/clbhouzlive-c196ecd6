/**
 * COMPLETED STATE — the shared block both pages render for a finished
 * stroke-play event: HOW IT WAS WON → <SURNAME> ON EACH HOLE TYPE → THE TOP
 * THREE → Full leaderboard → THE WEEK. Figures come from
 * get_tournament_week_facts (useTournamentWeekFacts); the top three reads the
 * leaderboard rows the caller already holds. No dividers anywhere.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { BoardEntry } from '../../leaderboard/BoardTable';
import { copy, score } from '../data/tournamentRules';
import { holeTypeCells, holeTypeHeading, wonChart, topThreeRows, weekCells, type FactCell, type WeekFacts } from '../data/weekFactsRules';
import { WonChart } from './WonChart';
import { HERO_POS_TYPE, HERO_TOT_TYPE } from './HeroBoardRows';
import { getScoreColor } from '../../_shared/scoreColor';
import './heroRoundPanel.css';
import './completedWeek.css';
import { HeroSectionHead } from '../../components/overview-v3/HeroSectionHead';
import { holeTypeTitle, runnerUpTitle, weekTitle, wonTitle } from '../../components/overview-v3/heroHeadRules';
import { surnameOf } from '../../_shared/playerName';

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

export function CompletedWeekBlock({ facts, rows, onFullBoard, tourCode = 'pga' }: { facts: WeekFacts; rows: BoardEntry[]; onFullBoard?: () => void; tourCode?: string }) {
  const chart = wonChart(facts, rows, 335);
  const holes = holeTypeCells(facts);
  const week = weekCells(facts);
  const last = facts.rounds || facts.path.length;
  const top = topThreeRows(rows, facts.champion_player_id, last);
  const { t } = useTranslation('tourhub');
  const tt = t as never;
  return (
    <div className="cw-block" data-completed-week>
      {chart ? <>
        <HeroSectionHead eyebrow={copy('wasWon')} title={wonTitle(tt, chart.lines.map(l => ({ ...l, name: surnameOf(l.name) })), facts.rounds)} />
        <WonChart facts={facts} rows={rows} tourCode={tourCode} />
      </> : null}
      {holes ? <>
        <HeroSectionHead eyebrow={holeTypeHeading(facts)} title={holeTypeTitle(tt, facts.hole_types)} />
        <div className="cw-figs" data-cw-section="holes" style={{ ['--cw-n' as string]: holes.length }}>{holes.map((c) => <Cell key={c.key} c={c} />)}</div>
      </> : null}
      {top.length > 0 ? <>
        <HeroSectionHead eyebrow={copy('wkTopThree')} title={topThreeTitle(tt, rows, facts)} />
        <div className="cw-hrow hero-head-cols" data-cw-section="top" style={{ paddingTop: 0 }}>
          <span /><span /><span>{`R${last}`}</span><span>TOT</span>
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
        <Button variant={null} size={null} className="cw-lr cw-more" data-hero-full-leaderboard data-field-size={rows.length} aria-label={`Full leaderboard, ${rows.length} players`} onClick={onFullBoard}>
          <span /><span className="cw-n">{rows.length - top.length} more players</span><span /><span className="cw-v" aria-hidden>›</span>
        </Button>
      ) : null}
      {week.length > 0 ? <>
        <HeroSectionHead eyebrow={copy('wkWeek')} title={weekTitle(tt, facts.cut, facts.field_size, score)} />
        <div className="cw-grid" data-cw-section="week">{week.map(c => <div className="cw-week-cell" data-cw-cell={c.key} key={c.key}><b data-under={c.under || undefined}>{c.value}</b><span>{c.label}</span><em>{c.detail}</em></div>)}</div>
      </> : null}
    </div>
  );
}

/** Rule (i): runnerUpTitle over the finished board's active rows. */
export function topThreeTitle(t: Parameters<typeof runnerUpTitle>[0], rows: BoardEntry[], facts: Pick<WeekFacts, 'champion_player_id' | 'playoff'>): string {
  const out = ['MC', 'CUT', 'WD', 'DQ'];
  const lines = rows.filter(r => r.player && r.position != null && r.score != null && !out.includes((r.status ?? '').toUpperCase()))
    .map(r => ({ name: surnameOf(r.player?.full_name ?? ''), total: r.score as number, champion: facts.champion_player_id != null && (r.player?.id === facts.champion_player_id || r.player?.sr_id === facts.champion_player_id) }));
  return runnerUpTitle(t, lines, facts.playoff);
}
