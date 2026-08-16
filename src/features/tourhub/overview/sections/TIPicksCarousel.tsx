/**
 * TIPicksCarousel — Tournament Intelligence: card carousel + Case sheet +
 * Board sheet. All verdicts route through tiVerdict() so the card chip,
 * case banner, board row chip and last-5 tokens share one treatment.
 */

import { useEffect, useMemo, useState } from 'react';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';

import { useTranslation } from 'react-i18next';
import { ClbhouzPickMark } from '../../_shared/ClbhouzPickMark';
import type { TFunction } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIPredictions, type AITopContender } from '../../hooks/useAIPredictions';
import { SectionShell } from './SectionShell';
import { V4 } from '../tokens';
import { tiVerdict, verdictFromResult, formatTiPosition, formatTiScore, type TiVerdict, type TiVerdictKind } from './tiVerdict';

import type { EventState } from '@/features/tourhub/components/overview-v3/useTournamentPulse';
import { usePickLiveState, type PickLiveState } from '../data/usePickLiveState';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { TourStatusBlock, TOUR_UNDER } from '../../_shared/TourStatusBlock';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { useSinglePlayerStatistics } from '../../hooks/useTourHubData';
import { usePlayerResults } from '../../hooks/usePlayerResults';
import { useSeasonResultsSummary } from '../../hooks/useSeasonResultsSummary';
import { Skeleton } from '@/components/ui/skeleton';
import { A } from '@/features/courses/components/holes/analytical/tokens';

// ---- Design tokens (per approved TIRedesign) ----
const INK = '#0E1013';
const INK_60 = 'rgba(15,23,42,0.60)';
const INK_45 = 'rgba(15,23,42,0.45)';
const HAIR = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C2620A';
const GREEN_BG = '#DCFCE7';
const GREEN_TX = '#166534';
const RED_BG = '#FEE2E2';
const RED_TX = '#B91C1C';
const GOLD_BG = 'linear-gradient(135deg,#FDE68A 0%,#F7931E 100%)';
const GOLD_TX = '#7C4A03';
const GOLD_RING = 'rgba(247,147,30,0.45)';
const GOLD_SHADOW = '0 2px 12px rgba(247,147,30,0.18)';
const NEUTRAL_BG = 'rgba(15,23,42,0.06)';
const FIT_TRACK = 'rgba(15,23,42,0.07)';
const FIT_FILL = 'linear-gradient(90deg,#FDBA5C,#F7931E)';

interface Props {
  tournamentId: string | undefined;
  state: EventState;
  tourCode?: string;
}

type SheetState =
  | null
  | { kind: 'index' }
  | { kind: 'case'; pick: AITopContender; from: 'index' | 'card' };

// ---- Shared verdict chip ----

function chipColors(kind: TiVerdictKind): React.CSSProperties {
  if (kind === 'win') return { background: GOLD_BG, color: GOLD_TX, boxShadow: '0 1px 6px rgba(247,147,30,0.35)' };
  if (kind === 'top20') return { background: GREEN_BG, color: GREEN_TX };
  return { background: RED_BG, color: RED_TX };
}

function VerdictChip({ v, size = 'md', t }: { v: TiVerdict; size?: 'md' | 'lg'; t: TFunction }) {
  if (v.kind === 'none') return null;
  const big = size === 'lg';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: big ? '5px 12px' : '3px 9px',
        borderRadius: 999,
        fontSize: big ? 13 : 11,
        fontWeight: 700,
        letterSpacing: 0.4,
        fontVariantNumeric: 'tabular-nums',
        ...chipColors(v.kind),
      }}
    >
      {v.kind === 'win' && <span style={{ fontSize: big ? 14 : 12 }}>🏆</span>}
      {v.kind === 'win' ? t('overview.tiPicks.verdict.won') : v.label}
      {v.score != null && <span style={{ fontWeight: 700, opacity: 0.75 }}>{v.score}</span>}
    </span>
  );
}

// ---- Root ----

