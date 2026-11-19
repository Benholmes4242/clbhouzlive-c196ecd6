/** CB58: all data reads use existing tee hooks; live scoreboard is supplied
 * by the band. No placeholder or height tween. Board scoring, 22px avatar
 * source order, surname shortening and scorecard navigation remain canonical.
 */
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { formatTimeHm24, formatWeekdayShort } from '@/i18n/format';
import { todayFromEntry, type BoardEntry } from '../../../leaderboard/BoardTable';
import { ScorecardSheet, type ScorecardSheetTarget } from '../../../leaderboard/ScorecardSheet';
import { useTeeTimesAll, type TeeGroup } from '../../../tournament-v2/data/useTeeTimesAll';
import { useDrawnRounds } from '../../../tournament-v2/data/useDrawnRounds';
import { thruLabel } from '../../../tournament-v2/sections/MiniBoard';
import { resolvePlayerAvatarCandidates } from '../../../_shared/resolvePlayerAvatar';
import { isStrokeEvent } from '../../../_shared/eventFormat';
import { fmtScore } from '../../../utils/fmtScore';
import { LEADERS_GROUP as L } from './leadersGroupTokens';
import { allLeaders, groupState, leadersBaseRound, leadersShownRound, leadersGroupVisible, pickLeadersGroup, otherLeaders, leadersNote, roundEntry, leadersPositionOrder } from './leadersGroupRules';
import { getScoreColor } from '../../../_shared/scoreColor';
import { initialSurname } from '../liveStateRules';
import './liveStates.css';
import { WHITE_ALPHA_06 } from '../../../_shared/tokens';

interface Props {
  tournamentId: string; entries: BoardEntry[]; currentRound: number | null;
  totalRounds: number | null; phase: 'live' | 'upcoming' | 'completed';
  leaderboardLoading?: boolean; eventType?: string | null; tourSlug?: string | null;
  onRowTap?: (playerId: string) => void;
  /** Overview live states (signed-off tour-live-states mock): dim kicker, no
   * rule, rows without THRU/TODAY before the group tees off, and the Stopped
   * state line when suspended. Selection and reads are unchanged. */
  live?: boolean;
  suspended?: boolean;
}
export function LeadersGroup(props: Props) {
  const { entries, currentRound, totalRounds, tournamentId, phase, leaderboardLoading = false, eventType } = props;
  const leaders = allLeaders(entries);
  const eligible = leadersGroupVisible(phase, !isStrokeEvent(eventType) || entries.some(e => !!e.team), entries, leaderboardLoading) && currentRound != null && leaders.length > 0;
  const baseRound = leadersBaseRound(leaders, currentRound ?? 1);
  const current = useTeeTimesAll(tournamentId, baseRound, { enabled: eligible });
  const needsDraw = eligible && baseRound < (totalRounds ?? baseRound);
  const draw = useDrawnRounds(tournamentId, { enabled: needsDraw });
  // Read actual next-round membership before handover, not merely round existence.
  const nextRound = baseRound + 1;
  const next = useTeeTimesAll(tournamentId, nextRound, { enabled: needsDraw && (draw.data ?? []).includes(nextRound) });
  const shownRound = leadersShownRound(baseRound, current.data ?? [], leaders, entries, draw.data ?? [], totalRounds ?? baseRound, next.data ?? []);
  const selected = shownRound === baseRound ? current : next;
  const groups = selected.data ?? [];
  const group = pickLeadersGroup(groups, leaders, entries, shownRound);
  if (!eligible || current.isLoading || (needsDraw && draw.isLoading) || selected.isLoading || !group || groups.length === 0) return null;
  return <LeadersGroupContent {...props} round={shownRound} group={group} groups={groups} />;
}

