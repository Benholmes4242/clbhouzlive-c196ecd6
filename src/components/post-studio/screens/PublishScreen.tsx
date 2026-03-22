// PublishScreen — Step 2: Clean review before posting
import React, { useCallback, useState, useEffect } from 'react';
import { Globe, Users, Lock, Clock, ChevronRight, Zap, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudioHeader } from '../components/StudioHeader';
import { usePostStudioContext } from '../usePostStudio';
import { enqueuePostUpload } from '@/uploads/uploadPipeline';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BG_BASE, BG_CARD, BORDER_CARD, TEXT_PRIMARY, TEXT_TERTIARY } from '../tokens';
import { useSocialCounts } from '@/hooks/useSocialCounts';
import type { UploadJobInput } from '@/uploads/types';

export function PublishScreen() {
  const { state, setStep, openPanel, onSuccess } = usePostStudioContext();
  const [isPublishing, setIsPublishing] = useState(false);

  // Fetch follower count for social context line
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data?.user?.id ?? undefined);
    });
  }, []);
  const { data: socialCounts } = useSocialCounts(currentUserId);
  const contextLine = (() => {
    const n = socialCounts?.followers ?? 0;
    if (state.visibility === 'private') return 'Only visible to you';
    if (state.visibility === 'followers') {
      if (n === 0) return 'Visible to your followers';
      if (n === 1) return 'Visible to 1 follower';
      return `Visible to ${n.toLocaleString()} followers`;
    }
    // public
    if (n === 0) return 'Visible to everyone on clbhouz';
    return `Visible to your ${n.toLocaleString()} followers and beyond`;
  })();

  const visibilityConfig = {
    anyone:    { label: 'Public',  Icon: Globe,  desc: 'Everyone can see' },
    followers: { label: 'Friends', Icon: Users,  desc: 'Followers only' },
    private:   { label: 'Private', Icon: Lock,   desc: 'Only you' },
  }[state.visibility];

  const handlePublish = useCallback(async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('You need to be logged in'); setIsPublishing(false); return; }

      const files = state.mediaItems.map((m) => m.file).filter((f): f is File => !!f);
      const selectedTags = state.mentions.map((m) => ({
        id: m.entityId,
        entity_id: m.profileId,
        entity_type: m.entityType,
        name: m.displayName,
        username: m.username ?? null,
        start_index: m.start,
        end_index: m.end,
      }));

      const input: UploadJobInput = {
        actorType: state.actorType,
        actorId: state.actorId ?? user.id,
        userId: user.id,
        caption: state.caption,
        files,
        mediaItems: state.mediaItems.map((item) => ({
          id: item.id, file: item.file, type: item.mediaType,
          width: item.width ?? undefined, height: item.height ?? undefined,
          duration: item.duration ?? undefined,
          trimStart: item.trimStart || null, trimEnd: item.trimEnd || null,
          posterTimestamp: item.posterTimestamp || null,
        })),
        studioEditsByMediaId: Object.fromEntries(
          state.mediaItems
            .filter((item) => item.edits && Object.keys(item.edits).length > 0)
            .map((item) => [item.id, item.edits!])
        ),
        courseIds: state.taggedCourses.map((c) => c.courseId),
        courseInfo: state.taggedCourses[0]
          ? { id: state.taggedCourses[0].courseId, name: state.taggedCourses[0].courseName, country: state.taggedCourses[0].country ?? '' }
          : null,
        selectedTags,
        visibility: state.visibility,
        scheduledAt: state.scheduledAt,
      };

      enqueuePostUpload(input);
      onSuccess?.('');
      setStep('SUCCESS');
    } catch (err) {
      console.error('[PublishScreen] Failed to enqueue:', err);
      toast.error('Failed to start upload. Please try again.');
      setIsPublishing(false);
    }
  }, [state, setStep, onSuccess, isPublishing]);

  const firstItem = state.mediaItems[state.activeMediaIndex] ?? state.mediaItems[0];
  const itemCount = state.mediaItems.length;
  const hasCaption = state.caption.trim().length > 0;

  return (
    <div className="flex-1 flex flex-col" style={{ background: BG_BASE }}>
      <StudioHeader
        title="Review Post"
        step="PUBLISH"
        leftAction={{ label: 'Back', onClick: () => setStep('COMPOSE') }}
      />

      <div className="flex-1 overflow-y-auto flex flex-col" style={{ scrollbarWidth: 'none' }}>

        {/* ── Media preview — clean, minimal scrim ── */}
        {firstItem && (
          <div className="mx-4 mt-4 overflow-hidden" style={{ borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.40)' }}>
            {/* Thumbnail */}
            <div className="relative" style={{ aspectRatio: '4/3' }}>
              {firstItem.mediaType === 'video' ? (
                firstItem.posterPreviewUrl ? (
                  <img
                    src={firstItem.posterPreviewUrl}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={firstItem.previewUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover"
                    style={{ pointerEvents: 'none' }}
                  />
                )
              ) : (
                <img
                  src={firstItem.thumbnailUrl || firstItem.previewUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
              {/* Cover pill — top left */}
              {firstItem.posterPreviewUrl && (
                <div
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(12px)', color: 'rgba(255,255,255,0.80)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  Cover
                </div>
              )}
              {/* Media count — top right */}
              {itemCount > 1 && (
                <div
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(12px)', color: 'rgba(255,255,255,0.80)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  {itemCount} Media
                </div>
              )}
              {/* Caption overlay */}
              {hasCaption && (
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                  <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {state.caption}
                  </p>
                </div>
              )}
            </div>

            {/* Metadata row — course tags and mentions, same style as step 1 pills */}
            {(state.taggedCourses.length > 0 || state.mentions.length > 0) && (
              <div
                className="flex flex-wrap gap-1.5 px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                {state.taggedCourses.map((course) => (
                  <div
                    key={course.courseId}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[12px] font-medium"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    <span>⛳</span>
                    <span>{course.courseName}</span>
                  </div>
                ))}
                {state.mentions.length > 0 && (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[12px] font-medium"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.10)' }}
                  >
                    <AtSign className="w-3 h-3" strokeWidth={2} />
                    <span>{state.mentions.length} tagged</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── No media — caption only ── */}
        {!firstItem && hasCaption && (
          <div
            className="mx-4 mt-4 px-4 py-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {state.caption}
            </p>
          </div>
        )}

        {/* ── Settings card ── */}
        <div className="mx-4 mt-3 mb-2 overflow-hidden" style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Section label */}
          <div className="px-4 pt-3 pb-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
              Before you post
            </p>
          </div>

          {/* Audience row */}
          <motion.button
            whileTap={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            onClick={() => openPanel('audience')}
            className="w-full flex items-center gap-3 px-4 py-4 min-h-[56px]"
            style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="w-9 h-9 flex items-center justify-center shrink-0">
              <visibilityConfig.Icon className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.40)' }} strokeWidth={1.75} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>Audience</p>
              <p className="text-[11px] mt-0.5" style={{ color: TEXT_TERTIARY }}>{visibilityConfig.desc}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>{visibilityConfig.label}</span>
              <ChevronRight className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.22)' }} />
            </div>
          </motion.button>

          {/* Schedule row */}
          <motion.button
            whileTap={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            onClick={() => openPanel('schedule')}
            className="w-full flex items-center gap-3 px-4 py-4 min-h-[56px]"
            style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="w-9 h-9 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.40)' }} strokeWidth={1.75} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>Schedule</p>
              <p className="text-[11px] mt-0.5" style={{ color: TEXT_TERTIARY }}>
                {state.scheduledAt ? 'Scheduled for later' : 'Post immediately'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.50)' }}>
                {state.scheduledAt
                  ? state.scheduledAt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                  : 'Now'}
              </span>
              <ChevronRight className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.22)' }} />
            </div>
          </motion.button>
        </div>

        <div className="flex-1" />
      </div>

      {/* ── Post Moment CTA ── */}
      <div
        className="shrink-0 px-4 pt-3"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
          background: 'rgba(8,8,8,0.98)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Social context line */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingBottom: 10,
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: state.visibility === 'private'
              ? 'rgba(255,255,255,0.20)'
              : 'rgba(255,255,255,0.55)',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: 0.1,
            color: state.visibility === 'private'
              ? 'rgba(255,255,255,0.30)'
              : 'rgba(255,255,255,0.45)',
          }}>
            {contextLine}
          </span>
        </div>

        <AnimatePresence>
          {state.scheduledAt && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-center text-[11px] mb-2"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Will post {state.scheduledAt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePublish}
          disabled={isPublishing}
          className="w-full rounded-[18px] font-bold flex items-center justify-center gap-2.5 disabled:opacity-40"
          style={{
            minHeight: 58,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '-0.015em',
            borderRadius: 18,
            background: isPublishing ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.97)',
            color: '#0D0D0D',
            boxShadow: isPublishing
              ? 'none'
              : '0 6px 28px rgba(0,0,0,0.40), 0 2px 8px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,1)',
          }}
        >
          {isPublishing ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(0,0,0,0.25)', borderTopColor: 'transparent' }} />
              Starting upload…
            </>
          ) : (
            <>
              {state.scheduledAt
                ? <Clock className="w-5 h-5" strokeWidth={2.5} />
                : <Zap className="w-5 h-5" strokeWidth={2.5} fill="currentColor" />}
              {state.scheduledAt ? 'Schedule Moment' : 'Post Moment'}
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
