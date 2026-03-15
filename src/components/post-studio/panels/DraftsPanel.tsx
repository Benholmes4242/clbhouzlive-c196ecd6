// DraftsPanel — Saved drafts list bottom sheet (dark mode override)
import React, { useCallback } from 'react';
import { X, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDrafts } from '@/hooks/useDrafts';
import { usePostStudioContext } from '../usePostStudio';
import { SPRING } from '../constants';
import { AMBER_DIM, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '../tokens';
import type { PostStudioState } from '../types';

export function DraftsPanel() {
  const { dispatch, closePanel } = usePostStudioContext();
  const { drafts, isLoading, deleteDraft } = useDrafts();

  const handleLoadDraft = useCallback((draft: (typeof drafts)[number]) => {
    const partialState: Partial<PostStudioState> = {
      caption: draft.content ?? '', actorType: (draft.actorType as 'personal' | 'business') ?? 'personal',
      actorId: draft.actorId ?? null, visibility: (draft.visibility as PostStudioState['visibility']) ?? 'anyone', step: 'COMPOSER',
    };
    if (draft.courseId) {
      partialState.taggedCourses = [{ courseId: draft.courseId, courseName: draft.courseName ?? 'Unknown Course', country: draft.courseCountry ?? undefined }];
    }
    dispatch({ type: 'LOAD_DRAFT', payload: { draftId: draft.id, state: partialState } });
    closePanel();
  }, [dispatch, closePanel]);

  const handleDelete = useCallback((e: React.MouseEvent, draftId: string) => { e.stopPropagation(); deleteDraft(draftId); }, [deleteDraft]);

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', ...SPRING.panel }}
      className="absolute inset-x-0 bottom-0 z-40 rounded-t-[20px] max-h-[70vh] flex flex-col"
      style={{ background: 'rgba(14,14,14,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex justify-center pt-2.5 pb-1"><div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.20)' }} /></div>
      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: AMBER_DIM }}>YOUR DRAFTS</p>
          <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Drafts</h3>
        </div>
        <button onClick={closePanel} className="w-11 h-11 flex items-center justify-center"><X className="w-5 h-5" style={{ color: TEXT_SECONDARY }} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading && (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-square rounded-xl clb-shimmer-dark" style={{ background: 'rgba(255,255,255,0.05)' }} />)}
          </div>
        )}
        {!isLoading && drafts.length === 0 && (
          <div className="text-center py-10">
            <p className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: AMBER_DIM }}>YOUR DRAFTS</p>
            <p className="font-semibold mt-1" style={{ color: TEXT_PRIMARY }}>No drafts yet</p>
            <p className="text-xs mt-1" style={{ color: TEXT_SECONDARY }}>Start a post and save it to come back later</p>
          </div>
        )}
        {!isLoading && drafts.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {drafts.map((draft) => {
              const firstMedia = draft.media?.[0];
              const thumbnailUrl = firstMedia?.posterUrl || firstMedia?.mediaUrl;
              return (
                <button key={draft.id} onClick={() => handleLoadDraft(draft)}
                  className="relative aspect-square overflow-hidden group"
                  style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                  {thumbnailUrl ? <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center"><span className="text-3xl">📝</span></div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-[10px] line-clamp-2">{draft.content || 'No caption'}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.50)' }}>{new Date(draft.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={(e) => handleDelete(e, draft.id)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.60)' }}>
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
