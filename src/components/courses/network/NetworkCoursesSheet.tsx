import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFriendsCourses, type CourseWithFriends } from '@/hooks/useFriendsCourses';
import type { Timeframe } from '@/lib/timeWindow';
import UnifiedCourseCard from '@/components/courses/UnifiedCourseCard';
import SquircleAvatar from '@/components/ui/SquircleAvatar';
import { getAvatarFallbackColor } from '@/lib/avatarFallback';
import type { CourseCardModel } from '@/types/courseCard';
import { format } from 'date-fns';

/* ──────────────────────────────────────────────────────────────────────────────
 * NetworkCoursesSheet
 *
 * Bottom sheet that opens from the "View all" button on the Your Network
 * section of the Explore tab. Replaces the legacy /friends-activity page.
 *
 * Source of truth: CoursesContent owns open/close via URL ?network=open.
 * ──────────────────────────────────────────────────────────────────────────── */

interface NetworkCoursesSheetProps {
  open: boolean;
  onClose: () => void;
}

const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '12m', label: '12 months' },
  { value: 'all', label: 'All time' },
];

const DEFAULT_TIMEFRAME: Timeframe = '30d';

/* ── FriendStack overlay ─────────────────────────────────────────────────── */
const FriendStack: React.FC<{
  friends: CourseWithFriends['friends'];
  max?: number;
  size?: number;
}> = ({ friends, max = 3, size = 26 }) => {
  const visible = friends.slice(0, max);
  const more = friends.length - visible.length;
  const overlap = Math.round(size * 0.35);

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        display: 'flex',
        alignItems: 'center',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      {visible.map((f, i) => (
        <div
          key={f.friend_id}
          style={{
            marginLeft: i === 0 ? 0 : -overlap,
            border: '2px solid #ffffff',
            borderRadius: '34%',
            background: getAvatarFallbackColor(
              f.friend_profile.id ?? f.friend_profile.username ?? f.friend_profile.display_name ?? 'fallback'
            ),
            width: size,
            height: size,
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.30)',
            zIndex: visible.length - i,
          }}
        >
          <SquircleAvatar
            size={size - 4}
            src={f.friend_profile.profile_photo_url}
            alt={f.friend_profile.display_name ?? f.friend_profile.username ?? ''}
            userId={f.friend_profile.id}
            hideRing
          />
        </div>
      ))}
      {more > 0 && (
        <div
          style={{
            marginLeft: -overlap,
            width: size,
            height: size,
            borderRadius: '34%',
            border: '2px solid #ffffff',
            background: 'rgba(15,23,42,0.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            boxShadow: '0 1px 4px rgba(0,0,0,0.30)',
          }}
        >
          +{more}
        </div>
      )}
    </div>
  );
};

/* ── Map CourseWithFriends → CourseCardModel ─────────────────────────────── */
function toCardModel(c: CourseWithFriends): CourseCardModel {
  // Pick the leading top100 membership for rank display (global preferred)
  const global = c.top100_memberships.find((m) => m.list_slug === 'global');
  const usa = c.top100_memberships.find((m) => m.list_slug === 'usa');
  const regional = c.top100_memberships.find(
    (m) => m.list_slug !== 'global' && m.list_slug !== 'usa'
  );

  const locationParts = [c.sub_country, c.country].filter(Boolean);

  return {
    id: c.course_id,
    name: c.course_name,
    locationText: locationParts.join(', '),
    imageUrl: c.thumbnail_url ?? null,
    communityRating: c.community_rating ?? null,
    country: c.country ?? undefined,
    ranks: {
      global: global?.rank ?? null,
      usa: usa?.rank ?? null,
      regional: regional?.rank ?? null,
    },
    context: {
      friendsPlayedCount: c.total_friends_played,
      lastPlayedAt: c.most_recent_play,
    },
  };
}

