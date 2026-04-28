import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { FollowBackButton } from './FollowBackButton';
import { FriendRequestButtons } from './FriendRequestButtons';
import {
  getActorDisplayName,
  getActorAvatarUrl,
  getNotificationBadgeIcon,
  getBadgeColor,
  isPrivateActor,
  isIncompleteProfile,
} from './rows/rowHelpers';

interface FeaturedNotificationCardProps {
  notification: ActivityNotification;
  onClick: () => void;
  onOpenActionsSheet: () => void;
  index?: number;
  currentUserId?: string;
  skipAnimation?: boolean;
}

const INK = '#0F172A';
const INK_SOFT = '#475569';
const INK_SUBTLE = '#94A3B8';
const BORDER = 'rgba(15,23,42,0.07)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97A10';

function getNotificationActionText(notification: ActivityNotification): string {
  const { type, message, title } = notification;
  switch (type) {
    case 'like': return 'liked your post';
    case 'comment': return message ? `commented: "${message.slice(0, 60)}${message.length > 60 ? '…' : ''}"` : 'commented on your post';
    case 'mention': return 'mentioned you in a post';
    case 'tag': return 'tagged you in a post';
    case 'follow': return 'started following you';
    case 'new_post': return 'shared a new post';
    case 'friend_request': return 'sent you a friend request';
    case 'friend_accept':
    case 'friend_accepted': return 'accepted your friend request';
    case 'friend_request_sent': return 'Friend request sent';
    case 'game_request': return 'invited you to a game';
    case 'game_request_accepted': return 'accepted your game invite';
    case 'trip_invite': return 'invited you on a trip';
    case 'friend_course_review':
    case 'course_review': return 'reviewed a course';
    case 'business_course_review': return 'left a review';
    case 'review_response': return 'responded to your review';
    default: return title || message || 'New notification';
  }
}

function getSubtext(notification: ActivityNotification): string | null {
  const { type, data, message } = notification;
  if (type === 'comment' && message && message.length > 60) return null;
  if (type === 'friend_request' && data?.mutual_friends_count) {
    return `${data.mutual_friends_count} mutual friend${data.mutual_friends_count > 1 ? 's' : ''}`;
  }
  if (data?.course_name) return data.course_name;
  if (data?.comment_preview) return `"${data.comment_preview.slice(0, 80)}"`;
  return null;
}