export function TIPicksCarousel({ tournamentId, state, tourCode = 'pga' }: Props) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const { data } = useAIPredictions(tournamentId ?? null);
  const [sheet, setSheet] = useState<SheetState>(null);
  const picks = data?.topContenders ?? [];
  // The denominator is the REAL pick count for this tournament (every contender
  // the prediction payload holds), not the number of cards the carousel renders.
  const pickTotal = picks.length;


  // Hide the floating bottom nav while any TI sheet is open so it doesn't
  // sit on top of the sheet content.
  const { hideBottomNav, showBottomNav } = useBottomNavigation();
  useEffect(() => {
    if (sheet) {
      hideBottomNav();
      return () => showBottomNav();
    }
  }, [sheet, hideBottomNav, showBottomNav]);


  const playerIds = useMemo(() => picks.map((p) => p.playerId).filter(Boolean), [picks]);
  const needsLiveData = state === 'live' || state === 'completed';
  const { data: liveMap } = usePickLiveState(tournamentId, needsLiveData ? playerIds : [], {
    live: state === 'live',
  });

  const show = !!tournamentId && picks.length > 0;
  const settled = state === 'completed';

  const closeCase = () => {
    if (sheet?.kind === 'case' && sheet.from === 'index') setSheet({ kind: 'index' });
    else setSheet(null);
  };

  const goToPlayer = (playerId: string) => {
    setSheet(null);
    navigate(`/tourhub/player/${playerId}`);
  };

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="ti"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ overflow: 'hidden' }}
        >
          <SectionShell
            eyebrow={t('overview.tiPicks.eyebrow')}
            linkLabel={t('overview.tiPicks.linkLabel')}
            onLinkClick={() => setSheet({ kind: 'index' })}
          >
            <div style={{ padding: '0 16px 10px', fontSize: 13, fontWeight: 700, color: V4.ink, letterSpacing: '-0.005em', lineHeight: 1.35 }}>
              {t('overview.tiPicks.subline')}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 10,
                overflowX: 'auto',
                // ASYMMETRIC GUTTER — padded left only, so the last tile bleeds
                // off the right edge and the rail announces that it scrolls.
                paddingLeft: 16,
                paddingRight: 0,
                paddingBottom: 10,
                scrollPaddingLeft: 16,
                scrollSnapType: 'x mandatory',
              }}
            >
              {picks.slice(0, 8).map((p) => {
                const live = liveMap?.[p.playerId];
                const v = settled ? tiVerdict(live) : { kind: 'none' as const, label: null, score: null };
                const isWin = v.kind === 'win';
                // ONE resolution for both the avatar and the band behind it.
                const headshots = p.photoUrl
                  ? [p.photoUrl, ...getPlayerHeadshotCandidates(p.playerName, tourCode)]
                  : getPlayerHeadshotCandidates(p.playerName, tourCode);
                return (
                  <button
                    key={p.playerId}
                    onClick={() => setSheet({ kind: 'case', pick: p, from: 'card' })}
                    style={{
                      flex: '0 0 300px',
                      scrollSnapAlign: 'start',
                      textAlign: 'left',
                      background: '#FFFFFF',
                      border: isWin ? `1px solid ${GOLD_RING}` : `1px solid ${HAIR}`,
                      boxShadow: isWin ? GOLD_SHADOW : V4.cardShadow,
                      borderRadius: 16,
                      padding: 0,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0,
                      cursor: 'pointer',
                    }}
                  >
                    {/* THE SCRIM BAND — the hero's move, at tile scale. The photo
                        is atmosphere; the avatar is still the identity. The fade
                        ENDS ON #FFFFFF, the tile's own white, so there is no seam. */}
                    <PickScrimBand candidates={headshots}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          minHeight: 10,
                        }}
                      >
                        <span style={{ ...PICK_META, color: 'rgba(255,255,255,0.78)' }}>
                          {t('overview.tiPicks.card.pickOf', { n: p.rank, total: pickTotal })}
                        </span>
                        {/* The status tag keeps its ink tokens (untouched), so it
                            rides a glass pill to stay legible over the photo. */}
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            borderRadius: 999,
                            background: 'rgba(255,255,255,0.82)',
                            padding: '2px 7px',
                          }}
                        >
                          <PickStatusTag live={live} t={t} />
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 11 }}>
                        <div
                          role="link"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToPlayer(p.playerId);
                          }}
                          style={{ cursor: 'pointer', flexShrink: 0 }}
                        >
                          <SquircleAvatar
                            size={52}
                            srcCandidates={headshots}
                            alt={p.playerName}
                            userId={p.playerId}
                            hairlineRing
                            ringColor={LIGHT_HAIRLINE}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {/* The name carries the SAME amber mark as the hero board
                              row, so a member reads the two as one statement. */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                            <span
                              style={{
                                fontSize: 15.5,
                                fontWeight: 700,
                                letterSpacing: '-0.02em',
                                color: INK,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.2,
                                minWidth: 0,
                              }}
                            >
                              {p.playerName}
                            </span>
                            <ClbhouzPickMark size={12} label={t('overview.board.clbhouzPick')} />
                          </div>
                          <CardStateSlot state={state} pick={p} live={live} settled={settled} v={v} t={t} />
                        </div>
                      </div>
                    </PickScrimBand>

                    <div style={{ padding: '0 15px 14px' }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 500,
                          color: 'rgba(15,23,42,0.78)',
                          lineHeight: 1.45,
                          minHeight: 39,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          margin: '4px 0 0',
                        }}
                      >
                        {p.pulledQuote || p.reasons?.[0] || '—'}
                      </div>

                      {/* Affordance, not a control — the whole card is the tap target */}
                      <span
                        style={{
                          display: 'block',
                          marginTop: 12,
                          fontSize: 9,
                          fontWeight: 700,
                          color: AMBER_DEEP,
                          letterSpacing: '0.09em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {t('overview.tiPicks.card.theCase')}
                      </span>
                    </div>
                  </button>
                );
              })}


            </div>

            {sheet?.kind === 'index' ? (
              <AllPicksSheet
                picks={picks}
                state={state}
                tourCode={tourCode}
                liveMap={liveMap}
                onPick={(p) => setSheet({ kind: 'case', pick: p, from: 'index' })}
                onClose={() => setSheet(null)}
                onNavigatePlayer={goToPlayer}
              />
            ) : null}

            {sheet?.kind === 'case' ? (
              <CaseSheet
                pick={sheet.pick}
                state={state}
                live={liveMap?.[sheet.pick.playerId]}
                tourCode={tourCode}
                onClose={closeCase}
                onNavigatePlayer={goToPlayer}
              />
            ) : null}
          </SectionShell>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * PickScrimBand — the scrim head, shared by the TILE and by BOTH sheets so the
 * chain hero → leaderboard → tile → sheet makes one move. A photo behind a
 * gradient that fades from transparent to the surface's EXACT white (#FFFFFF);
 * any near-white would ship as a horizontal band, worse on a full-width sheet
 * than on a 300px tile. The band NEVER collapses: with no resolvable photo it
 * paints the gradient over a flat slate tone, so the shape is identical either
 * way and the carousel stays even.
 */
