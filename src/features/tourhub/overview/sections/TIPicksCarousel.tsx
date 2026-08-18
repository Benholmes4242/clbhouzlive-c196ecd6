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
import { TOPAR_UNDER_LIGHT, TOPAR_UNDER_DARK } from '../../_shared/tokens';

import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { useSinglePlayerStatistics, useTourTournament, type TourTournament } from '../../hooks/useTourHubData';
import { useBatchCourseImages } from '../../hooks/useBatchCourseImages';
import { usePlayerResults } from '../../hooks/usePlayerResults';
import { useSeasonResultsSummary } from '../../hooks/useSeasonResultsSummary';
import { Skeleton } from '@/components/ui/skeleton';
import { A, LABEL } from '@/features/courses/components/holes/analytical/tokens';
import { CHIP_GLASS_CLASS } from '@/styles/photoScrim';

// ---- Design tokens (per approved TIRedesign) ----
const INK = '#0E1013';
const INK_60 = 'rgba(15,23,42,0.60)';
const INK_45 = 'rgba(15,23,42,0.45)';
const HAIR = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C2620A';
const GREEN_BG = '#DCFCE7';
const GREEN_TX = '#166534';
/** the record line's green on the scrim band; GREEN_TX is a light-surface value
 *  and fails here */
const GREEN_ON_DARK = '#5BD98D';
const RED_BG = '#FEE2E2';
const RED_TX = '#B91C1C';
const GOLD_BG = 'linear-gradient(135deg,#FDE68A 0%,#F7931E 100%)';
const GOLD_TX = '#7C4A03';
/** the win chip's gold on dark glass - border and figure. Not GOLD_TX, which is a
 *  dark gold for a light fill. */
const GOLD_LIGHT = '#FDE68A';
const GOLD_RING = 'rgba(247,147,30,0.45)';
/** The winning-pick ring on the DARK band: 0.45 amber disappears over a photo,
 *  so the dark tone takes near-solid amber gold at full strength. */
const GOLD_RING_STRONG = 'rgba(250,176,74,0.95)';

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

const CHIP_WON_CLASS = 'ti-won-chip';

function chipColors(kind: TiVerdictKind): { className?: string; background?: string; color?: string; boxShadow?: string } {
  if (kind === 'win') return { className: CHIP_WON_CLASS, color: '#FFFFFF' };
  if (kind === 'top20') return { background: GREEN_BG, color: GREEN_TX };
  return { background: RED_BG, color: RED_TX };
}


