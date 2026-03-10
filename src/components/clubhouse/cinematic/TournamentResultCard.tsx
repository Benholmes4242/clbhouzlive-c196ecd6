/**
 * TournamentResultCard — Full-bleed feed card for synthetic tournament result posts.
 * Glass card is a 100% pixel-identical match to HeroCarousel completed state.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import type { TournamentResultFeedPost, TournamentResultMeta, PodiumRow as PodiumRowType } from '@/components/media-system/types/media';
import { CinematicActionRail } from './CinematicActionRail';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import '@/styles/hero-glass.css';

// ─── Gradient fallback map ───
const TOUR_GRADIENTS: Record<string, string> = {
  pga: 'from-blue-900 via-blue-800 to-slate-900',
  liv: 'from-slate-900 via-green-900 to-slate-950',
  euro: 'from-indigo-900 via-purple-900 to-slate-900',
  dpw: 'from-green-900 via-green-800 to-slate-900',
  lpga: 'from-pink-900 via-rose-800 to-slate-900',
  kft: 'from-amber-900 via-amber-800 to-slate-900',
  champ: 'from-amber-900 via-yellow-800 to-amber-950',
};

// ─── Frosted Avatar — identical to TourHeroHelpers FrostedAvatar ───
function FrostedAvatar({ src, displayName, size }: { src: string | null; displayName: string; size: number }) {
  const [currentSrc, setCurrentSrc] = React.useState(src);
  const [imgError, setImgError] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const initials = displayName.split(/[\s.]/).filter(Boolean).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('') || '?';

  React.useEffect(() => {
    setCurrentSrc(src);
    setImgError(false);
    setLoaded(false);
  }, [src]);

  return (
    <div style={{
      width: size, height: size, borderRadius: '34%', overflow: 'hidden', flexShrink: 0,
      border: '1.5px solid #F8FAFC',
      background: '#F8FAFC',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {currentSrc && !imgError ? (
        <img
          src={currentSrc}
          alt={displayName}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (loaded) return;
            if (currentSrc !== PLAYER_SILHOUETTE_URL) {
              setCurrentSrc(PLAYER_SILHOUETTE_URL);
            } else {
              setImgError(true);
            }
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
        />
      ) : (
        <span style={{ fontSize: Math.round(size * 0.35), fontWeight: 700, color: 'rgba(255,255,255,0.65)', lineHeight: 1 }}>{initials}</span>
      )}
    </div>
  );
}

// ─── StatChip — identical to TourHeroHelpers StatChip ───
function StatChip({ value, label, suffix, color }: { value: string | number; label: string; suffix?: string; color?: string }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      padding: '8px 4px',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      minWidth: 0,
    }}>
      <span style={{
        fontSize: 15,
        fontWeight: 700,
        color: color ?? '#FFFFFF',
        fontFamily: "'JetBrains Mono','SF Mono',monospace",
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}>
        {value}{suffix && (
          <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.65 }}>{suffix}</span>
        )}
      </span>
      <span style={{
        fontSize: 9,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.45)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        lineHeight: 1,
        textAlign: 'center',
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── PodiumRunnerRow — identical to TourHeroHelpers PodiumRunnerRow ───
function FeedPodiumRunnerRow({ row, tourSlug }: { row: PodiumRowType; tourSlug: string }) {
  const isSingle = !row.isTied || row.players.length === 1;
  const player = row.players[0];
  const shownAvatars = row.players.slice(0, 5);
  const moreCount = row.players.length - shownAvatars.length;

  const resolvePhoto = (name: string, photoUrl?: string | null) => {
    return photoUrl || getPlayerHeadshotUrl(name, tourSlug) || PLAYER_SILHOUETTE_URL;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Position label */}
      <span style={{
        minWidth: 24,
        fontSize: 12,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        flexShrink: 0,
      }}>
        {row.isTied ? `T${row.position}` : row.position}
      </span>

      {/* Avatar section */}
      {isSingle ? (
        <FrostedAvatar
          src={resolvePhoto(player.name, player.photoUrl)}
          displayName={player.name}
          size={30}
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {shownAvatars.map((p, i) => (
            <div
              key={i}
              style={{
                marginLeft: i === 0 ? 0 : -8,
                position: 'relative',
                zIndex: shownAvatars.length - i,
                flexShrink: 0,
              }}
            >
              <FrostedAvatar
                src={resolvePhoto(p.name, p.photoUrl)}
                displayName={p.name}
                size={26}
              />
            </div>
          ))}
          {moreCount > 0 && (
            <div style={{
              marginLeft: -6,
              zIndex: 1,
              width: 22,
              height: 22,
              borderRadius: '34%',
              background: '#F8FAFC',
              border: '1.5px solid #F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 600,
              color: '#64748B',
              flexShrink: 0,
            }}>
              +{moreCount}
            </div>
          )}
        </div>
      )}

      {/* Name — only for single-player rows */}
      {isSingle ? (
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player.name}
        </span>
      ) : (
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.35)' }}>
            {row.players.length}-way tie
          </span>
        </div>
      )}

      {/* Score */}
      <span style={{
        fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
        fontSize: isSingle ? 14 : 13,
        fontWeight: isSingle ? 700 : 600,
        color: '#FFFFFF',
        flexShrink: 0,
      }}>
        {player.score || 'E'}
      </span>
    </div>
  );
}