function PickScrimBand({
  candidates,
  children,
  minHeight = 96,
  fadeStart = 26,
  padding = '12px 15px 11px',
  grabber = false,
  objectPosition = '50% 12%',
}: {
  candidates: string[];
  children: React.ReactNode;
  minHeight?: number;
  /** % down the band where the fade begins. */
  fadeStart?: number;
  padding?: string;
  /** Sheets carry their grabber ON the band, in white so it survives the photo. */
  grabber?: boolean;
  objectPosition?: string;
}) {
  const [idx, setIdx] = useState(0);
  const src = idx < candidates.length ? candidates[idx] : null;
  return (
    <div style={{ position: 'relative', minHeight, padding, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.10)' }} />
      {src ? (
        <img
          aria-hidden
          src={src}
          alt=""
          loading="lazy"
          onError={() => setIdx((i) => i + 1)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            // A headshot is a portrait crop in a wide band: bias to the TOP so
            // the face is never cut at the chin.
            objectPosition,
          }}
        />
      ) : null}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) ${fadeStart}%, rgba(255,255,255,0.55) ${Math.round(fadeStart + (100 - fadeStart) * 0.5)}%, rgba(255,255,255,0.88) ${Math.round(fadeStart + (100 - fadeStart) * 0.78)}%, #FFFFFF 100%)`,
        }}
      />
      {grabber ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 36,
            height: 4,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.5)',
          }}
        />
      ) : null}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 11 }}>
        {children}
      </div>

    </div>
  );
}


// ---- Card state slot: chip / neutral live / course fit line ----


// ---- Shared pick grammar: the index meta line and the live-state tag ----

/** 7.5/800 uppercase tabular — the pick index and the status share one voice. */
const PICK_META: React.CSSProperties = {
  fontSize: 7.5,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontVariantNumeric: 'tabular-nums',
};

const DEMOTED_STATUS = new Set(['CUT', 'MC', 'MDF', 'WD', 'DQ', 'DNS']);

