// StageComposer - the shell of the P2 Stage composer.
//
// Modes:
//  - Create (default): fresh composer + create_post_v2 flow.
//  - Edit (editPostId): prefill from an existing post + owner-CRUD save.
//    Actor is display-only, schedule row shows only for status='scheduled'.
//  - Draft restore (draftId): fetch the draft row and hydrate the composer
//    the same way the in-composer Drafts sheet does.
//
// ONE SCREEN (phase 3 of BRIEF_THE_UNIFIED_COMPOSER). The post path used to be
// two pages inside this file - media (dark) then words - each drawing its own
// "1 / 2" and "2 / 2" counter beside step 1's "Step 1 of 2". It is now a single
// step 2 under the shared ComposerStepHeader, and page 1's contents live on in
// THE MEDIA SHEET (openMediaIndex): nothing there was rewritten, it was moved.
//
// Owns: header, media rail + media sheet, caption field,
// detail rows, and orchestrates opening / closing every sheet.
// Delegates: state -> useStageComposer, submit -> usePostSubmit,
// drafts -> useDrafts, uploads -> postUploadController (module-level, survives unmount).

import { Button } from '@/components/ui/button';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Pencil, X } from 'lucide-react';
import { useProfileData } from '@/hooks/useProfileData';
import { useComposerActor } from './hooks/useComposerActor';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { setStatusBarStyleColor } from '@/hooks/useMedianStatusBar';
import { applyRouteChrome } from '@/lib/routeChrome';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { POST_COMPOSER_Z } from '@/lib/zLayers';
import { inkWithAlpha } from '@/lib/tokens/surfaces';
import { SURFACE } from '@/lib/tokens/surface';
import { POST_CHANGE_REFUSED } from '@/lib/canManagePost';

import { useStageComposer, MAX_MEDIA, type StageMediaItem } from './hooks/useStageComposer';
import { useTranslation } from 'react-i18next';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { notifyComposerCompleted, useComposerFlowStore } from '@/features/composer-flow/composerFlowStore';
import { postLeadingControl } from '@/features/composer-flow/handoffRules';
import ComposerStepHeader from '@/features/composer-flow/components/ComposerStepHeader';

import { usePostSubmit, type SubmitResult } from './hooks/usePostSubmit';
import { useDrafts } from './hooks/useDrafts';
import { useEditablePost } from '@/hooks/useEditablePost';
import { startPostUpload } from './lib/postUploadController';
import { postContentGate } from './lib/postGate';

import MediaStageV2 from './components/MediaStageV2';
import FramePills from './components/FramePills';
import MediaTray from './components/MediaTray';
import SlideThumb from './components/SlideThumb';
import CaptionField from './components/CaptionField';
import CourseTagSheet from './components/CourseTagSheet';
import ActorSheet from './components/ActorSheet';
import ScheduleSheetV2 from './components/ScheduleSheetV2';
import DraftsSheetV2 from './components/DraftsSheetV2';
import ScheduledPostsSheetV2 from './components/ScheduledPostsSheetV2';

import CoverFrameSheet from './components/CoverFrameSheet';
import AdjustSheet from './components/AdjustSheet';
import PostSuccessV2 from './components/PostSuccessV2';
import BottomSheet from './components/BottomSheet';
import { CT_DARK } from '@/features/_shared/composerTokens';
import { LABEL, DISPLAY_TRACKING } from '@/lib/tokens/type';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import StageLoadingShell from './StageLoadingShell';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { CHIP_GLASS_CLASS } from '@/styles/photoScrim';
import { STATUS_BAR_CANVAS } from '@/lib/tokens/surfaces';
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import { courseWalkHoles } from '@/lib/courseMedia/holeWalk';
import { GolfShotStrip, ShotTagSheet, WhereSection, PlayedWithSection, VisibilitySheet } from './components/golf/GolfPostSections';
import { PostPreview, buildDraftFeedPost } from './components/golf/PostPreview';
import { ShareFooter } from './components/golf/ShareFooter';
import { GP } from './components/golf/golfPageTokens';
import { isHoleTag, roundReason, shareSubLine, toggleWith, visibilityLabel, type PostVisibility, type ShotTag, type WithCandidate } from './lib/golfPostRules';
import { fetchPlayedWithSuggestions, fetchRecentCourses, findRoundCourse, firstCaptureDay, searchMembers } from './lib/golfPostReads';
import { readPostWith, syncPostWith } from './lib/postWith';
import { existingMediaUrl, existingTagFor, readExistingShotTags, rewriteExistingShotTag, type ExistingTags, type ShotTagChoice } from './lib/shotTagWrites';
import { refreshAuthorPosts } from './lib/refreshAuthorPosts';
import {ComposerCourseBlock,ComposerAttachRound,ComposerRoundsSheet} from './components/golf/ComposerGolf';
import {useRoundHoleShapes} from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import {readComposerRounds,readClaimedCourse,readNearbyCourse,readGolfCourse,roundIsRecent} from './lib/composerGolfReads';
import {chooseCourseSource,recentRound,roundDay,roundSuggestionDay,guideVisible,composerDestinations,editorTitleKey,effectiveHoleGuide,ordinal,type ComposerRound,type CourseSuggestion} from './lib/composerGolfRules';
import {loadComposerDraft} from './lib/composerDrafts';
import { isLongFormVideo } from '@/constants/videoRules';
import { emptyVideoDetails, singleVideo, videoDuration, premarkHoles } from './lib/videoDetails';
import { VideoTitleDescription, VideoCoverChapters } from './components/video/VideoComposerFields';
import { VideoDetailsPage } from './components/video/VideoDetailsPage';
import { MarkHolesPage } from './components/video/MarkHolesPage';
import type { RoundVideoContext } from './components/video/RoundVideoFields';

interface Props {
  onClose: () => void;
  onPosted?: () => void;
  onViewPost?: (postId: string, closeTo: string) => void;
  /** Files already chosen by the nav picker before the composer opened. */
  initialMedia?: File[];
  /** Edit mode: existing post id (owner-scoped). */
  editPostId?: string | null;
  /** Draft deep-link: hydrate the composer from this draft. */
  draftId?: string | null;
  /** CB65: actor the opener asked for; honoured only if available (see useComposerActor). */
  initialActorType?: 'personal' | 'business' | null;
  initialActorId?: string | null;
}