function VerdictChip({
  v,
  size = 'md',
  t,
  onDark = false,
}: {
  v: TiVerdict;
  size?: 'md' | 'lg';
  t: TFunction;
  /** In the tile's top-right slot the pill sits on the DARK top of the scrim —
   *  a bright sky can wash the gold, so it takes a hairline and a lift there. */
  onDark?: boolean;
}) {
  if (v.kind === 'none') return null;
  const big = size === 'lg';
  const isWin = v.kind === 'win';
  const chip = chipColors(v.kind);
  return (
    <span
      className={chip.className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: big ? '5px 12px' : '3px 9px',
        borderRadius: 999,
        fontSize: big ? 13 : 11,
        fontWeight: 700,
        letterSpacing: isWin ? '0.09em' : 0.4,
        textTransform: isWin ? 'uppercase' : undefined,
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
        ...(chip.background ? { background: chip.background } : {}),
        color: chip.color,
        ...(onDark && !isWin
          ? {
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 1px 8px rgba(10,14,10,0.45)',
            }
          : null),
      }}
    >
      {isWin && <span style={{ fontSize: big ? 14 : 12, lineHeight: 1 }}>🏆</span>}
      {isWin ? t('overview.tiPicks.verdict.won') : v.label}
      {v.score != null && <span style={{ fontWeight: 700, color: isWin ? GOLD_LIGHT : undefined }}>{v.score}</span>}
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

  // Every scrim band on this section carries the tournament venue photograph.
  const venueImageUrl = useTournamentVenueImage(tournamentId);
  const scrimCandidates = useMemo(() => (venueImageUrl ? [venueImageUrl] : []), [venueImageUrl]);

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
          <SectionShell eyebrow={t('overview.tiPicks.eyebrow')}>
            <div style={{ padding: '0 16px' }}>
              {/* The heading IS the control (BRIEF_TI_HEADER_CTA_AND_METHOD_SHEET S1).
                  The explainer that briefly sat here has moved into the sheet: it is a
                  paragraph, and a paragraph above a carousel costs the first tile its
                  place on screen. */}
              <button
                type="button"
                onClick={() => setSheet({ kind: 'index' })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'transparent',
                  border: 'none',
                  margin: 0,
                  // S1.5 requires 44px. The brief's 8/10 leaves 35.5px around a
                  // 17.5px line, so the padding grows rather than shipping short.
                  padding: '13px 0 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: V4.ink, letterSpacing: '-0.005em', lineHeight: 1.35 }}>
                  {t('overview.tiPicks.subline')}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: V4.inkFaint, lineHeight: 1 }} aria-hidden="true">
                  {'\u203A'}
                </span>
              </button>
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
                // The headshot is the AVATAR only — it never feeds the scrim.
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
                    {/* THE SCRIM BAND — DARK on the tile (the sheets stay light).
                        All three tiles carry the SAME venue photograph: they are
                        three picks for one tournament, and the repetition is what
                        ties the section to the page. The dark gradient keeps the
                        picture instead of bleaching it and gives the white name,
                        score and reason somewhere solid to sit — the treatment the
                        course cards already use. */}
                    <PickScrimBand
                      candidates={scrimCandidates}
                      tone="dark"
                      minHeight={168}
                      padding="12px 15px 13px"
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          minHeight: 10,
                        }}
                      >
                        <span style={{ ...PICK_META, color: 'rgba(255,255,255,0.75)' }}>
                          {t('overview.tiPicks.card.pickOf', { n: p.rank, total: pickTotal })}
                        </span>
                        {/* ONE STATUS SLOT. A win puts the gold pill HERE instead
                            of "FINISHED" — never both, and never a second pill
                            beside the name. */}
                        {isWin ? (
                          <VerdictChip v={v} t={t} onDark />
                        ) : (
                          <PickStatusTag live={live} t={t} tone="dark" />
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                              size={46}
                              srcCandidates={headshots}
                              alt={p.playerName}
                              userId={p.playerId}
                              hairlineRing
                              ringColor={isWin ? GOLD_RING_STRONG : 'rgba(255,255,255,0.55)'}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                            {/* The name carries the SAME amber mark as the hero board
                                row, so a member reads the two as one statement. */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, flex: 1 }}>
                              <span
                                style={{
                                  fontSize: 15.5,
                                  fontWeight: 700,
                                  letterSpacing: '-0.02em',
                                  color: '#FFFFFF',
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
                            <CardStateSlot
                              state={state}
                              pick={p}
                              live={live}
                              settled={settled}
                              v={v}
                              t={t}
                              tone="dark"
                              // The win pill has moved to the status slot above.
                              suppressWinChip
                            />

                          </div>
                        </div>

                        {/* The reason now lives INSIDE the photograph. */}
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: 'rgba(255,255,255,0.86)',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {p.pulledQuote || p.reasons?.[0] || '—'}
                        </div>
                      </div>
                    </PickScrimBand>

                    {/* THE WHITE BODY — one row only. Everything else is on the photo. */}
                    <div style={{ padding: '13px 15px 14px' }}>
                      {/* Affordance, not a control — the whole card is the tap target */}
                      <span
                        style={{
                          display: 'block',
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
                tournamentId={tournamentId}
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
                tournamentId={tournamentId}
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
 * useTournamentVenueImage — the ONE scrim source for Tournament Intelligence.
 * Every band (tiles, case sheet, board sheet) carries the tournament's venue
 * photograph, the same image the hero uses. No headshot ever feeds a scrim:
 * a face is not atmosphere. Returns null when nothing resolves, and the band
 * then paints the gradient alone at the same height.
 */
function useTournamentVenueImage(tournamentId: string | undefined) {
  const { data: tournament } = useTourTournament(tournamentId ?? '');
  const venueAdapter = useMemo(
    () => (tournament?.venue_name ? [{ venue_name: tournament.venue_name } as TourTournament] : []),
    [tournament?.venue_name]
  );
  const { data: imageMap } = useBatchCourseImages(venueAdapter);
  return tournament?.venue_name ? imageMap?.get(tournament.venue_name) ?? null : null;
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
  objectPosition = '50% 45%',
  tone = 'light',
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
  /**
   * TONE — a variant, not a fork (same pattern as TrajectoryLine's `surface`).
   * 'dark' keeps the photograph and gives white text a floor. The TILE and
   * BOTH SHEETS use it - one chain, hero to tile to sheet. 'light' is now
   * unused by any caller; it is kept because the band is a shared primitive
   * and a surface that opens on a light photo may need it again.
   */
  tone?: 'light' | 'dark';
}) {
  const [idx, setIdx] = useState(0);
  const src = idx < candidates.length ? candidates[idx] : null;
  const dark = tone === 'dark';
  return (
    <div style={{ position: 'relative', minHeight, padding, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: dark ? 'rgba(10,14,10,0.55)' : 'rgba(15,23,42,0.10)' }} />
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
            objectPosition,
          }}
        />
      ) : null}
      <div
        aria-hidden
        style={{
          background: dark
            ? // DARK BRANCH — EXCLUDED from the canonical scrim
              // (CORRECTION_APP_WIDE_SCRIM §3): starts at 0.12, NOT
              // transparent, because a bright sky swallows the pick label at
              // the top (BRIEF_TI_TILE_DARK_SCRIM §2.1).
              'linear-gradient(180deg, rgba(10,14,10,0.12) 0%, rgba(10,14,10,0.50) 44%, rgba(10,14,10,0.92) 100%)'
            : // LIGHT BRANCH — untouched: it fades to the sheet's #FFFFFF.
               `linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) ${fadeStart}%, rgba(255,255,255,0.55) ${Math.round(fadeStart + (100 - fadeStart) * 0.5)}%, rgba(255,255,255,0.88) ${Math.round(fadeStart + (100 - fadeStart) * 0.78)}%, #FFFFFF 100%)`,
          position: 'absolute',
          inset: 0,
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
 * On the DARK tile band the chip rides a rgba(10,14,10,0.5) pill with a
 * white-24 border; the live dot stays red either way.
 */
function PickStatusTag({
  live,
  t,
  tone = 'light',
}: {
  live: PickLiveState | undefined;
  t: TFunction;
  tone?: 'light' | 'dark';
}) {
  if (!live || live.thru == null) return null;
  if (DEMOTED_STATUS.has((live.status ?? '').toUpperCase())) return null;
  const dark = tone === 'dark';
  const wrap = (children: React.ReactNode, color: string) => (
    <span
      className={dark ? CHIP_GLASS_CLASS : undefined}
      style={{
        ...PICK_META,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        ...(dark
          ? {
              borderRadius: 999,
              padding: '3px 8px',
            }
          : null),
      }}
    >
      {children}
    </span>
  );
  if (live.thru >= 18) {
    return wrap(t('overview.status.finished'), dark ? 'rgba(255,255,255,0.72)' : A.DIM);
  }
  return wrap(
    <>
      <span style={{ width: 5, height: 5, borderRadius: 999, background: TOUR_UNDER, flexShrink: 0 }} />
      {t('overview.status.thru', { n: live.thru })}
    </>,
    dark ? 'rgba(255,255,255,0.86)' : A.MUTE,
  );
}

function CardStateSlot({

  state,
  pick,
  live,
  settled,
  v,
  t,
  tone = 'light',
  suppressWinChip = false,
}: {
  state: EventState;
  pick: AITopContender;
  live: PickLiveState | undefined;
  settled: boolean;
  v: TiVerdict;
  t: TFunction;
  tone?: 'light' | 'dark';
  /** The tile moves the win pill into the top-right status slot, so the inline
   *  chip must not draw it a second time. */
  suppressWinChip?: boolean;
}) {
  const dark = tone === 'dark';
  if (settled) {
    if (v.kind === 'none') {
      // Settled with no leaderboard row → show fit if present.
      return <CourseFitLine score={pick.courseFitScore} t={t} tone={tone} />;
    }
    if (suppressWinChip && v.kind === 'win') return null;

    return <VerdictChip v={v} t={t} />;
  }
  if (state === 'live' && live) {
    const cutV = tiVerdict(live);
    if (cutV.kind === 'mc') return <VerdictChip v={cutV} t={t} />;
    if (live.position != null) {
      if (dark) return <DarkScoreBlock live={live} />;
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
  }
  // Pre-tournament (upcoming) or live-with-no-row → course fit
  return <CourseFitLine score={pick.courseFitScore} t={t} tone={tone} />;
}

/**
 * DarkScoreBlock — score + position over the photograph, right-aligned.
 * THE TOKEN SWITCHES: under par uses TOPAR_UNDER_DARK (#DC2626), because
 * TOPAR_UNDER_LIGHT is tuned for ink on white and goes muddy on a photo.
 * Level / over par become white-tinted (INK is invisible here).
 */
function DarkScoreBlock({ live }: { live: PickLiveState }) {
  const score = live.score;
  const scoreText = formatTiScore(score) ?? (score == null ? null : String(score));
  const pos = formatTiPosition(live.position, live.positionTied);
  const color =
    score == null || !Number.isFinite(score)
      ? 'rgba(255,255,255,0.86)'
      : score < 0
        ? TOPAR_UNDER_DARK
        : score === 0
          ? 'rgba(255,255,255,0.86)'
          : 'rgba(255,255,255,0.7)';
  if (!scoreText && !pos) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0 }}>
      {scoreText ? (
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color, fontVariantNumeric: 'tabular-nums' }}>
          {scoreText}
        </span>
      ) : null}
      {pos ? (
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>
          {pos}
        </span>
      ) : null}
    </div>
  );
}