/**
 * STILL OUT → 5px red dot + "THRU {n}" in MUTE. FINISHED → "FINISHED" in DIM.
 * The feed carries no explicit finished flag, so thru >= 18 is the signal.
 */
function PickStatusTag({ live, t }: { live: PickLiveState | undefined; t: TFunction }) {
  if (!live || live.thru == null) return null;
  if (DEMOTED_STATUS.has((live.status ?? '').toUpperCase())) return null;
  if (live.thru >= 18) {
    return <span style={{ ...PICK_META, color: A.DIM }}>{t('overview.status.finished')}</span>;
  }
  return (
    <span style={{ ...PICK_META, color: A.MUTE, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 5, height: 5, borderRadius: 999, background: TOUR_UNDER, flexShrink: 0 }} />
      {t('overview.status.thru', { n: live.thru })}
    </span>
  );
}

function CardStateSlot({

  state,
  pick,
  live,
  settled,
  v,
  t,
}: {
  state: EventState;
  pick: AITopContender;
  live: PickLiveState | undefined;
  settled: boolean;
  v: TiVerdict;
  t: TFunction;
}) {
  if (settled) {
    if (v.kind === 'none') {
      // Settled with no leaderboard row → show fit if present.
      return <CourseFitLine score={pick.courseFitScore} t={t} />;
    }
    return <VerdictChip v={v} t={t} />;
  }
  if (state === 'live' && live) {
    const cutV = tiVerdict(live);
    if (cutV.kind === 'mc') return <VerdictChip v={cutV} t={t} />;
    if (live.position != null)
      return (
        <TourStatusBlock
          score={live.score}
          position={live.position}
          positionTied={live.positionTied}
          status={live.status}

          align="left"
        />
      );
  }
  // Pre-tournament (upcoming) or live-with-no-row → course fit
  return <CourseFitLine score={pick.courseFitScore} t={t} />;
}

function CourseFitLine({ score, t }: { score: number | null | undefined; t: TFunction }) {
  if (score == null) return <div style={{ height: 16 }} />;
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: INK_45,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {t('overview.tiPicks.card.courseFit', { score: Math.round(score) })
        .split(String(Math.round(score)))
        .map((part, i, arr) =>
          i === arr.length - 1 ? (
            <span key={i}>{part}</span>
          ) : (
            <span key={i}>
              {part}
              <span style={{ color: AMBER }}>{Math.round(score)}</span>
            </span>
          ),
        )}
    </div>
  );
}

// ---- Sheet shell ----

/**
 * SheetShell — shared by BOTH TI sheets and by nothing else (checked). The
 * `scrim` prop is optional and OFF by default: when present the header rides a
 * scrim band, the grabber moves onto it in white, and the sheet surface becomes
 * #FFFFFF so the gradient lands on the sheet's OWN white with no seam. Without
 * it the shell behaves exactly as before on V4.bg.
 */
