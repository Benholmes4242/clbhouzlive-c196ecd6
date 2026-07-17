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
import { getScoreColor } from '../../_shared/scoreColor';

import { PlayerAvatar } from '../../components/PlayerAvatar';
import { LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { SPACE } from '@/lib/spacing';
import { formatTimeHm } from '@/i18n/format';

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

const AMBER = '#F7931E';
const CARD_MIN_W = 218;
const CARD_H_EST = 150;

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
    const m = new Map<string, { today: number | null; score: number | null; status: string | null; thru: number | null }>();
    for (const row of (leaderboardQuery.data ?? []) as any[]) {
      const pid = row?.player_id as string | null | undefined;
      if (!pid) continue;
      m.set(pid, {
        today: row?.today ?? null,
        score: row?.score ?? null,
        status: (row?.status ?? null) as string | null,
        thru: row?.thru ?? null,
      });
    }
    return m;
  }, [leaderboardQuery.data]);

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
      <SectionShell eyebrow={t('overview.onTheCourse.eyebrow')} eyebrowColor={V4.amber} rightMeta={rightMeta}>
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
            return (
              <div
                key={g.group_id ?? `f-${gi}`}
                style={{
                  minWidth: CARD_MIN_W,
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                  background: V4.surface,
                  border: `1.5px solid ${AMBER}`,
                  boxShadow: V4.cardShadow,
                  borderRadius: 14,
                  padding: '12px 12px 10px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: V4.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {time ? `TEE ${time}` : ''}
                    {time && thru != null ? ' · ' : ''}
                    {thru != null ? `THRU ${thru >= 18 ? 'F' : thru}` : ''}
                  </div>
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 900,
                      letterSpacing: '0.12em',
                      color: '#fff',
                      background: AMBER,
                      padding: '2px 5px',
                      borderRadius: 5,
                      textTransform: 'uppercase',
                      lineHeight: 1,
                    }}
                  >
                    ★ {t('overview.onTheCourse.featuredChip')}
                  </span>
                </div>
                {(g.players ?? []).slice(0, 3).map((p, pi) => {
                  const name = p.full_name || p.name || '';
                  const status = (p.status || '').toUpperCase();
                  const isCut = status === 'CUT' || status === 'WD' || status === 'DQ';
                  const display = formatScore(p.today) ?? formatScore(p.score) ?? '—';
                  return (
                    <button
                      key={pi}
                      type="button"
                      onClick={() => { if (p.player_id) navigate(`/tourhub/player/${p.player_id}`); }}
                      disabled={!p.player_id}
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
                        cursor: p.player_id ? 'pointer' : 'default',
                      }}
                    >
                      <PlayerAvatar
                        playerId={name}
                        playerName={name}
                        tourCode={tourCode}
                        photoUrl={p.photo_url ?? null}
                        size="xs"
                        ringColor={LIGHT_HAIRLINE}
                      />
                      <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700, color: V4.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {name}
                      </div>
                      {isCut ? (
                        <span style={{ fontSize: 9.5, fontWeight: 800, color: V4.inkFaint, letterSpacing: '0.1em' }}>{status}</span>
                      ) : (
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: scoreColor(display), fontVariantNumeric: 'tabular-nums' }}>{display}</span>
                      )}
                    </button>
                  );
                })}
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
              <span style={{ fontSize: 11.5, fontWeight: 800, color: V4.ink }}>{t('overview.onTheCourse.allGroups')}</span>
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
                    fontWeight: 800,
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
                      background: V4.surface,
                      border: `0.5px solid ${V4.cardBorder}`,
                      boxShadow: V4.cardShadow,
                      borderRadius: 14,
                      padding: '12px 12px 10px',
                      contentVisibility: 'auto',
                      containIntrinsicSize: `${CARD_MIN_W}px ${CARD_H_EST}px`,
                    } as React.CSSProperties}
                  >
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: V4.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                      {time ? t('overview.onTheCourse.teeTimeLabel', { time }) : ''}
                      {g.startingHole ? t('overview.onTheCourse.holeLabelSep', { hole: g.startingHole }) : ''}
                    </div>
                    {g.players.slice(0, 3).map((p, pi) => {
                      const lb = p.id ? leaderboardByPlayerId.get(p.id) : undefined;
                      const status = (lb?.status || '').toUpperCase();
                      const isCut = status === 'CUT' || status === 'WD' || status === 'DQ';
                      const display = formatScore(lb?.today) ?? formatScore(lb?.score) ?? '—';
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
                            <span style={{ fontSize: 9.5, fontWeight: 800, color: V4.inkFaint, letterSpacing: '0.1em' }}>{status}</span>
                          ) : (
                            <span style={{ fontSize: 12.5, fontWeight: 800, color: display === '—' ? V4.inkFaint : scoreColor(display), fontVariantNumeric: 'tabular-nums' }}>{display}</span>
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
                <span style={{ fontSize: 11.5, fontWeight: 800, color: V4.ink }}>{t('overview.onTheCourse.backToLine1')}</span>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: V4.ink }}>{t('overview.onTheCourse.backToLine2')}</span>
              </button>
            </>
          )}
        </div>

      </SectionShell>
    </div>
  );
}
