// PublishScreen — Step 5: Premium final review
// Dark glass cards. Amber CTA. The moment before launch.

import React, { useCallback, useState } from 'react';
import { Globe, Users, Lock, Clock, Star, ChevronRight, Send, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { StudioHeader } from '../components/StudioHeader';
import { usePostStudioContext } from '../usePostStudio';
import { enqueuePostUpload } from '@/uploads/uploadPipeline';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UploadJobInput } from '@/uploads/types';

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 20,
};

const ROW_DIVIDER: React.CSSProperties = {
  borderTop: '1px solid rgba(255,255,255,0.06)',
};

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

  return (
    <div className="flex-1 flex flex-col" style={{ background: '#0D0D0D' }}>
      <StudioHeader title="Review" step="PUBLISH" leftAction={{ label: 'Back', onClick: () => setStep('COMPOSER') }} />

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="mx-4 mt-4" style={CARD_STYLE}>
          <div className="flex items-start gap-3 p-4">
            {firstItem && (
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0" style={{ background: 'rgba(255,255,255,0.06)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                <img src={firstItem.thumbnailUrl || firstItem.previewUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm line-clamp-2 leading-relaxed mb-1.5" style={{ color: hasCaption ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.30)' }}>
                {hasCaption ? state.caption : 'No caption'}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                {state.taggedCourses.length > 0 && (
                  <>
                    <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                    <span className="text-[11px] font-medium" style={{ color: 'rgba(245,158,11,0.70)' }}>⛳ {state.taggedCourses.map(c => c.courseName).join(', ')}</span>
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

        <div className="mx-4 mt-3" style={CARD_STYLE}>
          <p className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: 'rgba(255,255,255,0.30)' }}>Settings</p>

          <motion.button whileTap={{ backgroundColor: 'rgba(255,255,255,0.06)' }} onClick={() => openPanel('audience')} className="w-full flex items-center gap-3 px-4 py-4 min-h-[56px] transition-colors" style={ROW_DIVIDER}>
            <visibilityConfig.Icon className="w-5 h-5 shrink-0" style={{ color: 'rgba(255,255,255,0.40)' }} strokeWidth={1.75} />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>Audience</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{visibilityConfig.desc}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold" style={{ color: '#f59e0b' }}>{visibilityConfig.label}</span>
              <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
            </div>
          </motion.button>

          <motion.button whileTap={{ backgroundColor: 'rgba(255,255,255,0.06)' }} onClick={() => openPanel('schedule')} className="w-full flex items-center gap-3 px-4 py-4 min-h-[56px] transition-colors" style={ROW_DIVIDER}>
            <Clock className="w-5 h-5 shrink-0" style={{ color: 'rgba(255,255,255,0.40)' }} strokeWidth={1.75} />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>Schedule</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{state.scheduledAt ? 'Scheduled' : 'Post immediately'}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium" style={{ color: state.scheduledAt ? '#f59e0b' : 'rgba(255,255,255,0.35)' }}>
                {state.scheduledAt ? state.scheduledAt.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Now'}
              </span>
              <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
            </div>
          </motion.button>

          {state.postType === 'review' && (
            <div className="flex items-center gap-3 px-4 py-4 min-h-[56px]" style={ROW_DIVIDER}>
              <Star className="w-5 h-5 shrink-0" style={{ color: '#f59e0b' }} strokeWidth={1.75} fill="rgba(245,158,11,0.30)" />
              <div className="flex-1 text-left"><p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>Rating</p></div>
              <span className="text-sm font-semibold" style={{ color: '#f59e0b' }}>{state.reviewRating ? `${state.reviewRating}/5` : 'Not set'}</span>
            </div>
          )}
        </div>
        <div className="h-6" />
      </div>

      <div className="shrink-0 px-4 pt-3 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)', background: 'rgba(13,13,13,0.97)' }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handlePublish} disabled={isPublishing} className="w-full rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 min-h-[58px] disabled:opacity-60"
          style={{ background: isPublishing ? 'rgba(245,158,11,0.50)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#0D0D0D', boxShadow: isPublishing ? 'none' : '0 6px 24px rgba(245,158,11,0.45), 0 2px 8px rgba(245,158,11,0.30)' }}>
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
