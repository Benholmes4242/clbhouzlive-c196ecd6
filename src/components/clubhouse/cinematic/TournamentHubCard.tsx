import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, MapPin, Trophy, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TournamentHubFeedPost, TournamentHubPage, TournamentHubChaser } from '@/components/media-system/types/media';
import { formatDistanceToNowStrict, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

// ── Helpers ──────────────────────────────────────────────────────────────────

const DOT_COLORS: Record<string, string> = {
  live: '#22c55e',
  result: '#94a3b8',
  upcoming: '#818cf8',
};

function formatPurseCompact(purse: number | null): string {
  if (!purse) return '';
  if (purse >= 1_000_000) return `$${(purse / 1_000_000).toFixed(purse % 1_000_000 === 0 ? 0 : 1)}M`;
  if (purse >= 1_000) return `$${(purse / 1_000).toFixed(0)}K`;
  return `$${purse}`;
}

function formatScore(score: string | number | null): string {
  if (score === null || score === undefined) return 'E';
  const num = typeof score === 'string' ? parseInt(score, 10) : score;
  if (isNaN(num) || num === 0) return 'E';
  return num > 0 ? `+${num}` : `${num}`;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative flex items-center justify-center" style={{ width: 8, height: 8 }}>
        <div className="absolute inset-0 rounded-full animate-ping" style={{ background: '#22c55e', opacity: 0.4 }} />
        <div className="relative rounded-full" style={{ width: 8, height: 8, background: '#22c55e' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#22c55e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        LIVE
      </span>
    </div>
  );
}

function FinalBadge() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="rounded-full" style={{ width: 8, height: 8, background: '#94a3b8' }} />
      <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        FINAL
      </span>
    </div>
  );
}

function UpcomingBadge() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="rounded-full" style={{ width: 8, height: 8, background: '#818cf8' }} />
      <span style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        UPCOMING
      </span>
    </div>
  );
}

function CourseStrip({ page }: { page: TournamentHubPage }) {
  return (
    <div
      className="flex items-center gap-3 shrink-0"
      style={{
        margin: '0 20px',
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 13,
      }}
    >
      {/* Course thumbnail placeholder */}
      <div
        className="shrink-0 rounded-[10px]"
        style={{
          width: 40,
          height: 40,
          background: 'linear-gradient(135deg, #1a3a2a, #0d2818)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      />
      {/* Name + location */}
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2 }} className="truncate">
          {page.venueName || 'TPC Course'}
        </div>
        {page.venueCity && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{page.venueCity}</span>
          </div>
        )}
      </div>
      {/* Par + Purse */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {page.venuePar && (
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.06)',
            padding: '2px 7px',
            borderRadius: 6,
          }}>
            Par {page.venuePar}
          </div>
        )}
        {page.purse && (
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'rgba(245,158,11,0.7)',
            background: 'rgba(245,158,11,0.08)',
            padding: '2px 7px',
            borderRadius: 6,
          }}>
            {formatPurseCompact(page.purse)}
          </div>
        )}
      </div>
    </div>
  );
}

