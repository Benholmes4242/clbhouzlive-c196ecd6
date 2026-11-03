/** Shared picks presentation owns both overview and tournament cards. Defaults
 * preserve the signed-off overview; no event reads or automatic mutations here. */
import React, {useLayoutEffect,useRef,useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Trophy} from 'lucide-react';
import {AMBER,FONT,GOLD,WHITE_ALPHA_06,WHITE_ALPHA_65,TOPAR_UNDER_DARK} from '../../../_shared/tokens';
import {PAGE_CANVAS} from '@/lib/tokens/surfaces';
import {PlayerAvatar} from '../../PlayerAvatar';
import type {AITopContender} from '../../../hooks/useAIPredictions';
import {surnameOf} from '../../../_shared/playerName';
import {formatDayMonthShortGB,formatTimeHm24,formatWeekdayLong,formatWeekdayShortGB} from '@/i18n/format';
import {statusWord} from '../../../leaderboard/BoardTable';
import {normalizeStatus} from '../../../_shared/resultStatus';
import {OVERVIEW} from '../overviewTokens';
import {fmtScore} from '../../../utils/fmtScore';
import {finishedVerdict,type PickResult} from './pickInsightRules';
import {PickMemberBands} from './PickMemberBands';
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
 * §3 — THE PICKS BLOCK. Amber OUR TOURNAMENT PICKS header and a FIXED grid of
 * up to three cards (never padded, never scrolling). Each card opens PicksSheet.
 */
/** The status token a pick card shows instead of a position, as BoardTable labels it. */
export function pickStatusToken(raw: string | null | undefined): string | null {
  const s = normalizeStatus(raw);
  if (!s || !['WD', 'DQ', 'DNS', 'CUT', 'MC', 'MDF'].includes(s)) return null;
  return s === 'CUT' || s === 'MC' ? 'MC' : statusWord(s);
}

