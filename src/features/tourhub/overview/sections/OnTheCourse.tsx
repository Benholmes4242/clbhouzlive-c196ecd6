/**
 * OnTheCourse — live-only horizontal rail of featured groups with in-place
 * expansion to the full field.
 *
 * Collapsed (default): featured cards from useFeaturedGroups (amber-ringed
 * with a FEATURED chip) + a ghost "All groups" end-cap.
 *
 * Expanded (tap end-cap): fetches full round-1 tee times via useTeeTimesAll
 * (lazy, enabled only after tap; cached by react-query). The rail continues
 * with a FULL FIELD divider then every remaining group in chronological
 * order, deduped against featured. Full-field score columns are joined on
 * sr_players.id to the tournament leaderboard (useTourLeaderboard, shared
 * via react-query with the hero — no extra network); missing = em-dash
 * (WDs, pre-tee players with no card yet, or leaderboard fetch failure).
 *
 * Collapse via the "Back to featured" end tile. Expansion resets automatically
 * when tournamentId changes (the hero swiped to a new tournament).
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useFeaturedGroups } from '../data/useFeaturedGroups';
import { useTeeTimesAll, type TeeGroup } from '@/features/tourhub/tournament-v2/data/useTeeTimesAll';
import { useTourLeaderboard } from '../../hooks/useTourHubData';
import { SectionShell } from './SectionShell';
import { V4 } from '../tokens';
import { resolveCutDisplay } from '../../_shared/cutDisplay';
import { useTournamentMeta } from '../../leaderboard/useTournamentMeta';
import { getScoreColor } from '../../_shared/scoreColor';
import { todayFromEntry } from '../../leaderboard/BoardTable';

import { PlayerAvatar } from '../../components/PlayerAvatar';
import { LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { SPACE } from '@/lib/spacing';
import { formatTimeHm } from '@/i18n/format';
import { A, LABEL, KICKER, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { LiveFieldPanel } from './LiveFieldPanel';
import { formatToPar } from '../data/liveRoundStats';


interface Props {
  tournamentId: string | undefined;
  live: boolean;
  tourCode?: string;
}

interface GroupPlayerShape {
  player_id?: string;
  full_name?: string;
  name?: string;
  photo_url?: string | null;
  headshot_override?: string | null;
  position?: number | null;
  score?: number | string | null;

  today?: number | string | null;
  thru?: number | null;
  status?: string | null;
}

interface GroupShape {
  group_id?: string;
  tee_time?: string;
  thru?: number | null;
  players?: GroupPlayerShape[];
}

/**
 * CARD_MIN_W widened 218 -> 248. The row now carries a 22px position column,
 * a 32px avatar and a two-line figure stack; at 218 a full tour name
 * ("Scottie Scheffler") ellipsed after ~7 characters. At 248 the name column
 * clears ~90px and reads. One tile plus a clear peek of the next still shows
 * at 390dp, so the rail still announces that it scrolls.
 */
const CARD_MIN_W = 248;
const CARD_H_EST = 170;
/** Live dot on a still-out group's status line. */
const LIVE_DOT = V4.live;


/**
 * The "FEATURED GROUP" kicker above the featured cards. It renders through the
 * canonical KICKER token (10 / 700 / 0.16em) in A.MUTE — it is subordinate to
 * the section's own eyebrow and must not read as a second section header.
 *
 * Vertical block, re-measured against the 10px token:
 *   16 above (matches SectionEyebrow's top padding) + 12px line box + 6px gap
 *   to the card = 34. Non-featured tiles reserve exactly this so the rail
 *   holds ONE height.
 */
const FEATURED_LABEL_TOP = 16;
const FEATURED_LABEL_H = 18; // 12px line box + 6px gap
const FEATURED_LABEL_BLOCK = FEATURED_LABEL_TOP + FEATURED_LABEL_H; // 34

function FeaturedLabel({ text }: { text?: string }) {
  return (
    <div
      aria-hidden={!text}
      style={{
        ...KICKER,
        color: A.MUTE,
        marginTop: FEATURED_LABEL_TOP,
        height: FEATURED_LABEL_H,
        lineHeight: '12px',
        whiteSpace: 'nowrap',
      }}
    >
      {text ?? ''}
    </div>
  );
}


