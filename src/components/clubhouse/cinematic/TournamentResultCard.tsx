/**
 * TournamentResultCard — Full-bleed feed card for synthetic tournament result posts.
 * Renders as the same dimensions as video posts in the Clubhouse vertical grid.
 * Glass card spec matches HeroCarousel A* spec.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { TournamentResultFeedPost, TournamentResultMeta, PodiumRow as PodiumRowType } from '@/components/media-system/types/media';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { CinematicActionRail } from './CinematicActionRail';

// ─── Gradient fallback map ───
const TOUR_GRADIENTS: Record<string, string> = {
  pga: 'from-blue-900 via-blue-800 to-slate-900',
  liv: 'from-red-900 via-red-800 to-slate-900',
  euro: 'from-green-900 via-green-800 to-slate-900',
  dpw: 'from-green-900 via-green-800 to-slate-900',
  lpga: 'from-purple-900 via-purple-800 to-slate-900',
  kft: 'from-amber-900 via-amber-800 to-slate-900',
  champ: 'from-slate-800 via-slate-700 to-slate-900',
};

// ─── Sub-components ───

interface StatPillProps {
  value: number | string;
  label: string;
  color?: string;
  suffix?: string;
}

const StatPill: React.FC<StatPillProps> = ({ value, label, color, suffix }) => (
  <div
    style={{
      background: 'rgba(255,255,255,0.10)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 8,
      padding: '8px 6px',
      textAlign: 'center',
    }}
  >
    <p style={{ fontSize: 15, fontWeight: 700, color: color || '#FFFFFF', lineHeight: 1.2 }}>
      {value}{suffix || ''}
    </p>
    <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.8, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginTop: 2 }}>
      {label}
    </p>
  </div>
);

interface FrostedAvatarProps {
  src: string | null | undefined;
  displayName: string;
  size: number;
}

const SILHOUETTE_URL = 'https://pub-f598829c702247c88b3281e7ee9e35ea.r2.dev/DP%20World%20Tour/Silhouette.webp';

const FrostedAvatar: React.FC<FrostedAvatarProps> = ({ src, displayName, size }) => {
  const [currentSrc, setCurrentSrc] = React.useState(src || null);
  const [imgError, setImgError] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const initials = displayName.split(/[\s.]/).filter(Boolean).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('') || '?';

  React.useEffect(() => {
    setCurrentSrc(src || null);
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
            if (currentSrc !== SILHOUETTE_URL) {
              setCurrentSrc(SILHOUETTE_URL);
            } else {
              setImgError(true);
            }
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
        />
      ) : (
        <span style={{ fontSize: Math.round(size * 0.35), fontWeight: 700, color: 'rgba(0,0,0,0.35)', lineHeight: 1 }}>{initials}</span>
      )}
    </div>
  );
};

const WinnerAvatar: React.FC<{ photoUrl: string | null; name: string }> = ({ photoUrl, name }) => (
  <FrostedAvatar src={photoUrl} displayName={name} size={48} />
);

interface PodiumRowItemProps {
  row: PodiumRowType;
}

const PodiumRowItem: React.FC<PodiumRowItemProps> = ({ row }) => {
  const displayName = row.isTied && row.players.length > 1
    ? `${row.players.length}-way tie`
    : row.players[0]?.name || '';

  const visiblePlayers = row.players.slice(0, 3);
  const overflow = row.players.length > 3 ? row.players.length - 3 : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
      {/* Position label */}
      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', width: 24, textAlign: 'center', flexShrink: 0 }}>
        {row.label}
      </span>

      {/* Stacked avatars */}
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {visiblePlayers.map((player, i) => (
          <div
            key={i}
            style={{
              marginLeft: i > 0 ? -8 : 0,
              zIndex: visiblePlayers.length - i,
              position: 'relative',
            }}
          >
            <FrostedAvatar
              src={player.photoUrl}
              displayName={player.name}
              size={28}
            />
          </div>
        ))}
        {overflow > 0 && (
          <div
            style={{
              marginLeft: -8,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            +{overflow}
          </div>
        )}
      </div>

      {/* Name */}
      <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {displayName}
      </span>

      {/* Score */}
      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {row.players[0]?.score || ''}
      </span>
    </div>
  );
};

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
    {/* Logo circle — orange spiral logomark */}
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <img
        src="/assets/logomark-orange.png"
        alt="clbhouz"
        style={{ width: 28, height: 28, objectFit: 'contain' }}
      />
    </div>
    {/* Text */}
    <div>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', lineHeight: 1.2 }}>clbhouz</p>
      <p style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.6)', lineHeight: 1.2, marginTop: 1 }}>
        Tournament Result
      </p>
    </div>
  </motion.div>
);

// ─── Main component ───

export interface TournamentResultCardProps {
  post: TournamentResultFeedPost;
  isActive: boolean;
  isVisible: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onViewResults?: () => void;
}

