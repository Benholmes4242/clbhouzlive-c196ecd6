// PublishScreen — Step 5: Premium final review
// Dark glass cards. Amber CTA. The moment before launch.

import React, { useCallback, useState } from 'react';
import { Globe, Users, Lock, Clock, Star, ChevronRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { StudioHeader } from '../components/StudioHeader';
import { usePostStudioContext } from '../usePostStudio';
import { enqueuePostUpload } from '@/uploads/uploadPipeline';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BG_BASE, BG_CARD, BORDER_CARD, AMBER, AMBER_DEEP, AMBER_GRADIENT, AMBER_DIM, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '../tokens';
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

  const ROW_DIVIDER: React.CSSProperties = { borderTop: '1px solid rgba(255,255,255,0.06)' };

  return (
    <div className="flex-1 flex flex-col" style={{ background: BG_BASE }}>
      <StudioHeader title="Review" step="PUBLISH" leftAction={{ label: 'Back', onClick: () => setStep('COMPOSER') }} />

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {/* Post preview card with amber accent bar */}
        <div className="mx-4 mt-4 relative" style={{ background: BG_CARD, border: BORDER_CARD, borderRadius: 20 }}>
          {/* Left amber accent bar */}
          <div className="absolute left-0 rounded-sm" style={{ top: 12, bottom: 12, width: 3, borderRadius: 2, background: `linear-gradient(to bottom, ${AMBER}, ${AMBER_DEEP})` }} />
          <div className="flex items-start gap-3 p-4 pl-5">
            {firstItem && (
              <div className="w-20 h-20 overflow-hidden shrink-0" style={{ borderRadius: 16, background: 'rgba(255,255,255,0.06)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                <img src={firstItem.thumbnailUrl || firstItem.previewUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm line-clamp-2 leading-relaxed mb-1.5" style={{ color: hasCaption ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.30)' }}>
                {hasCaption ? state.caption : 'No caption'}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-medium" style={{ color: TEXT_TERTIARY }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                {state.taggedCourses.length > 0 && (
                  <>
                    <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                    <span className="text-[11px] font-medium" style={{ color: AMBER_DIM }}>⛳ {state.taggedCourses.map(c => c.courseName).join(', ')}</span>
                  </>
                )}
                {state.postType === 'review' && state.reviewRating && (
                  <>
                    <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                    <span className="text-[11px] font-medium" style={{ color: 'rgba(245,158,11,0.80)' }}>{'★'.repeat(state.reviewRating)} {state.reviewRating}/5</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settings card */}
        <div className="mx-4 mt-3" style={{ background: BG_CARD, border: BORDER_CARD, borderRadius: 20 }}>
          <p className="px-4 pt-4 pb-2 text-[13px] font-medium" style={{ color: TEXT_SECONDARY }}>Before you post</p>

          <motion.button whileTap={{ backgroundColor: 'rgba(255,255,255,0.06)' }} onClick={() => openPanel('audience')} className="w-full flex items-center gap-3 px-4 py-4 min-h-[56px] transition-colors" style={ROW_DIVIDER}>
            <visibilityConfig.Icon className="w-5 h-5 shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }} strokeWidth={1.75} />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>Audience</p>
              <p className="text-xs mt-0.5" style={{ color: TEXT_TERTIARY }}>{visibilityConfig.desc}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold" style={{ color: AMBER }}>{visibilityConfig.label}</span>
              <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.35)' }} />
            </div>
          </motion.button>

          <motion.button whileTap={{ backgroundColor: 'rgba(255,255,255,0.06)' }} onClick={() => openPanel('schedule')} className="w-full flex items-center gap-3 px-4 py-4 min-h-[56px] transition-colors" style={ROW_DIVIDER}>
            <Clock className="w-5 h-5 shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }} strokeWidth={1.75} />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>Schedule</p>
              <p className="text-xs mt-0.5" style={{ color: TEXT_TERTIARY }}>{state.scheduledAt ? 'Scheduled' : 'Post immediately'}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium" style={{ color: state.scheduledAt ? AMBER : TEXT_TERTIARY }}>
                {state.scheduledAt ? state.scheduledAt.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Now'}
              </span>
              <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.35)' }} />
            </div>
          </motion.button>

          {state.postType === 'review' && (
            <div className="flex items-center gap-3 px-4 py-4 min-h-[56px]" style={ROW_DIVIDER}>
              <Star className="w-5 h-5 shrink-0" style={{ color: AMBER }} strokeWidth={1.75} fill="rgba(245,158,11,0.30)" />
              <div className="flex-1 text-left"><p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>Rating</p></div>
              <span className="text-sm font-semibold" style={{ color: AMBER }}>{state.reviewRating ? `${state.reviewRating}/5` : 'Not set'}</span>
            </div>
          )}
        </div>
        <div className="h-6" />
      </div>

      {/* Publish CTA */}
      <div className="shrink-0 px-4 pt-3 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)', background: 'rgba(8,8,8,0.97)' }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handlePublish} disabled={isPublishing} className="w-full rounded-2xl font-bold flex items-center justify-center gap-2.5 disabled:opacity-60"
          style={{
            minHeight: 62,
            fontSize: 17,
            background: isPublishing ? 'rgba(245,158,11,0.50)' : AMBER_GRADIENT,
            color: '#0D0D0D',
            boxShadow: isPublishing ? 'none' : '0 8px 32px rgba(245,158,11,0.50), 0 2px 8px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.20)',
          }}>
          {isPublishing ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(0,0,0,0.4)', borderTopColor: 'transparent' }} />
              Starting upload…
            </>
          ) : (
            <>
              {state.scheduledAt ? <Clock className="w-5 h-5" strokeWidth={2.5} /> : <Zap className="w-5 h-5" strokeWidth={2.5} fill="currentColor" />}
              {state.scheduledAt ? 'Schedule Post' : 'Post Now'}
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