export const FeaturedNotificationCard: React.FC<FeaturedNotificationCardProps> = ({
  notification,
  onClick,
  onOpenActionsSheet,
  index = 0,
  currentUserId,
  skipAnimation = false,
}) => {
  const actorName = getActorDisplayName(notification);
  const avatarUrl = getActorAvatarUrl(notification);
  const badgeIcon = getNotificationBadgeIcon(notification.type);
  const badgeColor = getBadgeColor(notification.type);
  const actionText = getNotificationActionText(notification);
  const subtext = getSubtext(notification);
  const courseName = notification.data?.course_name;
  const incomplete = isIncompleteProfile(notification);

  // Fetch course thumbnail for review notifications
  const [courseThumbnail, setCourseThumbnail] = useState<string | null>(null);
  const courseId = notification.data?.course_id;
  const isReviewNotif = notification.type === 'friend_course_review' || notification.type === 'course_review';

  useEffect(() => {
    if (!isReviewNotif || !courseId) return;
    supabase
      .from('golf_courses')
      .select('thumbnail_image')
      .eq('id', courseId)
      .single()
      .then(({ data }) => {
        if (data?.thumbnail_image) setCourseThumbnail(data.thumbnail_image);
      });
  }, [courseId, isReviewNotif]);

  const isPrivateFollow = notification.type === 'follow' && isPrivateActor(notification);

  const showFollowBack =
    notification.type === 'follow' &&
    notification.actor_type === 'user' &&
    notification.actor_id &&
    notification.actor_id !== currentUserId &&
    !isPrivateFollow;

  const showFriendButtons =
    notification.type === 'friend_request' &&
    (!notification.data?.status || notification.data?.status === 'pending');

  const friendRequestId = notification.data?.request_id || notification.id;
  const isReview = isReviewNotif && courseThumbnail;

  // ──────────────────────────── REVIEW HERO CARD ────────────────────────────
  if (isReview) {
    return (
      <motion.div
        initial={skipAnimation ? false : { opacity: 0, y: 16 }}
        animate={skipAnimation ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
        onClick={onClick}
        className="cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div
          className="rounded-2xl overflow-hidden bg-white"
          style={{ border: `1px solid ${BORDER}` }}
        >
          {/* Photo hero */}
          <div className="relative" style={{ height: 110 }}>
            <img
              src={courseThumbnail!}
              alt={courseName || 'Course'}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.25) 100%)' }} />
            <span className="absolute top-3 right-3 text-[11px] font-medium text-white/60">
              {notification.time_ago}
            </span>
            <div className="absolute bottom-2.5 right-3.5">
              {notification.data?.rating != null && (
                <div
                  className="flex items-center gap-1 shrink-0"
                  style={{
                    background: 'rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 20,
                    padding: '3px 9px',
                  }}
                >
                  <img src="/images/brand/clubhouz-mark-white.svg" alt="" className="w-3 h-3" />
                  <span
                    className="text-[13px] font-bold text-white"
                    style={{ fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {Number(notification.data.rating).toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Avatar overlapping */}
          <div className="relative px-3.5 flex items-end gap-2.5" style={{ marginTop: -28 }}>
            <div className="relative inline-block shrink-0">
              <div style={{ border: '3px solid white', borderRadius: '34%', lineHeight: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                <SquircleAvatar
                  src={avatarUrl}
                  alt={actorName || 'User'}
                  size={48}
                  fallback={actorName?.charAt(0) || '?'}
                  hideRing
                />
              </div>
              <span
                className="absolute -bottom-0.5 -right-1.5 h-5 w-5 rounded-full ring-2 ring-white shadow-sm flex items-center justify-center"
                style={{ background: badgeColor }}
              >
                {badgeIcon}
              </span>
            </div>
            {courseName && (
              <span
                className="text-[13px] font-bold pb-1 truncate"
                style={{ minWidth: 0, flex: 1, color: INK }}
              >
                {courseName}
              </span>
            )}
            <ChevronRight size={18} color={AMBER_DEEP} className="pb-1 shrink-0" strokeWidth={2.25} />
          </div>

          {/* Content */}
          <div className="px-3.5 pt-2.5 pb-3.5 relative">
            {notification.is_unread && (
              <span
                style={{
                  position: 'absolute',
                  top: 10, left: 10,
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: AMBER,
                }}
              />
            )}
            <p className="text-[13.5px] leading-[1.45]" style={{ color: INK }}>
              <span className="font-semibold">{actorName}</span>{' '}
              <span style={{ color: INK_SOFT }} className="font-normal">{actionText}</span>
            </p>
            {subtext && (
              <p className="text-[12px] mt-1 italic leading-snug line-clamp-2" style={{ color: INK_SUBTLE }}>
                {subtext}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ──────────────────────────── COMPACT SOCIAL CARD ────────────────────────────
  return (
    <motion.div
      initial={skipAnimation ? false : { opacity: 0, y: 16 }}
      animate={skipAnimation ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div
        className="relative rounded-2xl bg-white"
        style={{
          border: `1px solid ${BORDER}`,
          padding: '12px 14px',
          paddingLeft: 18,
        }}
      >
        {/* Unread dot — top-left */}
        {notification.is_unread && (
          <span
            style={{
              position: 'absolute',
              top: 12, left: 8,
              width: 8, height: 8,
              borderRadius: '50%',
              background: AMBER,
            }}
          />
        )}

        {/* Timestamp — top right */}
        <span
          style={{
            position: 'absolute',
            top: 12, right: 14,
            fontSize: 11,
            fontWeight: 500,
            color: INK_SUBTLE,
          }}
        >
          {notification.time_ago}
        </span>

        <div className="flex items-start gap-3" style={{ paddingRight: 56 }}>
          {/* Avatar with badge */}
          <div className="relative shrink-0">
            <div
              style={{
                border: incomplete ? '0' : '0.5px solid #D1D5DB',
                borderRadius: '34%',
                lineHeight: 0,
                background: incomplete ? '#1E293B' : 'transparent',
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {incomplete ? (
                <span style={{ color: '#FFFFFF', fontSize: 17, fontWeight: 700 }}>
                  {(notification.actor_display_name?.charAt(0) || 'G').toUpperCase()}
                </span>
              ) : (
                <SquircleAvatar
                  src={avatarUrl}
                  alt={actorName || 'User'}
                  size={44}
                  fallback={actorName?.charAt(0) || '?'}
                  hideRing
                />
              )}
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 h-[18px] w-[18px] rounded-full ring-2 ring-white shadow-sm flex items-center justify-center"
              style={{ background: badgeColor }}
            >
              {badgeIcon}
            </span>
          </div>

          {/* Content column */}
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] leading-[1.4] line-clamp-2" style={{ color: INK }}>
              <span className="font-semibold">{actorName}</span>{' '}
              <span style={{ color: INK_SOFT }} className="font-normal">{actionText}</span>
            </p>

            {!isPrivateFollow && !incomplete && notification.actor_username && (
              <p style={{ fontSize: 11.5, color: INK_SUBTLE, marginTop: 1 }}>
                @{notification.actor_username}
              </p>
            )}

            {subtext && (
              <p className="text-[12px] mt-1 italic leading-snug line-clamp-2" style={{ color: INK_SUBTLE }}>
                {subtext}
              </p>
            )}

            {isPrivateFollow && (
              <p style={{ fontSize: 11.5, color: INK_SUBTLE, marginTop: 2, fontStyle: 'italic' }}>
                Private profile · no profile to view
              </p>
            )}

            {(showFollowBack || showFriendButtons) && (
              <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                {showFriendButtons && (
                  <FriendRequestButtons
                    notificationId={notification.id}
                    requestId={friendRequestId}
                    requesterId={notification.actor_id!}
                    requesterName={actorName}
                    initialStatus={notification.data?.status || 'pending'}
                    isMock={notification.is_mock}
                  />
                )}
                {showFollowBack && (
                  <FollowBackButton
                    actorId={notification.actor_id!}
                    actorDisplayName={actorName}
                    isMock={notification.is_mock}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
