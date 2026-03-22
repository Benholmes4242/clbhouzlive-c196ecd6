/**
 * TournamentHubCard — Multi-page carousel card for the Clubhouse feed.
 * Contains live, result, and upcoming tournament pages with horizontal navigation.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import type { TournamentHubFeedPost, LiveLeaderboardEntry } from '@/components/media-system/types/media';
import type { TournamentHubPage, TournamentHubPageState } from '@/components/media-system/types/TournamentHubPage';
import { format, formatDistanceToNow, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

/* ── Colour tokens ── */
const AMBER = '#f59e0b';
const GREEN = '#22c55e';
const SILVER = '#94a3b8';
const INDIGO = '#818cf8';
const AMBER_DIM = 'rgba(245,158,11,0.08)';
const AMBER_BORDER = 'rgba(245,158,11,0.18)';

/* ── Keyframe injection ── */
function injectKeyframes() {
  const ID = 'clb-hub-card-kf';
  if (document.getElementById(ID)) return;
  const s = document.createElement('style');
  s.id = ID;
  s.textContent = `
    @keyframes clb-hub-pulse {
      0%,100% { opacity:1; transform:scale(1); }
      50%     { opacity:0.4; transform:scale(0.75); }
    }
    @keyframes clb-hub-fadeUp {
      from { opacity:0; transform:translateY(12px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes clb-hub-heart {
      0%   { transform:scale(1); }
      30%  { transform:scale(1.35); }
      60%  { transform:scale(0.9); }
      100% { transform:scale(1); }
    }
  `;
  document.head.appendChild(s);
}

/* ── Helpers ── */
function roundLabel(round: number, total: number): string {
  if (round === total) return 'Final Round';
  if (round === 3) return 'Moving Day';
  if (round === 2) return 'Cut Day';
  return `Round ${round}`;
}

function dotColor(state: TournamentHubPageState): string {
  if (state === 'live') return GREEN;
  if (state === 'result') return SILVER;
  return INDIGO;
}

function ctaLabel(state: TournamentHubPageState): string {
  if (state === 'live') return 'Who wins this?';
  if (state === 'result') return 'Your reaction?';
  return 'Who takes it?';
}

/* ── Sub-components ── */
function LiveBadge() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
      borderRadius: 8, padding: '3px 8px',
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%', background: GREEN,
        animation: 'clb-hub-pulse 1.8s ease-in-out infinite',
      }} />
      <span style={{ fontSize: 10, fontWeight: 800, color: GREEN, letterSpacing: '0.06em' }}>
        LIVE
      </span>
    </div>
  );
}

function FinalBadge() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: 'rgba(148,163,184,0.12)', border: '1px solid rgba(148,163,184,0.25)',
      borderRadius: 8, padding: '3px 8px',
    }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: SILVER, letterSpacing: '0.06em' }}>
        FINAL
      </span>
    </div>
  );
}

function UpcomingBadge() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.25)',
      borderRadius: 8, padding: '3px 8px',
    }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: INDIGO, letterSpacing: '0.06em' }}>
        UPCOMING
      </span>
    </div>
  );
}

function PlayerAvatar({ name, photoUrl, tourSlug, size }: {
  name: string; photoUrl: string | null; tourSlug: string; size: number;
}) {
  const src = photoUrl || getPlayerHeadshotUrl(name, tourSlug) || null;
  const initials = name.split(/[\s.]/).filter(Boolean)
    .map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
  return <SquircleAvatar src={src} alt={name} size={size} fallback={initials} hideRing />;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24"
      fill={filled ? AMBER : 'none'}
      stroke={filled ? AMBER : 'rgba(255,255,255,0.5)'}
      strokeWidth={filled ? 0 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

/* ── CourseStrip ── */
function CourseStrip({ page }: { page: TournamentHubPage }) {
  if (!page.venueName) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 13, padding: '10px 14px', margin: '0 20px',
      flexShrink: 0,
    }}>
      {/* Course thumbnail placeholder */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16,
      }}>
        ⛳
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {page.venueName}
        </div>
        {page.venueCity && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
            {page.venueCity}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, alignItems: 'flex-end' }}>
        {page.venuePar && (
          <div style={{
            fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '2px 6px',
          }}>
            Par {page.venuePar}
          </div>
        )}
        {page.purse && (
          <div style={{
            fontSize: 10, fontWeight: 700, color: AMBER,
            background: AMBER_DIM, borderRadius: 6, padding: '2px 6px',
          }}>
            ${(page.purse / 1_000_000).toFixed(1)}M
          </div>
        )}
      </div>
    </div>
  );
}