function SheetShell({
  onClose,
  header,
  children,
  scrim,
}: {
  onClose: () => void;
  header?: React.ReactNode;
  children: React.ReactNode;
  scrim?: { candidates: string[]; minHeight: number; fadeStart?: number; objectPosition?: string };
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.45)' }} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          background: scrim ? '#FFFFFF' : V4.bg,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          height: 'auto',
          maxHeight: '85dvh',

          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {scrim ? (
          <div style={{ flexShrink: 0 }}>
            <PickScrimBand
              candidates={scrim.candidates}
              minHeight={scrim.minHeight}
              fadeStart={scrim.fadeStart ?? 23}
              objectPosition={scrim.objectPosition}
              padding="14px 20px 12px"
              grabber
            >
              {header}
            </PickScrimBand>
          </div>
        ) : (
          <div style={{ flexShrink: 0, padding: '10px 20px 0' }}>
            <div style={{ width: 36, height: 4, background: HAIR, borderRadius: 999, margin: '4px auto 14px' }} />
            {header}
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 20px 30px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}


// ---- Case sheet ----

function CaseSheet({
  pick,
  state,
  live,
  tourCode,
  onClose,
  onNavigatePlayer,
}: {
  pick: AITopContender;
  state: EventState;
  live: PickLiveState | undefined;
  tourCode: string;
  onClose: () => void;
  onNavigatePlayer: (playerId: string) => void;
}) {
  const { t } = useTranslation('tourhub');
  const settled = state === 'completed';
  const v = settled ? tiVerdict(live) : { kind: 'none' as const, label: null, score: null };

  const { data: stats, isLoading: statsLoading } = useSinglePlayerStatistics(pick.playerId);
  const { data: results, isLoading: resultsLoading } = usePlayerResults(pick.playerId, 5);
  const currentYear = new Date().getUTCFullYear();
  const { data: seasonSummary } = useSeasonResultsSummary(pick.playerId, currentYear);
  const winsValue = typeof stats?.wins === 'number' ? stats.wins : seasonSummary?.wins;
  const top10sValue = typeof stats?.top_10s === 'number' ? stats.top_10s : seasonSummary?.top10s;

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
      <div
        role="link"
        onClick={() => onNavigatePlayer(pick.playerId)}
        style={{ cursor: 'pointer', flexShrink: 0 }}
      >
        <PlayerAvatar
          playerId={pick.playerId}
          playerName={pick.playerName}
          tourCode={tourCode}
          photoUrl={pick.photoUrl}
          size="xl"
          ringColor={LIGHT_HAIRLINE}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: INK,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {t('overview.tiPicks.case.eyebrow')}
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: INK_45,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            #{pick.rank}
          </span>
        </div>
        <h2
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: INK,
            margin: '2px 0 0',
            letterSpacing: '-0.024em',
            lineHeight: 1.1,
          }}
        >
          {pick.playerName}
        </h2>
      </div>
    </div>
  );

  return (
    <SheetShell onClose={onClose} header={header}>
      {/* Verdict banner */}
      <VerdictBanner v={v} state={state} live={live} t={t} />

      {/* Course fit meter */}
      {pick.courseFitScore != null && (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: INK_45,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {t('overview.tiPicks.case.courseFit')}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: AMBER, fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(pick.courseFitScore)}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: FIT_TRACK, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.max(0, Math.min(100, Math.round(pick.courseFitScore)))}%`,
                background: FIT_FILL,
                borderRadius: 3,
              }}
            />
          </div>
        </div>
      )}

      {/* Reasons */}
      <div style={{ marginTop: 20 }}>
        {(pick.reasons ?? []).map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 12,
              marginTop: i === 0 ? 0 : 16,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: INK, minWidth: 22, letterSpacing: '0.06em', fontVariantNumeric: 'tabular-nums lining-nums' }}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'rgba(15,23,42,0.85)', lineHeight: 1.45 }}>
              {r}
            </div>
          </div>
        ))}
        {pick.concern ? (
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: (pick.reasons?.length ?? 0) > 0 ? 16 : 0,
            }}
          >

            <div style={{ fontSize: 15, fontWeight: 700, color: RED_TX, minWidth: 22, lineHeight: 1.2 }}>!</div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'rgba(15,23,42,0.85)', lineHeight: 1.45 }}>
              {pick.concern}
            </div>
          </div>
        ) : null}
      </div>

      {/* Season snapshot */}
      <div style={{ marginTop: 14 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: INK_45,
            letterSpacing: '0.11em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          {t('overview.tiPicks.case.seasonSnapshot')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {statsLoading ? (
            <>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} style={{ height: 62, borderRadius: 12 }} />
              ))}
            </>
          ) : (
            <>
              <StatTile label={t('overview.tiPicks.case.worldRankTile')} value={pick.worldRanking ? `#${pick.worldRanking}` : '—'} />
              <StatTile
                label={t('overview.tiPicks.case.winsTile')}
                value={typeof winsValue === 'number' ? String(winsValue) : '—'}
              />
              <StatTile
                label={t('overview.tiPicks.case.top10sTile')}
                value={typeof top10sValue === 'number' ? String(top10sValue) : '—'}
              />
              <StatTile
                label={t('overview.tiPicks.case.sgTotalTile')}
                value={typeof stats?.strokes_gained_total === 'number' ? stats.strokes_gained_total.toFixed(2) : '—'}
              />
            </>
          )}
        </div>
      </div>

      {/* Last 5 starts */}
      <Last5Block loading={resultsLoading} results={results ?? []} t={t} />

      {/* CTA */}
      <button
        onClick={() => onNavigatePlayer(pick.playerId)}
        style={{
          marginTop: 20,
          width: '100%',
          padding: '13px 0',
          borderRadius: 14,
          background: INK,
          color: '#FFFFFF',
          fontSize: 13.5,
          fontWeight: 700,
          letterSpacing: 0.3,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {t('overview.tiPicks.case.viewPlayer')}
      </button>
    </SheetShell>
  );
}

