import { picksEnabledForTour } from '../../../_shared/picksEnabledForTour';
import { overviewQueryReady, OverviewReadinessBand } from '../overviewShells';
/** Shared picks presentation owns both overview and tournament cards. Defaults
 * preserve the signed-off overview; no event reads or automatic mutations here.
 * The season-record hook/door belongs here (never in member bands), so all
 * phases and viewers share heading placement and the existing record opener. */
import React from 'react';
import {useTranslation} from 'react-i18next';
import {Trophy} from 'lucide-react';
import {AMBER,INK,FONT,GOLD,WHITE_ALPHA_65,TOPAR_UNDER_DARK} from '../../../_shared/tokens';
import {PlayerAvatar} from '../../PlayerAvatar';
import type {AITopContender} from '../../../hooks/useAIPredictions';
import {surnameOf} from '../../../_shared/playerName';
import {formatDayMonthShortGB,formatTimeHm24,formatWeekdayLong,formatWeekdayShortGB} from '@/i18n/format';
import {statusWord} from '../../../leaderboard/BoardTable';
import {normalizeStatus} from '../../../_shared/resultStatus';
import {EVEN_ROW_COLUMNS, EVEN_ROW_GRID, OVERVIEW} from '../overviewTokens';
import {fmtScore} from '../../../utils/fmtScore';
import {finishedVerdict,type PickResult} from './pickInsightRules';
import {Button} from '@/components/ui/button';
import {useOurPickRecord} from '../../../hooks/usePickInsights';
import { HeroSectionHead } from '../HeroSectionHead';
import { finishedPicksTitle, upcomingPicksTitle, livePicksTitle, livePicksEyebrow, picksEyebrowState, type PicksIntro } from '../heroHeadRules';
import { TournamentSectionHead } from '../../../tournament-v2/sections/TournamentSectionHead';
const pickWonTournament=(id:string,champion:string|null,ids:string[])=>id===champion||ids.includes(id);
const FIGS = { fontVariantNumeric: 'tabular-nums' as const, fontFeatureSettings: '"kern" 1, "liga" 1' };
const WON_LABEL = 'WON';

type SettledFigure = {
  right: string;
  rightColor: string;
  figure: string | null;
  figureColor: string;
};

/**
 * TOUR COLOUR RULE (unchanged from the removed panel): under par is RED,
 * level/over is INK — which on this dark surface is white.
 */
function tourFigColor(v: number | null | undefined): string {
  if (v == null || v === 0) return '#FFFFFF';
  return v < 0 ? TOPAR_UNDER_DARK : '#FFFFFF';
}

function settledFigureFor(
  line: { position: number | null; tied: boolean; score: number | null } | undefined,
): SettledFigure | null {
  if (!line || line.position == null) return null;

  // A TIED FIRST IS NOT A WIN - T1 stays a numeral. Unchanged rule from
  // MICRO_BRIEF_PICKS_ROW_WINNER section 2.
  const won = line.position === 1 && !line.tied;

  return {
    right: won ? WON_LABEL : `${line.tied ? 'T' : ''}${line.position}`,
    rightColor: won ? GOLD : WHITE_ALPHA_65,
    figure: line.score == null ? null : fmtScore(line.score),
    figureColor: tourFigColor(line.score),
  };
}

/** The card shows the time only, 24-hour ("14:05", viewer's local time); the day moves
 *  to the picks heading via pickTeeDayLabel (BRIEF — PICK TEE TIMES: THE DAY
 *  MOVES TO THE HEADING). */
export function pickTeeText(iso: string): string | null {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return formatTimeHm24(d);
}

type TeeT = (key: string, opts?: Record<string, unknown>) => string;
const localDayIndex = (d: Date) => Math.round(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86_400_000);

/** Heading label for the shown tee times, in the viewer's local time:
 *  TODAY / TOMORROW / full weekday (2–6 days) / short weekday + date (7+);
 *  shown times on different local days give "WED–THU". Null when none. */
/** Whether "OUR TOURNAMENT PICKS" + gap + the full tee label fit the row's
 *  content box, measured on the device (no breakpoint). */
export function teeHeadingFits(rowContentWidth: number, picksWidth: number, fullLabelWidth: number, gap = 8): boolean {
  return picksWidth + gap + fullLabelWidth <= rowContentWidth;
}