/* ── LivePage ── */
function LivePage({ page }: { page: TournamentHubPage }) {
  const navigate = useNavigate();
  const leader = page.leader;
  const coLeaders = page.leaderboard.filter(e => e.position === 1);
  const isTied = coLeaders.length > 1;
  const rLabel = roundLabel(page.currentRound, page.totalRounds);

  const chaserRows = useMemo(() => {
    if (page.leaderboard.length < 2) return [];
    const byPos = new Map<number, LiveLeaderboardEntry[]>();
    page.leaderboard.forEach(e => {
      if (e.position <= 1) return;
      const arr = byPos.get(e.position) ?? [];
      arr.push(e);
      byPos.set(e.position, arr);
    });
    return Array.from(byPos.entries())
      .sort(([a], [b]) => a - b)
      .slice(0, 3)
      .map(([pos, players]) => ({ pos, players, isTied: players.length > 1 }));
  }, [page.leaderboard]);

  const statTiles = useMemo(() => {
    if (!page.leaderStats) return [];
    return [
      { label: 'Eagles', value: page.leaderStats.totalEagles, color: AMBER },
      { label: 'Birdies', value: page.leaderStats.totalBirdies, color: GREEN },
      { label: 'Pars', value: page.leaderStats.totalPars, color: '#94a3b8' },
      { label: 'Bogeys', value: page.leaderStats.totalBogeys, color: '#ef4444' },
    ].filter(t => t.value > 0);
  }, [page.leaderStats]);

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      overflowY: 'auto', overflowX: 'hidden',
    }}>
      {/* Header gradient zone */}
      <div style={{
        flexShrink: 0, position: 'relative', paddingTop: 12,
        paddingLeft: 20, paddingRight: 20, paddingBottom: 16,
        background: 'linear-gradient(180deg, #141c2e 0%, #0d1525 40%, #080a0e 100%)',
      }}>
        {/* Amber glow */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 220, height: 220,
          background: 'radial-gradient(circle at 100% 0%, rgba(245,158,11,0.15), transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Badge + Tour/Round */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <LiveBadge />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
            {page.tourName} · {rLabel}
          </span>
        </div>

        {/* Tournament name */}
        <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>
          {page.tournamentName}
        </div>

        {/* Venue */}
        {page.venueName && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
            {page.venueName}{page.venueCity ? ` · ${page.venueCity}` : ''}
          </div>
        )}

        {/* Leader spotlight card */}
        {leader && (
          <div style={{
            background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}`,
            borderRadius: 16, padding: '13px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <PlayerAvatar name={leader.playerName} photoUrl={leader.photoUrl} tourSlug={page.tourSlug} size={56} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: AMBER, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                  {isTied ? `${coLeaders.length}-Way Tie` : 'Tournament Leader'}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {leader.playerName}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                  Thru {leader.thru ?? '-'}{leader.today ? ` · Today ${leader.today}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 38, fontWeight: 900, color: AMBER, lineHeight: 1 }}>
                  {leader.scoreDisplay}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>vs par</div>
              </div>
            </div>

            {/* Stats tiles */}
            {statTiles.length > 0 && (
              <>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  {statTiles.map(t => (
                    <div key={t.label} style={{
                      flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 12,
                      background: `${t.color}0A`, border: `1px solid ${t.color}18`,
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: t.color }}>{t.value}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>
                        {t.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Season stats */}
                {page.leaderStats && (page.leaderStats.drivingDistance != null || page.leaderStats.drivingAccuracy != null || page.leaderStats.greensInReg != null || page.leaderStats.puttingAverage != null) && (
                  <>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      {page.leaderStats.drivingDistance != null && (
                        <div style={{ flex: 1, textAlign: 'center', padding: '7px 4px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.75)', lineHeight: 1 }}>
                            {Math.round(page.leaderStats.drivingDistance)}<span style={{ fontSize: 9, fontWeight: 500 }}>yds</span>
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>Driver</div>
                        </div>
                      )}
                      {page.leaderStats.drivingAccuracy != null && (
                        <div style={{ flex: 1, textAlign: 'center', padding: '7px 4px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.75)', lineHeight: 1 }}>
                            {Math.round(page.leaderStats.drivingAccuracy)}<span style={{ fontSize: 9, fontWeight: 500 }}>%</span>
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>Accuracy</div>
                        </div>
                      )}
                      {page.leaderStats.greensInReg != null && (
                        <div style={{ flex: 1, textAlign: 'center', padding: '7px 4px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.75)', lineHeight: 1 }}>
                            {Math.round(page.leaderStats.greensInReg)}<span style={{ fontSize: 9, fontWeight: 500 }}>%</span>
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>GIR</div>
                        </div>
                      )}
                      {page.leaderStats.puttingAverage != null && (
                        <div style={{ flex: 1, textAlign: 'center', padding: '7px 4px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.75)', lineHeight: 1 }}>
                            {page.leaderStats.puttingAverage.toFixed(2)}
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>Putts</div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Insight */}
            {page.insight && (
              <div style={{
                ...(statTiles.length > 0 ? { marginTop: 10 } : { borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginTop: 12 }),
                fontSize: 12, color: 'rgba(255,255,255,0.48)', lineHeight: 1.55, fontStyle: 'italic',
              }}>
                {page.insight}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Course strip */}
      <div style={{ flexShrink: 0, marginTop: 12 }}>
        <CourseStrip page={page} />
      </div>

      {/* Chasers — grow to fill */}
      {chaserRows.length > 0 && (
        <div style={{ flex: 1, padding: '14px 20px 0', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              In Contention
            </span>
            <button
              onClick={() => navigate(`/tourhub/tournament/${page.tournamentId}`)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: AMBER, padding: 0 }}
            >
              Full leaderboard →
            </button>
          </div>
          {chaserRows.map((row, idx) => (
            <div key={row.pos} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 12, padding: '10px 12px', marginBottom: 8,
              animation: `clb-hub-fadeUp 0.4s ease-out ${0.15 + idx * 0.06}s both`,
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.35)', width: 20, textAlign: 'center', flexShrink: 0 }}>
                {row.isTied ? `T${row.pos}` : row.pos}
              </span>
              <div style={{ display: 'flex', flexShrink: 0 }}>
                {row.players.slice(0, 3).map((p, i) => (
                  <div key={p.playerId} style={{ marginLeft: i > 0 ? -10 : 0, borderRadius: '34%', position: 'relative', zIndex: 3 - i }}>
                    <PlayerAvatar name={p.playerName} photoUrl={p.photoUrl} tourSlug={page.tourSlug} size={28} />
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {row.players.length === 1
                    ? row.players[0].playerName
                    : row.players.slice(0, 2).map(p => p.playerName.split(' ').pop()).join(', ')
                      + (row.players.length > 2 ? ` +${row.players.length - 2}` : '')}
                </div>
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>
                {row.players[0].scoreDisplay}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── ResultPage ── */
function ResultPage({ page }: { page: TournamentHubPage }) {
  const leader = page.leader;
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      overflowY: 'auto', overflowX: 'hidden',
    }}>
      <div style={{
        flexShrink: 0, position: 'relative', paddingTop: 12,
        paddingLeft: 20, paddingRight: 20, paddingBottom: 16,
        background: 'linear-gradient(180deg, #141c2e 0%, #0d1525 40%, #080a0e 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <FinalBadge />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
            {page.tourName}
          </span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>
          {page.tournamentName}
        </div>
        {page.venueName && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
            {page.venueName}{page.venueCity ? ` · ${page.venueCity}` : ''}
          </div>
        )}

        {/* Champion card */}
        {leader && (
          <div style={{
            background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.15)',
            borderRadius: 16, padding: '13px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <PlayerAvatar name={leader.playerName} photoUrl={leader.photoUrl} tourSlug={page.tourSlug} size={56} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: SILVER, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                  Champion
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {leader.playerName}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 38, fontWeight: 900, color: SILVER, lineHeight: 1 }}>
                  {leader.scoreDisplay}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Final standings */}
        {page.leaderboard.length > 1 && (
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Final Standings
            </span>
            <div style={{ marginTop: 8 }}>
              {page.leaderboard.slice(1, 4).map((p, idx) => (
                <div key={p.playerId} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 12, padding: '10px 12px', marginBottom: 8,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.35)', width: 20, textAlign: 'center', flexShrink: 0 }}>
                    {p.position}
                  </span>
                  <PlayerAvatar name={p.playerName} photoUrl={p.photoUrl} tourSlug={page.tourSlug} size={28} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.playerName}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>
                    {p.scoreDisplay}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, marginTop: 12 }}>
        <CourseStrip page={page} />
      </div>

      <div style={{ flex: 1 }} />
    </div>
  );
}

/* ── UpcomingPage ── */
function UpcomingPage({ page }: { page: TournamentHubPage }) {
  const countdown = useMemo(() => {
    if (!page.startDate) return null;
    const start = new Date(page.startDate);
    const now = new Date();
    const days = differenceInDays(start, now);
    const hours = differenceInHours(start, now) % 24;
    const mins = differenceInMinutes(start, now) % 60;
    return { days, hours, mins };
  }, [page.startDate]);

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      overflowY: 'auto', overflowX: 'hidden',
    }}>
      <div style={{
        flexShrink: 0, position: 'relative', paddingTop: 12,
        paddingLeft: 20, paddingRight: 20, paddingBottom: 16,
        background: 'linear-gradient(180deg, #141c2e 0%, #0d1525 40%, #080a0e 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <UpcomingBadge />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
            {page.tourName}
          </span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>
          {page.tournamentName}
        </div>
        {page.venueName && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
            {page.venueName}{page.venueCity ? ` · ${page.venueCity}` : ''}
          </div>
        )}

        {/* Countdown tiles */}
        {countdown && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {[
              { value: countdown.days, label: 'Days' },
              { value: countdown.hours, label: 'Hrs' },
              { value: countdown.mins, label: 'Min' },
            ].map(t => (
              <div key={t.label} style={{
                flex: 1, textAlign: 'center', padding: '14px 0', borderRadius: 14,
                background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.18)',
              }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: INDIGO, lineHeight: 1 }}>
                  {Math.max(0, t.value)}
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
                  {t.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Date range */}
        {page.startDate && page.endDate && (
          <div style={{
            fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center',
            marginBottom: 4,
          }}>
            {format(new Date(page.startDate), 'MMM d')} – {format(new Date(page.endDate), 'MMM d, yyyy')}
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, marginTop: 12 }}>
        <CourseStrip page={page} />
      </div>

      <div style={{ flex: 1 }} />
    </div>
  );
}

/* ── Props ── */
export interface TournamentHubCardProps {
  post: TournamentHubFeedPost;
  isActive: boolean;
  onComment: () => void;
  onLike: () => void;
}

/* ── Main Component ── */
export const TournamentHubCard: React.FC<TournamentHubCardProps> = ({
  post, isActive, onComment, onLike,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [heartPop, setHeartPop] = useState(false);
  const pages = post.pages;
  const current = pages[currentPage];

  useEffect(() => { injectKeyframes(); }, []);

  // Reset page when card becomes active
  useEffect(() => {
    if (!isActive) setCurrentPage(0);
  }, [isActive]);

  const goToPage = useCallback((idx: number) => {
    if (idx < 0 || idx >= pages.length) return;
    setDirection(idx > currentPage ? 1 : -1);
    setCurrentPage(idx);
  }, [currentPage, pages.length]);

  const handleLike = useCallback(() => {
    setHeartPop(true);
    setTimeout(() => setHeartPop(false), 500);
    onLike();
  }, [onLike]);

  if (!current) return null;

  const isLiked = current.isLikedByMe;
  const likeCount = current.likeCount;
  const commentCount = current.commentCount;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      background: '#080a0e', color: '#fff',
    }}>
      {/* Zone 1 — Accent bar */}
      <div style={{
        height: 2.5, flexShrink: 0,
        background: `linear-gradient(90deg, ${AMBER}CC, transparent)`,
      }} />

      {/* Zone 2 — Nav row */}
      {pages.length > 1 && (
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 12, paddingTop: 10, paddingBottom: 6,
        }}>
          {/* Left chevron */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: currentPage === 0 ? 'default' : 'pointer',
              opacity: currentPage === 0 ? 0.3 : 0.8,
              transition: 'opacity 0.2s',
            }}
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>

          {/* Dots */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {pages.map((p, i) => (
              <button
                key={p.tournamentId}
                onClick={() => goToPage(i)}
                style={{
                  width: i === currentPage ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: dotColor(p.state),
                  opacity: i === currentPage ? 1 : 0.4,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Right chevron */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === pages.length - 1}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: currentPage === pages.length - 1 ? 'default' : 'pointer',
              opacity: currentPage === pages.length - 1 ? 0.3 : 0.8,
              transition: 'opacity 0.2s',
            }}
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* Zone 3 — Carousel content */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden' }}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={current.tournamentId}
            custom={direction}
            initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? -50 : 50, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ position: 'absolute', inset: 0 }}
          >
            {current.state === 'live' && <LivePage page={current} />}
            {current.state === 'result' && <ResultPage page={current} />}
            {current.state === 'upcoming' && <UpcomingPage page={current} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Zone 4 — CTA bar */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 20px',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Like button */}
        <button
          onClick={handleLike}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: isLiked ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${isLiked ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 14, padding: '11px 14px', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <span style={{
            display: 'inline-flex',
            animation: heartPop ? 'clb-hub-heart 0.5s ease-out' : 'none',
          }}>
            <HeartIcon filled={isLiked} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: isLiked ? AMBER : 'rgba(255,255,255,0.6)' }}>
            {likeCount > 0 ? likeCount : ''}
          </span>
        </button>

        {/* CTA button */}
        <button
          onClick={onComment}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: `linear-gradient(135deg, ${AMBER}, #d97706)`,
            border: 'none', borderRadius: 16, padding: '13px 16px', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(245,158,11,0.18)',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: '#000' }}>
            {ctaLabel(current.state)}
          </span>
          {commentCount > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 800, color: '#000',
              background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: '2px 7px',
            }}>
              {commentCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default TournamentHubCard;