function VerdictBanner({
  v,
  state,
  live,
  t,
}: {
  v: TiVerdict;
  state: EventState;
  live: PickLiveState | undefined;
  t: TFunction;
}) {
  const settled = state === 'completed';
  if (!settled && state !== 'live') return null;

  // In progress → neutral banner (only when we have a row)
  if (!settled) {
    if (!live || live.position == null) return null;
    return (
      <div
        style={{
          marginTop: 14,
          paddingBottom: 4,

          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 7.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: A.DIM,
          }}
        >
          {t('overview.tiPicks.case.onCourse')}
        </span>
        <TourStatusBlock
          score={live.score}
          position={live.position}
          positionTied={live.positionTied}
          thru={live.thru}
          status={live.status}
          align="right"
        />
      </div>
    );
  }

  // Settled
  if (v.kind === 'none') return null;
  if (v.kind === 'win') {
    return (
      <BannerRow
        left={`🏆 ${t('overview.tiPicks.case.champion')}`}
        leftColor={GOLD_TX}
        right={`${t('overview.tiPicks.verdict.won')}${v.score != null ? ` · ${v.score}` : ''}`}
        rightColor={GOLD_TX}
        background={GOLD_BG}
      />
    );
  }
  if (v.kind === 'top20') {
    return (
      <BannerRow
        left={t('overview.tiPicks.case.finished')}
        leftColor={GREEN_TX}
        right={`${v.label}${v.score != null ? ` · ${v.score}` : ''}`}
        rightColor={GREEN_TX}
        background={GREEN_BG}
      />
    );
  }
  return (
    <BannerRow
      left={t('overview.tiPicks.case.finished')}
      leftColor={RED_TX}
      right={v.kind === 'mc' ? (v.label ?? 'MC') : `${v.label}${v.score != null ? ` · ${v.score}` : ''}`}
      rightColor={RED_TX}
      background={RED_BG}
    />
  );
}

function BannerRow({
  left,
  leftColor,
  right,
  rightColor,
  background,
}: {
  left: string;
  leftColor: string;
  right: string;
  rightColor: string;
  background: string;
}) {
  return (
    <div
      style={{
        marginTop: 14,
        borderRadius: 14,
        padding: '11px 14px',
        background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: leftColor,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {left}
      </span>
      <span
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: rightColor,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
        }}
      >
        {right}
      </span>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: `1px solid ${HAIR}`,
        borderRadius: 12,
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: accent ? AMBER : INK,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.015em',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 9,
          fontWeight: 700,
          color: INK_45,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Last5Block({
  loading,
  results,
  t,
}: {
  loading: boolean;
  results: { position: number | null; position_tied: boolean | null; score: number | null; status: string | null }[];
  t: TFunction;
}) {
  const hasAny = loading || results.length > 0;
  if (!hasAny) return null;
  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: INK_45,
          letterSpacing: '0.11em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {t('overview.tiPicks.case.last5')}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {loading
          ? [0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} style={{ flex: 1, height: 30, borderRadius: 10 }} />
            ))
          : results.slice(0, 5).map((r, i) => {
              const v = verdictFromResult(r);
              const isWin = v.kind === 'win';
              const isMc = v.kind === 'mc';
              const style: React.CSSProperties = {
                flex: 1,
                textAlign: 'center',
                padding: '7px 0',
                borderRadius: 10,
                fontSize: 11.5,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: 0.3,
                ...(v.kind === 'none'
                  ? { background: NEUTRAL_BG, color: INK_60 }
                  : chipColors(v.kind)),
              };
              const label = isWin ? '🏆 1' : isMc ? (v.label ?? 'MC') : (v.label ?? '—');
              return (
                <div key={i} style={style}>
                  {label}
                </div>
              );
            })}
      </div>
    </div>
  );
}

// ---- Board sheet ----

