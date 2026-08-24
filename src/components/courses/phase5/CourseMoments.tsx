/**
 * CourseMoments - User's own media/content at this course
 */
import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import { useUserCourseMoments } from '@/hooks/useUserCourseMoments';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileData } from '@/hooks/useProfileData';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { Panel } from '@/features/courses/components/holes/analytical/tokens';
import type { FeedPost } from '@/components/media-system/types/media';
import { CHIP_GLASS_CLASS } from '@/styles/photoScrim';

interface CourseMomentsProps {
  courseId: string;
  courseName: string;
  className?: string;
}

export const CourseMoments: React.FC<CourseMomentsProps> = ({
  courseId,
  courseName,
}) => {
  const { t } = useTranslation('courses');
  const { data: moments, isLoading } = useUserCourseMoments(courseId);
  const { user } = useSupabaseSession();
  const { profile } = useProfileData();

  const fullscreenPosts = useMemo<FeedPost[]>(() => {
    if (!moments?.length) return [];
    return moments.map((m) => ({
      id: m.id,
      userId: user?.id ?? '',
      actorType: 'personal',
      // Author id, NOT viewer id. Safe today because useUserCourseMoments is
      // viewer-scoped (fetches only the signed-in user's own moments), so
      // author === viewer. If this hook is ever broadened to include other
      // users' moments, switch this to the moment's real author id — otherwise
      // the fullscreen follow pill (canonical cache) will key on the wrong
      // actor and any Follow tap will land on self.
      actorId: user?.id ?? '',
      username: profile?.username ?? '',
      displayName: profile?.display_name ?? profile?.username ?? '',
      avatarUrl: profile?.profile_photo_url ?? '',
      isVerified: profile?.is_verified ?? false,
      creatorRelation: 'none',
      caption: m.caption ?? '',
      mediaItems: [{
        id: m.id,
        type: m.mediaType,
        hlsUrl: m.mediaType === 'video' ? m.mediaUrl : undefined,
        imageUrl: m.mediaType === 'image' ? m.mediaUrl : undefined,
        thumbnailUrl: m.posterUrl,
        width: 0,
        height: 0,
      }],
      createdAt: m.createdAt,
      // ⚠️ HARDCODED 0/false engagement fields.
      // SAFE ONLY because CourseMoments opens the fullscreen viewer with
      // readOnly:true — likes/comments UI is suppressed and no mutation
      // paths can fire against these stub values. If this surface is ever
      // switched to an interactive viewer, wire real engagement (fetch
      // like_count / comment_count / is_liked_by_me for the moment's
      // underlying post) BEFORE flipping readOnly off, or every viewed
      // moment will appear zeroed and any like will patch a stale delta.
      likeCount: 0, // RPC lacks field
      commentCount: 0, // RPC lacks field
      shareCount: 0, // RPC lacks field
      review: null,
      isReview: false,
      isLikedByMe: false, // RPC lacks field
      isFollowedByMe: false, // RPC lacks field
      courseName,
      courseId,
    }) as FeedPost);
  }, [moments, user?.id, courseName, courseId, profile]);

  const handleMomentTap = useCallback((index: number) => {
    if (fullscreenPosts.length > 0) {
      useFullscreenFeedStore.getState().open(fullscreenPosts, index, { readOnly: true });
    }
  }, [fullscreenPosts]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 14, width: 140, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ height: 80, width: 80, borderRadius: 10, background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ height: 80, width: 80, borderRadius: 10, background: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>
    );
  }

  if (!moments || moments.length === 0) {
    return null;
  }

  return (
    <Panel
      title={t('courseDetail.you.moments')}
      aside={t('courseDetail.you.momentsCount', { count: moments.length })}
    >
      {/* Gallery - a horizontal rail of discrete objects; tiles stay tiles. */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          margin: '0 -16px',
          padding: '0 16px 4px',
          scrollbarWidth: 'none',
        }}
      >
        {moments.slice(0, 6).map((moment, index) => (

          <div
            key={moment.id}
            onClick={() => handleMomentTap(index)}
            style={{
              position: 'relative',
              flexShrink: 0,
              width: 80,
              height: 80,
              borderRadius: 10,
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            {moment.mediaType === 'video' ? (
              <>
                <img
                  src={moment.posterUrl || moment.mediaUrl}
                  alt={t('phase5.videoMomentAlt')}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className={CHIP_GLASS_CLASS} style={{
                    width: 22, height: 22, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Play style={{ width: 10, height: 10, color: '#fff', fill: '#fff' }} />
                  </div>
                </div>
              </>
            ) : (
              <img
                src={moment.mediaUrl}
                alt={t('phase5.courseMomentAlt')}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
            )}
          </div>
        ))}

        {moments.length > 6 && (
          <div
            onClick={() => handleMomentTap(6)}
            className={CHIP_GLASS_CLASS}
            style={{
              flexShrink: 0,
              width: 80,
              height: 80,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            +{moments.length - 6}
          </div>
        )}
      </div>
    </Panel>

  );
};

export default CourseMoments;