export default function StageComposer({ onClose, onPosted, onViewPost, initialMedia = [], editPostId, draftId, initialActorType, initialActorId }: Props) {
  const { profile } = useProfileData();
  const { t } = useTranslation('composer');
  const [scheduleBestHour, setScheduleBestHour] = useState<number | null>(null);

  const { activeActor, selectActor, applyDraftActor } = useComposerActor({ initialActorType, initialActorId, ignoreInitial: !!editPostId || !!draftId });
  const composer = useStageComposer();
  const { state, addFiles, removeAt, reorder, setActiveIndex, updateActive, setCaption, setCourse, setCourses, setScheduledAt, restoreDraft, hydrate, reset, setGolf } = composer;
  const { submit, submitting } = usePostSubmit();
  const drafts = useDrafts(profile?.id);
  const queryClient = useQueryClient();

  const isEditMode = !!editPostId;
  const [videoDetailsOpen, setVideoDetailsOpen] = useState(false);
  const [markHolesOpen, setMarkHolesOpen] = useState(false);
  const videoComposer = singleVideo(state.media, isEditMode);
  const videoItem = videoComposer ? state.media[0] : null;
  const videoData = state.videoData ?? emptyVideoDetails();
  const longVideo = videoItem ? isLongFormVideo(videoDuration(videoItem)) : false;
  const setVideoData = composer.setVideoData;

  // ---- Composer funnel instrumentation -----------------------------------
  // mode is derived from the props the openers set; entry from how it opened.
  const mode: 'create' | 'edit' | 'draft' = editPostId ? 'edit' : (draftId ? 'draft' : 'create');
  const mountedAtRef = useRef<number>(Date.now());
  const submittedRef = useRef(false);
  const captionStartedRef = useRef(false);
  // Read once at mount: a deep-linked open (edit / draft / share-a-round)
  // vs the create sheet.
  const entryRef = useRef<'create_sheet' | 'deep_link' | 'review_skip' | 'unknown'>('unknown');
  if (entryRef.current === 'unknown') {
    const st = usePostStudioStore.getState();
    // The store's own entry wins: only the review path's skip link sets it.
    if (st.entry === 'review_skip') entryRef.current = 'review_skip';
    else if (editPostId || draftId || st.prefillCourse) entryRef.current = 'deep_link';
    else if (st.isOpen) entryRef.current = 'create_sheet';
  }

  // Abandon snapshot: refreshed on every render, read in the [] cleanup.
  // A state value read there would be the mount value, not the teardown one.
  const abandonRef = useRef({ hasMedia: false, hasCaption: false, mediaCount: 0 });

  useEffect(() => {
    // Analytics callsite: post_composer_opened
    analyticsEvents.track('post_composer_opened', { mode, entry: entryRef.current });
    return () => {
      if (submittedRef.current) return;
      // Analytics callsite: post_composer_abandoned
      analyticsEvents.track('post_composer_abandoned', {
        mode,
        has_media: abandonRef.current.hasMedia,
        has_caption: abandonRef.current.hasCaption,
        media_count: abandonRef.current.mediaCount,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Edit-mode load
  const editable = useEditablePost(editPostId ?? null);
  const [editStatus, setEditStatus] = useState<{ status: string | null; scheduledAt: string | null } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [removedExistingIds, setRemovedExistingIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const stageAddInputRef = useRef<HTMLInputElement>(null);
  // Empty-state inputs. The LIBRARY input is rendered AT the button (not hidden
  // off in the header) because the iOS chooser menu anchors to the input's rect:
  // sitting it mid-stage keeps that menu off the footer. The CAMERA input carries
  // `capture`, which opens the camera directly with no OS source menu.
  const emptyCameraInputRef = useRef<HTMLInputElement>(null);
  const emptyLibraryInputRef = useRef<HTMLInputElement>(null);
  // Page-2 caption element: focus is chained off the Next tap because autoFocus
  // is unreliable in the WebView.
  const captionElRef = useRef<HTMLTextAreaElement | null>(null);

  /* ---- THE POST PAGE, REBUILT AROUND GOLF ------------------------------
     Per-photo tags, the course found from the photo date, Played with, Who
     can see this and Preview. Rules: lib/golfPostRules.ts. */
  const [shotTagMap, setShotTagMap] = useState<Record<string, ShotTagChoice>>({});
  const [tagIndex, setTagIndex] = useState<number | null>(null);
  const [tagCourseIdx, setTagCourseIdx] = useState(0);
  const [courseReason, setCourseReason] = useState<string | null>(null);
  const [whereChanging, setWhereChanging] = useState(false);
  const [recentCourses, setRecentCourses] = useState<typeof state.courses>([]);
  const [roundFind, setRoundFind] = useState<{ courseId: string; day: string } | null>(null);
  const [withSuggestions, setWithSuggestions] = useState<WithCandidate[]>([]);
  const [withTagged, setWithTagged] = useState<WithCandidate[]>([]);
  const [visibility, setVisibility] = useState<PostVisibility>('anyone');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const initialVisibilityRef = useRef<PostVisibility>('anyone');
  const initialWithIdsRef = useRef<string[]>([]);
  const existingTagsRef = useRef<ExistingTags>({ holes: [], places: [] });
  const initialExistingTagsRef = useRef<Record<string, ShotTag>>({});
  /** A course the member chose is never overridden by the date lookup. */
  const memberChoseCourseRef = useRef(false);
  const roundLookupRef = useRef(false);

  // Fetch the post's status + scheduled_at (useEditablePost doesn't return them).
  useEffect(() => {
    if (!editPostId) return;
    let cancelled = false;
    supabase
      .from('posts')
      .select('status, scheduled_at, visibility')
      .eq('id', editPostId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const row = data as { status?: string | null; scheduled_at?: string | null; visibility?: PostVisibility | null } | null;
        if (row?.visibility) { setVisibility(row.visibility); initialVisibilityRef.current = row.visibility; }
        setEditStatus({
          status: row?.status ?? null,
          scheduledAt: row?.scheduled_at ?? null,
        });
      });
    return () => { cancelled = true; };
  }, [editPostId]);


  useEffect(() => {
    return () => {
      try { applyRouteChrome(window.location.pathname, true); } catch { /* chrome re-resolve best-effort */ }
    };
  }, []);

  // Prefill state once the editable post lands.
  useEffect(() => {
    if (!isEditMode) return;
    if (hydrated) return;
    const data = editable.data;
    if (!data || !data.canManage) return;
    const media: StageMediaItem[] = data.media.map((m) => ({
      id: `existing-${m.id}`,
      existingId: m.id,
      holeNo: m.holeNo ?? null,
      shotTag: m.shotTag ?? null,
      type: m.mediaType,
      /* A VIDEO'S PLAYABLE URL IS BUILT FROM stream_id, NEVER READ FROM
       * media_url: 37 of 157 video rows store the sentinel 'stream:<uid>' there,
       * and no surface in the app resolves that prefix. Every video row has a
       * stream_id, so this is the uniform path, not a special case. Images keep
       * media_url, which is a real URL on all 678 rows. */
      previewUrl: m.mediaType === 'video' && m.streamId
        ? generateStreamHlsUrl(m.streamId)
        : m.mediaUrl,
      streamId: m.streamId ?? null,
      posterUrl: m.posterUrl ?? null,
      naturalWidth: m.width ?? undefined,
      naturalHeight: m.height ?? undefined,
      frame: 'original',
      crop: null,
      trimStart: null,
      trimEnd: null,
      posterTimestamp: null,
    }));
    const allCourses = (data.courses ?? []).map((c) => ({
      id: c.courseId,
      name: c.courseName,
      country: c.country,
    }));
    hydrate({
      caption: data.caption,
      courses: allCourses,
      course: allCourses[0] ?? null,
      scheduledAt: editStatus?.status === 'scheduled' && editStatus.scheduledAt
        ? new Date(editStatus.scheduledAt)
        : null,
      media,
      activeIndex: 0,
    });

    setHydrated(true);
  }, [isEditMode, hydrated, editable.data, editStatus, hydrate]);

  // Draft deep-link hydration.
  useEffect(() => {
    if (isEditMode) return;
    if (!draftId || !profile?.id) return;
    let cancelled = false;
    void loadComposerDraft(draftId,profile.id).then(saved=>{
      if(cancelled || !saved) return;
      applyDraftActor(saved.row.actor_type,saved.row.actor_id);
      memberChoseCourseRef.current=true;
      restoreDraft(saved.state);setShotTagMap(saved.shotTagMap);setVisibility(saved.visibility);setRestoredDraftId(saved.row.id);
    }).catch(error=>toast.error(error instanceof Error?error.message:'Could not restore draft'));
    return () => { cancelled = true; };
  }, [draftId, isEditMode, profile?.id, restoreDraft, applyDraftActor]);

  // C3 "Share this round" — open the composer pre-filled with the course and
  // the round the member tapped share on.
  const prefillCourse = usePostStudioStore((st) => st.prefillCourse);
  /* WORDS CARRIED IN FROM THE REVIEW PATH (§6). Seeded ONCE, on mount only, so
     it can never overwrite what the member has since typed. */
  const prefillCaptionRef = useRef(usePostStudioStore.getState().prefillCaption);
  const captionSeededRef = useRef(false);
  useEffect(() => {
    if (captionSeededRef.current) return;
    captionSeededRef.current = true;
    const text = prefillCaptionRef.current;
    if (text) setCaption(text);
  }, [setCaption]);
  const prefillAppliedRef = useRef(false);

  useEffect(() => {
    if (isEditMode || draftId) return;
    if (prefillAppliedRef.current) return;
    if (!prefillCourse) return;
    prefillAppliedRef.current = true;
    hydrate({
      caption: '',
      courses: [prefillCourse],
      course: prefillCourse,
      scheduledAt: null,
      media: [],
      activeIndex: 0,
    });
  }, [isEditMode, draftId, prefillCourse, hydrate]);

  /* THE MEDIA SHEET. Null = closed; a number = open on that slide.
     Everything page 1 used to own - the preview with its aspect handling and
     56vh cap, the slide counter, the Edit chip, FramePills, "+ Add" and the
     filmstrip - lives inside it, unchanged. It is a SHEET rather than a page
     because this screen carries the caption, the course card and the detail
     rows as well, and a media surface that big as a SECTION is what made the
     one-page version too much. */
  const [openMediaIndex, setOpenMediaIndex] = useState<number | null>(null);
  const mediaSheetOpen = openMediaIndex !== null;

  // One dark canvas, so the status bar keeps light icons and the notch bleeds
  // the page colour instead of the legacy light-mode white (FFF8FAFC).
  // On unmount, re-resolve chrome for the route underneath (Clubhouse dark,
  // Watch light, profile immersive, etc.) because overlay close is not a route change.
  useEffect(() => {
    try { setStatusBarStyleColor('light', STATUS_BAR_CANVAS); } catch { /* status bar best-effort */ }
  }, []);

  // Files chosen by the bottom-nav picker are injected whenever the store's
  // initialMedia array changes. The nav opens the composer immediately (even on
  // picker cancel) and then re-opens it with files once the user chooses them.
  // In EDIT mode the same array carries the files the create sheet's "Add
  // photos" picked for a bare round post — injected only once the existing post
  // has hydrated, so hydrate() cannot wipe them.
  const lastInitialMediaRef = useRef<File[]>([]);
  useEffect(() => {
    if (draftId) return;
    if (isEditMode && !hydrated) return;
    const files = initialMedia ?? [];
    const prev = lastInitialMediaRef.current;
    const isNew = files.length !== prev.length || files.some((f, i) => f !== prev[i]);
    if (!isNew) return;
    lastInitialMediaRef.current = files;
    if (files.length > 0) void addFiles(files);
  }, [isEditMode, hydrated, draftId, initialMedia, addFiles]);

  /* THE RAIL'S TWO STATES. No media: the two pick buttons, each over its own
     anchored input. Media: a strip of thumbnails plus a "+" tile. */
  const emptyStage = state.media.length === 0;


  const handoff = useComposerFlowStore((st) => st.handoff);
  const requestReopen = useComposerFlowStore((st) => st.requestReopen);

  const [sheet, setSheet] = useState<null | 'course' | 'actor' | 'schedule' | 'drafts' | 'scheduled' | 'cover' | 'adjust' | 'close-guard' | 'more'>(null);

  const [success, setSuccess] = useState<SubmitResult | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [scheduledCount, setScheduledCount] = useState<number>(0);
  const [restoredDraftId, setRestoredDraftId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  const active = state.media[state.activeIndex] ?? null;

  /* ---- GOLF PAGE: derived values and reads ---------------------------- */
  const shotTags = useMemo(() => Object.fromEntries(Object.entries(shotTagMap).map(([k, v]) => [k, v.tag])) as Record<string, ShotTag>, [shotTagMap]);
  const tagCourse = state.courses[tagCourseIdx] ?? state.courses[0] ?? null;
  const holeAnalysis = useCourseHoleAnalysis(tagCourse?.id);
  const { tagHoles, tagPars } = useMemo(() => {
    const walk = courseWalkHoles(holeAnalysis.data);
    const holes = walk ? [...walk.holes].sort((a, b) => a.hole_no - b.hole_no) : [];
    const pars = new Map<number, number>();
    for (const h of holes) if (h.par > 0) pars.set(h.hole_no, h.par);
    // No scored hole data: holes 1 to 18 without pars (Oct 24 rule).
    return { tagHoles: holes.length ? holes.map((h) => h.hole_no) : Array.from({ length: 18 }, (_, i) => i + 1), tagPars: pars };
  }, [holeAnalysis.data]);
  const holeShotCount = state.media.filter((m) => isHoleTag(shotTags[m.id])).length;

  /** Member course choice: never overridden; a new primary course clears photo tags. */
  const chooseCourses = useCallback((list: typeof state.courses, reason: string | null = null) => {
    memberChoseCourseRef.current = true;
    if ((list[0]?.id ?? null) !== (state.courses[0]?.id ?? null)) { setShotTagMap({}); setTagCourseIdx(0); }
    setCourseReason(reason);
    setRoundFind(null);
    setWhereChanging(false);
    setCourses(list);
  }, [setCourses, state.courses]);

  // Recent-round courses for the WHERE fallback chips.
  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    void fetchRecentCourses(profile.id).then((rows) => { if (!cancelled) setRecentCourses(rows); });
    return () => { cancelled = true; };
  }, [profile?.id]);

  const [golfRounds,setGolfRounds]=useState<ComposerRound[]>([]);
  const [golfSuggestions,setGolfSuggestions]=useState<CourseSuggestion[]>([]);
  const [selectedRoundId,setSelectedRoundId]=useState<string|null>(null);
  const [roundSheetOpen,setRoundSheetOpen]=useState(false);
  const selectedRound=golfRounds.find(r=>r.whs_score_id===(state.attachedScoreId ?? selectedRoundId)) ?? golfRounds[0] ?? null;
  const shapes=useRoundHoleShapes(state.attachedScoreId ? [state.attachedScoreId] : []);
  const attachedRound = golfRounds.find(r => r.whs_score_id === state.attachedScoreId);
  const premarkKeyRef = useRef('');
  const roundVideo: RoundVideoContext | null = videoComposer && longVideo && activeActor?.type === 'personal' && state.attachedScoreId && (attachedRound?.holes_played === 9 || attachedRound?.holes_played === 18) ? { scoreId: state.attachedScoreId, holes: attachedRound.holes_played, shape: shapes?.get(state.attachedScoreId) ?? null } : null;
  useEffect(() => {
    if (!roundVideo || !videoItem) return;
    const key = JSON.stringify([roundVideo.scoreId, roundVideo.holes, state.caption, videoDuration(videoItem)]);
    if (premarkKeyRef.current === key) return;
    premarkKeyRef.current = key;
    const marks = premarkHoles(state.caption, videoData.holeMarks ?? {}, roundVideo.holes, videoDuration(videoItem) ?? 0);
    if (JSON.stringify(marks) !== JSON.stringify(videoData.holeMarks ?? {})) setVideoData({ holeMarks: marks, marksRoundId: roundVideo.scoreId });
  }, [state.caption, roundVideo?.scoreId, roundVideo?.holes, videoItem?.duration, videoItem?.trimStart, videoItem?.trimEnd, videoData.holeMarks, setVideoData]);
  useEffect(() => { if (!roundVideo) setMarkHolesOpen(false); }, [!!roundVideo]);
  useEffect(()=>{
    if(isEditMode || draftId || prefillCourse || !profile?.id || !activeActor || memberChoseCourseRef.current) return;
    let cancelled=false;
    void (async()=>{
      const personal=activeActor.type!=='business';
      const claimed=personal?null:await readClaimedCourse(activeActor.id);
      const rows=personal?await readComposerRounds(profile.id):[];
      const recent=recentRound(rows);
      const roundCourse=recent?.course_id?await readGolfCourse(recent.course_id):null;
      const nearby=await readNearbyCourse(state.media.find(m=>m.type==='image'));
      if(cancelled || memberChoseCourseRef.current) return;
      const picked=chooseCourseSource({manual:false,claimed,round:recent&&roundCourse?{course:roundCourse,day:recent.play_date}:null,nearby});
      setCourses(picked?[picked.course]:[]);setCourseReason(picked?.reason??null);
      setRoundFind(recent&&roundCourse?{courseId:roundCourse.id,day:recent.play_date}:null);
      const suggestions:CourseSuggestion[]=[];
      for(const r of rows){if(!r.course_id||suggestions.some(c=>c.id===r.course_id)) continue;const c=await readGolfCourse(r.course_id);if(c)suggestions.push({...c,reason:`Your last round · ${roundSuggestionDay(r.play_date)}`});if(suggestions.length>=3)break;}
      if(nearby&&!suggestions.some(c=>c.id===nearby.id))suggestions.splice(2,1,{...nearby,reason:'Near where the first photo was taken'});
      if(!cancelled)setGolfSuggestions(suggestions);
    })();
    return()=>{cancelled=true;};
  },[activeActor?.id,activeActor?.type,profile?.id,isEditMode,draftId,prefillCourse,state.media.find(m=>m.type==='image')?.id,setCourses]);
  useEffect(()=>{
    let cancelled=false;
    if(!profile?.id || !state.course || activeActor?.type==='business'){setGolfRounds([]);return;}
    const attached = state.attachedScoreId;
    void readComposerRounds(profile.id,state.course.id).then(rows=>{if(!cancelled){setGolfRounds(rows);setSelectedRoundId(rows[0]?.whs_score_id??null);if (attached && !rows.some(r => r.whs_score_id === attached)) setVideoData({ holeMarks: {}, marksRoundId: null });}});
    return()=>{cancelled=true;};
  },[profile?.id,state.course?.id,activeActor?.type]);

  // Played with suggestions (re-ranked when a round course/day is found).
  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    void fetchPlayedWithSuggestions(profile.id, roundFind).then((rows) => { if (!cancelled) setWithSuggestions(rows); });
    return () => { cancelled = true; };
  }, [profile?.id, roundFind]);

  // Edit mode: the post's Played with rows and its media's existing tags.
  const editHydratedGolfRef = useRef(false);
  useEffect(() => {
    if (!isEditMode || !hydrated || !editPostId || !profile?.id || editHydratedGolfRef.current) return;
    editHydratedGolfRef.current = true;
    const userId = profile.id;
    void readPostWith([editPostId]).then((rows) => {
      const people = rows.map((r) => ({ id: r.userId, name: r.name, avatarUrl: r.avatarUrl, sameRound: false, lastInteraction: '' }));
      initialWithIdsRef.current = people.map((p) => p.id);
      setWithTagged(people);
    });
    const course = state.courses[0];
    const existing = state.media.filter((m) => m.existingId);
    if (course && existing.length) {
      void readExistingShotTags(course.id, userId, existing.map(existingMediaUrl)).then((tags) => {
        existingTagsRef.current = tags;
        const map: Record<string, ShotTagChoice> = {};
        const initial: Record<string, ShotTag> = {};
        for (const m of existing) {
          const t = m.holeNo != null ? { hole: m.holeNo } : m.shotTag?.tag ?? existingTagFor(existingMediaUrl(m), tags);
          if (t) { map[m.id] = { tag: t, courseId: course.id, knownHoles: [] }; initial[m.id] = t; }
        }
        initialExistingTagsRef.current = initial;
        setShotTagMap((cur) => ({ ...map, ...cur }));
      });
    }
  }, [isEditMode, hydrated, editPostId, profile?.id, state.courses, state.media]);

  const searchPeople = useCallback((q: string) => searchMembers(q, profile?.id ?? null), [profile?.id]);
  const chooseShotTag = (itemId: string, tag: ShotTag | null) => {
    setShotTagMap((cur) => {
      const next = { ...cur };
      if (!tag || !tagCourse) delete next[itemId];
      else next[itemId] = { tag, courseId: tagCourse.id, knownHoles: tagHoles };
      return next;
    });
    setGolf({});
    setTagIndex(null);
  };

  // Refreshed every render so the unmount cleanup reads teardown values.
  abandonRef.current = {
    hasMedia: state.media.length > 0,
    hasCaption: state.caption.trim().length > 0,
    mediaCount: state.media.length,
  };

  // Media added: kind is image / video / mixed across the batch just added.
  const handleAddFiles = useCallback(async (files: File[]) => {
    const countBefore = state.media.length;
    await addFiles(files);
    if (files.length === 0) return;
    const hasVideo = files.some((f) => f.type.startsWith('video/'));
    const hasImage = files.some((f) => !f.type.startsWith('video/'));
    // Analytics callsite: post_media_added
    analyticsEvents.track('post_media_added', {
      mode,
      count_after: countBefore + files.length,
      kind: hasVideo && hasImage ? 'mixed' : (hasVideo ? 'video' : 'image'),
    });
  }, [addFiles, state.media.length, mode]);

  // Caption: post_caption_started fires ONCE per composer session.
  const handleSetCaption = useCallback((v: string) => {
    if (!captionStartedRef.current && v.trim().length > 0) {
      captionStartedRef.current = true;
      // Analytics callsite: post_caption_started
      analyticsEvents.track('post_caption_started', { mode });
    }
    setCaption(v);
  }, [setCaption, mode]);

  const openDetail = useCallback((row: 'course' | 'actor' | 'schedule') => {
    // Analytics callsite: post_detail_opened
    analyticsEvents.track('post_detail_opened', { mode, row });
  }, [mode]);




  // Post button vs Save button gating.

  /* THE CONTENT GATE. A post needs ONE of media or words — see the commit-B
     note below; COMMIT A still requires media.
     EDIT is deliberately exempt: posts published before the media rule, and
     round posts, have no media and must still be saveable. */
  const hasWords = state.caption.trim().length > 0;
  const hasContent = postContentGate({
    isEditMode,
    mediaCount: state.media.length,
    caption: state.caption,
  });
  const canSubmit = !submitting && !saving && hasContent && !!activeActor;


  // Edit-mode: schedule row visible only for still-scheduled posts.
  const showScheduleRow = !isEditMode || editStatus?.status === 'scheduled';

  /* THE EMPTY-EVERYTHING LABEL names what is missing rather than sitting dead,
     in the same register as the review path's SET YOUR SCORE. */
  const primaryLabel = isEditMode
    ? t('stage.saveChanges')
    : (!state.media.length && !hasWords)
      ? t('stage.emptyGate')
      : (state.scheduledAt ? t('stage.schedule') : videoComposer && longVideo ? 'PUBLISH VIDEO' : t('stage.share'));
  const primaryStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: '14px 20px',
    borderRadius: 999,
    border: 'none',
    /* CAPS ACTION: two points down, caps at 0.10em, padding unchanged. */
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.10em',
    background: canSubmit ? CT_DARK.amber : CT_DARK.dim,
    color: CT_DARK.ink,
    cursor: canSubmit ? 'pointer' : 'not-allowed',
  };


  const authorName = useMemo(() => activeActor?.name ?? profile?.display_name ?? 'You', [activeActor, profile]);
  const authorAvatar = activeActor?.type==='business' ? activeActor.avatarUrl??null : activeActor?.avatarUrl ?? profile?.profile_photo_url ?? null;
  const authorUsername = activeActor?.slug ?? profile?.username ?? null;

  const isPersonalActor = activeActor?.type !== 'business';
  /* PF2_GUIDE: the guide is written and announced only when the post can
     actually feed it — personal actor, Everyone audience, with media. The
     member's own switch (state.addToGuide) is never rewritten by audience
     changes, so switching back to Everyone restores it. */
  
  /** Tags for photos still to upload, carried by the upload job. */
  const newShotTagJob = useCallback((items: typeof state.media) => {
    const out: Record<string, ShotTagChoice> = {};
    for (const m of items) if (!m.existingId && shotTagMap[m.id]) out[m.id] = shotTagMap[m.id];
    return Object.keys(out).length ? { items: out, personal: isPersonalActor, visibility } : undefined;
  }, [shotTagMap, isPersonalActor, visibility]);

  const doCreate = async () => {
    if (!canSubmit || !activeActor) return;
    try {
      const res = await submit({
        caption: state.caption,
        media: state.media,
        course: state.course,
        courses: state.courses,

        scheduledAt: state.scheduledAt,
        actorType: activeActor.type,
        actorId: activeActor.id,
        authorName,
        authorAvatarUrl: authorAvatar,
        authorUsername,
        visibility,
        playedWith: isPersonalActor ? withTagged.map((p) => p.id) : [],
        playedWithPeople: isPersonalActor ? withTagged.map(p => ({ id:p.id, name:p.name })) : [],
        bestHour: scheduleBestHour,
        shotTags: newShotTagJob(state.media),
        attachedScoreId:isPersonalActor?state.attachedScoreId:null,
        roundHoles: roundVideo?.holes ?? null,
        videoData: state.videoData,
      });
      submittedRef.current = true;
      // A finished job is not a change of mind: the composer-flow step 1 must
      // never come back on top of the success screen.
      notifyComposerCompleted();
      // Analytics callsite: post_submitted
      analyticsEvents.track('post_submitted', {
        mode,
        media_count: state.media.length,
        has_media: state.media.length > 0,
        has_caption: state.caption.trim().length > 0,
        caption_len: state.caption.trim().length,
        course_tagged: !!state.course,
        courses_count: state.courses.length,
        scheduled: !!state.scheduledAt,
        actor_type: activeActor.type,
        total_ms: Math.round(Date.now() - mountedAtRef.current),
      });
      void refreshAuthorPosts(queryClient, activeActor.type, activeActor.id);
      if(restoredDraftId) {try {await drafts.remove(restoredDraftId);setRestoredDraftId(null);} catch(error){console.warn('[PF1] draft removal failed',error);}}
      setSuccess(res);
      reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  const doSaveEdit = useCallback(async () => {
    if (!editPostId || !editable.data) return;
    if (saving) return;
    setSaving(true);
    try {
      const patch: Record<string, unknown> = {
        content: state.caption?.length ? state.caption : null,
        course_id: state.course?.id ?? null,
        tagged_course_ids: state.courses.map((c) => c.id),
        ...(visibility !== initialVisibilityRef.current ? { visibility } : {}),

      };
      // Only touch scheduled_at when the post is still scheduled.
      if (editStatus?.status === 'scheduled') {
        patch.scheduled_at = state.scheduledAt ? state.scheduledAt.toISOString() : null;
      }
      // BIZ_POSTS_V1: an RLS refusal affects 0 rows without erroring.
      const { data: patched, error: upErr } = await supabase.from('posts').update(patch as never).eq('id', editPostId).select('id');
      if (upErr) throw upErr;
      if (!(patched as unknown[] | null)?.length) throw new Error(POST_CHANGE_REFUSED);

      // Sync the single-course junction row to the primary course (best-effort;
      // full multi-course junction editing stays with useUpdatePost).
      const { error: pcDelErr } = await supabase.from('post_courses').delete().eq('post_id', editPostId);
      if (pcDelErr) throw pcDelErr;
      if (state.course?.id) {
        const { error: pcInsErr } = await supabase.from('post_courses').insert({
          post_id: editPostId,
          course_id: state.course.id,
          display_order: 0,
        } as never);
        if (pcInsErr) throw pcInsErr;
      }

      // Removed media rows: snapshot for cleanup, then delete.
      if (removedExistingIds.length > 0) {
        const { data: rows } = await supabase
          .from('post_media')
          .select('id, media_url, media_type, stream_id')
          .in('id', removedExistingIds);
        const snapshot = ((rows ?? []) as Array<{ id: string; media_url: string; media_type: string; stream_id: string | null }>).map((r) => ({
          id: r.id,
          media_url: r.media_url,
          media_type: (r.media_type === 'video' ? 'video' : 'image') as 'image' | 'video',
          stream_id: r.stream_id ?? null,
        }));
        const { error: delErr } = await supabase
          .from('post_media')
          .delete()
          .in('id', removedExistingIds);
        if (delErr) throw delErr;
        if (snapshot.length > 0) {
          supabase.functions
            .invoke('cleanup-review-media', { body: { mediaItems: snapshot } })
            .catch((err) => console.warn('[post-v2] media cleanup failed:', err));
        }
      }

      // Reorder kept existing media by their new position.
      const kept = state.media.filter((m) => m.existingId);
      for (let i = 0; i < kept.length; i++) {
        const m = kept[i];
        if (!m.existingId) continue;
        await supabase.from('post_media').update({ display_order: i } as never).eq('id', m.existingId);
      }

      // New media additions: hand to the controller against the existing post.
      const newMedia = state.media.filter((m) => !m.existingId && m.file);
      if (newMedia.length > 0) {
        startPostUpload(
          {
            jobId: crypto.randomUUID(),
            postId: editPostId,
            userId: editable.data.userId,
            actorType: editable.data.actorType,
            actorId: editable.data.actorId,
            isScheduled: editStatus?.status === 'scheduled',
            scheduledAt: state.scheduledAt?.toISOString(),
            skipFinalize: true,
            displayOrderOffset: kept.length,
            shotTags: newShotTagJob(newMedia),
          },
          newMedia,
        );
      }

      // Played with: bring post_with to the chosen people (trigger notifies).
      if (editable.data.actorType !== 'business') {
        await syncPostWith(editPostId, editable.data.userId, initialWithIdsRef.current, withTagged.map((p) => p.id));
      }
      // Existing photos whose tag changed: remove the old, add the new.
      if (state.course && profile?.id) {
        for (const m of kept) {
          const before = initialExistingTagsRef.current[m.id] ?? null;
          const after = shotTags[m.id] ?? null;
          if (JSON.stringify(before) === JSON.stringify(after)) continue;
          await rewriteExistingShotTag(state.course.id, profile.id, tagHoles, m, after, existingTagsRef.current, editable.data.userId, editable.data.actorType !== 'business', visibility);
        }
      }

      // Invalidate common caches.
      queryClient.invalidateQueries({ queryKey: ['post-golf-tags'] });
      queryClient.invalidateQueries({ queryKey: ['editable-post', editPostId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', editPostId] });
      window.dispatchEvent(new CustomEvent('postUpdated', { detail: { postId: editPostId } }));

      submittedRef.current = true;
      // Analytics callsite: post_submitted
      analyticsEvents.track('post_submitted', {
        mode,
        media_count: state.media.length,
        has_media: state.media.length > 0,
        has_caption: state.caption.trim().length > 0,
        caption_len: state.caption.trim().length,
        course_tagged: !!state.course,
        courses_count: state.courses.length,
        scheduled: !!state.scheduledAt,
        actor_type: activeActor?.type ?? editable.data.actorType,
        total_ms: Math.round(Date.now() - mountedAtRef.current),
      });
      setSaveSuccess(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save changes");
    } finally {
      setSaving(false);
    }
  }, [editPostId, editable.data, state, saving, editStatus, removedExistingIds, queryClient, activeActor, mode, visibility, withTagged, shotTags, profile?.id, tagHoles, newShotTagJob]);

  const onPrimary = () => {
    if (isEditMode) return void doSaveEdit();
    return void doCreate();
  };

  // Removal wrapper: track existing-id removals for the save phase.
  const handleRemoveAt = useCallback((idx: number) => {
    const item = state.media[idx];
    if (item?.existingId) {
      setRemovedExistingIds((ids) => (ids.includes(item.existingId!) ? ids : [...ids, item.existingId!]));
    }
    removeAt(idx);
  }, [state.media, removeAt]);

  const handleClose = () => {
    if (state.dirty) {
      setSheet('close-guard');
      return;
    }
    onClose();
  };

  /* THE LEADING CONTROL (§1.4). ← only when the member came from step 1, which
     is the only entry with a previous step to return to; every other entry
     (course prefill, edit, draft, deep link) closes instead. EITHER WAY a dirty
     composer meets the close guard first — ← does not bypass it. */
  const leadingControl = postLeadingControl(handoff);
  const handleLeading = () => {
    if (state.dirty) {
      setSheet('close-guard');
      return;
    }
    if (leadingControl === 'back') {
      // The composer is an overlay, so there is no back navigation to observe:
      // step 1 is asked back explicitly, and the request clears the handoff.
      requestReopen();
      reset();
      onClose();
      return;
    }
    onClose();
  };

  const saveAsDraft = async () => {
    if (savingDraft) return;
    if (!activeActor) return;
    setSavingDraft(true);
    try {
      await drafts.save({
        actorType: activeActor.type,
        actorId: activeActor.id,
        content: state.caption || null,
        courseId: state.course?.id ?? null,
        courseName: state.course?.name ?? null,
        courseCountry: state.course?.country ?? null,
        courses: state.courses,
        media:state.media,shotTagMap,attachedScoreId:isPersonalActor?state.attachedScoreId:null,visibility,
        videoData: state.videoData ? { ...state.videoData, coverFrame: state.media.length === 1 && state.media[0].type === 'video' ? state.media[0].posterTimestamp ?? state.videoData.coverFrame : state.videoData.coverFrame } : undefined,
      });
      // Analytics callsite: post_draft_saved
      analyticsEvents.track('post_draft_saved', {
        mode,
        media_count: state.media.length,
        had_caption: state.caption.trim().length > 0,
      });
      if (restoredDraftId) {
        await drafts.remove(restoredDraftId);
        setRestoredDraftId(null);
      }
      setSheet(null);
      reset();
      onClose();
    } catch(error) {toast.error(error instanceof Error?error.message:'Could not save draft');} finally {
      setSavingDraft(false);
    }
  };

  // No hooks below this point - early returns above.

  if (saveSuccess) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: CT_DARK.bg, display: 'flex', flexDirection: 'column', zIndex: POST_COMPOSER_Z }}>
        <PostSuccessV2
          result={{ kind: 'published', postId: editPostId ?? '' }}
          onDone={() => { setSaveSuccess(false); onPosted?.(); onClose(); }}
        />
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: CT_DARK.bg, display: 'flex', flexDirection: 'column', zIndex: POST_COMPOSER_Z }}>
        <PostSuccessV2 result={success} onViewPost={() => {
          const closeTo = activeActor?.type === 'business' ? `/business/${activeActor.id}` : '/profile';
          onViewPost?.(success.postId, closeTo);
        }}
          onOpenScheduled={() => setSheet('scheduled')} onDone={() => { setSuccess(null); onPosted?.(); onClose(); }} />
        <ScheduledPostsSheetV2 open={sheet === 'scheduled'} onClose={() => setSheet(null)} userId={profile?.id} onCountChange={setScheduledCount} />
      </div>
    );
  }

  const handleStageAdd = () => stageAddInputRef.current?.click();
  const handleStageAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) void handleAddFiles(files);
    e.target.value = '';
  };

  // Edit-mode load hold: never show the empty create composer while the
  // post is being fetched for editing. Shared with the /post-v2 route
  // fallback so the two silhouettes cannot drift.
  if (isEditMode && !hydrated && (editable.isLoading || (editable.data && editable.data.canManage))) {
    return <StageLoadingShell title={t('stage.editPost')} onClose={onClose} />;
  }

  // Edit target failed to load or does not exist.
  // SETTLED IS NOT "NOT LOADING": useEditablePost is gated on postId + viewerId.
  if (isEditMode && editable.isFetched && !editable.data) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: CT_DARK.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: POST_COMPOSER_Z, padding: 24, gap: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: CT_DARK.ink }}>Couldn't load this post</div>
        <div style={{ fontSize: 13, color: CT_DARK.mute, textAlign: 'center' }}>It may have been deleted, or your connection dropped.</div>
        <button onClick={onClose} style={{ background: CT_DARK.elev, color: CT_DARK.ink, border: 0, borderRadius: 999, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Close</button>
      </div>
    );
  }

  // Ownership guard: if edit target isn't manageable, close out.
  if (isEditMode && editable.data && !editable.data.canManage) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: CT_DARK.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: POST_COMPOSER_Z, padding: 24, gap: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: CT_DARK.ink }}>Can't edit this post</div>
        <div style={{ fontSize: 13, color: CT_DARK.mute, textAlign: 'center' }}>
          {editable.data.blockedReason === 'review-derived'
            ? 'Review posts are edited from the course page.'
            : "You don't have permission to edit this post."}
        </div>
        <button onClick={onClose} style={{ background: CT_DARK.elev, color: CT_DARK.ink, border: 0, borderRadius: 999, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Close</button>
      </div>
    );
  }

  const sheets = (
    <>
        {/* Sheets */}
        <CourseTagSheet
          open={sheet === 'course'}
          onClose={() => setSheet(null)}
          onDone={(list) => chooseCourses(list)}
          selected={state.courses}
          userId={profile?.id ?? null}
          actor={activeActor}
        />
        <ShotTagSheet
          open={tagIndex !== null}
          item={tagIndex !== null ? state.media[tagIndex] ?? null : null}
          courses={state.courses}
          courseIndex={tagCourseIdx}
          onCourseIndex={setTagCourseIdx}
          holes={tagHoles}
          tag={tagIndex !== null ? shotTags[state.media[tagIndex]?.id] ?? null : null}
          onChoose={(t) => { const it = tagIndex !== null ? state.media[tagIndex] : null; if (it) chooseShotTag(it.id, t); }}
          onClose={() => setTagIndex(null)}
          onEditPhoto={() => { if (tagIndex !== null) { setActiveIndex(tagIndex); setOpenMediaIndex(tagIndex); } }}
        />
        <VisibilitySheet open={visibilityOpen} value={visibility} onChange={setVisibility} onClose={() => setVisibilityOpen(false)} />
        <ActorSheet open={sheet === 'actor'} onClose={() => setSheet(null)} onSelect={(a) => selectActor(a)} selectedId={activeActor?.id ?? null} />
  
        <ScheduleSheetV2
          open={sheet === 'schedule'}
          onClose={() => setSheet(null)}
          value={state.scheduledAt}
          actor={activeActor}
          onBestHour={setScheduleBestHour}
          onChange={setScheduledAt}
          onOpenScheduled={() => setSheet('scheduled')}
          scheduledCount={scheduledCount}
        />
        <DraftsSheetV2
          open={sheet === 'drafts'}
          onClose={() => setSheet(null)}
          drafts={drafts.drafts}
          onRestore={(d) => {
            if(!profile?.id)return;
            void loadComposerDraft(d.id,profile.id).then(saved=>{if(!saved)return;applyDraftActor(saved.row.actor_type,saved.row.actor_id);memberChoseCourseRef.current=true;restoreDraft(saved.state);setShotTagMap(saved.shotTagMap);setVisibility(saved.visibility);setRestoredDraftId(d.id);}).catch(error=>toast.error(error instanceof Error?error.message:'Could not restore draft'));
          }}
          onDelete={drafts.remove}
        />
        <ScheduledPostsSheetV2
          open={sheet === 'scheduled'}
          onClose={() => setSheet(null)}
          userId={profile?.id}
          onCountChange={setScheduledCount}
        />
        <CoverFrameSheet
          open={sheet === 'cover'}
          onClose={() => setSheet(null)}
          item={active}
          onApply={(ts) => { updateActive({ posterTimestamp: ts }); if (videoComposer) setVideoData({ coverFrame: ts }); }}
        />
        <AdjustSheet
          open={sheet === 'adjust'}
          onClose={() => setSheet(null)}
          item={active}
          onApply={(crop) => updateActive({ crop })}
        />
  
        {/* More options sheet */}
        <BottomSheet open={sheet === 'more'} onClose={() => setSheet(null)} title="Options">
          <div style={{ padding: '4px 12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => setSheet('schedule')}
              style={moreRowStyle}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: CT_DARK.ink }}>Schedule post</span>
              {state.scheduledAt && <span style={{ fontSize: 12, color: CT_DARK.amber }}>Set</span>}
            </button>
            {!isEditMode && (
              <button
                onClick={() => setSheet('drafts')}
                style={moreRowStyle}
              >
                <span style={{ fontSize: 15, fontWeight: 600, color: CT_DARK.ink }}>{t('stage.drafts')}</span>
                {drafts.drafts.length > 0 && <span style={{ fontSize: 12, color: CT_DARK.mute }}>{drafts.drafts.length}</span>}
              </button>
            )}
          </div>
        </BottomSheet>
  
        <ComposerRoundsSheet open={roundSheetOpen} onClose={()=>setRoundSheetOpen(false)} rounds={golfRounds} onPick={r=>{setSelectedRoundId(r.whs_score_id);if(state.attachedScoreId)setGolf({attachedScoreId:r.whs_score_id});}} />
        <BottomSheet open={sheet === 'close-guard'} onClose={() => setSheet(null)} title={isEditMode?'Unsaved changes':t('closeGuard.title')}>
          <div style={{padding:'0 18px 34px',display:'flex',flexDirection:'column',gap:16,color:GP.ink}}>
            <p style={{fontSize:14,color:GP.mute,lineHeight:1.45,margin:0}}>{t('closeGuard.body')}</p>
            {!isEditMode&&<><div className="composer-draft-keeps">
              {state.media.length>0&&<div><span>Photos and video</span><b>{state.media.length}</b></div>}
              {state.caption&&<div><span>Words</span><b>Kept</b></div>}
              {state.course&&<div><span>Course and tags</span><b>{state.course.name}{state.media.filter(m=>shotTags[m.id]).length>0 ? ` · ${state.media.filter(m=>shotTags[m.id]).length} tagged` : ''}</b></div>}
              {state.attachedScoreId&&selectedRound&&<div><span>Round</span><b>{selectedRound.gross_score} attached</b></div>}
            </div><button onClick={saveAsDraft} disabled={savingDraft} style={{height:54,background:GP.ink,color:GP.onInk,border:0,borderRadius:999,fontSize:15,fontWeight:800,textTransform:'uppercase',letterSpacing:'.14em'}}>{savingDraft?'Saving':t('closeGuard.saveDraft')}</button>
            {state.scheduledAt&&<p style={{fontSize:12,color:GP.mute}}>{t('closeGuard.saveDraftLosesSchedule')}</p>}</>}
            <button onClick={()=>{setSheet(null);reset();onClose();}} style={{background:'none',border:0,color:'var(--composer-golf-under)',fontSize:13,fontWeight:800,letterSpacing:'.14em'}}>DISCARD</button>
          </div>
        </BottomSheet>
    </>
  );

  const frameRatio: Record<string, string> = { original: '4 / 5', '4:5': '4 / 5', '1:1': '1 / 1', '9:16': '9 / 16' };
  const stageAspect = active ? (frameRatio[active.frame] ?? '4 / 5') : '4 / 5';

  /* ---- THE MEDIA SHEET — PAGE 1, MOVED ------------------------------------
     Page 1's contents, unchanged: the preview with its frame-driven aspect and
     56vh cap, the slide counter chip, the Edit chip, FramePills, the "+ Add"
     pill and the filmstrip. Opened by tapping a rail thumbnail (seeded to that
     slide) or the rail's "+" when media already exists. AdjustSheet and
     CoverFrameSheet open from inside it exactly as they did from page 1 — they
     are BottomSheets at Z.sheet (12003), so they land above this surface
     without either of them naming the other. */
  const mediaSheet = !mediaSheetOpen ? null : (
    <div
      role="dialog"
      aria-label={t(editorTitleKey(state.media))}
      style={{
        position: 'fixed', inset: 0, height: '100dvh', background: PAGE2.canvas,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        zIndex: POST_COMPOSER_Z + 1,
      }}
    >
      <div style={{ flex: 'none', paddingTop: 'max(env(safe-area-inset-top, 0px), 10px)' }}>
        <div style={{ height: 56, padding: '0 12px', display: 'flex', alignItems: 'center' }}>
          <Button variant="ghost" className="pf4-edit-close" aria-label="Close" onClick={() => setOpenMediaIndex(null)}><X/></Button>
        </div>
      </div>

      {/* Media preview — aspect follows the frame pill, capped at 56vh */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: stageAspect, maxHeight: '56vh', flex: 'none', background: CT_DARK.surface, display: 'flex', overflow: 'hidden', transition: 'aspect-ratio 200ms ease' }}>
        <MediaStageV2
          item={active}
          index={state.activeIndex}
          total={1}
          onOpenAdjust={() => setSheet('adjust')}
          onOpenCover={() => setSheet('cover')}
          onRequestAdd={handleStageAdd}
        />

        {/* Slide counter — glass chip, top-right */}
        {state.media.length > 1 && (
          <div className={CHIP_GLASS_CLASS} style={{ position: 'absolute', right: 12, top: 12, padding: '4px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: CT_DARK.ink, fontVariantNumeric: 'tabular-nums' }}>
            {state.activeIndex + 1}/{state.media.length}
          </div>
        )}

        {/* Edit chip — bottom-left glass pill */}
        {active && !active.existingId && (
          <button
            onClick={() => setSheet(active.type === 'video' ? 'cover' : 'adjust')}
            style={{ ...floatingChipStyle, top: 'auto', right: 'auto', bottom: 12, left: 12, padding: '9px 13px', fontWeight: 700, gap: 6 }}
          >
            <Pencil size={13} />
            {t('stage.edit')}
          </button>
        )}
      </div>

      {/* Frame pills row (+ Add pill when there is exactly one slide) */}
      {active && !active.existingId && (
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px 0', background: PAGE2.canvas }}>
          <FramePills value={active.frame} onChange={(f) => updateActive({ frame: f })} />
          {state.media.length === 1 && (
            <button
              onClick={handleStageAdd}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: `1px dashed ${CT_DARK.dim}`,
                color: CT_DARK.mute,
                borderRadius: 999,
                padding: '8px 13px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                flex: 'none',
              }}
            >{t('stage.addShort')}</button>
          )}
        </div>
      )}

      {/* Filmstrip — only when there is more than one slide, centred in the gap */}
      {state.media.length > 1 ? (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '0 16px', background: PAGE2.canvas }}>
          <MediaTray
            media={state.media}
            activeIndex={state.activeIndex}
            onSelect={setActiveIndex}
            onRemove={handleRemoveAt}
            onReorder={reorder}
            onAddFiles={handleAddFiles}
          />
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, background: PAGE2.canvas }} />
      )}

    </div>
  );

  const openShot = (i: number) => {
    setActiveIndex(i);
    // A tagged course turns a tap into "What's in this shot?"; without one the
    // tap keeps opening the photo editor exactly as before.
    if (state.courses.length > 0) { setTagCourseIdx(0); setTagIndex(i); }
    else setOpenMediaIndex(i);
  };
  const withNames = withTagged.map((p) => p.name.split(/\s+/)[0]);

  const metaRow = (label: string, value: React.ReactNode, onClick: () => void, first: boolean) => (
    <button type="button" onClick={onClick} style={{ ...page2RowStyle(!first), padding: '14px 16px' }}>
      <span style={{ fontSize: 15, fontWeight: 600, flex:'none', color: GP.ink }}>{label}</span>
      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, minWidth:0, fontSize: 14, color: GP.mute }}>{value}</span>
      <ChevronRight size={14} color={GP.dim} style={{ marginLeft: 6, flex: 'none' }} />
    </button>
  );

  const tagAndDetails = (
    <>
      <ComposerCourseBlock course={state.course} reason={courseReason} suggestions={golfSuggestions} hole={state.holeNo??null} tags={state.postShotTags??[]} holes={[]} onChange={()=>{openDetail('course');setSheet('course');}} onPick={c=>chooseCourses([c])} onHole={holeNo=>setGolf({holeNo})} onTags={postShotTags=>setGolf({postShotTags})}/>
      {isPersonalActor&&selectedRound&&golfRounds.some(roundIsRecent)&&<ComposerAttachRound round={selectedRound} on={!!state.attachedScoreId} hole={state.holeNo??null} shape={shapes?.get(state.attachedScoreId??'')??null} onToggle={()=>setGolf({attachedScoreId:state.attachedScoreId?null:selectedRound.whs_score_id})} onDifferent={()=>setRoundSheetOpen(true)}/>}

      {state.courses.length > 1 && (
        <div style={{ display: 'flex', gap: 6, margin: '10px 16px 0', flexWrap: 'wrap' }}>
          {state.courses.slice(1).map((c) => (
            <button key={`tagged-${c.id}`} type="button" aria-label={t('stage.untag', { name: c.name })}
              onClick={() => setCourses(state.courses.filter((x) => x.id !== c.id))}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${GP.line2}`, background: 'transparent', borderRadius: 999, padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: GP.ink }}>
              {c.name}<span style={{ fontSize: 13, opacity: 0.85 }}>×</span>
            </button>
          ))}
        </div>
      )}
      {isPersonalActor && (
        <PlayedWithSection
          suggestions={withSuggestions}
          tagged={withTagged}
          onToggle={(p) => setWithTagged((cur) => toggleWith(cur, p, profile?.id ?? null))}
          search={searchPeople}
          selfId={profile?.id ?? null}
        />
      )}

      {videoItem && <VideoCoverChapters item={videoItem} details={videoData} description={state.caption} long={longVideo} round={roundVideo} onMark={() => setMarkHolesOpen(true)} onChange={setVideoData} onFrame={ts => { updateActive({ posterTimestamp: ts }); setVideoData({ coverFrame: ts }); }} onCover={() => { setActiveIndex(0); setSheet('cover'); }} />}
      <div className="composer-golf-head" style={{margin:'22px 16px 10px'}}><span className="composer-golf-kicker">Sharing</span></div>
      <div data-testid="meta-panel" style={{ background:'var(--composer-golf-card)', border:'1px solid var(--composer-golf-line)', borderRadius:16, margin:'0 16px', overflow: 'hidden' }}>
        {metaRow(t('stage.postingAs'), <>
          <span style={{minWidth:0,whiteSpace:'normal',overflowWrap:'anywhere',textAlign:'right'}}>{authorName}</span>
          <SquircleAvatar src={authorAvatar} alt={authorName} size={24} hairlineRing ringColor={DARK_HAIRLINE} />
        </>, () => { openDetail('actor'); setSheet('actor'); }, true)}
        {metaRow('Who can see this', visibilityLabel(visibility), () => setVisibilityOpen(true), false)}
        {showScheduleRow && metaRow(t('stage.scheduleForLater'),
          <span style={{ color: state.scheduledAt ? GP.ink : GP.mute }}>{state.scheduledAt ? state.scheduledAt.toLocaleString() : t('stage.off')}</span>,
          () => { openDetail('schedule'); setSheet('schedule'); }, false)}
        {!isEditMode && drafts.drafts.length > 0 && metaRow(t('stage.drafts'),
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{drafts.drafts.length}</span>, () => setSheet('drafts'), false)}
      </div>
      <div style={{ height: 24 }} />
    </>
  );

  // ---- STEP 2 — ONE SCREEN --------------------------------------------------
  return (
    <div style={{ position: 'fixed', inset: 0, height: '100dvh', background: GP.canvas, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: POST_COMPOSER_Z }}>
      {/* THE SHARED HEADER, on both paths, with the page title and Preview
          laid over it. No local counter. */}
      <div style={{ flex: 'none', paddingTop: 'max(env(safe-area-inset-top), 12px)', position: 'relative' }}>
        <ComposerStepHeader step={1} total={1} left={leadingControl} onLeft={handleLeading} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: GP.ink }}>{isEditMode ? 'Edit post' : videoComposer ? longVideo ? 'New video' : 'New short' : 'New post'}</span>
          <button type="button" onClick={() => setPreviewOpen(true)} disabled={!canSubmit}
            style={{ position: 'absolute', right: 16, pointerEvents: 'auto', height: 32, padding: '0 14px', borderRadius: 999, border: `1px solid ${GP.line2}`, background: 'transparent', fontSize: 13, fontWeight: 700, color: GP.ink, cursor: 'pointer', opacity: canSubmit ? 1 : 0.4 }}>
            Preview
          </button>
        </div>
      </div>

      <input ref={stageAddInputRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleStageAddFiles} />

      {emptyStage ? (
        /* EMPTY STATE keeps its original single-scroller layout. */
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '2px 0 16px', display: 'flex', flexDirection: 'column' }}>
          {/* Nothing here auto-fires a picker: no effect opens a file input on
              mount. Both inputs are anchored EXACTLY OVER THEIR OWN BUTTON so
              the iOS chooser opens from the control tapped. Do not consolidate. */}
            <div style={{ padding: '4px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <button onClick={() => emptyLibraryInputRef.current?.click()} style={emptyPrimaryButtonStyle}>
                  {t('stage.chooseFromLibrary')}
                </button>
                <input ref={emptyLibraryInputRef} type="file" accept="image/*,video/*" multiple onChange={handleStageAddFiles} tabIndex={-1} aria-hidden="true" style={anchoredInputStyle} />
              </div>
              <div style={{ position: 'relative' }}>
                <button onClick={() => emptyCameraInputRef.current?.click()} style={emptySecondaryButtonStyle}>
                  {t('stage.takePhotoOrVideo')}
                </button>
                <input ref={emptyCameraInputRef} type="file" accept="image/*,video/*" capture="environment" onChange={handleStageAddFiles} tabIndex={-1} aria-hidden="true" style={anchoredInputStyle} />
              </div>
            </div>
          <div style={{ padding: '10px 16px 0' }}>
            <CaptionField value={state.caption} onChange={handleSetCaption} currentUserId={profile?.id ?? null} variant="dark" minHeight={96}
              placeholder={t('stage.captionPlaceholder')} autoFocus={!isEditMode} inputRef={(el) => { captionElRef.current = el; }} />
            <div style={{ fontSize: 11, color: PAGE2.dim, marginTop: 2 }}>{t('stage.mentionHint')}</div>
          </div>
          {tagAndDetails}
        </div>
      ) : (
        /* ONE SCROLLER: strip, hole line, caption, Where, Played with, meta. */
        <div data-testid="golf-page" style={{ flex: 1, minHeight: 0, overflowY:'auto',willChange:'transform',WebkitOverflowScrolling:'touch' }}>
          <GolfShotStrip media={state.media} tags={shotTags} courseName={state.courses[0]?.name ?? null} onTap={openShot} onAdd={handleStageAdd} visibility={visibility} personal={isPersonalActor} onVisibility={() => setVisibilityOpen(true)} />
          {videoComposer ? <VideoTitleDescription details={videoData} description={state.caption} duration={videoItem ? videoDuration(videoItem) : undefined} long={longVideo} onChange={setVideoData} onDetails={() => setVideoDetailsOpen(true)} /> : <div style={{ padding: '14px 16px 0' }}>
            <CaptionField value={state.caption} onChange={handleSetCaption} currentUserId={profile?.id ?? null} variant="dark" minHeight={60}
              placeholder={t('stage.captionPlaceholder')} autoFocus={!isEditMode} inputRef={(el) => { captionElRef.current = el; }} />
            <div style={{ fontSize: 11.5, color: GP.dim, marginTop: 2 }}>{t('stage.mentionHint')}</div>
          </div>}
          {tagAndDetails}
        </div>
      )}

      {/* SHARE — 54px pill and its sub-line. ONE owner (ShareFooter) shared
          with the Preview page so the two cannot drift (PV1). */}
      <ShareFooter
        label={primaryLabel}
        subLine={(state.scheduledAt ? `Scheduled for ${state.scheduledAt.toLocaleString()}` : shareSubLine(isPersonalActor ? withNames : [], isPersonalActor && visibility === 'anyone' ? holeShotCount : 0)) + (videoComposer ? longVideo ? ' · Long form on your profile' : ' · Shorts on your profile' : '')}
        disabled={!canSubmit}
        busy={submitting || saving}
        onShare={onPrimary}
      />

      {profile?.id && (
        <PostPreview
          open={previewOpen}
          onBack={() => setPreviewOpen(false)}
          post={buildDraftFeedPost({
            caption: state.caption, media: state.media, course: state.courses[0] ?? null, userId: profile.id,
            actor: { id: activeActor?.id ?? profile.id, type: activeActor?.type === 'business' ? 'business' : 'personal', name: authorName, avatarUrl: authorAvatar, username: authorUsername },
          })}
          tags={shotTags}
          pars={tagPars}
          withPeople={isPersonalActor ? withTagged : []}
          /* PV1 — the preview ends with the composer's own Share footer;
             tapping it posts through the very same onPrimary path. */
          share={{
            label: primaryLabel,
            subLine: (state.scheduledAt ? `Scheduled for ${state.scheduledAt.toLocaleString()}` : shareSubLine(isPersonalActor ? withNames : [], isPersonalActor && visibility === 'anyone' ? holeShotCount : 0)) + (videoComposer ? longVideo ? ' · Long form on your profile' : ' · Shorts on your profile' : ''),
            disabled: !canSubmit,
            busy: submitting || saving,
            onShare: onPrimary,
          }}
        />
      )}
      {mediaSheet}
      {sheets}
      {videoComposer && videoDetailsOpen && <VideoDetailsPage details={videoData} description={state.caption} long={longVideo} userId={profile?.id ?? null} onChange={setVideoData} onDescription={handleSetCaption} onBack={() => setVideoDetailsOpen(false)} />}
      {roundVideo && videoItem && markHolesOpen && <MarkHolesPage item={videoItem} round={roundVideo} marks={videoData.holeMarks ?? {}} onChange={holeMarks => setVideoData({ holeMarks, marksRoundId: roundVideo.scoreId })} onBack={() => setMarkHolesOpen(false)} />}
    </div>
  );
}


// Empty-stage buttons: 44px, fully rounded.
const emptyButtonBase: React.CSSProperties = {
  width: '100%',
  height: 44,
  borderRadius: 999,
  /* CAPS ACTION. */
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.10em',
  cursor: 'pointer',
};

const emptyPrimaryButtonStyle: React.CSSProperties = {
  ...emptyButtonBase,
  border: 0,
  background: CT_DARK.ink,
  color: '#11131A',
};

const emptySecondaryButtonStyle: React.CSSProperties = {
  ...emptyButtonBase,
  border: `1px solid ${CT_DARK.line}`,
  background: inkWithAlpha(SURFACE.dark.ink, 0.06),
  color: CT_DARK.ink,
};

// The input sits exactly over its button so the iOS chooser menu anchors there.
const anchoredInputStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  opacity: 0,
  pointerEvents: 'none',
};

const closeButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 999,
  background: inkWithAlpha(SURFACE.dark.ink, 0.08),
  border: 0,
  color: '#F8FAFC',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 21,
  lineHeight: 1,
  padding: 0,
};

const iconButtonStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 999,
  background: inkWithAlpha(SURFACE.dark.ink, 0.08),
  border: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flex: 'none',
};

const floatingChipStyle: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 12,
  background: 'rgba(15, 18, 24, 0.72)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  color: '#F8FAFC',
  border: `1px solid ${inkWithAlpha(SURFACE.dark.ink, 0.1)}`,
  borderRadius: 999,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const moreRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '14px 16px',
  background: inkWithAlpha(SURFACE.dark.ink, 0.06),
  border: `1px solid ${inkWithAlpha(SURFACE.dark.ink, 0.08)}`,
  borderRadius: 14,
  cursor: 'pointer',
  textAlign: 'left',
};

// Page 2 (words) DARK tokens. Values are lifted from the already-converted
// profile bottom sheet (src/features/profile-sheet-v2), which takes them from
// the analytical ramp — so the composer matches an existing dark surface
// rather than inventing a second dark.
//   canvas A.CANVAS #15171F   panel A.PANEL #1B1E27
//   line   A.BORDER           ink/mute/dim A.INK / A.MUTE / A.DIM
// Named PAGE2 (not LIGHT): an object called LIGHT holding dark values is the
// naming fault that produced DARK_BAND_GREEN beside BAND_GREEN_DARK.
const PAGE2 = {
  canvas: A.CANVAS,
  panel: A.PANEL,
  line: A.BORDER,
  ink: A.INK,
  mute: A.MUTE,
  dim: A.DIM,
} as const;

const page2IconButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 999,
  border: `1px solid ${PAGE2.line}`,
  background: PAGE2.panel,
  color: PAGE2.ink,
  fontSize: 20,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flex: 'none',
};

const page2RowStyle = (divider: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  width: '100%',
  padding: '14px 14px',
  background: 'transparent',
  border: 0,
  borderTop: divider ? `1px solid ${PAGE2.line}` : 0,
  cursor: 'pointer',
  textAlign: 'left',
});
