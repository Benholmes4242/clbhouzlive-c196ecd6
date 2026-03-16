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
  BG_BASE, AMBER, AMBER_GRADIENT, AMBER_DIM, AMBER_GHOST,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY,
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
        title="Review Moment"
        step="PUBLISH"
        leftAction={{ label: 'Back', onClick: () => setStep('COMPOSER') }}
      />

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

        {/* Cinematic media preview */}
        {firstItem && (
          <div className="relative mx-4 mt-4 overflow-hidden" style={{ borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.60)' }}>
            <div className="relative" style={{ aspectRatio: '4/3' }}>
              <img
                src={firstItem.thumbnailUrl || firstItem.previewUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.40) 50%, transparent 100%)' }}
              />
            </div>

            {/* Media dots */}
            {itemCount > 1 && (
              <div className="flex justify-center gap-1.5 py-2">
                {state.mediaItems.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: i === 0 ? 16 : 6,
                      height: 6,
                      background: i === 0
                        ? 'linear-gradient(135deg, #F59E0B 0%, #C7870A 100%)'
                        : 'rgba(255,255,255,0.25)',
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
              {hasCaption && (
                <p className="text-sm font-medium leading-relaxed mb-2 line-clamp-2" style={{ color: 'rgba(255,255,255,0.90)' }}>
                  {state.caption}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {state.taggedCourses.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <MapPin className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.45)' }} strokeWidth={2} />
                    <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {state.taggedCourses[0].courseName}
                      {state.taggedCourses.length > 1 && ` +${state.taggedCourses.length - 1}`}
                    </span>
                  </div>
                )}
                {state.mentions.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <AtSign className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.55)' }} strokeWidth={1.75} />
                    <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {state.mentions.length} tagged
                    </span>
                  </div>
                )}
                {!hasCaption && state.taggedCourses.length === 0 && (
                  <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.30)' }}>No caption</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings card */}
        <div className="mx-4 mt-3 mb-2" style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="px-4 pt-4 pb-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
              Before you post
            </p>
          </div>

          <motion.button
            whileTap={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            onClick={() => openPanel('audience')}
            className="w-full flex items-center gap-3.5 px-4 py-4 min-h-[60px]"
            style={{ background: 'rgba(255,255,255,0.025)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <visibilityConfig.Icon className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.60)' }} strokeWidth={1.75} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>Audience</p>
              <p className="text-[11px] mt-0.5" style={{ color: TEXT_TERTIARY }}>{visibilityConfig.desc}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.70)' }}>{visibilityConfig.label}</span>
              <ChevronRight className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.25)' }} />
            </div>
          </motion.button>

          <motion.button
            whileTap={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            onClick={() => openPanel('schedule')}
            className="w-full flex items-center gap-3.5 px-4 py-4 min-h-[60px]"
            style={{ background: 'rgba(255,255,255,0.025)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <Clock className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.60)' }} strokeWidth={1.75} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>Schedule</p>
              <p className="text-[11px] mt-0.5" style={{ color: TEXT_TERTIARY }}>
                {state.scheduledAt ? 'Scheduled for later' : 'Post immediately'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {state.scheduledAt
                  ? state.scheduledAt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                  : 'Now'}
              </span>
              <ChevronRight className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.25)' }} />
            </div>
          </motion.button>
        </div>

        <div className="h-4" />
      </div>

      {/* Post Now CTA */}
      <div
        className="shrink-0 px-4 pt-3"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
          background: 'rgba(8,8,8,0.98)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <AnimatePresence>
          {state.scheduledAt && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-center text-xs mb-2.5"
              style={{ color: AMBER_DIM }}
            >
              Will post {state.scheduledAt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePublish}
          disabled={isPublishing}
          className="w-full rounded-2xl font-bold flex items-center justify-center gap-2.5 disabled:opacity-60"
          style={{
            minHeight: 58,
            fontSize: 16,
            letterSpacing: '-0.01em',
            background: isPublishing ? 'rgba(232,152,10,0.45)' : AMBER_GRADIENT,
            color: '#0D0D0D',
            boxShadow: isPublishing ? 'none' : '0 4px 24px rgba(200,135,10,0.40), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          {isPublishing ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(0,0,0,0.35)', borderTopColor: 'transparent' }} />
              Starting upload…
            </>
          ) : (
            <>
              {state.scheduledAt ? <Clock className="w-5 h-5" strokeWidth={2.5} /> : <Zap className="w-5 h-5" strokeWidth={2.5} fill="currentColor" />}
              {state.scheduledAt ? 'Schedule Moment' : 'Post Moment'}
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}