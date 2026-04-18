/**
 * BreathingRoomIdentityPill - Top-anchored glass identity chrome
 *
 * Renders two stacked fixed elements over the active feed slide:
 *  1. Identity pill: avatar + name + (optional) HCP badge + time-ago + FOLLOW button
 *  2. Course chip: amber map-pin + course name (only when a course is tagged)
 *
 * Both share a single `isVisible` transition so the comments sheet can fade
 * the entire identity chrome in unison with the bottom bar.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Z } from '@/config/zIndex';

interface BreathingRoomIdentityPillProps {
  user: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string;
    /** TODO: surface user_profiles.eg_handicap_index in FeedPost builders. Pass null for now. */
    handicapIndex?: number | null;
  };
  course: {
    id: string;
    name: string;
  } | null;
  timeAgoLabel: string;
  isFollowing: boolean;
  isOwnPost: boolean;
  isVisible: boolean;
  onFollow: () => void;
  onViewProfile: () => void;
  onCourseTap?: () => void;
}

const PILL_TOP = 'calc(max(env(safe-area-inset-top, 0px), 47px) + 56px)';
const CHIP_TOP = 'calc(max(env(safe-area-inset-top, 0px), 47px) + 102px)';

export const BreathingRoomIdentityPill: React.FC<BreathingRoomIdentityPillProps> = ({
  user,
  course,
  timeAgoLabel,
  isFollowing,
  isOwnPost,
  isVisible,
  onFollow,
  onViewProfile,
  onCourseTap,
}) => {
  const showHcp =
    user.handicapIndex !== null &&
    user.handicapIndex !== undefined &&
    Number.isFinite(user.handicapIndex);

  return (
    <>
      {/* ── Identity pill ── */}
      <motion.div
        initial={false}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -6 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          top: PILL_TOP,
          left: 16,
          right: 16,
          zIndex: Z.echo,
          pointerEvents: isVisible ? 'auto' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px 8px 8px',
          borderRadius: 14,
          background: 'rgba(15, 23, 42, 0.55)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          fontFamily: 'Geist, system-ui, sans-serif',
        }}
      >
        {/* Avatar — tappable */}
        <button
          type="button"
          onClick={onViewProfile}
          aria-label={`View ${user.displayName}'s profile`}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <SquircleAvatar
            size={28}
            src={user.avatarUrl}
            alt={user.displayName}
            fallback={user.displayName?.[0] ?? '?'}
            thinRing
          />
        </button>

        {/* Name + meta — tappable */}
        <button
          type="button"
          onClick={onViewProfile}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 1,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              minWidth: 0,
              maxWidth: '100%',
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: '-0.01em',
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}
            >
              {user.displayName}
            </span>
            {showHcp && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'rgba(255, 255, 255, 0.6)',
                  flexShrink: 0,
                }}
              >
                HCP {user.handicapIndex!.toFixed(1)}
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: 1.2,
            }}
          >
            {timeAgoLabel}
          </span>
        </button>

        {/* FOLLOW button — hidden on own posts */}
        {!isOwnPost && (
          <motion.button
            type="button"
            onClick={onFollow}
            whileTap={{ scale: 0.94 }}
            aria-label={isFollowing ? 'Unfollow' : 'Follow'}
            style={{
              flexShrink: 0,
              border: 'none',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: 'Geist, system-ui, sans-serif',
              background: isFollowing ? 'rgba(255, 255, 255, 0.14)' : '#F7931E',
              color: isFollowing ? 'rgba(255, 255, 255, 0.85)' : '#0F172A',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >
            {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
          </motion.button>
        )}
      </motion.div>

      {/* ── Course chip ── */}
      {course && (
        <motion.button
          type="button"
          onClick={onCourseTap}
          initial={false}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -4 }}
          transition={{ duration: 0.18, ease: 'easeOut', delay: isVisible ? 0.04 : 0 }}
          style={{
            position: 'fixed',
            top: CHIP_TOP,
            left: 16,
            zIndex: Z.echo,
            pointerEvents: isVisible ? 'auto' : 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            maxWidth: 'calc(100% - 32px)',
            padding: '6px 10px',
            borderRadius: 999,
            background: 'rgba(0, 0, 0, 0.50)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            cursor: onCourseTap ? 'pointer' : 'default',
            fontFamily: 'Geist, system-ui, sans-serif',
          }}
        >
          <MapPin size={11} fill="#F7931E" stroke="#F7931E" strokeWidth={1} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {course.name}
          </span>
        </motion.button>
      )}
    </>
  );
};

export default BreathingRoomIdentityPill;