/** Exported real display supports controlled state/height checks without extra reads. */
export function LeadersGroupContent({ tournamentId, entries, group, groups, round, tourSlug, onRowTap, live = false, suspended = false }: Props & { round: number; group: TeeGroup; groups: TeeGroup[] }) {
  const { t } = useTranslation('tourhub');
  const [target, setTarget] = useState<ScorecardSheetTarget | null>(null);
  const state = groupState(group, entries, round);
  const note = leadersNote(otherLeaders(group, allLeaders(entries), groups));
  const stateKey = state === 'onCourse' ? 'onCourse' : state === 'finished' ? 'finished' : 'teesOff';
  const stateText = live && suspended && state === 'onCourse' ? t('overview.leadersGroup.stopped') : state === 'before' ? t('overview.leadersGroup.teesOff', { day: formatWeekdayShort(group.teeTime), time: formatTimeHm24(group.teeTime) }) : t(`overview.leadersGroup.${stateKey}`);
  const scoreColor = (v: number | null | undefined) => live ? getScoreColor(v, 'dark') : v != null && v < 0 ? L.under : L.ink;
  const grid = live ? state === 'before' ? '28px minmax(0,1fr) 44px' : '28px minmax(0,1fr) 40px 44px 44px' : L.grid;
  const named = note?.names ?? [];
  const namesMarkup = named.map((name, i) => <span key={`${name}-${i}`}><span style={{ color: L.ink, fontWeight: 600 }}>{name}</span>{i < named.length - 2 ? ', ' : i === named.length - 2 ? t('overview.leadersGroup.and') : ''}</span>);
  return <>
    <section className={live ? "live-leaders" : undefined} data-leaders-today={live && state !== 'before' || undefined} data-leaders-group data-group-state={state} data-leaders-live={live || undefined} style={live ? { padding: '30px 20px 0', color: L.ink, lineHeight: 'normal' } : { padding: '14px 20px 12px', marginTop: 6, borderTop: `1px solid ${WHITE_ALPHA_06}`, color: L.ink, lineHeight: 'normal' }}>
      <div style={live ? { fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(248,250,252,.62)' } : { fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: L.amber }}>{t('overview.leadersGroup.kicker')}</div>
      <div data-leaders-group-state style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600 }}>
        {state === 'onCourse' && !(live && suspended) ? <span aria-hidden style={{ width: 7, height: 7, flexShrink: 0, borderRadius: '50%', background: L.live, boxShadow: L.halo }} /> : null}
        <span>{t('overview.leadersGroup.round', { round })}</span><span style={{ fontWeight: 500, color: L.mute }}>· {stateText}</span>
      </div>
      {live && state === 'before' ? null : live ? <div data-leaders-group-header style={{ display: 'grid', gridTemplateColumns: grid, gap: L.gap, alignItems: 'end', marginTop: 10, paddingBottom: 6, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(248,250,252,.42)' }}>
        <span /><span /><span style={{ textAlign: 'center' }}>{t('overview.live.board.thru')}</span><span style={{ textAlign: 'center' }}>{t('overview.live.board.today')}</span><span style={{ textAlign: 'right' }}>{t('overview.live.board.tot')}</span>
      </div> : <div data-leaders-group-header style={{ display: 'grid', gridTemplateColumns: grid, gap: L.gap, alignItems: 'center', marginTop: 10, paddingBottom: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: L.mute }}>
        {['pos', 'player', 'thru', 'today', 'tot'].map((key, i) => <span key={key} style={{ textAlign: i >= 2 ? 'center' : 'left' }}>{t(`board.columns.${key}`)}</span>)}
      </div>}
      {leadersPositionOrder(group.players, entries).map((player, index) => {
        const raw = entries.find(e => player.id != null && e.player?.id === player.id);
        const e = raw ? roundEntry(raw, round) : null;
        const today = e ? todayFromEntry(e, round) : null;
        const name = e?.player?.full_name?.trim() || player.name;
        const status = e?.status?.toUpperCase();
        const pos = status === 'MC' || status === 'CUT' ? 'MC' : status === 'WD' ? 'WD' : e?.position == null ? '' : `${e.position_tied ? 'T' : ''}${e.position}`;
        const tap = () => {
          if (!player.id) return;
          onRowTap?.(player.id);
          setTarget({ playerId: player.id, playerName: name, countryCode: e?.player?.country_code ?? e?.player?.country ?? player.country ?? null,
            position: e?.position ?? null, positionTied: e?.position_tied ?? null, total: e?.score ?? null, today, thru: e?.thru ?? null, status: e?.status ?? null });
        };
        const RowTag = player.id ? Button : 'div';
        return <RowTag key={player.id ?? `missing-${index}`} {...(player.id ? { type: 'button' as const, variant: 'ghost' as const, 'aria-haspopup': 'dialog' as const } : { role: 'group' })}
          aria-label={t('overview.board.rowLabel', { name, position: pos, score: e?.score == null ? '' : fmtScore(e.score) })} onClick={player.id ? tap : undefined}
          data-leaders-group-row style={{ display: 'grid', gridTemplateColumns: grid, gap: L.gap, width: '100%', minHeight: live ? 40 : 33, height: 'auto', alignItems: 'center', padding: 0, border: 'none', borderRadius: 0, background: 'transparent', color: L.ink, textAlign: 'left', whiteSpace: 'normal' }}>
          <span style={{ fontSize: live ? 12.5 : 11, fontWeight: live ? 700 : 800, letterSpacing: live ? 0 : '0.04em', color: live || e?.position === 1 ? L.ink : L.mute }} className="tabular-nums">{pos}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: live ? 10 : 8, minWidth: 0 }}><span className={live ? 'live-leaders-face' : undefined} style={{ display: 'inline-flex', flex: 'none' }}><SquircleAvatar size={live ? 26 : 22} srcCandidates={resolvePlayerAvatarCandidates({ name, photoUrl: e?.player?.photo_url ?? player.photoUrl ?? null, tourSlug })} alt={name} userId={player.id ?? name} hairlineRing={live} hideRing={!live} /></span><span style={{ fontSize: live ? 14 : 13.5, fontWeight: 600, letterSpacing: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{live ? <><span className="live-leaders-name-full">{name}</span><span className="live-leaders-name-short">{initialSurname(name)}</span></> : name}</span></span>
          {live && state === 'before' ? null : <><span data-group-thru className="tabular-nums" style={{ textAlign: 'center', fontSize: live ? 12.5 : 13, fontWeight: 600, color: live ? e && thruLabel(e, today) === 'F' ? 'var(--live-dim)' : 'var(--live-secondary)' : L.mute }}>{e && state !== 'before' ? thruLabel(e, today) : ''}</span>
          <span data-group-today className="tabular-nums" style={{ textAlign: 'center', fontSize: live ? 12.5 : 13, fontWeight: 700, color: scoreColor(today) }}>{today == null || state === 'before' ? '' : fmtScore(today)}</span></>}
          <span className="tabular-nums" style={{ textAlign: live ? 'right' : 'center', fontSize: 15, fontWeight: 700, color: scoreColor(e?.score) }}>{e?.score == null ? '' : fmtScore(e.score)}</span>
        </RowTag>;
      })}
      {note ? <div data-leaders-group-note style={{ marginTop: 10, fontSize: 12, lineHeight: 1.45, color: L.mute }}><Trans t={t} i18nKey={`overview.leadersGroup.note.${note.key === 'named' ? 'named_other' : note.key === 'one' ? 'one_one' : 'many_other'}`} values={{ count: note.count, score: fmtScore(allLeaders(entries)[0]?.score, { absent: '' }) }} components={{ names: <span>{namesMarkup}</span> }} /></div> : null}
    </section>
    <ScorecardSheet open={!!target} onClose={() => setTarget(null)} tournamentId={tournamentId} target={target} />
  </>;
}