/* ── Sheet ────────────────────────────────────────────────────────────────── */
const NetworkCoursesSheet: React.FC<NetworkCoursesSheetProps> = ({ open, onClose }) => {
  const { user } = useSupabaseSession();
  const [timeframe, setTimeframe] = useState<Timeframe>(DEFAULT_TIMEFRAME);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading } = useFriendsCourses(user?.id, timeframe);

  // ESC closes sheet
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dropdownOpen) setDropdownOpen(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, dropdownOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close dropdown on outside tap
  useEffect(() => {
    if (!dropdownOpen) return;
    const onDocDown = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('touchstart', onDocDown);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('touchstart', onDocDown);
    };
  }, [dropdownOpen]);

  // Drag-to-dismiss
  const dragStateRef = useRef<{ startY: number; currentY: number } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const onTouchStart = (e: React.TouchEvent) => {
    dragStateRef.current = { startY: e.touches[0].clientY, currentY: e.touches[0].clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragStateRef.current) return;
    const dy = e.touches[0].clientY - dragStateRef.current.startY;
    if (dy > 0) {
      dragStateRef.current.currentY = e.touches[0].clientY;
      setDragOffset(dy);
    }
  };
  const onTouchEnd = () => {
    if (!dragStateRef.current) return;
    const dy = dragStateRef.current.currentY - dragStateRef.current.startY;
    dragStateRef.current = null;
    if (dy > 120) {
      setDragOffset(0);
      onClose();
    } else {
      setDragOffset(0);
    }
  };

  const courses = data?.courses ?? [];
  const totalCourses = data?.totalCourses ?? 0;
  const totalFriendsActive = data?.totalFriendsActive ?? 0;

  const totalRounds = useMemo(
    () => courses.reduce((sum, c) => sum + c.total_friends_played, 0),
    [courses]
  );

  const lastActivityLabel = useMemo(() => {
    if (courses.length === 0) return '—';
    const mostRecent = courses
      .map((c) => new Date(c.most_recent_play).getTime())
      .reduce((max, t) => (t > max ? t : max), 0);
    if (!mostRecent) return '—';
    const days = Math.max(0, Math.floor((Date.now() - mostRecent) / (1000 * 60 * 60 * 24)));
    if (days === 0) return 'TODAY';
    if (days === 1) return 'YESTERDAY';
    if (days < 7) return `${days}D AGO`;
    return format(new Date(mostRecent), 'd MMM').toUpperCase();
  }, [courses]);

  const currentTimeframeLabel =
    TIMEFRAME_OPTIONS.find((t) => t.value === timeframe)?.label ?? '30 days';

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1200,
          background: 'rgba(0,0,0,0.40)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          animation: 'ncs-fade-in 180ms ease-out',
        }}
        aria-label="Close sheet"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Friends played courses"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1201,
          background: '#F8FAFC',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: '92%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.18)',
          transform: `translateY(${dragOffset}px)`,
          transition: dragOffset === 0 ? 'transform 220ms cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
          animation: 'ncs-slide-up 260ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag handle */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 10,
            paddingBottom: 6,
            flexShrink: 0,
            touchAction: 'none',
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: 'rgba(15,23,42,0.18)',
            }}
          />
        </div>

        {/* Header block */}
        <div
          style={{
            padding: '6px 18px 16px',
            background: '#F8FAFC',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          {/* Left: eyebrow + headline + sub-line */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div
                style={{
                  width: 3,
                  height: 8,
                  background: '#F7931E',
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  color: '#F7931E',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                }}
              >
                Your Network
              </span>
            </div>

            {/* Two-line headline */}
            <h2
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: '#0F172A',
                letterSpacing: '-0.03em',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Friends played
            </h2>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: '#F7931E',
                letterSpacing: '-0.03em',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {totalCourses} {totalCourses === 1 ? 'course' : 'courses'}
            </h2>

            {/* Sub-line */}
            <p
              style={{
                fontSize: 11,
                color: '#64748B',
                margin: '8px 0 0',
                fontWeight: 600,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
              }}
            >
              {totalFriendsActive} FRIENDS · {totalRounds} ROUNDS · LAST {lastActivityLabel}
            </p>
          </div>

          {/* Right: timeframe pill */}
          <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: '#ffffff',
                border: '1px solid rgba(15,23,42,0.10)',
                borderRadius: 8,
                padding: '6px 10px',
                cursor: 'pointer',
                color: '#0F172A',
                fontSize: 11,
                fontWeight: 700,
              }}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
            >
              {currentTimeframeLabel}
              <ChevronDown size={11} color="#64748B" />
            </button>
            {dropdownOpen && (
              <div
                role="listbox"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  minWidth: 130,
                  background: '#ffffff',
                  border: '1px solid rgba(15,23,42,0.08)',
                  borderRadius: 10,
                  boxShadow: '0 12px 32px rgba(15,23,42,0.20)',
                  overflow: 'hidden',
                  zIndex: 10,
                }}
              >
                {TIMEFRAME_OPTIONS.map((opt) => {
                  const active = opt.value === timeframe;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        setTimeframe(opt.value);
                        setDropdownOpen(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px 14px',
                        fontSize: 12.5,
                        fontWeight: active ? 800 : 500,
                        color: '#0F172A',
                        textAlign: 'left',
                        background: active ? 'rgba(247,147,30,0.06)' : 'transparent',
                        border: 'none',
                        borderLeft: active ? '3px solid #F7931E' : '3px solid transparent',
                        cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Body — scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
          }}
        >
          {isLoading ? (
            <div style={{ padding: '12px 16px 32px', display: 'grid', gap: 12 }}>
              <SkeletonTile />
              <SkeletonTile />
            </div>
          ) : courses.length === 0 ? (
            <div
              style={{
                padding: '48px 20px',
                textAlign: 'center',
                color: '#64748B',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div style={{ fontSize: 32 }}>📅</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                No activity in this period
              </p>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#64748B', margin: 0 }}>
                Try expanding your time range
              </p>
            </div>
          ) : (
            <div style={{ padding: '12px 16px 32px', display: 'grid', gap: 12 }}>
              {courses.map((c) => (
                <div key={c.course_id} style={{ position: 'relative' }}>
                  <UnifiedCourseCard
                    course={toCardModel(c)}
                    showRankBadges
                    showRating
                  />
                  <FriendStack friends={c.friends} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hidden close button for SR users / keyboard navigation */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{ position: 'fixed', left: -9999, top: -9999 }}
      >
        <X />
      </button>

      {/* Inline keyframes */}
      <style>{`
        @keyframes ncs-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ncs-slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

const SkeletonTile: React.FC = () => (
  <div
    style={{
      width: '100%',
      aspectRatio: '16 / 9.5',
      background: 'linear-gradient(90deg, rgba(15,23,42,0.06), rgba(15,23,42,0.10), rgba(15,23,42,0.06))',
      borderRadius: 12,
      animation: 'ncs-shimmer 1.2s ease-in-out infinite',
    }}
  >
    <style>{`
      @keyframes ncs-shimmer {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
      }
    `}</style>
  </div>
);

export default NetworkCoursesSheet;
