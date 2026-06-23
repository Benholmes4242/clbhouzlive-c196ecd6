// PostComposer — portal shell that hosts the redesigned Chooser → Canvas flow.
// Open/close contract (usePostStudioStore → GlobalPostComposer → PostComposer) is unchanged.

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useActiveActor } from '@/context/ActiveActorContext';
import { ComposerChooser } from './ComposerChooser';
import { CanvasComposer } from './CanvasComposer';
import { CourseSearchSheet } from './CourseSearchSheet';
import type { StudioActorType, TaggedCourse } from './types';

type Screen = 'choose' | 'post';

interface PostComposerProps {
  open: boolean;
  onClose: () => void;
  initialMedia?: File[];
  initialActorType?: StudioActorType;
  initialActorId?: string | null;
}

export function PostComposer({
  open,
  onClose,
  initialMedia = [],
  initialActorType = 'personal',
  initialActorId = null,
}: PostComposerProps) {
  const navigate = useNavigate();
  const { availableActors } = useActiveActor();

  const [screen, setScreen] = useState<Screen>('choose');
  const [reviewCourseSheetOpen, setReviewCourseSheetOpen] = useState(false);

  const isBusiness = initialActorType === 'business';

  const actorInfo = useMemo(() => {
    if (isBusiness && initialActorId) {
      const biz = availableActors.find((a) => a.type === 'business' && a.id === initialActorId);
      return biz
        ? { name: biz.name, avatarUrl: biz.avatarUrl }
        : { name: 'Business', avatarUrl: null };
    }
    const personal = availableActors.find((a) => a.type === 'personal');
    return personal
      ? { name: personal.name, avatarUrl: personal.avatarUrl }
      : { name: 'You', avatarUrl: null };
  }, [availableActors, isBusiness, initialActorId]);

  // Reset on open. If we were opened with initial media, jump straight to canvas.
  useEffect(() => {
    if (!open) return;
    setScreen(initialMedia.length > 0 ? 'post' : 'choose');
    setReviewCourseSheetOpen(false);
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'auto' }}>
            {screen === 'choose' ? (
              <ComposerChooser
                onClose={onClose}
                onPost={() => setScreen('post')}
                onReview={() => setReviewCourseSheetOpen(true)}
                isBusiness={isBusiness}
              />
            ) : (
              <CanvasComposer
                onClose={onClose}
                initialMedia={initialMedia}
                initialActorType={initialActorType}
                initialActorId={initialActorId}
                actorInfo={actorInfo}
              />
            )}
          </div>

          {/* Review flow uses the existing course sheet → navigate to rate */}
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
