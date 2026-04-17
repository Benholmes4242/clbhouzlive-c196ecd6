/**
 * CourseMoments - User's own media/content at this course
 */
import React, { useMemo, useCallback } from 'react';
import { Play } from 'lucide-react';
import { useUserCourseMoments } from '@/hooks/useUserCourseMoments';
import { useMediaViewer } from '@/hooks/useMediaViewer';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface CourseMomentsProps {
  courseId: string;
  courseName: string;
  className?: string;
}

export const CourseMoments: React.FC<CourseMomentsProps> = ({
  courseId,
  courseName,
}) => {
  const { data: moments, isLoading } = useUserCourseMoments(courseId);
  const { user } = useSupabaseSession();
  const { openViewer } = useMediaViewer();

  const fullscreenItems = useMemo(() => {
    if (!moments?.length) return [];
    return moments.map((moment, index) => ({
      id: moment.id,
      postId: moment.id,
      mediaIndex: index,
      mediaUrl: moment.mediaUrl,
      mediaType: moment.mediaType as 'video' | 'image',
      posterUrl: moment.posterUrl,
      creatorId: user?.id || '',
      creatorName: 'Golfer',
      creatorUsername: '',
      creatorAvatar: undefined,
      likeCount: 0,
      commentCount: 0,
      courseName,
    }));
  }, [moments, user?.id, courseName]);

  const handleMomentTap = useCallback((index: number) => {
    if (fullscreenItems.length > 0) {
      openViewer(fullscreenItems, index);
    }
  }, [fullscreenItems, openViewer]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 14, width: 140, background: 'rgba(15,23,42,0.06)', borderRadius: 4 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ height: 80, width: 80, borderRadius: 10, background: 'rgba(15,23,42,0.06)' }} />
          <div style={{ height: 80, width: 80, borderRadius: 10, background: 'rgba(15,23,42,0.06)' }} />
        </div>
      </div>
    );
  }

  if (!moments || moments.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>📷 Your Moments</span>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>({moments.length})</span>
      </div>

      {/* Gallery */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
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
              boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
            }}
          >
            {moment.mediaType === 'video' ? (
              <>
                <img
                  src={moment.posterUrl || moment.mediaUrl}
                  alt="Video moment"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.55)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Play style={{ width: 10, height: 10, color: '#fff', fill: '#fff' }} />
                  </div>
                </div>
              </>
            ) : (
              <img
                src={moment.mediaUrl}
                alt="Course moment"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
            )}
          </div>
        ))}

        {moments.length > 6 && (
          <div
            onClick={() => handleMomentTap(6)}
            style={{
              flexShrink: 0,
              width: 80,
              height: 80,
              borderRadius: 10,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
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
    </div>
  );
};

export default CourseMoments;
