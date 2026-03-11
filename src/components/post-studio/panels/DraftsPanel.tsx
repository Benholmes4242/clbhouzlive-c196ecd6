// DraftsPanel — Saved drafts list bottom sheet

import React, { useCallback } from 'react';
import { X, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDrafts } from '@/hooks/useDrafts';
import { usePostStudioContext } from '../usePostStudio';
import { SPRING } from '../constants';
import type { PostStudioState, StudioMediaItem } from '../types';

export function DraftsPanel() {
  const { dispatch, closePanel } = usePostStudioContext();
  const { drafts, isLoading, deleteDraft } = useDrafts();

  const handleLoadDraft = useCallback(
    (draft: (typeof drafts)[number]) => {
      // Build partial state from draft
      const partialState: Partial<PostStudioState> = {
        caption: draft.content ?? '',
        actorType: (draft.actorType as 'personal' | 'business') ?? 'personal',
        actorId: draft.actorId ?? null,
        visibility: (draft.visibility as PostStudioState['visibility']) ?? 'anyone',
        step: 'COMPOSER',
      };

      // Add course data if available
      if (draft.courseId) {
        partialState.taggedCourses = [
          {
            courseId: draft.courseId,
            courseName: draft.courseName ?? 'Unknown Course',
            country: draft.courseCountry ?? undefined,
          },
        ];
      }

      dispatch({
        type: 'LOAD_DRAFT',
        payload: { draftId: draft.id, state: partialState },
      });
      closePanel();
    },
    [dispatch, closePanel]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent, draftId: string) => {
      e.stopPropagation();
      deleteDraftMutation.mutate(draftId);
    },
    [deleteDraftMutation]
  );

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', ...SPRING.panel }}
      className="absolute inset-x-0 bottom-0 z-40 bg-background rounded-t-[20px] border-t border-border/50 backdrop-blur-xl max-h-[70vh] flex flex-col"
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>

      <div className="flex items-center justify-between px-4 pb-2">
        <h3 className="text-sm font-semibold text-foreground">Drafts</h3>
        <button onClick={closePanel} className="w-11 h-11 flex items-center justify-center">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading && (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted clb-shimmer-dark" />
            ))}
          </div>
        )}

        {!isLoading && drafts.length === 0 && (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm">No drafts yet</p>
            <p className="text-muted-foreground text-xs mt-1">
              Save a post as a draft to continue later
            </p>
          </div>
        )}

        {!isLoading && drafts.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {drafts.map((draft) => {
              const firstMedia = draft.media?.[0];
              const thumbnailUrl = firstMedia?.posterUrl || firstMedia?.mediaUrl;
              return (
                <button
                  key={draft.id}
                  onClick={() => handleLoadDraft(draft)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-muted group"
                >
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-muted-foreground text-3xl">📝</span>
                    </div>
                  )}

                  {/* Overlay info */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-[10px] line-clamp-2">
                      {draft.content || 'No caption'}
                    </p>
                    <p className="text-white/60 text-[9px] mt-0.5">
                      {new Date(draft.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, draft.id)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
