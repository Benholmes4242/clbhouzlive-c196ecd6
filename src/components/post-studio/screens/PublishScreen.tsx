// PublishScreen — Step 5: Final review before publishing
// Summary of post + publish options

import React, { useCallback } from 'react';
import { Globe, Users, Lock, Clock, Eye, Flag, Send } from 'lucide-react';
import { StudioHeader } from '../components/StudioHeader';
import { usePostStudioContext } from '../usePostStudio';
import { enqueuePostUpload } from '@/uploads/uploadPipeline';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UploadJobInput } from '@/uploads/types';

export function PublishScreen() {
  const { state, setStep, openPanel, dispatch, onSuccess } = usePostStudioContext();

  const visibilityLabel = {
    anyone: { label: 'Public', icon: Globe },
    followers: { label: 'Friends', icon: Users },
    private: { label: 'Private', icon: Lock },
  }[state.visibility];
  const VisIcon = visibilityLabel.icon;

  const handlePublish = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You need to be logged in');
        return;
      }

      const files = state.mediaItems
        .map((m) => m.file)
        .filter((f): f is File => !!f);

      const input: UploadJobInput = {
        actorType: state.actorType,
        actorId: state.actorId ?? user.id,
        userId: user.id,
        caption: state.caption,
        files,
        mediaItems: state.mediaItems.map((item, i) => ({
          id: item.id,
          file: item.file,
          type: item.mediaType,
          width: item.width ?? undefined,
          height: item.height ?? undefined,
          duration: item.duration ?? undefined,
          trimStart: item.trimStart || null,
          trimEnd: item.trimEnd || null,
          posterTimestamp: item.posterTimestamp || null,
        })),
        courseIds: state.taggedCourses.map((c) => c.courseId),
        courseInfo: state.taggedCourses[0]
          ? {
              id: state.taggedCourses[0].courseId,
              name: state.taggedCourses[0].courseName,
              country: state.taggedCourses[0].country ?? '',
            }
          : null,
        visibility: state.visibility,
        scheduledAt: state.scheduledAt,
      };

      enqueuePostUpload(input);
      setStep('SUCCESS');
    } catch (err) {
      console.error('[PublishScreen] Failed to enqueue:', err);
      toast.error('Failed to start upload. Please try again.');
    }
  }, [state, setStep]);

  return (
    <div className="flex-1 flex flex-col">
      <StudioHeader
        title="Review"
        leftAction={{ label: 'Back', onClick: () => setStep('COMPOSER') }}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Preview thumbnail */}
        <div className="px-4 pt-4">
          <div className="flex items-start gap-3 bg-muted/50 rounded-xl p-3">
            {state.mediaItems[0] && (
              <img
                src={state.mediaItems[0].thumbnailUrl || state.mediaItems[0].previewUrl}
                alt=""
                className="w-16 h-16 rounded-lg object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-sm line-clamp-3">
                {state.caption || 'No caption'}
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                {state.mediaItems.length} item{state.mediaItems.length !== 1 ? 's' : ''}
                {state.taggedCourses.length > 0 &&
                  ` · ${state.taggedCourses.length} course${state.taggedCourses.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="px-4 pt-6 space-y-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Post options
          </h3>

          {/* Audience */}
          <button
            onClick={() => openPanel('audience')}
            className="w-full flex items-center gap-3 py-3.5 px-3 rounded-xl min-h-[52px] hover:bg-muted/50 transition-colors"
          >
            <VisIcon className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1 text-left">
              <p className="text-sm text-foreground">Audience</p>
              <p className="text-xs text-muted-foreground">{visibilityLabel.label}</p>
            </div>
          </button>

          {/* Schedule */}
          <button
            onClick={() => openPanel('schedule')}
            className="w-full flex items-center gap-3 py-3.5 px-3 rounded-xl min-h-[52px] hover:bg-muted/50 transition-colors"
          >
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1 text-left">
              <p className="text-sm text-foreground">Schedule</p>
              <p className="text-xs text-muted-foreground">
                {state.scheduledAt
                  ? state.scheduledAt.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : 'Post now'}
              </p>
            </div>
          </button>

          {/* Post type */}
          {state.postType === 'review' && (
            <div className="flex items-center gap-3 py-3.5 px-3 rounded-xl">
              <Flag className="w-5 h-5 text-primary" />
              <div className="flex-1 text-left">
                <p className="text-sm text-foreground">Review</p>
                <p className="text-xs text-muted-foreground">
                  {state.reviewRating ? `${state.reviewRating}/5 stars` : 'No rating'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Publish button */}
      <div className="px-4 py-4 border-t border-border/50 shrink-0">
        <button
          onClick={handlePublish}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 min-h-[48px]"
        >
          <Send className="w-4 h-4" />
          {state.scheduledAt ? 'Schedule Post' : 'Post'}
        </button>
      </div>
    </div>
  );
}
