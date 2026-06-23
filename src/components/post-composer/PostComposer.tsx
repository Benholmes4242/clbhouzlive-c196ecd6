// PostComposer — portal shell hosting Chooser → Composer → MediaEditor flow.
// Open/close contract (usePostStudioStore → GlobalPostComposer → PostComposer) is unchanged.

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useActiveActor } from '@/context/ActiveActorContext';
import { ComposerChooser } from './ComposerChooser';
import { Composer } from './Composer';
import { MediaEditor } from './MediaEditor';
import { CourseSearchSheet } from './CourseSearchSheet';
import type { ComposerMediaItem } from './composerMedia';
import type { StudioActorType, TaggedCourse } from './types';

type Screen = 'choose' | 'post' | 'editor';

interface PostComposerProps {
  open: boolean;
  onClose: () => void;
  initialMedia?: File[];
  initialActorType?: StudioActorType;
  initialActorId?: string | null;
  /** When set, opens the Composer in edit mode against this existing post id. */
  editPostId?: string | null;
}

export function PostComposer({
  open,
  onClose,
  initialMedia = [],
  initialActorType = 'personal',
  initialActorId = null,
  editPostId = null,
}: PostComposerProps) {
  const navigate = useNavigate();
  const { availableActors } = useActiveActor();

  const [screen, setScreen] = useState<Screen>('choose');
  const [reviewCourseSheetOpen, setReviewCourseSheetOpen] = useState(false);

  // Shared media state — lives on the shell so the Editor can read/update it.
  const [mediaItems, setMediaItems] = useState<ComposerMediaItem[]>([]);
  const [editIndex, setEditIndex] = useState(0);

  const isBusiness = initialActorType === 'business';
  const isEditMode = !!editPostId;

  const actorInfo = useMemo(() => {
    if (isBusiness && initialActorId) {
      const biz = availableActors.find(
        (a) => a.type === 'business' && a.id === initialActorId
      );
      return biz
        ? { name: biz.name, avatarUrl: biz.avatarUrl }
        : { name: 'Business', avatarUrl: null };
    }
    const personal = availableActors.find((a) => a.type === 'personal');
    return personal
      ? { name: personal.name, avatarUrl: personal.avatarUrl }
      : { name: 'You', avatarUrl: null };
  }, [availableActors, isBusiness, initialActorId]);

  // Reset on open. Edit mode skips the chooser and lands straight on the form.
  useEffect(() => {
    if (!open) return;
    setScreen(isEditMode || initialMedia.length > 0 ? 'post' : 'choose');
    setReviewCourseSheetOpen(false);
    setMediaItems([]);
    setEditIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Body scroll lock
  useLayoutEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const handleReviewPick = useCallback(
    (course: TaggedCourse) => {
      setReviewCourseSheetOpen(false);
      onClose();
      navigate(`/courses/${course.courseId}/rate`);
    },
    [navigate, onClose]
  );

  const openEditor = useCallback((_items: ComposerMediaItem[], idx: number) => {
    setEditIndex(idx);
    setScreen('editor');
  }, []);

  const handleEditorDone = useCallback((updated: ComposerMediaItem[]) => {
    setMediaItems(updated);
    setScreen('post');
  }, []);

  const handleEditorCancel = useCallback(() => {
    setScreen('post');
  }, []);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="light fixed inset-0 z-[9999] flex flex-col overscroll-contain"
          style={{ touchAction: 'pan-y', background: '#F8FAFC' }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {screen === 'choose' ? (
              <ComposerChooser
                onClose={onClose}
                onPost={() => setScreen('post')}
                onReview={() => setReviewCourseSheetOpen(true)}
                isBusiness={isBusiness}
              />
            ) : (
              <Composer
                onClose={onClose}
                onOpenEditor={openEditor}
                initialMedia={initialMedia}
                initialActorType={initialActorType}
                initialActorId={initialActorId}
                actorInfo={actorInfo}
                mediaItems={mediaItems}
                setMediaItems={setMediaItems}
              />
            )}

            {/* Editor overlays the Composer */}
            <MediaEditor
              open={screen === 'editor'}
              items={mediaItems}
              startIndex={editIndex}
              onCancel={handleEditorCancel}
              onDone={handleEditorDone}
            />
          </div>

          <CourseSearchSheet
            open={reviewCourseSheetOpen}
            onClose={() => setReviewCourseSheetOpen(false)}
            onSelect={handleReviewPick}
            title="Review a course"
            subtitle="Pick a course to rate"
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default PostComposer;