function CourseFitLine({
  score,
  t,
  tone = 'light',
}: {
  score: number | null | undefined;
  t: TFunction;
  tone?: 'light' | 'dark';
}) {
  if (score == null) return <div style={{ height: 16 }} />;
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: tone === 'dark' ? 'rgba(255,255,255,0.72)' : INK_45,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
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
              tone="dark"
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
  tournamentId,
  state,
  live,
  tourCode,
  onClose,
  onNavigatePlayer,
}: {
  pick: AITopContender;
  tournamentId: string | undefined;
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

  // The headshot is the AVATAR only — it never feeds the scrim.
  const headshots = pick.photoUrl
    ? [pick.photoUrl, ...getPlayerHeadshotCandidates(pick.playerName, tourCode)]
    : getPlayerHeadshotCandidates(pick.playerName, tourCode);

  const venueImageUrl = useTournamentVenueImage(tournamentId);
  const caseScrim = useMemo(() => (venueImageUrl ? [venueImageUrl] : []), [venueImageUrl]);

  const headScore = live?.score ?? null;

  const header = (
    <>
      <span
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.82)',
          letterSpacing: '0.11em',
          textTransform: 'uppercase',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {t('overview.tiPicks.case.eyebrow')}
      </span>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
        <div
          role="link"
          onClick={() => onNavigatePlayer(pick.playerId)}
          style={{ cursor: 'pointer', flexShrink: 0 }}
        >
          <SquircleAvatar
            size={58}
            srcCandidates={headshots}
            alt={pick.playerName}
            userId={pick.playerId}
            hairlineRing
            ringColor="rgba(255,255,255,0.55)"
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#FFFFFF',
                margin: 0,
                letterSpacing: '-0.024em',
                lineHeight: 1.12,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
              }}
            >
              {pick.playerName}
            </h2>
            <ClbhouzPickMark size={13} label={t('overview.board.clbhouzPick')} />
          </div>
        </div>
        {headScore != null ? (
          <span
            style={{
              flexShrink: 0,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
              color: headScore < 0 ? TOPAR_UNDER_DARK : headScore > 0 ? '#FFFFFF' : 'rgba(255,255,255,0.70)',
            }}
          >
            {formatTiScore(headScore)}
          </span>
        ) : null}
      </div>
    </>
  );

  return (
    <SheetShell
      onClose={onClose}
      header={header}
      scrim={{ candidates: caseScrim, minHeight: 168, fadeStart: 23 }}
    >

      {/* Verdict banner — the score lives in the HEAD, beside the name, so the
          banner carries only what the head does not: position and THRU. */}
      <VerdictBanner v={v} state={state} live={live} t={t} hideScore={headScore != null} />

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
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: INK_45,
            letterSpacing: '0.11em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          {t('overview.tiPicks.case.whyWePicked')}
        </div>
        {(pick.reasons ?? []).map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 12,
              paddingTop: i === 0 ? 0 : 12,
              paddingBottom: 12,
              borderBottom: `1px solid ${HAIR}`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: INK_45, minWidth: 22, letterSpacing: '0.06em', fontVariantNumeric: 'tabular-nums lining-nums' }}>
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
                <Skeleton key={i} style={{ height: 40, borderRadius: 6 }} />
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

      {/* CTA — OUTLINED, not filled. Reading the case is the purpose of this
          sheet; tapping through to the profile is the exit, not the headline. */}
      <button
        onClick={() => onNavigatePlayer(pick.playerId)}
        style={{
          marginTop: 20,
          width: '100%',
          padding: '13px 0',
          borderRadius: 14,
          background: 'transparent',
          color: INK,
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          border: `1px solid ${HAIR}`,
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
  hideScore = false,
}: {
  v: TiVerdict;
  state: EventState;
  live: PickLiveState | undefined;
  t: TFunction;
  /** The head already carries the score: the banner must not repeat it. */
  hideScore?: boolean;
}) {
  const settled = state === 'completed';
  if (!settled && state !== 'live') return null;

  // In progress → neutral banner (only when we have a row)
  if (!settled) {
    if (!live || live.position == null) return null;
    const posText = `${live.positionTied ? 'T' : ''}${live.position}`;
    const thruLabel =
      live.thru == null
        ? null
        : live.thru >= 18
          ? t('overview.status.finished')
          : t('overview.status.thru', { n: live.thru });
    return (
      <div
        style={{
          marginTop: 14,
          paddingBottom: 4,

          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          gap: 12,
        }}
      >
        {hideScore ? (
          // POSITION and THRU only — the score sits beside the name above.
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
              {posText}
            </span>
            {thruLabel ? (
              <span
                style={{
                  fontSize: 7.5,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: INK_45,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {thruLabel}
              </span>
            ) : null}
          </div>
        ) : (
          /* No "ON THE COURSE" label — the position, score and thru say it. */
          <TourStatusBlock
            score={live.score}
            position={live.position}
            positionTied={live.positionTied}
            thru={live.thru}
            status={live.status}
            align="right"
          />
        )}
      </div>
    );
  }

  // Settled — the OUTCOME, never the word "Finished".
  if (v.kind === 'none') return null;
  const scoreRight = (text: string) => (hideScore ? '' : text);
  if (v.kind === 'win') {
    return (
      <BannerRow
        left={t('overview.tiPicks.case.wonIt')}
        leftColor={GOLD_TX}
        right={scoreRight(`${t('overview.tiPicks.verdict.won')}${v.score != null ? ` · ${v.score}` : ''}`)}
        rightColor={GOLD_TX}
        background={GOLD_BG}
      />
    );
  }
  if (v.kind === 'top20') {
    return (
      <BannerRow
        left={v.label ?? ''}
        leftColor={GREEN_TX}
        right={scoreRight(v.score != null ? String(v.score) : '')}
        rightColor={GREEN_TX}
        background={GREEN_BG}
      />
    );
  }
  return (
    <BannerRow
      left={v.kind === 'mc' ? (v.label ?? 'MC') : (v.label ?? '')}
      leftColor={RED_TX}
      right={v.kind === 'mc' ? '' : scoreRight(v.score != null ? String(v.score) : '')}
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

/** A figure with a label — no tinted capsule, no border. Alignment separates. */
function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div
        style={{
          fontSize: 19,
          fontWeight: 600,
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
          marginTop: 5,
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
          : // usePlayerResults returns MOST RECENT FIRST. The direction label
            // states "most recent on the right", so reverse to oldest → newest.
            results.slice(0, 5).reverse().map((r, i) => {
              const v = verdictFromResult(r);
              const isWin = v.kind === 'win';
              const isMc = v.kind === 'mc';
              // RED MEANS UNDER PAR on tour surfaces, so a red MC beside a green
              // 2 reads as two SCORES. Amber — the one colour that already means
              // clbhouz here — marks the win; everything else is neutral.
              const style: React.CSSProperties = {
                flex: 1,
                textAlign: 'center',
                padding: '7px 0',
                borderRadius: 10,
                fontSize: 11.5,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: 0.3,
                background: isWin ? 'rgba(247,147,30,0.12)' : 'transparent',
                border: `1px solid ${isWin ? AMBER : HAIR}`,
                color: isWin ? AMBER_DEEP : isMc ? INK_45 : INK,
              };
              const label = isWin ? '1' : isMc ? (v.label ?? 'MC') : (v.label ?? '—');
              return (
                <div key={i} style={style}>
                  {label}
                </div>
              );
            })}
      </div>
      <div
        style={{
          marginTop: 7,
          fontSize: 9,
          fontWeight: 700,
          color: INK_45,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
        }}
      >
        {t('overview.tiPicks.case.mostRecentRight')}
      </div>
    </div>

  );
}

// ---- Board sheet ----

/**
 * TIMethodSection - "How we pick", rendered BELOW the pick rows inside the
 * picks sheet. Editorial groupings of real inputs; counts come from the locale
 * lists, not from the pipeline at runtime. No model names, no model count, no
 * accuracy figure, no gambling language.
 */
function TIMethodSection({ t }: { t: TFunction }) {
  const groups: { label: string; items: string[] }[] = [
    {
      label: t('overview.tiPicks.method.playerLabel'),
      items: t('overview.tiPicks.method.playerItems', { returnObjects: true }) as unknown as string[],
    },
    {
      label: t('overview.tiPicks.method.courseLabel'),
      items: t('overview.tiPicks.method.courseItems', { returnObjects: true }) as unknown as string[],
    },
    {
      label: t('overview.tiPicks.method.weekLabel'),
      items: t('overview.tiPicks.method.weekItems', { returnObjects: true }) as unknown as string[],
    },
  ];

  const rules = t('overview.tiPicks.method.rules', { returnObjects: true }) as unknown as string[];

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ borderTop: `1px solid ${HAIR}` }} />
      <div style={{ ...LABEL, color: A.DIM, marginTop: 14 }}>
        {t('overview.tiPicks.method.heading')}
      </div>
      <div style={{ marginTop: 8, fontSize: 13.5, fontWeight: 400, color: A.BODY, lineHeight: 1.55 }}>
        {t('overview.tiPicks.method.lede')}
      </div>

      {groups.map((g) => (
        <div key={g.label} style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ ...LABEL, color: A.DIM }}>{g.label}</span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: AMBER_DEEP,
                letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {Array.isArray(g.items) ? g.items.length : 0}
            </span>
          </div>
          <div style={{ marginTop: 6 }}>
            {(Array.isArray(g.items) ? g.items : []).map((item, i) => (
              <div
                key={item}
                style={{
                  padding: '7px 0',
                  borderTop: i === 0 ? 'none' : `1px solid ${HAIR}`,
                  fontSize: 13,
                  fontWeight: 500,
                  color: INK,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${HAIR}` }}>
        {(Array.isArray(rules) ? rules : []).map((rule, i) => (
          <div
            key={rule}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: i === 0 ? 0 : 9 }}
          >
            <span
              style={{ width: 5, height: 5, borderRadius: 999, background: AMBER_DEEP, flexShrink: 0 }}
              aria-hidden="true"
            />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: INK }}>
              {rule}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 11.5, fontWeight: 400, color: A.MUTE, lineHeight: 1.5 }}>
        {t('overview.tiPicks.method.closing')}
      </div>
    </div>
  );
}

function AllPicksSheet({
  picks,
  state,
  tourCode,
  tournamentId,
  liveMap,
  onPick,
  onClose,
  onNavigatePlayer,
}: {
  picks: AITopContender[];
  state: EventState;
  tourCode: string;
  tournamentId: string | undefined;
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

  // The board is about THREE picks: leading it with one player's face would say
  // it is about him. It carries the TOURNAMENT COURSE image — the same
  // photograph the hero uses — or the gradient alone when none resolves.
  const venueImageUrl = useTournamentVenueImage(tournamentId ?? undefined);
  const scrimCandidates = venueImageUrl ? [venueImageUrl] : [];

  const header = (
    <>
      <div />
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.82)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 5,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {t('overview.tiPicks.eyebrow')}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 25, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.02 }}>
            {t('overview.tiPicks.board.titleCount', { count: total })}
          </div>
          {showRecord ? (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: recordGood ? GREEN_ON_DARK : 'rgba(255,255,255,0.70)',
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'right',
                flexShrink: 0,
              }}
            >
              {t('overview.tiPicks.board.record', { inside: insideCount, total })}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <SheetShell
      onClose={onClose}
      header={header}
      scrim={{ candidates: scrimCandidates, minHeight: 128, fadeStart: 18 }}

    >
      <div style={{ marginTop: 2 }}>
        {ordered.map((p, i) => {
          const live = liveMap?.[p.playerId];
          const v = settled ? tiVerdict(live) : { kind: 'none' as const, label: null, score: null };
          const figure =
            settled || state === 'live' ? formatTiScore(live?.score) : null;
          const sub =
            live?.position != null && v.kind !== 'mc'
              ? formatTiPosition(live.position, !!live.positionTied)
              : v.kind === 'mc'
                ? (v.label ?? 'MC')
                : null;
          const reason = p.pulledQuote || p.reasons?.[0] || null;
          return (
            <div
              key={p.playerId}
              role="button"
              onClick={() => onPick(p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${HAIR}`,
                cursor: 'pointer',
              }}
            >
              {/* Rank in the position slot a leaderboard would use */}
              <span
                style={{
                  width: 16,
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: INK_45,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.01em',
                }}
              >
                {p.rank}
              </span>
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
                {reason ? (
                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: A.BODY,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {reason}
                  </div>
                ) : null}
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 40 }}>
                {figure ? (
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: (live?.score ?? 0) < 0 ? TOPAR_UNDER_LIGHT : INK,
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.05,
                    }}
                  >
                    {figure}
                  </div>
                ) : null}
                {sub ? (
                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 9,
                      fontWeight: 700,
                      color: INK_45,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {sub}
                  </div>
                ) : null}
              </div>
              <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 700, color: INK_45 }}>›</span>
            </div>
          );
        })}

        {/* THE METHOD, below the picks. The subject is the picks; the method is
            what a member reads once they want to know whether to believe them. */}
        <TIMethodSection t={t} />

      </div>
    </SheetShell>
  );
}

