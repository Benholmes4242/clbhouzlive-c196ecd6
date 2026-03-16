// PublishScreen — Step 5: The moment before launch
import React, { useCallback, useState } from 'react';
import { Globe, Users, Lock, Clock, ChevronRight, Zap, MapPin, AtSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudioHeader } from '../components/StudioHeader';
import { usePostStudioContext } from '../usePostStudio';
import { enqueuePostUpload } from '@/uploads/uploadPipeline';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  BG_BASE, BG_CARD, BORDER_CARD, AMBER, AMBER_DEEP,
  AMBER_GRADIENT, AMBER_DIM, AMBER_GHOST, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY,
} from '../tokens';
import type { UploadJobInput } from '@/uploads/types';

export function PublishScreen() {
  const { state, setStep, openPanel, onSuccess } = usePostStudioContext();
  const [isPublishing, setIsPublishing] = useState(false);

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

  const firstItem = state.mediaItems[0];
  const itemCount = state.mediaItems.length;
  const hasCaption = state.caption.trim().length > 0;

  return (
    <div className="flex-1 flex flex-col" style={{ background: BG_BASE }}>
      <StudioHeader
        title="Review"
        step="PUBLISH"
        leftAction={{ label: 'Back', onClick: () => setStep('COMPOSER') }}
      />

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

        {/* ── Cinematic media preview ── */}
        {firstItem && (
          <div className="mx-4 mt-4" style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.50)' }}>
            {/* Full-bleed thumbnail */}
            <div className="relative" style={{ aspectRatio: '4/5', maxHeight: '44vh' }}>
              <img
                src={firstItem.thumbnailUrl || firstItem.previewUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              {/* Gradient scrim */}
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(8,8,8,0.90) 0%, rgba(8,8,8,0.20) 40%, transparent 65%)' }}
              />
              {/* Multi-item indicator */}
              {itemCount > 1 && (
                <div
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(12px)' }}
                >
                  {itemCount} items
                </div>
              )}
            </div>

            {/* Caption + metadata overlay */}
            <div className="relative px-4 pt-0 pb-4 -mt-14" style={{ zIndex: 2 }}>
              {hasCaption && (
                <p
                  className="text-sm leading-relaxed line-clamp-3 mb-2"
                  style={{ color: 'rgba(255,255,255,0.80)' }}
                >
                  {state.caption}
                </p>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                {state.taggedCourses.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" style={{ color: AMBER_DIM }} strokeWidth={2} />
                    <span className="text-[12px] font-medium" style={{ color: AMBER_DIM }}>
                      {state.taggedCourses[0].courseName}
                      {state.taggedCourses.length > 1 && ` +${state.taggedCourses.length - 1}`}
                    </span>
                  </div>
                )}
                {state.mentions.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5" style={{ color: TEXT_SECONDARY }} strokeWidth={2} />
                    <span className="text-[12px] font-medium" style={{ color: TEXT_SECONDARY }}>
                      {state.mentions.length} tagged
                    </span>
                  </div>
                )}
                {!hasCaption && state.taggedCourses.length === 0 && (
                  <span className="text-[12px]" style={{ color: TEXT_TERTIARY }}>No caption</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Settings card ── */}
        <div className="mx-4 mt-3" style={{ background: BG_CARD, border: BORDER_CARD, borderRadius: 20 }}>

          {/* Section label */}
          <div className="px-4 pt-4 pb-2">
            <p className="text-[13px] font-medium" style={{ color: TEXT_SECONDARY }}>
              Before you post
            </p>
          </div>

          {/* Audience row */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => openPanel('audience')}
            className="w-full flex items-center gap-3.5 px-4 py-4 min-h-[60px]"
            style={{ background: 'rgba(255,255,255,0.025)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <visibilityConfig.Icon className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.55)' }} strokeWidth={1.75} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>Audience</p>
              <p className="text-xs mt-0.5" style={{ color: TEXT_TERTIARY }}>{visibilityConfig.desc}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold" style={{ color: AMBER }}>{visibilityConfig.label}</span>
              <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
            </div>
          </motion.button>

          {/* Schedule row */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => openPanel('schedule')}
            className="w-full flex items-center gap-3.5 px-4 py-4 min-h-[60px]"
            style={{ background: 'rgba(255,255,255,0.025)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <Clock className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.55)' }} strokeWidth={1.75} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>Schedule</p>
              <p className="text-xs mt-0.5" style={{ color: TEXT_TERTIARY }}>
                {state.scheduledAt ? 'Scheduled for later' : 'Post immediately'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-medium"
                style={{ color: state.scheduledAt ? AMBER : TEXT_TERTIARY }}
              >
                {state.scheduledAt
                  ? state.scheduledAt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                  : 'Now'}
              </span>
              <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
            </div>
          </motion.button>
        </div>

        <div className="h-6" />
      </div>

      {/* ── Post Now CTA ── */}
      <div
        className="shrink-0 px-4 pt-3 pb-4"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
          background: 'rgba(8,8,8,0.97)',
        }}
      >
        {/* Scheduled label above button */}
        <div className="mb-2 text-center" style={{ minHeight: 16 }}>
          {state.scheduledAt && (
            <span className="text-[11px]" style={{ color: TEXT_TERTIARY }}>
              Will post {state.scheduledAt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePublish}
          disabled={isPublishing}
          className="w-full rounded-2xl font-bold flex items-center justify-center gap-2.5 disabled:opacity-60"
          style={{
            minHeight: 62,
            fontSize: 17,
            background: isPublishing ? 'rgba(232,152,10,0.50)' : AMBER_GRADIENT,
            color: '#0D0D0D',
            boxShadow: isPublishing
              ? 'none'
              : '0 8px 32px rgba(232,152,10,0.45), 0 2px 8px rgba(232,152,10,0.30), inset 0 1px 0 rgba(255,255,255,0.20)',
          }}
        >
          {isPublishing ? (
            <>
              <div
                className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'rgba(0,0,0,0.4)', borderTopColor: 'transparent' }}
              />
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
