// DraftsPanel — Dark sheet, row layout, 3:4 thumbnails, relative timestamps
import React, { useCallback } from 'react';
import { Trash2, FileText, Layers, X } from 'lucide-react';
import { motion, useDragControls } from 'framer-motion';
import { useDrafts } from '@/hooks/useDrafts';
import { usePostStudioContext } from '../usePostStudio';
import { SPRING } from '../constants';
import type { PostStudioState } from '../types';

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  if (diffH < 48) return 'Yesterday';
  const diffD = Math.floor(diffH / 24);
  return `${diffD} days ago`;
}

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
    if (draft.media && draft.media.length > 0) {
      partialState.mediaItems = draft.media.map((m) => {
        const isVideo = m.mediaType === 'video';
        return {
          id: m.id, file: null as any, mediaType: m.mediaType,
          previewUrl: isVideo ? (m.posterUrl || m.mediaUrl) : m.mediaUrl,
          thumbnailUrl: isVideo ? m.posterUrl || undefined : undefined,
          duration: m.durationSeconds ?? null, trimStart: 0, trimEnd: m.durationSeconds ?? null,
          posterTimestamp: 0, posterPreviewUrl: isVideo ? (m.posterUrl ?? null) : null,
          width: m.width ?? null, height: m.height ?? null, validationError: null,
          isRestored: true, restoredMediaUrl: m.mediaUrl,
          restoredStreamId: isVideo ? (m.streamId ?? undefined) : undefined,
        } as any;
      });
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
        style={{ background: 'rgba(0,0,0,0.55)' }}
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
        className="absolute inset-x-0 bottom-0 z-40 flex flex-col"
        style={{
          maxHeight: '76%',
          background: '#161616',
          borderRadius: '20px 20px 0 0',
          borderTop: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 flex items-start justify-between">
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>Saved</p>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>
              Your Drafts{drafts.length > 0 && <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>{drafts.length}</span>}
            </h3>
          </div>
          <button
            onClick={closePanel}
            className="flex items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }}
          >
            <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.45)' }} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4" style={{ scrollbarWidth: 'none' }}>
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3" style={{ padding: '12px 0' }}>
                  <div className="animate-pulse" style={{ width: 72, aspectRatio: '3/4', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="animate-pulse" style={{ width: '70%', height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
                    <div className="animate-pulse" style={{ width: '40%', height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && drafts.length === 0 && (
            <div className="flex flex-col items-center text-center py-10">
              <div className="flex items-center justify-center mb-3" style={{
                width: 52, height: 52, borderRadius: 16,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <FileText className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.35)' }} strokeWidth={1.75} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.50)' }}>No drafts yet</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 4, maxWidth: 200 }}>
                Start a post and save it to pick up where you left off
              </p>
            </div>
          )}

          {!isLoading && drafts.length > 0 && drafts.map((draft) => {
            const firstMedia = draft.media?.[0];
            const thumbnailUrl = firstMedia?.posterUrl || firstMedia?.mediaUrl;
            const mediaCount = draft.media?.length ?? 0;

            return (
              <div
                key={draft.id}
                role="button"
                tabIndex={0}
                onClick={() => handleLoadDraft(draft)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLoadDraft(draft); } }}
                className="flex gap-3 cursor-pointer"
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  alignItems: 'flex-start',
                }}
              >
                {/* Thumbnail */}
                <div className="relative shrink-0 overflow-hidden" style={{
                  width: 72, aspectRatio: '3/4', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <FileText className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.20)' }} strokeWidth={1.5} />
                    </div>
                  )}
                  {mediaCount > 1 && (
                    <div className="absolute bottom-1 right-1 flex items-center gap-0.5 px-1 py-0.5 rounded" style={{
                      background: 'rgba(0,0,0,0.60)', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.80)',
                    }}>
                      <Layers className="w-2.5 h-2.5" strokeWidth={2} />
                      {mediaCount}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  {draft.content ? (
                    <p style={{
                      fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.92)',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {draft.content}
                    </p>
                  ) : (
                    <p style={{ fontSize: 14, fontStyle: 'italic', color: 'rgba(255,255,255,0.28)' }}>No caption</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    {draft.courseName && (
                      <span className="px-2 py-0.5 rounded-full" style={{
                        fontSize: 11, fontWeight: 600,
                        background: 'rgba(34,197,94,0.08)', color: 'rgba(34,197,94,0.60)',
                        border: '1px solid rgba(34,197,94,0.15)',
                      }}>
                        ⛳ {draft.courseName}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>{relativeTime(draft.updatedAt)}</span>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => handleDelete(e, draft.id)}
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.14)',
                  }}
                >
                  <Trash2 className="w-3 h-3" style={{ color: 'rgba(239,68,68,0.65)' }} />
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