export function pickTeeDayLabel(isos: string[], now: Date, t: TeeT, dayOnly = false): string | null {
  const ds = isos.map((s) => new Date(s)).filter((d) => Number.isFinite(d.getTime())).sort((a, b) => a.getTime() - b.getTime());
  if (!ds.length) return null;
  const first = ds[0];
  const last = ds[ds.length - 1];
  let day: string;
  if (localDayIndex(first) !== localDayIndex(last)) {
    day = `${formatWeekdayShortGB(first)}\u2013${formatWeekdayShortGB(last)}`;
  } else {
    const ahead = localDayIndex(first) - localDayIndex(now);
    if (ahead <= 0) day = t('overview.hero.picksTeeToday', { defaultValue: 'TODAY' });
    else if (ahead === 1) day = t('overview.hero.picksTeeTomorrow', { defaultValue: 'TOMORROW' });
    else if (ahead <= 6) day = formatWeekdayLong(first);
    else day = `${formatWeekdayShortGB(first)} ${formatDayMonthShortGB(first)}`;
  }
  if (dayOnly) return day.toLocaleUpperCase();
  return t('overview.hero.picksTeeTimes', { day: day.toLocaleUpperCase(), defaultValue: `TEE TIMES \u00b7 ${day.toLocaleUpperCase()}` });
}

/**
 * §3 — THE PICKS BLOCK. Amber OUR TOURNAMENT PICKS header and a FIXED group of
 * up to three cards (never padded, never scrolling, no tiles and no hairline).
 * Three cards sit in the shared even row (EVEN_ROW_GRID in overviewTokens);
 * two are a centred pair and one is centred. Each card opens PicksSheet.
 */
/** The status token a pick card shows instead of a position, as BoardTable labels it. */
export function pickStatusToken(raw: string | null | undefined): string | null {
  const s = normalizeStatus(raw);
  if (!s || !['WD', 'DQ', 'DNS', 'CUT', 'MC', 'MDF'].includes(s)) return null;
  return s === 'CUT' || s === 'MC' ? 'MC' : statusWord(s);
}