function AllPicksSheet({
  picks,
  state,
  tourCode,
  liveMap,
  onPick,
  onClose,
  onNavigatePlayer,
}: {
  picks: AITopContender[];
  state: EventState;
  tourCode: string;
  liveMap: Record<string, PickLiveState> | undefined;
  onPick: (p: AITopContender) => void;
  onClose: () => void;
  onNavigatePlayer: (playerId: string) => void;
}) {
  const { t } = useTranslation('tourhub');
  const settled = state === 'completed';

  const ordered = [...picks].sort((a, b) => a.rank - b.rank);

  const insideCount = settled
    ? ordered.reduce((n, p) => {
        const v = tiVerdict(liveMap?.[p.playerId]);
        return n + (v.kind === 'win' || v.kind === 'top20' ? 1 : 0);
      }, 0)
    : 0;
  const total = ordered.length;
  const showRecord = settled && total > 0;
  const recordGood = insideCount >= Math.ceil(total / 2);

  const header = (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: INK,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 6,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {t('overview.tiPicks.board.eyebrow', { n: total })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: INK, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
          {t('overview.tiPicks.board.title')}
        </div>
        {showRecord ? (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.3,
              background: recordGood ? GREEN_BG : RED_BG,
              color: recordGood ? GREEN_TX : RED_TX,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {t('overview.tiPicks.board.record', { inside: insideCount, total })}
          </span>
        ) : null}
      </div>
    </div>
  );

  return (
    <SheetShell onClose={onClose} header={header}>
      <div style={{ marginTop: 4 }}>
        {ordered.map((p, i) => {
          const live = liveMap?.[p.playerId];
          const v = settled ? tiVerdict(live) : { kind: 'none' as const, label: null, score: null };
          return (
            <div
              key={p.playerId}
              role="button"
              onClick={() => onPick(p)}
              style={{
                marginTop: i === 0 ? 0 : 22,
                cursor: 'pointer',
              }}
            >
              {/* Same grammar as the card: the pick with its denominator, then the state */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 7,
                  minHeight: 10,
                }}
              >
                <span style={{ ...PICK_META, color: A.DIM }}>
                  {t('overview.tiPicks.card.pickOf', { n: p.rank, total })}
                </span>
                <PickStatusTag live={live} t={t} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

                <div
                  role="link"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigatePlayer(p.playerId);
                  }}
                  style={{ flexShrink: 0, cursor: 'pointer' }}
                >
                  <SquircleAvatar
                    size={34}
                    srcCandidates={
                      p.photoUrl
                        ? [p.photoUrl, ...getPlayerHeadshotCandidates(p.playerName, tourCode)]
                        : getPlayerHeadshotCandidates(p.playerName, tourCode)
                    }
                    alt={p.playerName}
                    userId={p.playerId}
                    hairlineRing
                    ringColor={LIGHT_HAIRLINE}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: INK,
                      letterSpacing: '-0.02em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {p.playerName}
                  </div>
                  {p.courseFitScore != null ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <div style={{ maxWidth: 110, flex: 1, height: 4, borderRadius: 2, background: FIT_TRACK, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.max(0, Math.min(100, Math.round(p.courseFitScore)))}%`,
                            height: '100%',
                            background: AMBER,
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: INK_45,
                          letterSpacing: '0.06em',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {t('overview.tiPicks.board.fit', { score: Math.round(p.courseFitScore) })}
                      </span>
                    </div>
                  ) : null}
                </div>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {settled ? (
                    <VerdictChip v={v} t={t} />
                  ) : state === 'live' && live ? (
                    tiVerdict(live).kind === 'mc' ? (
                      <VerdictChip v={tiVerdict(live)} t={t} />
                    ) : live.position != null ? (
                      <TourStatusBlock
                        score={live.score}
                        position={live.position}
                        positionTied={live.positionTied}
                        status={live.status}

                        align="right"
                      />
                    ) : null
                  ) : null}
                  <span style={{ fontSize: 14, fontWeight: 700, color: INK_45 }}>›</span>
                </div>
              </div>
              {(p.pulledQuote || p.reasons?.[0]) && (
                <div
                  style={{
                    marginTop: 7,
                    fontSize: 12,
                    fontWeight: 600,
                    color: A.BODY,
                    lineHeight: 1.45,
                  }}
                >
                  “{p.pulledQuote || p.reasons?.[0]}”
                </div>
              )}
            </div>
          );
        })}

        <div
          style={{
            marginTop: 26,
            fontSize: 12,
            fontWeight: 600,
            color: A.BODY,
            lineHeight: 1.5,
          }}
        >
          {t('overview.tiPicks.board.methodology')}
        </div>
      </div>
    </SheetShell>
  );
}