// ─── Tour label helper ───
function getTourLabel(slug: string): string {
  const map: Record<string, string> = {
    pga: 'PGA TOUR',
    liv: 'LIV GOLF',
    euro: 'DP WORLD',
    dpw: 'DP WORLD',
    lpga: 'LPGA',
    champ: 'CHAMPIONS',
    kft: 'KORN FERRY',
  };
  return map[slug] || slug.toUpperCase();
}

// ─── TournamentCreatorCapsule ───
interface TournamentCreatorCapsuleProps {
  isVisible: boolean;
}

const TournamentCreatorCapsule: React.FC<TournamentCreatorCapsuleProps> = ({ isVisible }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
    style={{
      position: 'fixed',
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)',
      left: 16,
      zIndex: 50,
      pointerEvents: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}
  >
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: 'rgba(0, 0, 0, 0.35)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <img src="/assets/logomark-orange.png" alt="clbhouz" style={{ width: 28, height: 28, objectFit: 'contain' }} />
    </div>
    <div>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', lineHeight: 1.2 }}>clbhouz</p>
      <p style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.6)', lineHeight: 1.2, marginTop: 1 }}>
        Tournament Result
      </p>
    </div>
  </motion.div>
);

// ─── Score colors (matching hero) ───
const SCORE_COLORS = {
  eagle: { text: '#F59E0B' },
  birdie: { text: '#22C55E' },
  bogey: { text: '#EF4444' },
};

// ─── Main component ───

export interface TournamentResultCardProps {
  post: TournamentResultFeedPost;
  isActive: boolean;
  isVisible: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onViewResults?: () => void;
  /** Optimistic like state override from parent */
  likeOverride?: { isLiked: boolean; count: number };
  /** Optimistic comment count override from parent */
  commentCountOverride?: number;
}