function PicksBlockSession({
  picks,
  tourCode,
  phase,
  boardByPlayer,
  teeByPlayer,
  startedPlayers,
  championPlayerId,
  championPlayerIds,
  intro,
  onOpenPick,
  tournamentId,
  seasonYear,
  currentRound,
  pickResults,
  onOpenRecord,
  tournamentLiveHead,
}: {
  /** Pick tee times by sr_players.id; null/empty renders no tee line. */
  teeByPlayer: Map<string, string> | null;
  startedPlayers: Set<string>;
  onOpenPick: (id:string) => void;
  tournamentId:string;
  seasonYear:number|null;
  currentRound:number|null;
  pickResults:PickResult[];
  onOpenRecord:()=>void;
  /** Brief 17: cards-only tournament caller; overview and other phases stay frozen. */
  tournamentLiveHead?: { intro: PicksIntro | null; stage: string; delayedRound?: number | null };
  /** §E.1 where the picks stand; null renders no line. */
  intro: string | null;
  picks: AITopContender[];
  /** The event's tour, for the shared headshot resolver. */
  tourCode: string;
  phase: 'live' | 'upcoming' | 'completed';
  boardByPlayer: Map<string, { position: number | null; tied: boolean; score: number | null; status?: string | null }>;
  /** The champion, by player id — settledFigureFor can only see a POSITION,
   *  and a playoff winner's position is T1, so identity comes in separately. */
  championPlayerId: string | null;
  championPlayerIds: string[];
}) {
  const { t } = useTranslation('tourhub');
  const recordQuery = useOurPickRecord(tourCode, seasonYear);
  const record = recordQuery.isError ? null : recordQuery.data;
  const cards = picks.slice(0, 3);
  const verdict=finishedVerdict(pickResults,[...championPlayerIds,...(championPlayerId?[championPlayerId]:[])]);
  const recordCopy=(key:string,options:Record<string,unknown>={})=>t(`overview.pickRecord.${key}`,options);
  /* A card shows a tee time only with no figure line and no start — the same
     rule the card applies below; the heading's day reads exactly these. */
  const teeFor = (p: AITopContender): string | null => {
    const id = String(p.playerId);
    const line = boardByPlayer.get(id);
    if (phase !== 'upcoming' && pickStatusToken(line?.status)) return null;
    const hasFigure = phase === 'completed' ? !!settledFigureFor(line) : false;
    if (hasFigure || startedPlayers.has(id)) return null;
    const iso = teeByPlayer?.get(id) ?? null;
    return iso && pickTeeText(iso) ? iso : null;
  };
  /* Upcoming hero new order §5: upcoming picks are rows, tee time ascending,
     untimed picks after in pick order. Live/completed keep the card row. */
  const up = phase === 'upcoming';
  const upRows = up ? cards.map((p, i) => ({ p, i, at: (() => { const iso = teeFor(p); return iso ? Date.parse(iso) : null; })() }))
    .sort((a, b) => a.at != null && b.at != null ? a.at - b.at || a.i - b.i : a.at != null ? -1 : b.at != null ? 1 : a.i - b.i).map(x => x.p) : [];
  /* Brief 16 rule (o): the earliest shown tee names the title, with the
     row's own formatter (pickTeeText) so the two match. */
  const firstTee = (() => {
    let best: { p: AITopContender; at: number; iso: string } | null = null;
    for (const p of cards) { const iso = teeFor(p); const at = iso ? Date.parse(iso) : NaN; if (iso && Number.isFinite(at) && (!best || at < best.at)) best = { p, at, iso }; }
    return best ? { name: surnameOf(best.p.playerName), weekday: formatWeekdayLong(best.iso), time: pickTeeText(best.iso) ?? '' } : null;
  })();
  const tournamentHead = phase === 'live' && tournamentLiveHead ? {
    ...livePicksEyebrow(t, picksEyebrowState(tournamentLiveHead.stage, { delayedRound: tournamentLiveHead.delayedRound }), currentRound ?? 1),
    title: tournamentLiveHead.intro ? livePicksTitle(t, tournamentLiveHead.intro) : upcomingPicksTitle(t, cards.length, firstTee),
  } : null;
  const head = up
    ? { eyebrow: t('overview.heroHead.picks.eyebrow'), title: upcomingPicksTitle(t as never, cards.length, firstTee) }
    : phase === 'completed' ? { eyebrow: t('overview.heroHead.picks.eyebrowFinal'), title: finishedPicksTitle(verdict.bold) } : tournamentHead ? { eyebrow: tournamentHead.text, title: tournamentHead.title } : null;

  return (
<OverviewReadinessBand id="picks" base={overviewQueryReady(recordQuery, !!tourCode && !!seasonYear)} expect={[]}>
    <div data-overview-picks data-picks-layout={up ? 'rows' : 'cards'} className={up ? 'overview-picks-up' : undefined} style={up ? { paddingTop: 0 } : { paddingTop: head ? 0 : 8, paddingBottom: 10 }}>
      {tournamentHead ? <div style={{ padding: '16px 20px 0' }}><TournamentSectionHead eyebrow={tournamentHead.text} title={tournamentHead.title} live={tournamentHead.live} /></div> : head ? <HeroSectionHead inset={!up} eyebrow={head.eyebrow} title={head.title} /> : (
      <div data-overview-picks-heading style={{ position: 'relative', padding: '16px 20px 10px', display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
        {/* Amber here is the clbhouz mark, its documented second meaning on Tour. */}
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK, whiteSpace: 'nowrap', flex: 'none' }}>{t('overview.hero.ourPicks')}</span>
        <span className="pick-panel-dim" style={{marginLeft:'auto',fontSize:9.5,fontWeight:700,letterSpacing:'.12em'}}>{recordCopy('roundLive',{round:currentRound??''})}</span>
      </div>)}
      {phase==='completed' && verdict.rest ? <p className="hero-head-lead" data-picks-verdict style={{ padding: '0 20px' }}>{verdict.rest}</p> : null}
      {record && record.picks > 0 && up && <Button variant={null} size={null} data-our-record-door onClick={onOpenRecord}
        style={{ display:'flex', alignItems:'baseline', width:'100%', padding:0, margin:'8px 0 0', border:0, borderRadius:0, background:'transparent', textAlign:'left', lineHeight:1.35, fontFamily:'inherit', fontSize:12.5, height:'auto', whiteSpace:'normal', ...FIGS }}>
        <span style={{ minWidth:0 }}><span data-pick-record-figures style={{ fontWeight:700, color:'#F8FAFC', whiteSpace:'nowrap' }}>{recordCopy('wins',{count:record.won})} · {recordCopy('topTens',{count:record.top10})}</span>
        {record.event_count != null && <span data-pick-record-events style={{ marginLeft:'0.28em', fontWeight:400, color:'rgba(248,250,252,.78)', whiteSpace:'nowrap' }}>{recordCopy('fromEvents',{count:record.event_count})}</span>}</span>
        <span aria-hidden style={{ marginLeft:'auto', paddingLeft:8, fontSize:15, color:'rgba(248,250,252,.42)' }}>›</span>
      </Button>}
      {record && record.picks > 0 && !up && <Button variant={null} size={null} data-our-record-door onClick={onOpenRecord}
        style={{ display:'flex', alignItems:'baseline', flexWrap:'wrap', columnGap:5, width:'100%', padding:'8px 20px', margin: head ? '4px 0 2px' : '-12px 0 2px', border:0, borderRadius:0, background:'transparent', textAlign:'left', lineHeight:1.35, fontFamily:'inherit', fontSize:13, fontWeight:700, color:'var(--pick-ink)', height:'auto', minHeight:32, whiteSpace:'normal', ...FIGS }}>
        <span data-pick-record-figures style={{ whiteSpace:'nowrap' }}>{recordCopy('wins',{count:record.won})} · {recordCopy('topTens',{count:record.top10})}</span>
        {record.event_count != null && <span data-pick-record-events style={{ fontWeight:500, color:'var(--text-secondary)', whiteSpace:'nowrap' }}>{recordCopy('fromEvents',{count:record.event_count})}</span>}
        <span aria-hidden style={{ marginLeft:'auto', paddingLeft:8, fontWeight:600, color:'var(--pick-dim)' }}>›</span>
      </Button>}
      {intro && !tournamentHead ? (
        <p data-overview-picks-intro style={{ margin: '0 20px 12px', marginTop: 0, fontSize: up ? 12.5 : 14, lineHeight: 1.45, color: OVERVIEW.mute }}>{intro}</p>
      ) : null}

      {up ? <div data-overview-picks-rows style={{ marginTop: 6 }}>{upRows.map(p => {
        const tee = teeFor(p); const teeText = tee ? pickTeeText(tee) : null;
        return <button type="button" key={p.playerId} data-overview-pick-card data-overview-pick-row onClick={()=>onOpenPick(p.playerId)}
          aria-label={t('overview.picksSheet.cardAria', { name: p.playerName, defaultValue: `Why we picked ${p.playerName}` })}
          className="active:opacity-70 transition-opacity"
          style={{ display: 'grid', gridTemplateColumns: '26px minmax(0,1fr) auto', gap: 12, alignItems: 'center', height: 48, width: '100%', margin: 0, padding: 0, border: 0, background: 'transparent', color: 'inherit', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
          <div data-overview-pick-avatar style={{ display: 'flex' }}><PlayerAvatar playerId={String(p.playerId ?? '')} playerName={p.playerName} tourCode={tourCode} photoUrl={p.photoUrl ?? null} headshotOverride={p.headshotOverride ?? null} size={26} /></div>
          <span data-overview-pick-name style={{ minWidth: 0, fontSize: 13, fontWeight: 600, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.playerName}</span>
          {teeText ? <span data-overview-pick-tee data-overview-pick-tee-time style={{ fontSize: 12.5, fontWeight: 700, color: '#F8FAFC', textAlign: 'right', whiteSpace: 'nowrap', ...FIGS }}>{teeText}</span> : <span />}
        </button>;
      })}</div> : <div data-overview-picks-grid style={cards.length === 2
        ? { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', columnGap: 32, padding: '0 20px' }
        : cards.length === 1
          ? { display: 'flex', justifyContent: 'center', padding: 0 }
          : { display: 'grid', gridTemplateColumns: EVEN_ROW_GRID, padding: 0 }}>
        {cards.map((p, i) => {
          const line = boardByPlayer.get(String(p.playerId));
          const settledRaw = phase === 'completed' ? settledFigureFor(line) : null;
          /* THE CHAMPION WEARS THE WIN, WHATEVER THE BOARD SAYS. A playoff
             winner ties on strokes, so settledFigureFor returns "T1" — right
             for everyone else, the playoff LOSER included. Identity separates
             them, via the same test the trophy uses. */
          const isChampion = phase === 'completed'
            && pickWonTournament(p.playerId, championPlayerId, championPlayerIds);
          const settled = settledRaw && isChampion
            ? { ...settledRaw, right: WON_LABEL, rightColor: GOLD }
            : settledRaw;
          /* Ben's ruling: a live pick who has not started (one has-started rule)
             gets no position and no score — the feed's T1 E is false. */
          const pickStarted = startedPlayers.has(String(p.playerId));
          const liveLine = phase === 'live' && pickStarted && line && line.position != null ? line : null;

          /* A WD/DQ/DNS/CUT/MDF pick shows the board's own token, never a
             position or score; locked picks are never swapped (CB54). */
          const statusToken = !isChampion ? pickStatusToken(line?.status) : null;
          let figureLine: React.ReactNode;
          if (statusToken) {
            figureLine = <span data-overview-pick-status style={{ color: WHITE_ALPHA_65 }}>{statusToken}</span>;
          } else if (liveLine) {
            figureLine = (
              <>
                <span style={{ color: WHITE_ALPHA_65 }}>{`${liveLine.tied ? 'T' : ''}${liveLine.position}`}</span>
                {liveLine.score != null ? <span style={{ color: tourFigColor(liveLine.score) }}>{fmtScore(liveLine.score)}</span> : null}
              </>
            );
          } else if (settled) {
            figureLine = (
              <>
                {settled.right === WON_LABEL ? <Trophy data-pick-trophy size={11} color={GOLD} strokeWidth={2.5} aria-hidden /> : null}
                <span style={{ color: settled.rightColor }}>{settled.right}</span>
                {settled.figure ? <span style={{ color: settled.figureColor }}>{settled.figure}</span> : null}
              </>
            );
          } else {
            // Absent figure renders NOTHING (same rule as MiniBoard): no dash,
            // and no win % on upcoming picks — an unlabelled number is not data.
            figureLine = null;
          }
          const tee = !figureLine ? teeFor(p) : null;
          const teeText = tee ? pickTeeText(tee) : null;

          return (
            <button
              type="button"
              key={p.playerId || i}
              data-overview-pick-card
              onClick={()=>onOpenPick(p.playerId)}
              aria-label={t('overview.picksSheet.cardAria', { name: p.playerName, defaultValue: `Why we picked ${p.playerName}` })}
              className="active:opacity-70 transition-opacity"
              /* Signed-off: no tile at all — the card is a bare tappable row
                 sitting in the shared even row (or the centred pair/one). */
              style={{ display: 'flex', alignItems: 'center', gap: 8, height: 46, boxSizing: 'border-box', margin: 0, fontFamily: FONT, color: 'inherit', cursor: 'pointer', background: 'transparent', padding: 0, textAlign: 'left', minWidth: 0, ...(cards.length === 2 ? { justifySelf: i === 0 ? 'end' : 'start' } : {}), ...(cards.length === 3 ? { gridColumn: EVEN_ROW_COLUMNS[i] } : {}) }}
            >
              {/* The shared resolver walks the headshot folder chain itself;
                  photoUrl is tried FIRST when present. No second resolver. */}
              <div data-overview-pick-avatar style={{ flex: 'none', display: 'flex' }}>
                <PlayerAvatar
                  playerId={String(p.playerId ?? '')}
                  playerName={p.playerName}
                  tourCode={tourCode}
                  photoUrl={p.photoUrl ?? null}
                  headshotOverride={p.headshotOverride ?? null}
                  size={28}
                />
              </div>
              <div data-overview-pick-text style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div data-overview-pick-name style={{ fontSize: 12.5, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {surnameOf(p.playerName)}
                </div>
                {figureLine ? (
                  <div data-overview-pick-figure style={{ marginTop: 1, lineHeight: 1.2, fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'baseline', justifyContent: 'flex-start', gap: 4, whiteSpace: 'nowrap', ...FIGS }}>
                    {figureLine}
                  </div>
                ) : teeText ? (
                  <div data-overview-pick-tee data-overview-pick-tee-time style={{ marginTop: 1, lineHeight: 1.2, fontSize: 12.5, fontWeight: 700, color: '#F8FAFC', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flex: 'none', ...FIGS }}>{teeText}</div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>}
    </div>
    </OverviewReadinessBand>
  );
}


export function PicksBlock(props: Parameters<typeof PicksBlockSession>[0]) {
  return picksEnabledForTour(props.tourCode) ? <PicksBlockSession {...props} /> : null;
}