function parseGroups(raw: unknown): GroupShape[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as GroupShape[];
  if (typeof raw === 'object' && raw !== null) {
    const g = (raw as Record<string, unknown>).groups;
    if (Array.isArray(g)) return g as GroupShape[];
  }
  return [];
}

function parseRoundNumber(raw: unknown): number | null {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const r = (raw as Record<string, unknown>).round_number;
    if (typeof r === 'number' && Number.isFinite(r)) return r;
    if (typeof r === 'string') {
      const n = Number(r);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function formatScore(v: number | string | null | undefined): string | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  if (Number.isNaN(n)) return String(v);
  if (n === 0) return 'E';
  return n < 0 ? String(n) : `+${n}`;
}

function scoreColor(s: string | null): string {
  if (!s || s === 'E') return V4.scoreEven;
  const n = s.startsWith('-') ? -1 : 1;
  return getScoreColor(n, 'light');
}

function groupThru(g: GroupShape): number | null {
  if (typeof g.thru === 'number') return g.thru;
  const first = g.players?.find((p) => typeof p.thru === 'number')?.thru;
  return typeof first === 'number' ? first : null;
}

function formatTeeTime(iso: string | undefined): string {
  if (!iso) return '';
  return formatTimeHm(new Date(iso)).toUpperCase();
}

/** Dedupe key: tee_time + sorted player names joined. */
function featuredKey(g: GroupShape): string {
  const names = (g.players ?? [])
    .map((p) => (p.full_name || p.name || '').trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join('|');
  return `${g.tee_time ?? ''}|${names}`;
}
function teeKey(g: TeeGroup): string {
  const names = g.players
    .map((p) => p.name.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join('|');
  return `${g.teeTime}|${names}`;
}

/**
 * CutWatchLine — one line under the stat band during the cut round only.
 * Projections are only ever shown while current_round === cut_round (see
 * resolveCutDisplay); a stale projection after the cut has landed is never
 * displayed. Tours without a projection (LPGA, Champions, Evans) render
 * nothing — no heading, no placeholder, and no derived figure.
 */
function CutWatchLine({ tournamentId }: { tournamentId: string | undefined }) {
  const { t } = useTranslation('tourhub');
  const { data: meta } = useTournamentMeta(tournamentId ?? null, { live: true });

  const cut = resolveCutDisplay({
    status: meta?.status ?? null,
    currentRound: meta?.current_round ?? null,
    cutRound: meta?.cut_round ?? null,
    cutline: meta?.cutline ?? null,
    projectedCutline: meta?.projected_cutline ?? null,
  });

  if (cut.kind !== 'projected' || cut.cutline == null) return null;

  return (
    <div style={{ padding: `0 ${SPACE.pagePadX}px 10px` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ ...LABEL, color: A.INK }}>{t('tour.projectedCut')}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: A.INK, ...FIGS }}>
          {formatToPar(cut.cutline)}
        </span>
      </div>
    </div>
  );
}

export function OnTheCourse({ tournamentId, live, tourCode = 'pga' }: Props) {

  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const { data } = useFeaturedGroups(tournamentId, { live });
  const [expanded, setExpanded] = useState(false);
  const railRef = useRef<HTMLDivElement | null>(null);

  // Auto-collapse whenever the tournament changes (hero swiped away).
  useEffect(() => {
    setExpanded(false);
  }, [tournamentId]);

  const round = parseRoundNumber(data) ?? 1;

  // Lazy full-field fetch — enabled only once expanded. React-query caches.
  const teeTimesQuery = useTeeTimesAll(tournamentId, round, { enabled: expanded });
  const teeGroups = teeTimesQuery.data ?? [];

  // Reuse the hero's leaderboard query (react-query dedupes by key). Only
  // consumed by the expanded full-field rail — no extra network fires.
  const leaderboardQuery = useTourLeaderboard(tournamentId ?? '');
  const leaderboardByPlayerId = useMemo(() => {
    const m = new Map<string, { today: number | null; score: number | null; status: string | null; thru: number | null; position: number | null; positionTied: boolean | null }>();
    for (const row of (leaderboardQuery.data ?? []) as any[]) {
      const pid = row?.player_id as string | null | undefined;
      if (!pid) continue;
      m.set(pid, {
        // Round-scoped: null means this player has not started the active round.
        today: todayFromEntry(row, round),
        score: row?.score ?? null,
        status: (row?.status ?? null) as string | null,
        thru: row?.thru ?? null,
        position: row?.position ?? null,
        positionTied: row?.position_tied ?? null,
      });
    }
    return m;
  }, [leaderboardQuery.data, round]);

  const groups = parseGroups(data);

  const featuredKeys = useMemo(() => new Set(groups.map(featuredKey)), [groups]);
  const dedupedTee = useMemo(
    () => teeGroups.filter((g) => !featuredKeys.has(teeKey(g))),
    [teeGroups, featuredKeys],
  );

  const collapseToFeatured = () => {
    setExpanded(false);
    railRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  if (!live) return null;
  if (groups.length === 0) return null;

  const featuredCount = groups.length;
  const totalKnown = expanded && teeTimesQuery.isSuccess ? teeGroups.length : null;
  const moreCount = totalKnown != null ? Math.max(0, totalKnown - featuredCount) : null;

  const rightMeta = totalKnown != null
    ? t('overview.onTheCourse.rightMetaWithRound', { count: totalKnown, round })
    : (round != null ? t('overview.onTheCourse.roundShort', { round }) : undefined);

  return (
    <div style={{ marginTop: SPACE.sectionSection }}>
      <SectionShell eyebrow={t('overview.onTheCourse.eyebrow')} rightMeta={rightMeta}>
        <LiveFieldPanel
          entries={(leaderboardQuery.data ?? []) as any[]}
          round={round}
          tournamentId={tournamentId ?? ''}
          live={live}
        />
        <CutWatchLine tournamentId={tournamentId} />
        <div

          ref={railRef}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            overflowX: 'auto',
            padding: '0 16px 6px',
            scrollPaddingLeft: 16,
            scrollSnapType: 'x proximity',
          }}
        >
          {groups.map((g, gi) => {
            const thru = groupThru(g);
            const time = formatTeeTime(g.tee_time);
            // The card has no "finished" fact — sr_leaderboards.status carries
            // only active / CUT / WD / DQ / MDF / DNS. Finished is therefore
            // INFERRED from thru >= 18 (see the brief's report).
            const finished = thru != null && thru >= 18;
            const stillOut = thru != null && thru < 18;
            return (
              <div
                key={g.group_id ?? `f-${gi}`}
                style={{
                  minWidth: CARD_MIN_W,
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                }}
              >
                <FeaturedLabel text={t('overview.onTheCourse.featuredGroupLabel')} />
                <div
                  style={{
                    background: V4.surface,
                    border: `0.5px solid ${V4.cardBorder}`,
                    boxShadow: V4.cardShadow,
                    borderRadius: 14,
                    padding: '13px 14px 13px',
                    position: 'relative',
                  }}
                >
                {/* Status line — leads with whatever currently matters. */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginBottom: 9,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                    {stillOut && (
                      <span
                        aria-hidden
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          background: LIVE_DOT,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: stillOut ? A.INK : A.MUTE,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {stillOut
                        ? t('overview.onTheCourse.thruLabel', { value: thru })
                        : finished
                          ? t('overview.onTheCourse.finishedLabel')
                          : time
                            ? t('overview.onTheCourse.teeTimeLabel', { time })
                            : ''}
                    </span>
                  </span>
                  {/* The tee time never disappears — it is how a member finds
                      the group on a tee sheet — it just stops competing. */}
                  {time && (stillOut || finished) && (
                    <span
                      style={{
                        fontSize: 7,
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: A.DIM,
                        whiteSpace: 'nowrap',
                        ...FIGS,
                      }}
                    >
                      {t('overview.onTheCourse.teeTimeLabel', { time })}
                    </span>
                  )}
                </div>

                {/* Every player in the group — no cap. */}
                {(g.players ?? []).map((p, pi) => {
                  const name = p.full_name || p.name || '';
                  const lbRow = p.player_id ? leaderboardByPlayerId.get(p.player_id) : undefined;
                  const status = (lbRow?.status || p.status || '').toUpperCase();
                  const isCut = status === 'CUT' || status === 'MC' || status === 'WD' || status === 'DQ';

                  const posNum = p.position ?? lbRow?.position ?? null;
                  const tied = lbRow?.positionTied ?? null;
                  const posText = posNum != null ? `${tied ? 'T' : ''}${posNum}` : '';

                  const total = formatScore(lbRow ? lbRow.score : (p.score as number | string | null));
                  // Prefer the round-scoped leaderboard figure; fall back to
                  // the group RPC's own today when the board's is round-gated null.
                  const todayVal = (lbRow?.today ?? (p.today as number | string | null)) ?? null;
                  const today = formatScore(todayVal);

                  return (
                    <button
                      key={pi}
                      type="button"
                      onClick={() => { if (p.player_id) navigate(`/tourhub/player/${p.player_id}`); }}
                      disabled={!p.player_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '9px 0',
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        // Hairline between players only, never above the first.
                        borderTop: pi === 0 ? 'none' : `0.5px solid ${V4.hairline}`,
                        textAlign: 'left',
                        cursor: p.player_id ? 'pointer' : 'default',
                      }}
                    >
                      <PlayerAvatar
                        playerId={p.player_id ?? name}
                        playerName={name}
                        tourCode={tourCode}
                        photoUrl={p.photo_url ?? null}
                        size="sm"
                        ringColor={LIGHT_HAIRLINE}
                      />
                      <span
                        style={{
                          width: 22,
                          flexShrink: 0,
                          fontSize: 7.5,
                          fontWeight: 700,
                          color: A.DIM,
                          letterSpacing: '0.02em',
                          ...FIGS,
                        }}
                      >
                        {posText}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: 13.5,
                          fontWeight: 700,
                          letterSpacing: '-0.01em',
                          color: V4.ink,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {name}
                      </span>
                      {isCut ? (
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: V4.inkFaint, letterSpacing: '0.1em' }}>{status}</span>
                      ) : (
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              letterSpacing: '-0.02em',
                              color: total ? scoreColor(total) : V4.inkFaint,
                              ...FIGS,
                            }}
                          >
                            {total ?? '—'}
                          </span>
                          {today && (
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                color: A.DIM,
                                whiteSpace: 'nowrap',
                                ...FIGS,
                              }}
                            >
                              {t('overview.onTheCourse.todaySuffix', { value: today })}
                            </span>
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
                </div>
              </div>

            );
          })}


          {!expanded && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label={t('overview.onTheCourse.showAllAria')}
              style={{
                minWidth: 122,
                flexShrink: 0,
                scrollSnapAlign: 'start',
                // Reserve the FEATURED GROUP kicker's space so the rail keeps
                // one height and every tile top-aligns.
                marginTop: FEATURED_LABEL_BLOCK,

                background: V4.surface,
                border: `1px dashed #CBD5E1`,
                borderRadius: 16,
                padding: '14px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 300, color: '#64748B', lineHeight: 1 }}>›</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: V4.ink }}>{t('overview.onTheCourse.allGroups')}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8' }}>
                {moreCount != null ? t('overview.onTheCourse.moreCount', { count: moreCount }) : t('overview.onTheCourse.fullField')}
              </span>
            </button>
          )}

          {expanded && (
            <>
              {/* FULL FIELD divider */}
              <div
                aria-hidden
                style={{
                  minWidth: 34,
                  flexShrink: 0,
                  marginTop: FEATURED_LABEL_BLOCK,
                  alignSelf: 'stretch',

                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '0 4px',
                }}
              >
                <div style={{ flex: 1, width: 1, background: '#E2E8F0' }} />
                <div
                  style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    fontSize: 7.5,
                    fontWeight: 700,
                    color: '#94A3B8',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('overview.onTheCourse.fullFieldDivider')}
                </div>
                <div style={{ flex: 1, width: 1, background: '#E2E8F0' }} />
              </div>

              {teeTimesQuery.isLoading && (
                <>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={`sk-${i}`}
                      style={{
                        minWidth: CARD_MIN_W,
                        flexShrink: 0,
                        scrollSnapAlign: 'start',
                        marginTop: FEATURED_LABEL_BLOCK,

                        background: V4.surface,
                        border: `0.5px solid ${V4.cardBorder}`,
                        borderRadius: 14,
                        padding: 12,
                        height: CARD_H_EST,
                        opacity: 0.55,
                      }}
                    >
                      <div style={{ width: 80, height: 10, background: '#E2E8F0', borderRadius: 4, marginBottom: 12 }} />
                      {[0, 1, 2].map((r) => (
                        <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0' }}>
                          <div style={{ width: 26, height: 26, borderRadius: 8, background: '#E2E8F0' }} />
                          <div style={{ flex: 1, height: 10, background: '#E2E8F0', borderRadius: 4 }} />
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}

              {dedupedTee.map((g, gi) => {
                const time = formatTeeTime(g.teeTime);
                return (
                  <div
                    key={`t-${gi}-${g.teeTime}`}
                    style={{
                      minWidth: CARD_MIN_W,
                      flexShrink: 0,
                      scrollSnapAlign: 'start',
                      marginTop: FEATURED_LABEL_BLOCK,

                      background: V4.surface,
                      border: `0.5px solid ${V4.cardBorder}`,
                      boxShadow: V4.cardShadow,
                      borderRadius: 14,
                      padding: '12px 12px 10px',
                      contentVisibility: 'auto',
                      containIntrinsicSize: `${CARD_MIN_W}px ${CARD_H_EST}px`,
                    } as React.CSSProperties}
                  >
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: V4.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                      {time ? t('overview.onTheCourse.teeTimeLabel', { time }) : ''}
                      {g.startingHole ? t('overview.onTheCourse.holeLabelSep', { hole: g.startingHole }) : ''}
                    </div>
                    {g.players.slice(0, 3).map((p, pi) => {
                      const lb = p.id ? leaderboardByPlayerId.get(p.id) : undefined;
                      const status = (lb?.status || '').toUpperCase();
                      const isCut = status === 'CUT' || status === 'WD' || status === 'DQ';
                      // Not started the active round -> TOTAL to par; started -> TODAY.
                      const display = (lb && lb.today != null
                        ? formatScore(lb.today)
                        : formatScore(lb?.score)) ?? '—';
                      return (
                        <button
                          key={pi}
                          type="button"
                          onClick={() => { if (p.id) navigate(`/tourhub/player/${p.id}`); }}
                          disabled={!p.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 9,
                            padding: '6px 0',
                            minHeight: 40,
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            borderTop: pi === 0 ? 'none' : `0.5px solid ${V4.hairline}`,
                            textAlign: 'left',
                            cursor: p.id ? 'pointer' : 'default',
                          }}
                        >
                          <PlayerAvatar
                            playerId={p.id ?? p.name}
                            playerName={p.name}
                            tourCode={tourCode}
                            photoUrl={p.photoUrl ?? null}
                            size="xs"
                            ringColor={LIGHT_HAIRLINE}
                          />
                          <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700, color: V4.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </div>
                          {isCut ? (
                            <span style={{ fontSize: 9.5, fontWeight: 700, color: V4.inkFaint, letterSpacing: '0.1em' }}>{status}</span>
                          ) : (
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: display === '—' ? V4.inkFaint : scoreColor(display), fontVariantNumeric: 'tabular-nums' }}>{display}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {/* Back-to-featured end tile */}
              <button
                type="button"
                onClick={collapseToFeatured}
                aria-label={t('overview.onTheCourse.backToFeaturedAria')}
                style={{
                  minWidth: 122,
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                  marginTop: FEATURED_LABEL_BLOCK,

                  background: V4.surface,
                  border: `1px dashed #CBD5E1`,
                  borderRadius: 16,
                  padding: '14px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 22, fontWeight: 300, color: '#64748B', lineHeight: 1 }}>‹</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: V4.ink }}>{t('overview.onTheCourse.backToLine1')}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: V4.ink }}>{t('overview.onTheCourse.backToLine2')}</span>
              </button>
            </>
          )}
        </div>

      </SectionShell>
    </div>
  );
}