export function PicksBlock({
  picks,
  tourCode,
  phase,
  boardByPlayer,
  teeByPlayer,
  startedPlayers,
  championPlayerId,
  championPlayerIds,
  intro,
  neededByPlayer,
  toReachScore,
  leaderTotal,
  onOpenPick,
  tournamentId,
  seasonYear,
  currentRound,
  pickResults,
  onOpenYourPick,
  onOpenRecord,
}: {
  /** Pick tee times by sr_players.id; null/empty renders no tee line. */
  teeByPlayer: Map<string, string> | null;
  startedPlayers: Set<string>;
  /** The leader's to-par; a pick at or ahead of it has nothing to reach. */
  leaderTotal: number | null;
  onOpenPick: (id:string) => void;
  tournamentId:string;
  seasonYear:number|null;
  currentRound:number|null;
  pickResults:PickResult[];
  onOpenYourPick:()=>void;
  onOpenRecord:()=>void;
  /** §E.1 where the picks stand; null renders no line. */
  intro: string | null;
  /** §E.2 the same map PicksSheet reads; null outside the required-round window. */
  neededByPlayer: Map<string, number> | null;
  toReachScore: string | null;
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
  const shownTees = cards.map(teeFor).filter((x): x is string => !!x);
  const teeDay = shownTees.length ? pickTeeDayLabel(shownTees, new Date(), t as unknown as TeeT) : null;
  const teeDayOnly = shownTees.length ? pickTeeDayLabel(shownTees, new Date(), t as unknown as TeeT, true) : null;
  /* STOP 2 ruling: the full label first; the day alone when the row would
     overflow. A hidden twin of the full label is always measured, so the row
     can switch back when it widens. */
  const rowRef = useRef<HTMLDivElement>(null);
  const picksRef = useRef<HTMLSpanElement>(null);
  const fullRef = useRef<HTMLSpanElement>(null);
  const [teeFits, setTeeFits] = useState(true);
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row || !teeDay) return;
    const measure = () => {
      const cs = getComputedStyle(row);
      const content = row.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      setTeeFits(teeHeadingFits(content, picksRef.current?.offsetWidth ?? 0, fullRef.current?.offsetWidth ?? 0));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    return () => ro.disconnect();
  }, [teeDay]);

  return (
    <div data-overview-picks style={{ background: PAGE_CANVAS, paddingTop: 8 }}>
      <div data-overview-picks-hairline style={{ margin: '0 20px', borderTop: `1px solid ${WHITE_ALPHA_06}` }} />
      <div ref={rowRef} data-overview-picks-heading style={{ position: 'relative', padding: '14px 20px 8px', display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
        {/* Amber here is the clbhouz mark, its documented second meaning on Tour. */}
        {/* PicksSheet's eyebrow reads this same key on purpose: one label, one
            key, so band and sheet cannot drift apart in translation. */}
        <span ref={picksRef} style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: AMBER, whiteSpace: 'nowrap', flex: 'none' }}>{t('overview.hero.ourPicks')}</span>
        {teeDay && phase !== 'completed' ? (
          <>
            <span data-overview-picks-tee-day style={{ marginLeft: 'auto', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.42)', whiteSpace: 'nowrap', flex: 'none' }}>{teeFits ? teeDay : teeDayOnly}</span>
            <span ref={fullRef} data-overview-picks-tee-measure aria-hidden style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', left: 0, top: 0, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{teeDay}</span>
          </>
        ) : phase !== 'upcoming' ? <span className="pick-panel-dim" style={{marginLeft:'auto',fontSize:9.5,fontWeight:800,letterSpacing:'.12em'}}>{phase==='completed'?recordCopy('final'):recordCopy('roundLive',{round:currentRound??''})}</span> : null}
      </div>
      {phase==='completed' && <div className="pick-overview-verdict" data-picks-verdict><b>{verdict.bold}</b>{verdict.rest && ` ${verdict.rest}`}</div>}
      {intro ? (
        <p data-overview-picks-intro style={{ margin: '0 20px 12px', marginTop: 0, fontSize: 14, lineHeight: 1.45, color: OVERVIEW.mute }}>{intro}</p>
      ) : null}

      <div data-overview-picks-grid style={{ padding: '0 20px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
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
          const statusToken = phase !== 'upcoming' && !isChampion ? pickStatusToken(line?.status) : null;
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
              /* Signed-off Board B: outlined landscape chip, three across, no fill. */
              style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontFamily: FONT, color: 'inherit', cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 7, textAlign: 'left', minWidth: 0 }}
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
              <div data-overview-pick-text style={{ minWidth: 0 }}>
                <div data-overview-pick-name style={{ fontSize: 12.5, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {surnameOf(p.playerName)}
                </div>
                {figureLine ? (
                  <div data-overview-pick-figure style={{ marginTop: 2, fontSize: 11.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: 4, whiteSpace: 'nowrap', ...FIGS }}>
                    {figureLine}
                  </div>
                ) : teeText ? (
                  <div data-overview-pick-tee data-overview-pick-tee-time style={{ marginTop: 3, fontSize: 12.5, fontWeight: 700, color: '#F8FAFC', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flex: 'none', ...FIGS }}>{teeText}</div>
                ) : null}
                {/* CORRECTIONS I.2: a pick leading or level has nothing to reach — no
                    line at all. The dash is only for a target genuinely out of reach. */}
                {!statusToken && neededByPlayer && toReachScore && (phase !== 'live' || pickStarted) && !(line?.score != null && leaderTotal != null && line.score <= leaderTotal) ? (
                  <div data-overview-pick-to-reach style={{ marginTop: 2, display: 'flex', gap: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: OVERVIEW.mute, whiteSpace: 'nowrap', ...FIGS }}>
                    <span>{t('overview.picksNeeds', { defaultValue: 'Needs' })}</span><span style={{ color: OVERVIEW.ink }}>{neededByPlayer.get(String(p.playerId)) ?? '\u2014'}</span>
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
      {seasonYear != null && <PickMemberBands tournamentId={tournamentId} tourCode={tourCode} seasonYear={seasonYear} phase={phase} currentRound={currentRound} pickResults={pickResults} startedPlayers={startedPlayers} onPick={onOpenYourPick} onRecord={onOpenRecord}/>}
    </div>
  );
}

