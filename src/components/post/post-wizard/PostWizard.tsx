// Post Wizard - Cinematic Media-First Composer
// Single-screen composer with full-bleed hero media and overlay caption.
// State engine (usePostWizard), upload pipeline, and all services are unchanged.

import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import StudioShelf from '@/components/studio/StudioShelf';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { StudioTool, StudioEdits } from '@/types/studio';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, RefreshCw, Image, Camera, MapPin, UserPlus, Plus, Globe, ChevronDown, ChevronRight, Clock, FileText, Play } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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
import { getFilterClass } from '@/utils/studioFilters';
import { getRotateStyle } from '@/utils/studioEdit';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { cn } from '@/lib/utils';

// New extracted components
import { ToolButton } from './components/ToolButton';
import { CharacterRing } from './components/CharacterRing';
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

  // Caption focus state
  const [captionFocused, setCaptionFocused] = useState(false);

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

  // Hero active media index (for carousel)
  const [heroIndex, setHeroIndex] = useState(0);

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
      setHeroIndex(0);
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

  // Keep heroIndex in bounds
  useEffect(() => {
    if (heroIndex >= state.mediaItems.length && state.mediaItems.length > 0) {
      setHeroIndex(state.mediaItems.length - 1);
    }
  }, [state.mediaItems.length, heroIndex]);

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
        if (state.scheduledAt) {
          updatePayload.scheduled_at = state.scheduledAt.toISOString();
          updatePayload.status = 'scheduled';
        } else {
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

        await supabase.from('post_courses').delete().eq('post_id', state.editPostId);
        if (state.selectedCourses.length > 0) {
          const courseRows = state.selectedCourses.map((course, index) => ({
            post_id: state.editPostId!,
            course_id: course.id,
            display_order: index,
          }));
          await supabase.from('post_courses').insert(courseRows);
        }

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

      if (state.currentDraftId) {
        try {
          await deleteDraftFn(state.currentDraftId);
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

  // Sync media for draft updates
  const syncDraftMedia = useCallback(async (draftId: string) => {
    const existingDraft = await getDraftFn(draftId);
    const existingMedia = existingDraft?.media || [];
    const existingMediaIds = new Set(existingMedia.map(m => m.id));
    const currentRestoredIds = new Set(
      state.mediaItems
        .filter(item => (item as any).isRestored && item.id)
        .map(item => item.id)
    );
    const removedMedia = existingMedia.filter(m => !currentRestoredIds.has(m.id));
    for (const removed of removedMedia) {
      await deleteDraftMediaFn(removed.id);
    }
    if (removedMedia.length > 0) {
      const { cleanupDraftMedia } = await import('@/services/drafts/draftMediaUpload');
      await cleanupDraftMedia(removedMedia);
    }
    const newMedia = state.mediaItems.filter(item => item.file && !(item as any).isRestored);
    if (newMedia.length > 0) {
      const result = await uploadMedia(draftId, newMedia, getEdits);
      if (result.failed.length > 0) {
        toast.warning(`Draft updated, but ${result.failed.length} new media file(s) failed to upload`);
      }
    }
  }, [state.mediaItems, getDraftFn, deleteDraftMediaFn, uploadMedia, getEdits]);

  const handleSaveDraft = useCallback(async () => {
    const hasContent = state.caption.trim().length > 0 || state.mediaItems.length > 0;
    if (!hasContent) { toast.error('Add a caption or media to save a draft'); return; }
    if (!state.currentDraftId && !canCreateDraft) { toast.error('Maximum drafts reached'); return; }
    setIsSavingDraft(true);
    try {
      if (state.currentDraftId) {
        const success = await updateDraftFn(state.currentDraftId, draftSaveInput);
        if (!success) { toast.error('Failed to update draft'); return; }
        await syncDraftMedia(state.currentDraftId);
        toast.success('Draft updated');
        analyticsEvents.track('draft_saved', { media_count: state.mediaItems.length, has_course: state.selectedCourses.length > 0, is_update: true });
      } else {
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
    const hasContent = state.caption.trim().length > 0 || state.mediaItems.length > 0;
    if (!hasContent) { toast.error('Add a caption or media to save a draft'); return; }
    if (!state.currentDraftId && !canCreateDraft) { toast.error('Maximum drafts reached'); return; }
    setIsSavingDraft(true);
    try {
      if (state.currentDraftId) {
        const success = await updateDraftFn(state.currentDraftId, draftSaveInput);
        if (!success) { toast.error('Failed to update draft'); return; }
        await syncDraftMedia(state.currentDraftId);
        toast.success('Draft updated');
        analyticsEvents.track('draft_saved', { media_count: state.mediaItems.length, has_course: state.selectedCourses.length > 0, is_update: true });
      } else {
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

  const activeStudioItem = showStudio
    ? state.mediaItems.find(m => m.id === state.activeMediaId)
    : null;

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

  const visibilityLabel = state.visibility === 'anyone' ? 'Anyone' : state.visibility === 'followers' ? 'Followers' : 'Private';

  const canPost = (state.mediaItems.length > 0 || state.isEditMode) && !state.isSubmitting && !!user;

  const captionGraphemeCount = countGraphemes(state.caption);

  const hasMedia = state.mediaItems.length > 0;

  // Hero swipe handling
  const heroRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const handleHeroTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleHeroTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0 && heroIndex < state.mediaItems.length - 1) {
        setHeroIndex(prev => prev + 1);
      } else if (dx > 0 && heroIndex > 0) {
        setHeroIndex(prev => prev - 1);
      }
    }
  }, [heroIndex, state.mediaItems.length]);

  // Get hero media item with studio edits
  const heroItem = state.mediaItems[heroIndex];
  const heroEdits = heroItem ? state.studioEditsByMediaId[heroItem.id] : undefined;
  const heroFilterClass = heroEdits?.filter && heroEdits.filter !== 'normal' ? getFilterClass(heroEdits.filter) : '';
  const heroTransforms: string[] = [];
  if (heroEdits?.rotate) heroTransforms.push(`rotate(${heroEdits.rotate}deg)`);
  if (heroEdits?.flipH) heroTransforms.push('scaleX(-1)');
  if (heroEdits?.flipV) heroTransforms.push('scaleY(-1)');
  const heroTransformStyle: React.CSSProperties = heroTransforms.length > 0
    ? { transform: heroTransforms.join(' '), transformOrigin: 'center' }
    : {};

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
        style={{ backgroundColor: 'var(--bg-page)', touchAction: 'pan-y pinch-zoom', overscrollBehavior: 'contain' }}
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
              avatarUrl={actorDisplayInfo.avatarUrl}
              actorName={actorDisplayInfo.name}
              visibilityLabel={visibilityLabel}
              onAudienceClick={() => setShowProfileSelector(true)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <AnimatePresence mode="wait">
                {!hasMedia ? (
                  /* ========== EMPTY STATE: Cinematic Canvas ========== */
                  <motion.div
                    key="empty-canvas"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col"
                    style={{ padding: '12px 16px 0' }}
                  >
                    {/* Canvas tap target */}
                    <button
                      onClick={() => handleAddMedia()}
                      className="flex-1 flex flex-col items-center justify-center relative overflow-hidden transition-all active:brightness-105"
                      style={{
                        borderRadius: '24px',
                        background: 'linear-gradient(145deg, rgba(245,158,11,0.03) 0%, rgba(245,158,11,0.08) 50%, rgba(245,158,11,0.03) 100%)',
                        border: '1px solid rgba(245,158,11,0.08)',
                        minHeight: '300px',
                      }}
                    >
                      {/* Shimmer overlay */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'linear-gradient(110deg, transparent 30%, rgba(245,158,11,0.04) 50%, transparent 70%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer-sweep 7s ease-in-out infinite',
                        }}
                      />

                      {/* Icon */}
                      <div
                        className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
                        }}
                      >
                        <Image className="w-8 h-8" style={{ color: '#f59e0b' }} />
                      </div>
                      <p
                        className="mt-4 text-[20px] font-bold text-foreground"
                        style={{ letterSpacing: '-0.02em' }}
                      >
                        Create your moment
                      </p>
                      <p className="mt-1.5 text-[14px] text-muted-foreground">
                        Add photos and videos to get started
                      </p>
                    </button>

                    {/* Subtle caption below canvas */}
                    <div style={{ padding: '8px 4px 12px' }}>
                      <span
                        className="text-[14px]"
                        style={{ color: 'hsl(var(--muted-foreground) / 0.25)' }}
                      >
                        Add a caption…
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  /* ========== MEDIA ADDED STATE: Cinematic Hero ========== */
                  <motion.div
                    key="media-layout"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col"
                  >
                    {/* Hero Image */}
                    <div
                      ref={heroRef}
                      className="relative w-full overflow-hidden"
                      style={{
                        aspectRatio: '4/3',
                        borderRadius: '0 0 24px 24px',
                        background: '#111',
                      }}
                      onTouchStart={handleHeroTouchStart}
                      onTouchEnd={handleHeroTouchEnd}
                    >
                      {/* Hero media */}
                      <AnimatePresence mode="wait">
                        {heroItem && (
                          <motion.div
                            key={heroItem.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0"
                          >
                            {heroItem.type === 'video' ? (
                              <>
                                <img
                                  src={heroItem.thumbnailUrl || heroItem.previewUrl}
                                  className={cn('w-full h-full object-cover', heroFilterClass)}
                                  style={heroTransformStyle}
                                  alt=""
                                />
                                {/* Play button overlay */}
                                <button
                                  onClick={() => setPreviewMediaIndex(heroIndex)}
                                  className="absolute inset-0 flex items-center justify-center z-[2]"
                                >
                                  <div
                                    className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
                                    style={{
                                      background: 'rgba(255,255,255,0.2)',
                                      backdropFilter: 'blur(20px)',
                                      border: '1px solid rgba(255,255,255,0.3)',
                                    }}
                                  >
                                    <Play className="w-[22px] h-[22px] text-white ml-0.5" fill="white" />
                                  </div>
                                </button>
                              </>
                            ) : (
                              <img
                                src={heroItem.previewUrl}
                                className={cn('w-full h-full object-cover', heroFilterClass)}
                                style={heroTransformStyle}
                                alt=""
                                onClick={() => setPreviewMediaIndex(heroIndex)}
                              />
                            )}

                            {/* Text overlays */}
                            {heroEdits?.textOverlays && heroEdits.textOverlays.length > 0 && (
                              <TextOverlayRenderer
                                textOverlays={heroEdits.textOverlays}
                                isEditable={false}
                                safeAreaContext="feed"
                              />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Dot indicators at top */}
                      {state.mediaItems.length > 1 && (
                        <div className="absolute top-3 left-0 right-0 z-[3] flex items-center justify-center gap-1">
                          {state.mediaItems.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setHeroIndex(i)}
                              className="transition-all duration-200"
                              style={{
                                width: i === heroIndex ? '18px' : '5px',
                                height: '5px',
                                borderRadius: '3px',
                                background: i === heroIndex ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                              }}
                              aria-label={`Go to media ${i + 1}`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Dark gradient at bottom */}
                      <div
                        className="absolute bottom-0 left-0 right-0 z-[2] pointer-events-none"
                        style={{
                          height: '50%',
                          background: captionFocused
                            ? 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 40%, transparent 100%)'
                            : 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)',
                          transition: 'background 0.2s ease',
                        }}
                      />

                      {/* Caption overlay on hero */}
                      <div
                        className="absolute bottom-0 left-0 right-0 z-[3]"
                        style={{ padding: '16px 18px 18px' }}
                      >
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
                          placeholder="Add a caption…"
                          maxLength={POST_LIMITS.MAX_CAPTION_LENGTH}
                          accentColor="#f59e0b"
                          onFocusChange={setCaptionFocused}
                          overlayMode
                        />

                        {/* Character counter */}
                        <p
                          className="text-[11px] font-semibold tabular-nums text-right mt-1 transition-opacity duration-200"
                          style={{
                            color: captionGraphemeCount > POST_LIMITS.MAX_CAPTION_LENGTH * 0.95
                              ? '#EF4444'
                              : 'rgba(255,255,255,0.35)',
                            opacity: captionGraphemeCount > 0 ? 1 : 0,
                            pointerEvents: 'none',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {captionGraphemeCount > 0 ? `${captionGraphemeCount}/${POST_LIMITS.MAX_CAPTION_LENGTH}` : '\u00A0'}
                        </p>
                      </div>
                    </div>

                    {/* Thumbnail Strip */}
                    <div
                      className="flex items-center gap-2"
                      style={{ padding: '12px 16px 4px', overflowX: 'auto', scrollbarWidth: 'none' }}
                    >
                      {state.mediaItems.map((item, index) => {
                        const edits = state.studioEditsByMediaId[item.id];
                        const filterCls = edits?.filter && edits.filter !== 'normal' ? getFilterClass(edits.filter) : '';
                        const tforms: string[] = [];
                        if (edits?.rotate) tforms.push(`rotate(${edits.rotate}deg)`);
                        if (edits?.flipH) tforms.push('scaleX(-1)');
                        if (edits?.flipV) tforms.push('scaleY(-1)');
                        const tStyle: React.CSSProperties = tforms.length > 0 ? { transform: tforms.join(' '), transformOrigin: 'center' } : {};
                        const isActive = index === heroIndex;

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.25, delay: index * 0.05 }}
                            className="relative flex-shrink-0 overflow-hidden"
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '10px',
                              border: isActive ? '2.5px solid #f59e0b' : '2px solid rgba(0,0,0,0.06)',
                              transform: isActive ? 'scale(1.02)' : 'scale(1)',
                              transition: 'border 0.2s, transform 0.2s',
                            }}
                          >
                            {/* Thumbnail image */}
                            <button
                              onClick={() => setHeroIndex(index)}
                              className="w-full h-full"
                            >
                              <img
                                src={item.thumbnailUrl || item.previewUrl}
                                className={cn('w-full h-full object-cover', filterCls)}
                                style={tStyle}
                                alt=""
                              />
                            </button>

                            {/* Video play icon */}
                            {item.type === 'video' && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <Play className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.9)' }} fill="rgba(255,255,255,0.9)" />
                              </div>
                            )}

                            {/* COVER badge on first */}
                            {index === 0 && (
                              <div
                                className="absolute bottom-[3px] left-1/2 -translate-x-1/2 pointer-events-none"
                                style={{
                                  background: '#f59e0b',
                                  color: '#FFFFFF',
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  lineHeight: '1',
                                }}
                              >
                                COVER
                              </div>
                            )}

                            {/* X remove */}
                            <button
                              onClick={(e) => { e.stopPropagation(); removeMedia(item.id); }}
                              className="absolute top-[3px] right-[3px] z-[2] w-[18px] h-[18px] rounded-full flex items-center justify-center"
                              style={{ background: 'rgba(0,0,0,0.5)' }}
                              aria-label="Remove"
                            >
                              <X className="w-[10px] h-[10px] text-white" />
                            </button>
                          </motion.div>
                        );
                      })}

                      {/* [+] Add more tile */}
                      {state.mediaItems.length < POST_LIMITS.MAX_MEDIA_COUNT && (
                        <button
                          onClick={() => handleAddMedia()}
                          className="flex-shrink-0 flex items-center justify-center active:scale-95 transition-transform"
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '10px',
                            border: '1.5px dashed rgba(245,158,11,0.2)',
                            background: 'rgba(245,158,11,0.08)',
                          }}
                        >
                          <Plus className="w-5 h-5" style={{ color: '#f59e0b' }} />
                        </button>
                      )}

                      {/* Counter */}
                      <span
                        className="flex-shrink-0 text-[11px] font-semibold text-muted-foreground"
                        style={{ fontVariantNumeric: 'tabular-nums', marginLeft: '4px' }}
                      >
                        {state.mediaItems.length}/{POST_LIMITS.MAX_MEDIA_COUNT}
                      </span>
                    </div>

                    {/* Metadata Pills */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: 0.15 }}
                      className="flex items-center gap-2"
                      style={{ padding: '8px 16px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}
                    >
                      {/* Course pills */}
                      {state.selectedCourses.length > 0 ? (
                        <>
                          {state.selectedCourses.map(course => (
                            <button
                              key={course.id}
                              onClick={() => removeCourse(course.id)}
                              className="flex-shrink-0 flex items-center gap-1.5 rounded-full transition-all active:scale-95"
                              style={{
                                padding: '7px 14px',
                                background: 'rgba(245,158,11,0.08)',
                                border: '1px solid rgba(245,158,11,0.2)',
                              }}
                            >
                              <MapPin className="w-[13px] h-[13px] flex-shrink-0" style={{ color: '#f59e0b' }} />
                              <span className="text-[12px] font-semibold text-foreground truncate max-w-[120px]">{course.name}</span>
                              <X className="w-3 h-3 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }} />
                            </button>
                          ))}
                          {/* Add more course pill */}
                          <button
                            onClick={() => setShowCourseSearch(true)}
                            className="flex-shrink-0 flex items-center gap-1.5 rounded-full active:scale-95 transition-transform"
                            style={{
                              padding: '7px 14px',
                              background: 'rgba(0,0,0,0.03)',
                              border: '1px solid rgba(0,0,0,0.06)',
                            }}
                          >
                            <MapPin className="w-[13px] h-[13px] flex-shrink-0" style={{ color: '#f59e0b' }} />
                            <Plus className="w-3 h-3" style={{ color: '#f59e0b' }} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setShowCourseSearch(true)}
                          className="flex-shrink-0 flex items-center gap-1.5 rounded-full active:scale-95 transition-transform"
                          style={{
                            padding: '7px 14px',
                            background: 'rgba(0,0,0,0.03)',
                            border: '1px solid rgba(0,0,0,0.06)',
                          }}
                        >
                          <MapPin className="w-[13px] h-[13px] flex-shrink-0" style={{ color: '#f59e0b' }} />
                          <span className="text-[12px] font-medium text-muted-foreground">Tag course</span>
                        </button>
                      )}

                      {/* People pills */}
                      {state.selectedTags.length > 0 ? (
                        <>
                          <button
                            onClick={() => setShowTagPeople(true)}
                            className="flex-shrink-0 flex items-center gap-1.5 rounded-full active:scale-95 transition-transform"
                            style={{
                              padding: '7px 14px',
                              background: 'rgba(245,158,11,0.08)',
                              border: '1px solid rgba(245,158,11,0.2)',
                            }}
                          >
                            <UserPlus className="w-[13px] h-[13px] flex-shrink-0" style={{ color: '#f59e0b' }} />
                            {/* Facepile */}
                            <div className="flex items-center" style={{ marginLeft: 0 }}>
                              {state.selectedTags.slice(0, 3).map((tag, i) => (
                                <div
                                  key={tag.id}
                                  className="rounded-full overflow-hidden flex-shrink-0"
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    marginLeft: i === 0 ? 0 : '-6px',
                                    zIndex: 3 - i,
                                    border: '1.5px solid white',
                                  }}
                                >
                                  {tag.avatar_url ? (
                                    <img src={tag.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                                      {tag.name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            <span className="text-[12px] font-semibold text-foreground">{state.selectedTags.length} tagged</span>
                            <X
                              className="w-3 h-3 flex-shrink-0"
                              style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Remove all tags from caption
                                let newCaption = state.caption;
                                state.selectedTags.forEach(tag => {
                                  const mentionText = `@${(tag.username || tag.name).replace(/\s+/g, '')}`;
                                  const escapeRegex = mentionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                  const removeRegex = new RegExp(`\\s*${escapeRegex}`, 'gi');
                                  newCaption = newCaption.replace(removeRegex, '');
                                });
                                setCaption(newCaption.trim());
                                setTags([]);
                              }}
                            />
                          </button>
                          {/* Add more people pill */}
                          <button
                            onClick={() => setShowTagPeople(true)}
                            className="flex-shrink-0 flex items-center gap-1.5 rounded-full active:scale-95 transition-transform"
                            style={{
                              padding: '7px 14px',
                              background: 'rgba(0,0,0,0.03)',
                              border: '1px solid rgba(0,0,0,0.06)',
                            }}
                          >
                            <UserPlus className="w-[13px] h-[13px] flex-shrink-0" style={{ color: '#f59e0b' }} />
                            <Plus className="w-3 h-3" style={{ color: '#f59e0b' }} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setShowTagPeople(true)}
                          className="flex-shrink-0 flex items-center gap-1.5 rounded-full active:scale-95 transition-transform"
                          style={{
                            padding: '7px 14px',
                            background: 'rgba(0,0,0,0.03)',
                            border: '1px solid rgba(0,0,0,0.06)',
                          }}
                        >
                          <UserPlus className="w-[13px] h-[13px] flex-shrink-0" style={{ color: '#f59e0b' }} />
                          <span className="text-[12px] font-medium text-muted-foreground">Tag people</span>
                        </button>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Toolbar */}
            <div
              className="flex-shrink-0 flex items-center px-4 pt-2.5"
              style={{
                borderTop: '0.5px solid hsl(var(--border) / 0.3)',
                paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 28px)',
              }}
            >
              <div className="flex items-center gap-0.5">
                <ToolButton icon={Image} onClick={() => handleAddMedia('gallery')} label="Photo" />
                <ToolButton icon={Camera} onClick={() => handleAddMedia('camera')} label="Camera" />
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
            </div>

            {/* === OVERLAYS === */}

            <DiscardActionSheet
              open={showCloseConfirm}
              onDiscard={confirmClose}
              onSaveToDrafts={handleSaveDraftAndClose}
              onKeepEditing={() => setShowCloseConfirm(false)}
              isSaving={isSavingDraft}
              canSaveDraft={canCreateDraft}
            />

            <PostingOptionsSheet
              isOpen={showProfileSelector}
              onClose={() => setShowProfileSelector(false)}
              selectedActor={selectedActorForSheet}
              availableActors={availableActors}
              onActorChange={handleActorChange}
              visibility={state.visibility}
              onVisibilityChange={handleVisibilityChange}
            />

            <CourseSearchSheetBoundary
              isOpen={showCourseSearch}
              onClose={() => setShowCourseSearch(false)}
              onSelectCourse={handleCourseSelect}
              userId={state.actor.id || undefined}
              existingCourseIds={state.selectedCourses.map(c => c.id).filter(Boolean)}
            />

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

            <ScheduleSheet
              isOpen={showScheduleSheet}
              onClose={() => setShowScheduleSheet(false)}
              onSchedule={handleScheduleSelect}
              initialDate={state.scheduledAt ?? undefined}
            />

            <MentionBottomSheet
              open={showMentions}
              onOpenChange={setShowMentions}
              query={mentionQuery}
              onSelect={handleMentionSelect}
              bottomOffset={keyboardHeight}
            />

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

      {/* Fullscreen Media Preview Viewer */}
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
