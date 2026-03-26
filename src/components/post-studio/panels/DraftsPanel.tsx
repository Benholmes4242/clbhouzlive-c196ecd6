// DraftsPanel — Saved drafts list bottom sheet, light mode
import React, { useCallback } from 'react';
import { Trash2, FileText } from 'lucide-react';
import { motion, useDragControls } from 'framer-motion';
import { useDrafts } from '@/hooks/useDrafts';
import { usePostStudioContext } from '../usePostStudio';
import { SPRING } from '../constants';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, ICON_BG } from '../tokens';
import type { PostStudioState } from '../types';

export function DraftsPanel() {
  const { dispatch, closePanel } = usePostStudioContext();
  const { drafts, isLoading, deleteDraft } = useDrafts();
  const dragControls = useDragControls();

  const handleLoadDraft = useCallback((draft: (typeof drafts)[number]) => {
    const partialState: Partial<PostStudioState> = {
      caption: draft.content ?? '',
      actorType: (draft.actorType as 'personal' | 'business') ?? 'personal',
      actorId: draft.actorId ?? null,
      visibility: (draft.visibility as PostStudioState['visibility']) ?? 'anyone',
      step: 'COMPOSE',
    };
    if (draft.courseId) {
      partialState.taggedCourses = [{
        courseId: draft.courseId,
        courseName: draft.courseName ?? 'Unknown Course',
        country: draft.courseCountry ?? undefined,
      }];
    }
    dispatch({ type: 'LOAD_DRAFT', payload: { draftId: draft.id, state: partialState } });
    closePanel();
  }, [dispatch, closePanel]);

  const handleDelete = useCallback(
    (e: React.MouseEvent, draftId: string) => { e.stopPropagation(); deleteDraft(draftId); },
    [deleteDraft]
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-30"
        style={{ background: 'rgba(0,0,0,0.25)' }}
        onClick={closePanel}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', ...SPRING.panel }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={(_e, info) => {
          if (info.offset.y > 80 || info.velocity.y > 400) closePanel();
        }}
        className="absolute inset-x-0 bottom-0 z-40 rounded-t-[24px] max-h-[75vh] flex flex-col"
        style={{
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.12)' }} />
        </div>

        <div className="px-4 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: TEXT_TERTIARY }}>Saved</p>
          <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Your Drafts</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoading && (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square rounded-[18px] animate-pulse" style={{ background: 'rgba(0,0,0,0.04)' }} />
              ))}
            </div>
          )}

          {!isLoading && drafts.length === 0 && (
            <div className="flex flex-col items-center text-center py-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: ICON_BG, border: '1px solid rgba(0,0,0,0.06)' }}>
                <FileText className="w-5 h-5" style={{ color: TEXT_TERTIARY }} strokeWidth={1.75} />
              </div>
              <p className="font-semibold text-sm" style={{ color: TEXT_PRIMARY }}>No drafts yet</p>
              <p className="text-xs mt-1 max-w-[200px]" style={{ color: TEXT_SECONDARY }}>Start a post and save it to pick up where you left off</p>
            </div>
          )}

          {!isLoading && drafts.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {drafts.map((draft) => {
                const firstMedia = draft.media?.[0];
                const thumbnailUrl = firstMedia?.posterUrl || firstMedia?.mediaUrl;
                const date = new Date(draft.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                return (
                  <button
                    key={draft.id}
                    onClick={() => handleLoadDraft(draft)}
                    className="relative aspect-square overflow-hidden text-left"
                    style={{ borderRadius: 18, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.02)' }}
                  >
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: ICON_BG }}>
                        <FileText className="w-8 h-8" style={{ color: TEXT_TERTIARY }} strokeWidth={1.5} />
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-2">
                      {draft.content ? (
                        <p className="text-[10px] line-clamp-2" style={{ color: 'rgba(255,255,255,0.90)' }}>{draft.content}</p>
                      ) : null}
                      <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{date}</p>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, draft.id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
