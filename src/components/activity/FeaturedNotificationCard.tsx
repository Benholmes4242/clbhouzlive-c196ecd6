import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { FollowBackButton } from './FollowBackButton';
import { FriendRequestButtons } from './FriendRequestButtons';
import {
  getActorDisplayName,
  getActorAvatarUrl,
  getNotificationBadgeIcon,
} from './rows/rowHelpers';

interface FeaturedNotificationCardProps {
  notification: ActivityNotification;
  onClick: () => void;
  onOpenActionsSheet: () => void;
  index?: number;
  currentUserId?: string;
}

const stripGradient = 'linear-gradient(160deg, #0a2342 0%, #1a4a2e 50%, #2d6a4f 100%)';

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
  if (type === 'comment' && message && message.length > 60) return null; // already shown in action
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
}) => {
  const actorName = getActorDisplayName(notification);
  const avatarUrl = getActorAvatarUrl(notification);
  const badgeIcon = getNotificationBadgeIcon(notification.type);
  const actionText = getNotificationActionText(notification);
  const subtext = getSubtext(notification);
  const courseName = notification.data?.course_name;

  // Fetch course thumbnail for friend_course_review notifications
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

  const showFollowBack =
    notification.type === 'follow' &&
    notification.actor_type === 'user' &&
    notification.actor_id &&
    notification.actor_id !== currentUserId;

  const showFriendButtons =
    notification.type === 'friend_request' &&
    (!notification.data?.status || notification.data?.status === 'pending');

  const friendRequestId = notification.data?.request_id || notification.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="rounded-2xl overflow-hidden bg-background shadow-sm border border-border/60">
        {/* Layer 1 — Strip: photo hero for reviews, gradient for everything else */}
        {isReviewNotif && courseThumbnail ? (
          // ── PHOTO HERO — course review ──
          <div className="relative" style={{ height: 110 }}>
            <img
              src={courseThumbnail}
              alt={courseName || 'Course'}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.25) 100%)' }} />

            {/* Time ago — top right */}
            <span className="absolute top-3 right-3 text-[11px] font-medium text-white/50">
              {notification.time_ago}
            </span>
            {/* Course name + rating badge — bottom */}
            <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-end justify-between gap-2">
              <span className="text-[11px] font-semibold tracking-[0.04em] text-white/80 line-clamp-1">
                {notification.data?.course_name}
              </span>
              {notification.data?.rating != null && (
                <div className="flex items-center gap-1 shrink-0" style={{
                  background: 'rgba(247,147,30,0.85)', borderRadius: 6,
                  padding: '2px 7px',
                }}>
                  <span style={{ fontSize: 10 }}>⭐</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>
                    {Number(notification.data.rating).toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          // ── GRADIENT STRIP — all other notification types ──
          <div
            className="relative h-[72px]"
            style={{
              backgroundImage: `${stripGradient}, radial-gradient(circle at 20% 50%, rgba(255,255,255,0.04) 0%, transparent 60%)`,
            }}
          >
            <span className="absolute top-3 right-3 text-[11px] font-medium text-white/50">
              {notification.time_ago}
            </span>
            {courseName && (
              <span className="absolute bottom-2.5 left-3.5 text-[10px] font-semibold tracking-[0.06em] uppercase text-white/40">
                {courseName}
              </span>
            )}
          </div>
        )}

        {/* Layer 2 — Avatar overlapping the strip */}
        <div className="relative px-3.5" style={{ marginTop: -28 }}>
          <div className="relative inline-block">
            <div
              style={{
                border: '3px solid white',
                borderRadius: '34%',
                lineHeight: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }}
            >
              <SquircleAvatar
                src={avatarUrl}
                alt={actorName || 'User'}
                size={48}
                fallback={actorName?.charAt(0) || '?'}
                hideRing
              />
            </div>
            {/* Badge icon */}
            <span className="absolute -bottom-0.5 -right-1.5 h-5 w-5 rounded-full bg-white ring-2 ring-white shadow-sm flex items-center justify-center">
              {badgeIcon}
            </span>
          </div>
        </div>

        {/* Layer 3 — Content area */}
        <div className="px-3.5 pt-2.5 pb-3.5">
          <p className="text-[13.5px] leading-[1.45] text-foreground">
            <span className="font-semibold">{actorName}</span>{' '}
            <span className="text-muted-foreground font-normal">{actionText}</span>
          </p>

          {subtext && (
            <p className="text-[12px] text-muted-foreground/70 mt-1 italic leading-snug line-clamp-2">
              {subtext}
            </p>
          )}

          {/* Action buttons */}
          {(showFollowBack || showFriendButtons) && (
            <div
              className="mt-2.5"
              onClick={(e) => e.stopPropagation()}
            >
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
    </motion.div>
  );
};