function ChaserRow({ chaser, index }: { chaser: TournamentHubChaser; index: number }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.35)', width: 20, textAlign: 'center' }}
        className="tabular-nums">
        {chaser.isTied ? `T${chaser.position}` : chaser.position}
      </span>
      {/* Avatar placeholder */}
      <div className="shrink-0 rounded-full overflow-hidden" style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.08)' }}>
        {chaser.photoUrl && <img src={chaser.photoUrl} alt="" className="w-full h-full object-cover" />}
      </div>
      <span className="flex-1 truncate" style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1' }}>
        {chaser.playerName}
      </span>
      <span className="tabular-nums" style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>
        {chaser.scoreDisplay || 'E'}
      </span>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: number | null; color: string }) {
  return (
    <div className="flex-1 text-center" style={{ padding: '6px 2px' }}>
      <div className="tabular-nums" style={{ fontSize: 18, fontWeight: 800, color }}>{value ?? '-'}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

// ── Page Components ─────────────────────────────────────────────────────────

function LivePage({ page }: { page: TournamentHubPage }) {
  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Header with gradient */}
      <div className="shrink-0 relative overflow-hidden" style={{ padding: '14px 20px 18px', background: 'linear-gradient(180deg, #141c2e 0%, #0d1525 40%, #080a0e 100%)' }}>
        {/* Ambient glow */}
        <div className="absolute" style={{ top: -40, right: -40, width: 220, height: 260, background: 'radial-gradient(circle, rgba(245,158,11,0.13) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Badge + round */}
        <div className="flex items-center justify-between relative">
          <LiveBadge />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
            {page.tourName} · R{page.currentRound}/{page.totalRounds}
          </span>
        </div>

        {/* Tournament name */}
        <div className="mt-1.5 relative" style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
          {page.tournamentName}
        </div>

        {/* Leader card */}
        {page.leader && (
          <div className="mt-3 flex items-center gap-3 relative" style={{
            padding: '10px 14px',
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.15)',
            borderRadius: 14,
          }}>
            <div className="shrink-0 rounded-[12px] overflow-hidden" style={{
              width: 50, height: 50,
              boxShadow: '0 0 20px rgba(245,158,11,0.2)',
              background: 'rgba(255,255,255,0.06)',
            }}>
              {page.leader.photoUrl && <img src={page.leader.photoUrl} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(245,158,11,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Tournament Leader
              </div>
              <div className="truncate" style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginTop: 1 }}>
                {page.leader.playerName}
              </div>
              {page.leader.thru && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                  Thru {page.leader.thru}
                </div>
              )}
            </div>
            <div className="tabular-nums" style={{ fontSize: 34, fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>
              {page.leader.scoreDisplay || 'E'}
            </div>
          </div>
        )}

        {/* Stat tiles */}
        {page.leaderStats && (
          <>
            <div className="h-px mt-3" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="flex mt-2">
              <StatTile label="Eagles" value={page.leaderStats.totalEagles} color="#f59e0b" />
              <StatTile label="Birdies" value={page.leaderStats.totalBirdies} color="#22c55e" />
              <StatTile label="Pars" value={page.leaderStats.totalPars} color="rgba(255,255,255,0.5)" />
              <StatTile label="Bogeys" value={page.leaderStats.totalBogeys} color="#ef4444" />
            </div>
            {/* Season stats row */}
            <div className="flex mt-1 gap-1">
              {page.leaderStats.drivingDistance != null && (
                <div className="flex-1 text-center" style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                  <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{page.leaderStats.drivingDistance.toFixed(0)}</span> yds
                </div>
              )}
              {page.leaderStats.drivingAccuracy != null && (
                <div className="flex-1 text-center" style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                  <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{page.leaderStats.drivingAccuracy.toFixed(1)}%</span> FW
                </div>
              )}
              {page.leaderStats.greensInReg != null && (
                <div className="flex-1 text-center" style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                  <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{page.leaderStats.greensInReg.toFixed(1)}%</span> GIR
                </div>
              )}
              {page.leaderStats.puttingAverage != null && (
                <div className="flex-1 text-center" style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                  <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{page.leaderStats.puttingAverage.toFixed(2)}</span> PPR
                </div>
              )}
            </div>
          </>
        )}

        {/* Insight */}
        {page.insight && (
          <div className="mt-2 text-center" style={{ fontSize: 11.5, fontStyle: 'italic', color: 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>
            {page.insight}
          </div>
        )}
      </div>

      {/* Course strip */}
      <CourseStrip page={page} />

      {/* Chasers section */}
      <div className="flex-1 min-h-0 flex flex-col mt-1">
        <div className="px-5 py-2">
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            In Contention
          </span>
        </div>
        <div className="flex-1 overflow-auto">
          {page.chasers.map((c, i) => (
            <ChaserRow key={`${c.playerName}-${i}`} chaser={c} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultPage({ page }: { page: TournamentHubPage }) {
  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="shrink-0 relative overflow-hidden" style={{ padding: '14px 20px 18px', background: 'linear-gradient(180deg, #141c2e 0%, #0d1525 40%, #080a0e 100%)' }}>
        <div className="flex items-center justify-between relative">
          <FinalBadge />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
            {page.tourName} · Final
          </span>
        </div>
        <div className="mt-1.5 relative" style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
          {page.tournamentName}
        </div>

        {page.leader && (
          <div className="mt-3 flex items-center gap-3 relative" style={{
            padding: '10px 14px',
            background: 'rgba(148,163,184,0.06)',
            border: '1px solid rgba(148,163,184,0.15)',
            borderRadius: 14,
          }}>
            <div className="shrink-0 rounded-[12px] overflow-hidden" style={{
              width: 50, height: 50,
              background: 'rgba(255,255,255,0.06)',
            }}>
              {page.leader.photoUrl && <img src={page.leader.photoUrl} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                🏆 Champion
              </div>
              <div className="truncate" style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginTop: 1 }}>
                {page.leader.playerName}
              </div>
            </div>
            <div className="tabular-nums" style={{ fontSize: 34, fontWeight: 900, color: '#e2e8f0', lineHeight: 1 }}>
              {page.leader.scoreDisplay || 'E'}
            </div>
          </div>
        )}
      </div>

      <CourseStrip page={page} />

      <div className="flex-1 min-h-0 flex flex-col mt-1">
        <div className="px-5 py-2">
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Final Standings
          </span>
        </div>
        <div className="flex-1 overflow-auto">
          {page.chasers.map((c, i) => (
            <ChaserRow key={`${c.playerName}-${i}`} chaser={c} index={i} />
          ))}
          {page.chasers.length === 0 && (
            <div className="px-5 py-6 text-center" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
              Final results loading...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UpcomingPage({ page }: { page: TournamentHubPage }) {
  const now = new Date();
  const start = page.startDate ? new Date(page.startDate) : null;
  const days = start ? Math.max(0, differenceInDays(start, now)) : 0;
  const hours = start ? Math.max(0, differenceInHours(start, now) % 24) : 0;
  const minutes = start ? Math.max(0, differenceInMinutes(start, now) % 60) : 0;

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="shrink-0 relative overflow-hidden" style={{ padding: '14px 20px 18px', background: 'linear-gradient(180deg, #141c2e 0%, #0d1525 40%, #080a0e 100%)' }}>
        <div className="flex items-center justify-between relative">
          <UpcomingBadge />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
            {page.tourName}
          </span>
        </div>
        <div className="mt-1.5 relative" style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
          {page.tournamentName}
        </div>

        {/* Countdown card */}
        <div className="mt-3" style={{
          padding: '14px 16px',
          background: 'rgba(129,140,248,0.06)',
          border: '1px solid rgba(129,140,248,0.15)',
          borderRadius: 14,
        }}>
          <div className="flex justify-center gap-4">
            {[
              { value: days, label: 'DAYS' },
              { value: hours, label: 'HRS' },
              { value: minutes, label: 'MIN' },
            ].map(tile => (
              <div key={tile.label} className="text-center" style={{ minWidth: 52 }}>
                <div className="tabular-nums" style={{ fontSize: 28, fontWeight: 900, color: '#818cf8', lineHeight: 1 }}>
                  {tile.value}
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(129,140,248,0.5)', marginTop: 4, letterSpacing: '0.1em' }}>
                  {tile.label}
                </div>
              </div>
            ))}
          </div>

          {page.defendingChamp && (
            <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(129,140,248,0.1)' }}>
              <Trophy style={{ width: 12, height: 12, color: 'rgba(129,140,248,0.5)' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                Defending: <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{page.defendingChamp}</span>
                {page.defendingScore && <span> ({page.defendingScore})</span>}
              </span>
            </div>
          )}
        </div>
      </div>

      <CourseStrip page={page} />

      {/* Past champions placeholder */}
      <div className="flex-1 min-h-0 flex flex-col mt-1">
        <div className="px-5 py-2">
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Tournament Info
          </span>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center px-5">
          <Clock style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.15)' }} />
          <div className="mt-2" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
            Coverage begins when the tournament starts
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

interface TournamentHubCardProps {
  post: TournamentHubFeedPost;
  isActive: boolean;
  onComment?: () => void;
  onLike?: () => void;
  onPageChange?: (index: number) => void;
}

export function TournamentHubCard({ post, isActive, onComment, onLike, onPageChange }: TournamentHubCardProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();
  const pages = post.pages;
  const activePage = pages[pageIndex];

  // Report page changes upward
  useEffect(() => {
    onPageChange?.(pageIndex);
  }, [pageIndex, onPageChange]);

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= pages.length) return;
    setDirection(idx > pageIndex ? 1 : -1);
    setPageIndex(idx);
  }, [pageIndex, pages.length]);

  const goNext = useCallback(() => goTo(pageIndex + 1), [goTo, pageIndex]);
  const goPrev = useCallback(() => goTo(pageIndex - 1), [goTo, pageIndex]);

  if (!activePage) return null;

  const showChevrons = pages.length > 1;

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ background: '#080a0e', color: '#fff' }}
    >
      {/* Zone 1 — Amber accent bar */}
      <div className="shrink-0" style={{ height: 2.5, background: 'linear-gradient(90deg, #f59e0bCC, transparent)' }} />

      {/* Zone 2 — Nav row */}
      <div className="shrink-0 flex items-center justify-between" style={{ padding: '10px 16px 8px' }}>
        {/* Left chevron */}
        {showChevrons ? (
          <button
            onClick={goPrev}
            disabled={pageIndex === 0}
            className="flex items-center justify-center rounded-full active:scale-95 transition-transform"
            style={{
              width: 34,
              height: 34,
              background: 'rgba(255,255,255,0.08)',
              opacity: pageIndex === 0 ? 0.3 : 1,
            }}
          >
            <ChevronLeft style={{ width: 18, height: 18, color: '#fff' }} />
          </button>
        ) : <div style={{ width: 34 }} />}

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {pages.map((p, i) => (
            <button
              key={p.tournamentId}
              onClick={() => goTo(i)}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === pageIndex ? 20 : 7,
                height: 7,
                background: DOT_COLORS[p.state] ?? '#94a3b8',
                opacity: i === pageIndex ? 1 : 0.4,
              }}
            />
          ))}
        </div>

        {/* Right chevron */}
        {showChevrons ? (
          <button
            onClick={goNext}
            disabled={pageIndex === pages.length - 1}
            className="flex items-center justify-center rounded-full active:scale-95 transition-transform"
            style={{
              width: 34,
              height: 34,
              background: 'rgba(255,255,255,0.08)',
              opacity: pageIndex === pages.length - 1 ? 0.3 : 1,
            }}
          >
            <ChevronRight style={{ width: 18, height: 18, color: '#fff' }} />
          </button>
        ) : <div style={{ width: 34 }} />}
      </div>

      {/* Zone 3 — Carousel */}
      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activePage.tournamentId}
            initial={{ x: direction * 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -50, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {activePage.state === 'live' && <LivePage page={activePage} />}
            {activePage.state === 'result' && <ResultPage page={activePage} />}
            {activePage.state === 'upcoming' && <UpcomingPage page={activePage} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Zone 4 — CTA bar */}
      <div
        className="shrink-0 flex items-center justify-between"
        style={{
          padding: '12px 20px',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Like + Comment */}
        <div className="flex items-center gap-4">
          <button
            onClick={onLike}
            className="flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Heart
              style={{
                width: 20,
                height: 20,
                color: activePage.isLikedByMe ? '#ef4444' : 'rgba(255,255,255,0.5)',
                fill: activePage.isLikedByMe ? '#ef4444' : 'none',
              }}
            />
            {activePage.likeCount > 0 && (
              <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                {activePage.likeCount}
              </span>
            )}
          </button>
          <button
            onClick={onComment}
            className="flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <MessageCircle style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.5)' }} />
            {activePage.commentCount > 0 && (
              <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                {activePage.commentCount}
              </span>
            )}
          </button>
        </div>

        {/* Full leaderboard CTA */}
        {activePage.state === 'live' && (
          <button
            onClick={() => navigate(`/tourhub/${activePage.tourSlug}/leaderboard/${activePage.tournamentId}`)}
            className="flex items-center gap-1.5 active:scale-95 transition-transform"
            style={{
              padding: '8px 14px',
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 10,
            }}
          >
            <Zap style={{ width: 14, height: 14, color: '#f59e0b' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>Full Leaderboard</span>
          </button>
        )}
        {activePage.state === 'upcoming' && (
          <button
            onClick={() => navigate(`/tourhub/${activePage.tourSlug}/tournament/${activePage.tournamentId}`)}
            className="flex items-center gap-1.5 active:scale-95 transition-transform"
            style={{
              padding: '8px 14px',
              background: 'rgba(129,140,248,0.12)',
              border: '1px solid rgba(129,140,248,0.2)',
              borderRadius: 10,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: '#818cf8' }}>Preview</span>
          </button>
        )}
      </div>
    </div>
  );
}
