// Post Wizard - Single-Screen Composer
// Replaces the 3-step wizard with a unified composer surface.
// State engine (usePostWizard), upload pipeline, and all services are unchanged.

import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import StudioShelf from '@/components/studio/StudioShelf';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { StudioTool, StudioEdits } from '@/types/studio';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, RefreshCw, Image, Camera, MapPin, UserPlus, Plus, Globe, ChevronDown, Clock, FileText } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { PostWizardProps } from './types';
import { usePostWizard } from './usePostWizard';
import type { PostForEdit } from '@/lib/fetchPostForEdit';
import { PostWizardHeader } from './PostWizardHeader';
import { PostSuccessScreen } from './PostSuccessScreen';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useDrafts } from '@/hooks/useDrafts';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { enqueuePostUploadWithResilience } from '@/hooks/usePostUploadResilience';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { postKeys } from '@/queryKeys/posts';
import { toast } from 'sonner';
import type { DraftWithMedia } from '@/services/drafts';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { pickMediaFiles, validateMediaFiles } from '@/utils/media/pickMediaFiles';
import { normalizeFilesToMediaItems } from '@/lib/mediaUtils';
import { TaggableEntity } from '@/components/post/create-moment/types';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { MentionBottomSheet, MentionSuggestion } from './steps/MentionBottomSheet';
import { POST_LIMITS } from '@/constants/postLimits';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';

// New extracted components
import { ToolButton } from './components/ToolButton';
import { CharacterRing } from './components/CharacterRing';
import { MediaThumbnail } from './components/MediaThumbnail';
import { MediaPreviewViewer } from './components/MediaPreviewViewer';
import { RichCaptionInput, type RichCaptionInputHandle } from './components/RichCaptionInput';
import { TagPeopleSheet } from './components/TagPeopleSheet';
import { useToolbarTooltips, ToolbarTooltipBubble } from './components/ToolbarTooltip';

// Sheets
import {
  DraftsAndScheduledSheet,
  ScheduleSheet,
} from '@/components/post/create-moment/sheets';
import { CourseSearchSheet } from '@/components/courses/CourseSearchSheet';
import PostingOptionsSheet from '@/components/post/create-moment/PostingOptionsSheet';
import { DiscardActionSheet } from './DiscardActionSheet';

// ---------------------------------------------------------------------------
// CourseSearchSheet error boundary
// ---------------------------------------------------------------------------

function CourseSearchSheetFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[10011] rounded-t-[24px] bg-background p-8 text-center"
      style={{ boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.1)' }}
    >
      <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
        <AlertTriangle className="w-5 h-5 text-destructive" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">Couldn't load course search</p>
      <p className="text-xs text-muted-foreground mb-4">Check your connection and try again.</p>
      <Button variant="outline" size="sm" onClick={resetErrorBoundary} className="gap-2">
        <RefreshCw className="w-3.5 h-3.5" />
        Tap to retry
      </Button>
    </div>
  );
}