export const TournamentResultCard: React.FC<TournamentResultCardProps> = ({
  post,
  isActive,
  isVisible,
  onLike,
  onComment,
  onShare,
  onViewResults,
}) => {
  const navigate = useNavigate();
  const meta = post.tournamentMeta;
  const hasImage = !!meta.course_image_url;
  const bgGradient = TOUR_GRADIENTS[meta.tour_slug] || 'from-slate-900 via-slate-800 to-slate-900';

  const hasScoreStats = (meta.stat_birdies > 0 || meta.stat_pars > 0 || meta.stat_bogeys > 0);
  const hasPerfStats = !!(meta.stat_driving_distance || meta.stat_fairways_pct || meta.stat_gir_pct || meta.stat_putts);
  const hasVenue = !!(meta.venue_name || meta.venue_city);
  const hasPodium = meta.podium_rows && meta.podium_rows.length > 0;

  // Dynamic grid columns for stats
  const scoreGridCols = meta.stat_eagles > 0 ? 4 : 3;

  // Performance stat items
  const perfItems = useMemo(() => {
    const items: { value: string; label: string; suffix?: string }[] = [];
    if (meta.stat_driving_distance) items.push({ value: String(meta.stat_driving_distance), label: 'DRIVER', suffix: ' yds' });
    if (meta.stat_fairways_pct) items.push({ value: String(Math.round(meta.stat_fairways_pct)), label: 'FAIRWAYS', suffix: '%' });
    if (meta.stat_gir_pct) items.push({ value: String(Math.round(meta.stat_gir_pct)), label: 'GIR', suffix: '%' });
    if (meta.stat_putts) items.push({ value: meta.stat_putts.toFixed(2), label: 'PUTTS' });
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
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#000000',
        overflow: 'hidden',
      }}
    >
      {/* 1. Course background image with Ken Burns */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        initial={{ scale: 1.03, opacity: 0 }}
        animate={{
          scale: isActive ? 1 : 1.03,
          opacity: isActive ? 1 : 0,
        }}
        transition={{
          opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 8, ease: 'easeOut' },
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

      {/* 3. Glass card — bottom anchored */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)',
          left: 16,
          right: 72,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
          borderRadius: 16,
          padding: '20px 20px 16px 20px',
          zIndex: 10,
          overflowY: 'auto',
          maxHeight: 'calc(100vh - env(safe-area-inset-bottom, 0px) - 200px)',
        }}
      >
        {/* Row 1: Tour badge + View Results */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="tour-badge">
            <span>{meta.tour_name}</span>
          </div>
          <button
            onClick={handleViewResults}
            style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            View Results →
          </button>
        </div>

        {/* Row 2: Tournament name */}
        <p className="hero-tournament-name" style={{ marginBottom: 2 }}>
          {meta.tournament_name}
        </p>

        {/* Row 3: Venue — only if data exists */}
        {hasVenue && (
          <p className="hero-venue" style={{ marginBottom: 16 }}>
            {[meta.venue_name, meta.venue_city].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* Row 4: Winner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: hasVenue ? 0 : 16 }}>
          <WinnerAvatar photoUrl={meta.winner_photo_url} name={meta.winner_name} />
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#FFFFFF', letterSpacing: -0.3, lineHeight: 1.2 }}>
              {meta.winner_name} {meta.winner_score_display}
            </p>
            {meta.winner_by && (
              <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                {meta.winner_by}
              </p>
            )}
          </div>
        </div>

        {/* Row 5: Tournament stats — hidden when all zeros */}
        {hasScoreStats && (
          <>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
              TOURNAMENT
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${scoreGridCols}, 1fr)`, gap: 6, marginBottom: 14 }}>
              {meta.stat_eagles > 0 && (
                <StatPill value={meta.stat_eagles} label="EAGLES" color="#F59E0B" />
              )}
              <StatPill value={meta.stat_birdies} label="BIRDIES" color="#22C55E" />
              <StatPill value={meta.stat_pars} label="PARS" color="rgba(255,255,255,0.9)" />
              <StatPill value={meta.stat_bogeys} label="BOGEYS" color="#EF4444" />
            </div>
          </>
        )}

        {/* Row 6: Performance averages — hidden when all null */}
        {hasPerfStats && perfItems.length > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
              PERFORMANCE AVERAGES
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${perfItems.length}, 1fr)`, gap: 6, marginBottom: 14 }}>
              {perfItems.map((item) => (
                <StatPill key={item.label} value={item.value} label={item.label} suffix={item.suffix} />
              ))}
            </div>
          </>
        )}

        {/* Row 7: Podium rows — hidden when empty */}
        {hasPodium && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {meta.podium_rows.slice(0, 2).map((row) => (
              <PodiumRowItem key={row.position} row={row} />
            ))}
          </div>
        )}
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
      <TournamentCreatorCapsule
        isVisible={isVisible}
      />
    </div>
  );
};

export default TournamentResultCard;