export const TournamentResultCard: React.FC<TournamentResultCardProps> = ({
  post,
  isActive,
  isVisible,
  onLike,
  onComment,
  onShare,
  onViewResults,
  likeOverride,
  commentCountOverride,
}) => {
  const navigate = useNavigate();
  const meta = post.tournamentMeta;
  const isLiked = likeOverride?.isLiked ?? post.isLikedByMe;
  const likeCount = likeOverride?.count ?? post.likeCount;
  const commentCount = commentCountOverride ?? post.commentCount;
  const hasImage = !!meta.course_image_url;
  const bgGradient = TOUR_GRADIENTS[meta.tour_slug] || 'from-slate-900 via-slate-800 to-slate-900';

  const hasScoreStats = (meta.stat_birdies > 0 || meta.stat_pars > 0 || meta.stat_bogeys > 0);
  const hasPerfStats = !!(meta.stat_driving_distance || meta.stat_fairways_pct || meta.stat_gir_pct || meta.stat_putts);
  const hasVenue = !!(meta.venue_name || meta.venue_city);
  const hasPodium = meta.podium_rows && meta.podium_rows.length > 0;

  // Performance stat items
  const perfItems = useMemo(() => {
    const items: { value: string; label: string; suffix?: string }[] = [];
    if (meta.stat_driving_distance) items.push({ value: String(meta.stat_driving_distance), label: 'Driver', suffix: 'yds' });
    if (meta.stat_fairways_pct) items.push({ value: String(Math.round(meta.stat_fairways_pct)), label: 'Fairways', suffix: '%' });
    if (meta.stat_gir_pct) items.push({ value: String(Math.round(meta.stat_gir_pct)), label: 'GIR', suffix: '%' });
    if (meta.stat_putts) items.push({ value: meta.stat_putts.toFixed(2), label: 'Putts' });
    return items;
  }, [meta]);

  const handleViewResults = () => {
    if (onViewResults) {
      onViewResults();
    } else {
      navigate(`/tourhub/tournament/${meta.tournament_id}`);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000000', overflow: 'hidden' }}>
      {/* 1. Course background image with Ken Burns */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        initial={{ scale: 1.03, opacity: 0 }}
        animate={{ scale: isActive ? 1 : 1.03, opacity: isActive ? 1 : 0 }}
        transition={{
          opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 5, ease: 'linear' },
        }}
      >
        {hasImage ? (
          <img
            src={meta.course_image_url!}
            alt={meta.venue_name || meta.tournament_name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className={`absolute inset-0 w-full h-full bg-gradient-to-br ${bgGradient}`}>
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              }}
            />
          </div>
        )}
      </motion.div>

      {/* 2. Legibility gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: `
            linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.20) 100%),
            linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 55%)
          `,
        }}
      />

      {/* 3. Glass card — EXACT match to HeroCarousel completed state */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(350px, calc(100% - 32px))',
          minWidth: '280px',
          borderRadius: 12,
          background: 'rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
          padding: '20px 20px 14px 20px',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          overflow: 'hidden',
          zIndex: 10,
          pointerEvents: 'auto' as const,
        }}
      >
        {/* Row 1: Tournament name (same as hero completed — name is first) */}
        <Link to={`/tourhub/tournament/${meta.tournament_id}`} className="block active:opacity-70 transition-opacity">
          <h2 className="hero-tournament-name">{meta.tournament_name}</h2>
        </Link>

        {/* Row 2: Venue */}
        {hasVenue && (
          <p className="hero-venue">
            {[meta.venue_name, meta.venue_city].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* Row 3: Winner — 60px avatar, name + score on same line */}
        <div style={{ marginTop: 14, minHeight: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flexShrink: 0 }}>
              <FrostedAvatar
                src={meta.winner_photo_url || getPlayerHeadshotUrl(meta.winner_name, meta.tour_slug) || PLAYER_SILHOUETTE_URL}
                displayName={meta.winner_name}
                size={60}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: '#FFFFFF' }}>
                  {meta.winner_name}
                </span>
                {meta.winner_score_display && (
                  <span style={{ fontFamily: "'JetBrains Mono','SF Mono',monospace", fontSize: 17, fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>
                    {meta.winner_score_display}
                  </span>
                )}
              </div>
              {meta.winner_by && (
                <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.50)', marginTop: 2, display: 'block' }}>
                  {meta.winner_by}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Row 4: Tournament stats — using StatChip (matching hero WinnerStatsPanel) */}
        {hasScoreStats && (
          <>
            <div style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: 'uppercase' as const,
              color: 'rgba(255,255,255,0.25)',
              marginTop: 12,
              marginBottom: 6,
            }}>
              Tournament
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {meta.stat_eagles > 0 && (
                <StatChip
                  value={meta.stat_eagles}
                  label={meta.stat_eagles === 1 ? 'Eagle' : 'Eagles'}
                  color={SCORE_COLORS.eagle.text}
                />
              )}
              <StatChip
                value={meta.stat_birdies}
                label="Birdies"
                color={SCORE_COLORS.birdie.text}
              />
              <StatChip value={meta.stat_pars} label="Pars" />
              {meta.stat_bogeys > 0 && (
                <StatChip
                  value={meta.stat_bogeys}
                  label="Bogeys"
                  color={SCORE_COLORS.bogey.text}
                />
              )}
            </div>
          </>
        )}

        {/* Row 5: Performance averages — using StatChip */}
        {hasPerfStats && perfItems.length > 0 && (
          <>
            <div style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: 'uppercase' as const,
              color: 'rgba(255,255,255,0.25)',
              marginTop: hasScoreStats ? 10 : 12,
              marginBottom: 6,
            }}>
              Performance Averages
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {perfItems.map((item) => (
                <StatChip key={item.label} value={item.value} label={item.label} suffix={item.suffix} />
              ))}
            </div>
          </>
        )}

        {/* Row 6: Podium rows — matching hero PodiumRunnerRow style */}
        {hasPodium && (
          <div style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
            {meta.podium_rows.slice(0, 2).map((row) => (
              <FeedPodiumRunnerRow key={row.position} row={row} tourSlug={meta.tour_slug} />
            ))}
          </div>
        )}

        {/* Row 7: Footer — tour badge, engagement pills, View Results */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          {/* Tour badge - left */}
          <div className="tour-badge">
            <span>{getTourLabel(meta.tour_slug)}</span>
          </div>

          {/* Engagement pills - centre (matching CinematicActionRail icons & colors) */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onLike}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: post.isLikedByMe
                  ? 'rgba(245, 158, 11, 0.25)'
                  : 'rgba(255, 255, 255, 0.10)',
                border: `1px solid ${post.isLikedByMe
                  ? 'rgba(245, 158, 11, 0.5)'
                  : 'rgba(255, 255, 255, 0.15)'}`,
                borderRadius: 20,
                padding: '6px 12px',
                color: post.isLikedByMe ? '#f59e0b' : 'rgba(255,255,255,0.85)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Heart
                className="w-4 h-4"
                style={{ color: post.isLikedByMe ? '#f59e0b' : 'rgba(255,255,255,0.85)' }}
                fill={post.isLikedByMe ? '#f59e0b' : 'none'}
                strokeWidth={post.isLikedByMe ? 0 : 2}
              />
              <span>{post.likeCount}</span>
            </button>

            <button
              onClick={onComment}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(255, 255, 255, 0.10)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 20,
                padding: '6px 12px',
                color: 'rgba(255,255,255,0.85)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <MessageSquare className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.85)' }} strokeWidth={2} />
              <span>{post.commentCount}</span>
            </button>
          </div>

          {/* View Results - right */}
          <button
            onClick={handleViewResults}
            style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            View Results →
          </button>
        </div>
      </div>

      {/* 4. CinematicActionRail — right side */}
      <CinematicActionRail
        postId={post.id}
        likesCount={post.likeCount}
        commentsCount={post.commentCount}
        hasLiked={post.isLikedByMe}
        isMuted={false}
        isVisible={isVisible}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onMore={() => {}}
        onMuteToggle={() => {}}
        hideMute={true}
      />

      {/* 5. TournamentCreatorCapsule — bottom left */}
      <TournamentCreatorCapsule isVisible={isVisible} />
    </div>
  );
};

export default TournamentResultCard;