function CourseSearchSheetBoundary(props: React.ComponentProps<typeof CourseSearchSheet>) {
  return (
    <ReactErrorBoundary FallbackComponent={CourseSearchSheetFallback}>
      <CourseSearchSheet {...props} />
    </ReactErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countGraphemes(str: string): number {
  try {
    // @ts-ignore — Intl.Segmenter available in modern browsers (Chrome 87+, Safari 15.4+)
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    return [...segmenter.segment(str)].length;
  } catch {
    return [...str].length;
  }
}

function hasNonEmptyStudioEdits(edits?: StudioEdits): boolean {
  if (!edits) return false;
  return !!(
    (edits.filter && edits.filter !== 'normal') ||
    (edits.textOverlays && edits.textOverlays.length > 0) ||
    edits.music ||
    edits.crop ||
    (edits.rotate && edits.rotate !== 0) ||
    edits.flipH ||
    edits.flipV
  );
}

// ---------------------------------------------------------------------------
// Main PostWizard Component
// ---------------------------------------------------------------------------

export function PostWizard({
  isOpen,
  onClose,
  initialMedia,
  initialCourses,
  initialActorOverride,
  onRequestReview,
  editPostData,
}: PostWizardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  const {
    state,
    dispatch,
    canSubmit,
    reset,
    addCourse,
    removeCourse,
    setActor,
    setScheduledAt,
    setSubmitting,
    setVisibility,
    addMedia,
    removeMedia,
    setActiveMediaId,
    setStudioEdits,
    setCaption,
    setTags,
    setCoverIndex,
    loadDraft,
    loadExistingPost,
    loadScheduledPost,
  } = usePostWizard({
    initialMedia,
    initialCourses,
    initialActorOverride,
  });

  // Active actor context
  const { activeActor, setActiveActor, availableActors } = useActiveActor();

  const personalActor = useMemo(() => availableActors.find(a => a.type === 'personal'), [availableActors]);
  const businessActors = useMemo(() => availableActors.filter(a => a.type === 'business'), [availableActors]);

  // Drafts
  const { drafts, createDraft, canCreateDraft, uploadMedia, updateDraft: updateDraftFn, getDraft: getDraftFn, deleteMedia: deleteDraftMediaFn, deleteDraft: deleteDraftFn } = useDrafts();
  const { scheduledPosts } = useScheduledPosts();

  // Sheet states
  const [showCourseSearch, setShowCourseSearch] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [showDraftsSheet, setShowDraftsSheet] = useState(false);
  const [showScheduleSheet, setShowScheduleSheet] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showTagPeople, setShowTagPeople] = useState(false);
  const [pendingDraftToLoad, setPendingDraftToLoad] = useState<DraftWithMedia | null>(null);

  // Keyboard height for sheet avoidance
  const keyboardHeight = useKeyboardHeight();

  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const captionInputRef = useRef<RichCaptionInputHandle>(null);

  // Studio state
  const [showStudio, setShowStudio] = useState(false);
  const [studioTool, setStudioTool] = useState<StudioTool>('filter');
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);

  // Toolbar tooltips
  const { showCourseTooltip, showFriendsTooltip, dismissCourseTooltip, dismissFriendsTooltip } = useToolbarTooltips();

  // Media preview viewer state
  const [previewMediaIndex, setPreviewMediaIndex] = useState<number | null>(null);

  // Status bar — switch to dark (white icons) when fullscreen viewer is open over black
  const isViewerOpen = previewMediaIndex !== null;
  useMedianStatusBar(
    isViewerOpen ? "dark" : "light",
    "transparent",
    true,
    false,
    isOpen
  );

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      reset();
      setShowSuccess(false);
      setShowCloseConfirm(false);
      setPreviewMediaIndex(null);
      setShowStudio(false);
    }
  }, [isOpen, reset]);

  // Load existing post for edit
  useEffect(() => {
    if (isOpen && editPostData && !state.isEditMode) {
      loadExistingPost(editPostData);
    }
  }, [isOpen, editPostData, state.isEditMode, loadExistingPost]);

  // Sync actor
  useEffect(() => {
    if (activeActor && !initialActorOverride) {
      setActor({ type: activeActor.type === 'business' ? 'business' : 'personal', id: activeActor.id });
    }
  }, [activeActor, initialActorOverride, setActor]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleClose = useCallback(() => {
    if (state.isDirty) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }, [state.isDirty, onClose]);

  const confirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    onClose();
  }, [onClose]);

  // Media picker
  const handleAddMedia = useCallback(async (source?: 'camera' | 'gallery') => {
    const remainingSlots = POST_LIMITS.MAX_MEDIA_COUNT - state.mediaItems.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${POST_LIMITS.MAX_MEDIA_COUNT} photos & videos per post`);
      return;
    }

    try {
      const files = await pickMediaFiles({
        accept: source === 'camera' ? 'image/*' : 'image/*,video/*',
        capture: source === 'camera' ? 'environment' : undefined,
        multiple: remainingSlots > 1,
        maxFiles: remainingSlots,
      });
      if (files.length > 0) {
        const result = await normalizeFilesToMediaItems(files);
        if (result.errors?.length) {
          result.errors.forEach(err => toast.error(`${err.fileName}: ${err.error}`));
        }
        if (result.validItems?.length) {
          addMedia(result.validItems);
        }
      }
    } catch {
      // User cancelled picker
    }
  }, [state.mediaItems.length, addMedia]);

  // Caption change handler for RichCaptionInput
  const handleCaptionChange = useCallback((plainText: string) => {
    setCaption(plainText);
    dismissCourseTooltip();
    dismissFriendsTooltip();
  }, [setCaption, dismissCourseTooltip, dismissFriendsTooltip]);

  // Cursor position handler — triggers mention detection
  const handleCursorChange = useCallback((position: number) => {
    setCursorPosition(position);
  }, []);

  // Mention query handler from RichCaptionInput
  const handleMentionQueryChange = useCallback((query: string | null) => {
    if (query !== null) {
      setMentionQuery(query);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  }, []);

  // Mention selection
  const handleMentionSelect = useCallback((mention: MentionSuggestion) => {
    const caption = state.caption;
    const textBeforeCursor = caption.slice(0, cursorPosition);
    const textAfterCursor = caption.slice(cursorPosition);
    const beforeMention = textBeforeCursor.replace(/@\w*$/, '');
    const displayName = (mention.username || mention.name).replace(/\s+/g, '');

    const atStart = beforeMention.length;
    const atEnd = cursorPosition;

    captionInputRef.current?.insertMention(
      {
        id: mention.id,
        entity_id: mention.entity_id,
        entity_type: mention.entity_type,
        name: mention.name,
        username: mention.username,
        avatar_url: mention.avatar_url,
      },
      [atStart, atEnd]
    );

    setShowMentions(false);
    setMentionQuery('');

    const tagEntity: TaggableEntity = {
      id: mention.id,
      entity_id: mention.entity_id,
      entity_type: mention.entity_type,
      name: mention.name,
      username: mention.username,
      avatar_url: mention.avatar_url,
    };
    if (!state.selectedTags.some(t => t.id === mention.id)) {
      dispatch({ type: 'SET_TAGS', payload: [...state.selectedTags, tagEntity] });
    }
  }, [state.caption, state.selectedTags, cursorPosition, setCaption, dispatch]);

  // Submission
  const handleSubmit = useCallback(async () => {
    if (state.isSubmitting || !canSubmit) return;

    setSubmitting(true);

    try {
      // EDIT MODE
      if (state.isEditMode && state.editPostId) {
        if (!user?.id) {
          toast.error('You must be logged in to edit a post.');
          setSubmitting(false);
          return;
        }
        const updatePayload: Record<string, any> = {
          content: state.caption.trim() || null,
          visibility: state.visibility,
          course_id: state.selectedCourses[0]?.id || null,
          updated_at: new Date().toISOString(),
        };
        // Persist schedule changes
        if (state.scheduledAt) {
          // User kept or changed the schedule time
          updatePayload.scheduled_at = state.scheduledAt.toISOString();
          updatePayload.status = 'scheduled';
        } else {
          // User removed the schedule — publish immediately
          updatePayload.scheduled_at = null;
          updatePayload.status = 'published';
          updatePayload.created_at = new Date().toISOString();
        }
        const { data: updatedRows, error } = await supabase
          .from('posts')
          .update(updatePayload)
          .eq('id', state.editPostId)
          .eq('user_id', user.id)
          .select('id');

        if (error) throw new Error(`Failed to update post: ${error.message}`);
        if (!updatedRows || updatedRows.length === 0) {
          toast.error('This post could not be updated. It may have been deleted.');
          dispatch({ type: 'SET_SUBMITTING', payload: false });
          return;
        }

        // Persist course changes: delete-and-reinsert post_courses
        await supabase.from('post_courses').delete().eq('post_id', state.editPostId);
        if (state.selectedCourses.length > 0) {
          const courseRows = state.selectedCourses.map((course, index) => ({
            post_id: state.editPostId!,
            course_id: course.id,
            display_order: index,
          }));
          await supabase.from('post_courses').insert(courseRows);
        }

        // Persist tag changes: delete-and-reinsert post_tags
        await supabase.from('post_tags').delete().eq('post_id', state.editPostId);
        if (state.selectedTags.length > 0) {
          const tagRows = state.selectedTags.map(tag => {
            const displayText = `@${(tag.username || tag.name).replace(/\s+/g, '')}`;
            const caption = state.caption.toLowerCase();
            const startIndex = caption.indexOf(displayText.toLowerCase());
            const endIndex = startIndex >= 0 ? startIndex + displayText.length : displayText.length;
            return {
              post_id: state.editPostId!,
              tagged_entity_id: tag.id,
              start_index: Math.max(0, startIndex),
              end_index: endIndex,
            };
          });
          await supabase.from('post_tags').insert(tagRows);
        }

        queryClient.invalidateQueries({ queryKey: ['trending-posts'] });
        queryClient.invalidateQueries({ queryKey: ['infinite-followed-posts'] });
        queryClient.invalidateQueries({ queryKey: ['actor-posts'] });
        queryClient.invalidateQueries({ queryKey: ['activity-posts'] });
        queryClient.invalidateQueries({ queryKey: ['userPosts'] });
        queryClient.invalidateQueries({ queryKey: ['followedUsersPosts'] });
        queryClient.invalidateQueries({ queryKey: ['explore-content'] });
        queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
        queryClient.invalidateQueries({ queryKey: ['pinned-posts'] });
        queryClient.invalidateQueries({ queryKey: ['featured-post'] });
        queryClient.invalidateQueries({ queryKey: ['creator-features'] });
        queryClient.invalidateQueries({ queryKey: postKeys.actorPosts(state.actor.type as 'personal' | 'business', state.actor.id) });
        queryClient.invalidateQueries({ queryKey: ['post', state.editPostId] });
        window.dispatchEvent(new CustomEvent('postUpdated'));
        queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
        queryClient.invalidateQueries({ queryKey: ['scheduled-posts-count'] });
        toast.success(state.scheduledAt ? 'Scheduled post updated' : 'Post published');
        if (!state.scheduledAt) {
          analyticsEvents.track('scheduled_post_unscheduled', {});
        }
        onClose();
        return;
      }

      // CREATE MODE
      // Reorder media items so cover is first (display_order: 0)
      const reorderedItems = [...state.mediaItems];
      if (state.coverIndex > 0 && state.coverIndex < reorderedItems.length) {
        const [coverItem] = reorderedItems.splice(state.coverIndex, 1);
        reorderedItems.unshift(coverItem);
      }
      const files = reorderedItems.filter(item => item.file).map(item => item.file as File);
      const firstCourse = state.selectedCourses[0];
      const courseInfo = firstCourse?.id && firstCourse?.name
        ? { id: firstCourse.id, name: firstCourse.name, country: firstCourse.country || '' }
        : undefined;
      const courseIds = state.selectedCourses.map(c => c?.id).filter((id): id is string => Boolean(id));

      await enqueuePostUploadWithResilience({
        userId: state.actor.id,
        actorType: state.actor.type,
        actorId: state.actor.id,
        caption: state.caption,
        courseInfo,
        courseIds,
        selectedTags: state.selectedTags,
        files,
        mediaItems: reorderedItems,
        studioEditsByMediaId: state.studioEditsByMediaId,
        visibility: state.visibility,
        scheduledAt: state.scheduledAt ?? undefined,
      });

      // If this post was created from a loaded draft, clean it up
      if (state.currentDraftId) {
        try {
          await deleteDraftFn(state.currentDraftId);
          console.log('[PostWizard] Deleted source draft:', state.currentDraftId);
        } catch (err) {
          console.warn('[PostWizard] Failed to delete source draft:', err);
        }
      }

      setShowSuccess(true);
    } catch (error) {
      console.error('[PostWizard] Submission failed:', error);
      toast.error(state.isEditMode ? 'Failed to update post.' : 'Failed to post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [state, canSubmit, setSubmitting, onClose, user, queryClient, dispatch]);

  // Course handler
  const handleCourseSelect = useCallback((course: { id: string; name: string; country: string; region?: string }) => {
    try {
      if (!course?.id || !course?.name) {
        setShowCourseSearch(false);
        return;
      }
      addCourse(course);
      setShowCourseSearch(false);
    } catch {
      setShowCourseSearch(false);
    }
  }, [addCourse]);

  const handleActorChange = useCallback((actor: { type: 'personal' | 'business'; id: string; name: string; avatarUrl?: string }) => {
    setActor({ type: actor.type, id: actor.id });
    const selected = availableActors.find(a => a.id === actor.id);
    if (selected) setActiveActor(selected);
  }, [setActor, availableActors, setActiveActor]);

  const handleTrimChange = useCallback((mediaIndex: number, trimStart: number | null, trimEnd: number | null) => {
    dispatch({ type: 'UPDATE_MEDIA_ITEM', payload: {
      id: state.mediaItems[mediaIndex]?.id,
      updates: { trimStart, trimEnd },
    }});
  }, [state.mediaItems, dispatch]);

  const handlePosterTimestampChange = useCallback((mediaIndex: number, timestamp: number | null) => {
    dispatch({ type: 'UPDATE_MEDIA_ITEM', payload: {
      id: state.mediaItems[mediaIndex]?.id,
      updates: { posterTimestamp: timestamp },
    }});
  }, [state.mediaItems, dispatch]);

  const handleVisibilityChange = useCallback((visibility: 'anyone' | 'followers' | 'private') => {
    setVisibility(visibility);
  }, [setVisibility]);

  const handleScheduleSelect = useCallback((date: Date | null) => {
    setScheduledAt(date);
    setShowScheduleSheet(false);
    if (date) {
      const minutesAhead = Math.round((date.getTime() - Date.now()) / 60000);
      toast.success('Post scheduled');
      analyticsEvents.track('post_scheduled', { schedule_minutes_ahead: minutesAhead });
    } else {
      toast.success('Schedule removed');
      analyticsEvents.track('schedule_removed', {});
    }
  }, [setScheduledAt]);

  const handleLoadDraft = useCallback((draft: DraftWithMedia) => {
    const isWizardDirty = state.caption.trim().length > 0 || state.mediaItems.length > 0;
    if (isWizardDirty) {
      setPendingDraftToLoad(draft);
      return;
    }
    loadDraft(draft);
    setShowDraftsSheet(false);
    toast.success('Draft loaded');
    analyticsEvents.track('draft_loaded', { media_count: draft.media?.length || 0, has_course: !!draft.courseId });
  }, [loadDraft, state.caption, state.mediaItems.length]);

  const confirmLoadDraft = useCallback(() => {
    if (pendingDraftToLoad) {
      loadDraft(pendingDraftToLoad);
      setPendingDraftToLoad(null);
      setShowDraftsSheet(false);
      toast.success('Draft loaded');
    }
  }, [pendingDraftToLoad, loadDraft]);

  const handleEditScheduledPost = useCallback((post: import('@/services/posts/scheduledPosts').ScheduledPost) => {
    loadScheduledPost(post);
    setShowDraftsSheet(false);
    toast.success('Editing scheduled post');
    analyticsEvents.track('scheduled_post_edited', { has_media: (post.media?.length || 0) > 0 });
  }, [loadScheduledPost]);

  const draftSaveInput = useMemo(() => ({
    actorType: state.actor.type as 'personal' | 'business',
    actorId: state.actor.id,
    content: state.caption || null,
    visibility: state.visibility as 'anyone' | 'followers' | 'private',
    categories: [] as string[],
    badges: [] as string[],
    courseId: state.selectedCourses[0]?.id || null,
    courseName: state.selectedCourses[0]?.name || null,
    courseCountry: state.selectedCourses[0]?.country || null,
    courseData: state.selectedCourses.length > 0 ? state.selectedCourses.map(c => ({ id: c.id, name: c.name, country: c.country, region: c.region })) : null,
  }), [state.actor, state.caption, state.visibility, state.selectedCourses]);

  const getEdits = useCallback((mediaId: string) => state.studioEditsByMediaId[mediaId], [state.studioEditsByMediaId]);

  // Sync media for draft updates: delete removed items, upload new ones
  const syncDraftMedia = useCallback(async (draftId: string) => {
    const existingDraft = await getDraftFn(draftId);
    const existingMedia = existingDraft?.media || [];
    const existingMediaIds = new Set(existingMedia.map(m => m.id));

    // Items the user kept (restored from draft, still in wizard)
    const currentRestoredIds = new Set(
      state.mediaItems
        .filter(item => (item as any).isRestored && item.id)
        .map(item => item.id)
    );

    // Delete removed media (was in DB, no longer in wizard)
    const removedMedia = existingMedia.filter(m => !currentRestoredIds.has(m.id));
    for (const removed of removedMedia) {
      await deleteDraftMediaFn(removed.id);
    }
    // Clean up storage for removed items
    if (removedMedia.length > 0) {
      const { cleanupDraftMedia } = await import('@/services/drafts/draftMediaUpload');
      await cleanupDraftMedia(removedMedia);
    }

    // Upload new media (has file object, not restored)
    const newMedia = state.mediaItems.filter(item => item.file && !(item as any).isRestored);
    if (newMedia.length > 0) {
      const result = await uploadMedia(draftId, newMedia, getEdits);
      if (result.failed.length > 0) {
        toast.warning(`Draft updated, but ${result.failed.length} new media file(s) failed to upload`);
      }
    }
  }, [state.mediaItems, getDraftFn, deleteDraftMediaFn, uploadMedia, getEdits]);

  const handleSaveDraft = useCallback(async () => {
    // Fix 3.1: Empty draft prevention
    const hasContent = state.caption.trim().length > 0 || state.mediaItems.length > 0;
    if (!hasContent) { toast.error('Add a caption or media to save a draft'); return; }
    if (!state.currentDraftId && !canCreateDraft) { toast.error('Maximum drafts reached'); return; }
    setIsSavingDraft(true);
    try {
      if (state.currentDraftId) {
        // UPDATE existing draft
        const success = await updateDraftFn(state.currentDraftId, draftSaveInput);
        if (!success) { toast.error('Failed to update draft'); return; }
        await syncDraftMedia(state.currentDraftId);
        toast.success('Draft updated');
        analyticsEvents.track('draft_saved', { media_count: state.mediaItems.length, has_course: state.selectedCourses.length > 0, is_update: true });
      } else {
        // CREATE new draft
        const draft = await createDraft(draftSaveInput);
        if (draft?.id && state.mediaItems.length > 0) {
          const mediaWithFiles = state.mediaItems.filter(item => item.file);
          if (mediaWithFiles.length > 0) {
            const result = await uploadMedia(draft.id, mediaWithFiles, getEdits);
            if (result.failed.length > 0) {
              toast.warning(`Draft saved, but ${result.failed.length} media file(s) failed to upload`);
              return;
            }
          }
        }
        toast.success('Draft saved');
        analyticsEvents.track('draft_saved', { media_count: state.mediaItems.length, has_course: state.selectedCourses.length > 0, is_update: false });
      }
    } catch { toast.error('Failed to save draft'); } finally { setIsSavingDraft(false); }
  }, [state, canCreateDraft, createDraft, updateDraftFn, uploadMedia, getEdits, draftSaveInput, syncDraftMedia]);

  const handleSaveDraftAndClose = useCallback(async () => {
    // Fix 3.1: Empty draft prevention
    const hasContent = state.caption.trim().length > 0 || state.mediaItems.length > 0;
    if (!hasContent) { toast.error('Add a caption or media to save a draft'); return; }
    if (!state.currentDraftId && !canCreateDraft) { toast.error('Maximum drafts reached'); return; }
    setIsSavingDraft(true);
    try {
      if (state.currentDraftId) {
        // UPDATE existing draft
        const success = await updateDraftFn(state.currentDraftId, draftSaveInput);
        if (!success) { toast.error('Failed to update draft'); return; }
        await syncDraftMedia(state.currentDraftId);
        toast.success('Draft updated');
        analyticsEvents.track('draft_saved', { media_count: state.mediaItems.length, has_course: state.selectedCourses.length > 0, is_update: true });
      } else {
        // CREATE new draft
        const draft = await createDraft(draftSaveInput);
        if (draft?.id && state.mediaItems.length > 0) {
          const mediaWithFiles = state.mediaItems.filter(item => item.file);
          if (mediaWithFiles.length > 0) {
            const result = await uploadMedia(draft.id, mediaWithFiles, getEdits);
            if (result.failed.length > 0) {
              toast.warning(`Draft saved, but ${result.failed.length} file(s) failed`);
              setShowCloseConfirm(false);
              onClose();
              return;
            }
          }
        }
        toast.success('Draft saved');
        analyticsEvents.track('draft_saved', { media_count: state.mediaItems.length, has_course: state.selectedCourses.length > 0, is_update: false });
      }
      setShowCloseConfirm(false);
      onClose();
    } catch { toast.error("Couldn't save draft"); } finally { setIsSavingDraft(false); }
  }, [state, canCreateDraft, createDraft, updateDraftFn, uploadMedia, getEdits, onClose, draftSaveInput, syncDraftMedia]);

  // Success handlers
  const handleViewPost = useCallback(() => { onClose(); navigate('/clubhouse'); }, [onClose, navigate]);
  const handleCreateAnother = useCallback(() => { reset(); setShowSuccess(false); }, [reset]);
  const handleSuccessDone = useCallback(() => { onClose(); }, [onClose]);
  const handleLeaveReview = useCallback((course: { id: string; name: string; country: string; region?: string }) => {
    const mediaFiles = state.mediaItems.map(item => item.file).filter(Boolean) as File[];
    onRequestReview?.(course, mediaFiles);
    onClose();
  }, [onClose, onRequestReview, state.mediaItems]);

  // Studio handlers
  const handleOpenStudio = useCallback((mediaId: string) => {
    setActiveMediaId(mediaId);
    setShowStudio(true);
    setPreviewMediaIndex(null);
  }, [setActiveMediaId]);

  const handleCloseStudio = useCallback(() => {
    setShowStudio(false);
    setStudioTool('filter');
    setActiveOverlayId(null);
  }, []);

  // Derive the active media item for studio
  const activeStudioItem = showStudio
    ? state.mediaItems.find(m => m.id === state.activeMediaId)
    : null;

  // Current edits for the active media item
  const activeStudioEdits: StudioEdits = state.activeMediaId
    ? (state.studioEditsByMediaId[state.activeMediaId] || {})
    : {};

  const handleUpdateStudioEdits = useCallback((patch: Partial<StudioEdits>) => {
    if (!state.activeMediaId) return;
    const current = state.studioEditsByMediaId[state.activeMediaId] || {};
    setStudioEdits(state.activeMediaId, { ...current, ...patch });
  }, [state.activeMediaId, state.studioEditsByMediaId, setStudioEdits]);

  const handleClearStudioEdits = useCallback(() => {
    if (!state.activeMediaId) return;
    setStudioEdits(state.activeMediaId, {} as StudioEdits);
  }, [state.activeMediaId, setStudioEdits]);

  // Actor display info
  const actorDisplayInfo = useMemo(() => {
    if (state.actor.type === 'personal' && personalActor) {
      return { name: personalActor.name, avatarUrl: personalActor.avatarUrl };
    }
    const business = businessActors?.find(b => b.id === state.actor.id);
    if (business) return { name: business.name, avatarUrl: business.avatarUrl };
    return { name: 'You', avatarUrl: undefined };
  }, [state.actor, personalActor, businessActors]);

  const selectedActorForSheet = useMemo(() => {
    return availableActors.find(a => a.id === state.actor.id) || null;
  }, [availableActors, state.actor.id]);

  // Visibility label
  const visibilityLabel = state.visibility === 'anyone' ? 'Anyone' : state.visibility === 'followers' ? 'Followers' : 'Private';

  // Can post
  const canPost = (state.mediaItems.length > 0 || state.isEditMode) && !state.isSubmitting && !!user;

  if (!isOpen) return null;

  return createPortal(
    <ErrorBoundary
      fallback={
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center pt-safe pb-safe">
          <div className="text-center p-6 max-w-sm">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-6">Please try again.</p>
            <button onClick={onClose} className="w-full px-4 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors">
              Close
            </button>
          </div>
        </div>
      }
    >
      <div
        className="light fixed inset-0 z-[9999] flex flex-col overflow-hidden"
        style={{ backgroundColor: '#F8FAFC', touchAction: 'pan-y pinch-zoom', overscrollBehavior: 'contain' }}
      >
        {showSuccess ? (
          <PostSuccessScreen
            isScheduled={!!state.scheduledAt}
            scheduledAt={state.scheduledAt}
            firstMediaUrl={state.mediaItems[0]?.previewUrl || null}
            firstMediaType={state.mediaItems[0]?.type || 'image'}
            mediaCount={state.mediaItems.length}
            onViewPost={handleViewPost}
            onCreateAnother={handleCreateAnother}
            onDone={handleSuccessDone}
            taggedCourse={state.selectedCourses[0] || null}
            onLeaveReview={onRequestReview ? handleLeaveReview : undefined}
            isBusinessActor={state.actor.type === 'business'}
          />
        ) : (
          <>
            {/* Header */}
            <PostWizardHeader
              onClose={handleClose}
              onPost={handleSubmit}
              canPost={canPost}
              isSubmitting={state.isSubmitting}
              isEditMode={state.isEditMode}
              isScheduled={!!state.scheduledAt}
              isDirty={state.isDirty}
              onOpenSchedule={() => setShowScheduleSheet(true)}
            />

            {/* Scrollable Composer */}
            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6" style={{ scrollbarWidth: 'none' }}>
              <div className="flex items-start gap-3 max-w-[680px] mx-auto">
                {/* Avatar */}
                <SquircleAvatar
                  size={40}
                  src={actorDisplayInfo.avatarUrl}
                  alt={actorDisplayInfo.name || 'You'}
                  fallback={actorDisplayInfo.name?.[0]?.toUpperCase() || 'U'}
                  hideRing
                  className="mt-0.5"
                />

                {/* Compose area */}
                <div className="flex-1 min-w-0 flex flex-col gap-3.5">
                  {/* User info + audience pill */}
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold tracking-tight" style={{ color: '#1A1A1A' }}>
                      {actorDisplayInfo.name || 'You'}
                    </span>
                    <button
                      onClick={() => setShowProfileSelector(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[12px] font-medium active:scale-[0.95] active:bg-[rgba(245,158,11,0.05)] transition-all"
                      style={{ borderColor: 'rgba(0,0,0,0.07)', color: '#d97706' }}
                    >
                      <Globe className="w-3 h-3" style={{ color: '#f59e0b' }} />
                      <span>{visibilityLabel}</span>
                      <ChevronDown className="w-2.5 h-2.5 opacity-55" style={{ color: '#f59e0b' }} />
                    </button>
                  </div>

                  {/* Rich Caption Input (contentEditable with inline mentions) */}
                  <RichCaptionInput
                    ref={captionInputRef}
                    value={state.caption}
                    onChange={handleCaptionChange}
                    mentions={state.selectedTags}
                    onMentionsChanged={(surviving) => {
                      setTags(surviving);
                    }}
                    onCursorChange={handleCursorChange}
                    onMentionQueryChange={handleMentionQueryChange}
                    placeholder="Share your moment..."
                    maxLength={POST_LIMITS.MAX_CAPTION_LENGTH}
                    accentColor="#f59e0b"
                  />

                  {/* Media Zone */}
                  <div>
                    {state.mediaItems.length === 0 ? (
                      <button
                        onClick={() => handleAddMedia()}
                        className="w-full flex flex-col items-center justify-center gap-2 py-7 rounded-2xl cursor-pointer transition-all active:scale-[0.985] active:bg-[rgba(245,158,11,0.04)]"
                        style={{ border: '1.5px dashed rgba(245,158,11,0.25)' }}
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.10)' }}>
                          <Image className="w-[19px] h-[19px]" style={{ color: '#f59e0b' }} />
                        </div>
                        <span className="text-[13px] font-medium tracking-tight" style={{ color: '#AEAEB2' }}>
                          Add photo or video
                        </span>
                      </button>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                        {state.mediaItems.map((item, index) => (
                          <MediaThumbnail
                            key={item.id}
                            item={item}
                            index={index}
                            isCover={index === state.coverIndex}
                            totalItems={state.mediaItems.length}
                            hasStudioEdits={hasNonEmptyStudioEdits(state.studioEditsByMediaId[item.id])}
                            studioEdits={state.studioEditsByMediaId[item.id]}
                            onRemove={() => removeMedia(item.id)}
                            onExpand={() => setPreviewMediaIndex(index)}
                            onStudio={() => handleOpenStudio(item.id)}
                            onSetCover={() => setCoverIndex(index)}
                            isViewerOpen={previewMediaIndex !== null}
                          />
                        ))}
                        {state.mediaItems.length < POST_LIMITS.MAX_MEDIA_COUNT && (
                          <button
                            onClick={() => handleAddMedia()}
                            className="flex-shrink-0 w-[160px] h-[160px] rounded-2xl flex items-center justify-center active:scale-[0.96] transition-transform"
                            style={{ border: '1.5px dashed rgba(245,158,11,0.25)' }}
                          >
                            <Plus className="w-6 h-6" style={{ color: '#f59e0b' }} />
                          </button>
                        )}
                      </div>
                    )}
                   </div>

                  {/* Media counter */}
                  {state.mediaItems.length > 0 && (
                    <p
                      className="text-[11px] font-medium tabular-nums text-center mt-1"
                      style={{
                        color: state.mediaItems.length >= POST_LIMITS.MAX_MEDIA_COUNT
                          ? '#EF4444'
                          : '#AEAEB2',
                      }}
                    >
                      {state.mediaItems.length}/{POST_LIMITS.MAX_MEDIA_COUNT}
                    </p>
                  )}

                  {state.selectedCourses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {state.selectedCourses.map((course) => (
                        <span
                          key={course.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium"
                          style={{ background: 'rgba(245,158,11,0.10)', color: '#92400e' }}
                        >
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{course.name}</span>
                          <button onClick={() => removeCourse(course.id)} className="ml-0.5 flex-shrink-0">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Toolbar */}
            <div
              className="flex-shrink-0 flex items-center justify-between px-5 pt-2.5"
              style={{
                borderTop: '0.5px solid rgba(0,0,0,0.07)',
                paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 28px)',
              }}
            >
              <div className="flex items-center gap-0.5">
                <ToolButton icon={Image} onClick={() => handleAddMedia('gallery')} label="Photo" />
                <ToolButton icon={Camera} onClick={() => handleAddMedia('camera')} label="Camera" />
                <div className="relative">
                  <ToolButton icon={MapPin} onClick={() => { dismissCourseTooltip(); setShowCourseSearch(true); }} label="Tag Course" />
                  <ToolbarTooltipBubble text="Tag a golf course" visible={showCourseTooltip} />
                </div>
                <div className="relative">
                  <ToolButton icon={UserPlus} onClick={() => { dismissFriendsTooltip(); setShowTagPeople(true); }} label="Tag Friends" />
                  <ToolbarTooltipBubble text="Tag friends or businesses" visible={showFriendsTooltip} />
                </div>
                {/* Drafts button */}
                <div className="relative">
                  <ToolButton icon={FileText} onClick={() => setShowDraftsSheet(true)} label="Drafts" />
                  {drafts.length > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-[10px] font-bold text-white pointer-events-none"
                      style={{ background: '#f59e0b' }}
                    >
                      {drafts.length}
                    </span>
                  )}
                </div>
              </div>
              <CharacterRing current={countGraphemes(state.caption)} max={POST_LIMITS.MAX_CAPTION_LENGTH} />
            </div>

            {/* === OVERLAYS === */}

            {/* Discard Action Sheet */}
            <DiscardActionSheet
              open={showCloseConfirm}
              onDiscard={confirmClose}
              onSaveToDrafts={handleSaveDraftAndClose}
              onKeepEditing={() => setShowCloseConfirm(false)}
              isSaving={isSavingDraft}
              canSaveDraft={canCreateDraft}
            />

            {/* Profile Selector */}
            <PostingOptionsSheet
              isOpen={showProfileSelector}
              onClose={() => setShowProfileSelector(false)}
              selectedActor={selectedActorForSheet}
              availableActors={availableActors}
              onActorChange={handleActorChange}
              visibility={state.visibility}
              onVisibilityChange={handleVisibilityChange}
            />

            {/* Course Search */}
            <CourseSearchSheetBoundary
              isOpen={showCourseSearch}
              onClose={() => setShowCourseSearch(false)}
              onSelectCourse={handleCourseSelect}
              userId={state.actor.id || undefined}
              existingCourseIds={state.selectedCourses.map(c => c.id).filter(Boolean)}
            />

            {/* Drafts & Scheduled */}
            <DraftsAndScheduledSheet
              isOpen={showDraftsSheet}
              onClose={() => { setShowDraftsSheet(false); setPendingDraftToLoad(null); }}
              onLoadDraft={handleLoadDraft}
              onEditScheduledPost={handleEditScheduledPost}
              onSaveDraft={handleSaveDraft}
              canSaveDraft={canCreateDraft && state.isDirty}
              pendingOverwriteDraft={pendingDraftToLoad}
              onConfirmOverwrite={confirmLoadDraft}
              onCancelOverwrite={() => setPendingDraftToLoad(null)}
            />

            {/* Schedule Sheet */}
            <ScheduleSheet
              isOpen={showScheduleSheet}
              onClose={() => setShowScheduleSheet(false)}
              onSchedule={handleScheduleSelect}
              initialDate={state.scheduledAt ?? undefined}
            />

            {/* Mention suggestions */}
            <MentionBottomSheet
              open={showMentions}
              onOpenChange={setShowMentions}
              query={mentionQuery}
              onSelect={handleMentionSelect}
              bottomOffset={keyboardHeight}
            />

            {/* Tag People Sheet */}
            <AnimatePresence>
              {showTagPeople && (
                <TagPeopleSheet
                  isOpen={showTagPeople}
                  onClose={() => setShowTagPeople(false)}
                  selectedTags={state.selectedTags}
                  bottomOffset={keyboardHeight}
                  onTagsChange={(newTags) => {
                    const newlyAdded = newTags.filter(t => !state.selectedTags.some(p => p.id === t.id));
                    let appendText = '';
                    newlyAdded.forEach(tag => {
                      const mentionText = (tag.username || tag.name).replace(/\s+/g, '');
                      appendText += ` @${mentionText}`;
                    });

                    const removed = state.selectedTags.filter(t => !newTags.some(n => n.id === t.id));
                    let currentCaption = state.caption + appendText;
                    removed.forEach(tag => {
                      const mentionText = `@${(tag.username || tag.name).replace(/\s+/g, '')}`;
                      const escapeRegex = mentionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                      const removeRegex = new RegExp(`\\s*${escapeRegex}`, 'gi');
                      currentCaption = currentCaption.replace(removeRegex, '');
                    });
                    currentCaption = currentCaption.trim();

                    setCaption(currentCaption);
                    setTags(newTags);
                    setShowTagPeople(false);
                  }}
                  accentColor="#f59e0b"
                />
              )}
            </AnimatePresence>

            {/* Studio Shelf */}
            {showStudio && activeStudioItem && (
              <StudioShelf
                open={showStudio}
                onClose={handleCloseStudio}
                activeTool={studioTool}
                setActiveTool={setStudioTool}
                activeMediaId={activeStudioItem.id}
                activeMediaType={activeStudioItem.type}
                activeMediaPreviewUrl={activeStudioItem.previewUrl}
                activeMediaThumbnailUrl={activeStudioItem.thumbnailUrl || null}
                edits={activeStudioEdits}
                updateEdits={handleUpdateStudioEdits}
                clearEdits={handleClearStudioEdits}
                activeOverlayId={activeOverlayId}
                onSelectOverlay={setActiveOverlayId}
              />
            )}
          </>
        )}
      </div>

      {/* Fullscreen Media Preview Viewer — rendered OUTSIDE overflow-hidden container */}
      <AnimatePresence>
        {previewMediaIndex !== null && (
          <MediaPreviewViewer
            items={state.mediaItems}
            initialIndex={previewMediaIndex}
            onClose={() => setPreviewMediaIndex(null)}
            onStudio={handleOpenStudio}
            coverIndex={state.coverIndex}
            onSetCover={(index) => setCoverIndex(index)}
            studioEditsByMediaId={state.studioEditsByMediaId}
            onTrimChange={handleTrimChange}
            onPosterTimestampChange={handlePosterTimestampChange}
          />
        )}
      </AnimatePresence>
    </ErrorBoundary>,
    document.body
  );
}

export default PostWizard;
