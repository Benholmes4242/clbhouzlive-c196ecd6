// Composer — light "home base" post composer (LinkedIn-style).
// Media is embedded inline as cards/tiles. Tapping a media item opens the MediaEditor.
// Holds: actor dropdown, visibility pill, caption, multi-course pill, keyboard-docked
// action bar. Posting happens here (Share/Post button in header).

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  X,
  ImagePlus,
  MapPin,
  ChevronDown,
  Globe,
  Users,
  Lock,
  Check,
  Pencil,
  Trash2,
  Play,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePostSubmission } from '@/hooks/usePostSubmission';
import { useActiveActor } from '@/context/ActiveActorContext';
import type { ActiveActor } from '@/types/actor';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { CourseSearchSheet } from './CourseSearchSheet';
import { TaggedCoursesSheet } from './TaggedCoursesSheet';
import { MediaStage } from './MediaStage';
import { MediaEditor } from './MediaEditor';
import { bakeFrameCrop } from './bakeFrameCrop';
import {
  filesToComposerMedia,
  type ComposerMediaItem,
} from './composerMedia';
import type { TaggedCourse, StudioActorType } from './types';

const MAX_CAPTION = 2000;
const COUNTER_THRESHOLD = 100;

const INK_2 = '#0F172A';
const INK_MUTE = '#64748B';
const SURFACE = '#FFFFFF';
const PAGE = '#F8FAFC';
const CHIP = '#F5F5F7';
const HAIR = 'rgba(15,23,42,0.07)';
const AMBER = '#F7931E';
const AMBER_SOFT = '#FEF3E7';
const GOLD_DEEP = '#D97706';
const GOLD_BORDER = 'rgba(255,184,0,0.32)';

type Visibility = 'anyone' | 'followers' | 'private';

const VISIBILITY_OPTIONS: Array<{
  value: Visibility;
  label: string;
  sub: string;
  Icon: React.ComponentType<any>;
}> = [
  { value: 'anyone', label: 'Anyone', sub: 'Visible to everyone on clbhouz', Icon: Globe },
  { value: 'followers', label: 'Followers', sub: 'People who follow you', Icon: Users },
  { value: 'private', label: 'Only me', sub: 'Visible only to you', Icon: Lock },
];

interface ComposerProps {
  onClose: () => void;
  onOpenEditor: (items: ComposerMediaItem[], startIndex: number) => void;
  initialMedia: File[];
  initialActorType: StudioActorType;
  initialActorId: string | null;
  actorInfo: { name: string; avatarUrl: string | null };
  // Two-way binding with parent so editor results survive routing
  mediaItems: ComposerMediaItem[];
  setMediaItems: React.Dispatch<React.SetStateAction<ComposerMediaItem[]>>;
}

export function Composer({
  onClose,
  onOpenEditor,
  initialMedia,
  initialActorType,
  initialActorId,
  actorInfo,
  mediaItems,
  setMediaItems,
}: ComposerProps) {
  const { submitPost, isSubmitting } = usePostSubmission();
  const { activeActor, availableActors, setActiveActor } = useActiveActor();
  const fileRef = useRef<HTMLInputElement>(null);

  const [caption, setCaption] = useState('');
  const [taggedCourses, setTaggedCourses] = useState<TaggedCourse[]>([]);
  const [courseSheetOpen, setCourseSheetOpen] = useState(false);
  const [taggedSheetOpen, setTaggedSheetOpen] = useState(false);
  const [courseSearchMode, setCourseSearchMode] = useState<'single' | 'add'>('single');

  const [visibility, setVisibility] = useState<Visibility>('anyone');
  const [actorSheetOpen, setActorSheetOpen] = useState(false);
  const [visibilitySheetOpen, setVisibilitySheetOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const captionRef = useRef<HTMLTextAreaElement>(null);


  const displayActor = useMemo(() => {
    if (activeActor) return activeActor;
    return {
      type: initialActorType,
      id: initialActorId ?? '',
      name: actorInfo.name,
      avatarUrl: actorInfo.avatarUrl,
    } as ActiveActor;
  }, [activeActor, initialActorType, initialActorId, actorInfo]);

  const canSwitchActor = availableActors.length > 1;

  // Visual viewport — for keyboard docking
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const h = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardHeight(Math.max(0, Math.round(h)));
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  // Seed initial media once
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    if (initialMedia && initialMedia.length > 0) {
      seededRef.current = true;
      filesToComposerMedia(initialMedia).then((items) => {
        if (items.length) setMediaItems((prev) => [...prev, ...items]);
      });
    } else {
      seededRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revoke previews on unmount
  useEffect(() => {
    return () => {
      mediaItems.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      const items = await filesToComposerMedia(files);
      if (items.length) setMediaItems((prev) => [...prev, ...items]);
    },
    [setMediaItems]
  );

  const handlePickFiles = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      addFiles(files);
      e.target.value = '';
    },
    [addFiles]
  );

  const removeAt = useCallback(
    (idx: number) => {
      setMediaItems((prev) => {
        const removed = prev[idx];
        if (removed) URL.revokeObjectURL(removed.previewUrl);
        return prev.filter((_, i) => i !== idx);
      });
    },
    [setMediaItems]
  );

  const hasMedia = mediaItems.length > 0;
  const hasDraft =
    caption.trim().length > 0 || hasMedia || taggedCourses.length > 0;
  const canPost = (hasMedia || caption.trim().length > 0) && !isSubmitting;
  const remaining = MAX_CAPTION - caption.length;
  const showCounter = remaining <= COUNTER_THRESHOLD;
  const visibilityMeta = VISIBILITY_OPTIONS.find((v) => v.value === visibility)!;
  const VisIcon = visibilityMeta.Icon;

  const primaryCourse = taggedCourses[0] ?? null;
  const courseExtraCount = Math.max(0, taggedCourses.length - 1);
  const coursePillLabel = primaryCourse
    ? `${primaryCourse.courseName}${courseExtraCount > 0 ? ` +${courseExtraCount}` : ''}`
    : null;

  const openCourseSearchSingle = useCallback(() => {
    setCourseSearchMode('single');
    setCourseSheetOpen(true);
  }, []);
  const openCourseSearchAdd = useCallback(() => {
    setCourseSearchMode('add');
    setCourseSheetOpen(true);
  }, []);
  const handleCoursePillTap = useCallback(() => {
    if (taggedCourses.length === 0) openCourseSearchSingle();
    else setTaggedSheetOpen(true);
  }, [taggedCourses.length, openCourseSearchSingle]);
  const handleAddCourse = useCallback((c: TaggedCourse) => {
    setTaggedCourses((prev) =>
      prev.some((x) => x.courseId === c.courseId) ? prev : [...prev, c]
    );
  }, []);
  const handleRemoveCourse = useCallback((courseId: string) => {
    setTaggedCourses((prev) => {
      const next = prev.filter((c) => c.courseId !== courseId);
      if (next.length === 0) setTaggedSheetOpen(false);
      return next;
    });
  }, []);

  const handleCloseRequest = useCallback(() => {
    if (hasDraft) setDiscardConfirmOpen(true);
    else onClose();
  }, [hasDraft, onClose]);

  const handleShare = useCallback(async () => {
    if (!canPost) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be signed in to post');
      return;
    }

    // Bake crops per item (only images with non-original frame)
    const filesOut: File[] = [];
    for (const item of mediaItems) {
      if (item.type === 'image' && item.frame !== 'original') {
        try {
          const baked = await bakeFrameCrop(item.file, item.frame, item.pos);
          filesOut.push(baked);
        } catch {
          filesOut.push(item.file);
        }
      } else {
        filesOut.push(item.file);
      }
    }

    const actorType: StudioActorType =
      displayActor.type === 'business' ? 'business' : 'personal';
    const actorId =
      actorType === 'business' ? displayActor.id : displayActor.id || user.id;

    await submitPost({
      user,
      content: caption,
      mediaFiles: filesOut,
      selectedTags: [],
      courses: taggedCourses.map((c) => ({
        id: c.courseId,
        name: c.courseName,
        country: c.country ?? '',
      })),
      actorType,
      actorId,
      visibility,
      onSuccess: () => {
        toast.success('Posted');
        onClose();
      },
      onError: () => {},
    });
  }, [canPost, mediaItems, caption, taggedCourses, displayActor, visibility, submitPost, onClose]);

  return (
    <div
      style={{
        background: PAGE,
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handlePickFiles}
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px',
          gap: 8,
          background: PAGE,
          borderBottom: `0.5px solid ${HAIR}`,
          paddingTop: 'max(env(safe-area-inset-top, 0px), 14px)',
          position: 'sticky',
          top: 0,
          zIndex: 5,
        }}
      >
        <button
          onClick={handleCloseRequest}
          aria-label="Close"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: CHIP,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: INK_MUTE,
          }}
        >
          <X size={18} strokeWidth={2} />
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleShare}
          disabled={!canPost}
          style={{
            fontSize: 13,
            fontWeight: 800,
            padding: '9px 18px',
            borderRadius: 20,
            border: 'none',
            cursor: canPost ? 'pointer' : 'default',
            background: canPost ? INK_2 : CHIP,
            color: canPost ? '#fff' : '#94A3B8',
            boxShadow: canPost ? '0 2px 10px rgba(15,23,42,0.18)' : 'none',
          }}
        >
          {isSubmitting ? 'Posting…' : 'Post'}
        </button>
      </div>

      {/* Scroll body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: `calc(${keyboardHeight}px + 64px + env(safe-area-inset-bottom, 0px) + 16px)`,
        }}
      >

        {/* Identity + visibility */}
        <div
          style={{
            padding: '14px 16px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => canSwitchActor && setActorSheetOpen(true)}
            disabled={!canSwitchActor}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: canSwitchActor ? 'pointer' : 'default',
            }}
            aria-label={canSwitchActor ? 'Change posting identity' : undefined}
          >
            <SquircleAvatar
              src={displayActor.avatarUrl ?? undefined}
              alt={displayActor.name}
              size={36}
              hideRing
            />
            <span
              style={{
                fontSize: 13,
                color: INK_MUTE,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Posting as{' '}
              <b style={{ color: INK_2, fontWeight: 700 }}>{displayActor.name}</b>
              {canSwitchActor && (
                <ChevronDown size={14} strokeWidth={2.5} color={INK_2} />
              )}
            </span>
          </button>

          <div style={{ flex: 1 }} />

          <button
            onClick={() => setVisibilitySheetOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 999,
              background: CHIP,
              border: `1px solid ${HAIR}`,
              cursor: 'pointer',
              color: INK_2,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <VisIcon size={13} strokeWidth={2.5} />
            {visibilityMeta.label}
            <ChevronDown size={12} strokeWidth={2.5} />
          </button>
        </div>

        {/* Caption */}
        <textarea
          ref={captionRef}
          autoFocus
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION))}
          placeholder="Share a thought…"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border: 'none',
            outline: 'none',
            resize: 'none',
            padding: '8px 16px 10px',
            fontSize: 18,
            lineHeight: 1.4,
            color: INK_2,
            caretColor: AMBER,
            fontFamily: 'inherit',
            background: 'transparent',
            minHeight: hasMedia ? 56 : 180,
            overflow: 'hidden',
          }}
        />

        {showCounter && (
          <div
            style={{
              textAlign: 'right',
              padding: '0 16px 4px',
              fontSize: 11,
              color: remaining <= 0 ? '#DC2626' : 'rgba(15,23,42,0.45)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {remaining}
          </div>
        )}

        {/* Embedded media */}
        {hasMedia && (
          <div style={{ padding: '8px 16px 12px' }}>
            <MediaPreview
              items={mediaItems}
              onEditItem={(idx) => onOpenEditor(mediaItems, idx)}
              onRemoveItem={removeAt}
            />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                marginTop: 10,
                width: '100%',
                padding: '11px 0',
                borderRadius: 12,
                border: `1px dashed rgba(15,23,42,0.18)`,
                background: 'transparent',
                fontSize: 13,
                fontWeight: 700,
                color: INK_2,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <ImagePlus size={16} strokeWidth={2} />
              Add more
            </button>
          </div>
        )}

        {/* Course pill (amber soft) */}
        {coursePillLabel && (
          <button
            onClick={handleCoursePillTap}
            style={{
              margin: '0 16px 12px',
              display: 'inline-flex',
              alignSelf: 'flex-start',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 20,
              background: AMBER_SOFT,
              border: `1px solid ${GOLD_BORDER}`,
              cursor: 'pointer',
            }}
          >
            <MapPin size={12} color={GOLD_DEEP} strokeWidth={2.5} />
            <span style={{ fontSize: 12, fontWeight: 700, color: GOLD_DEEP }}>
              {coursePillLabel}
            </span>
          </button>
        )}
      </div>

      {/* Keyboard-docked action bar */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: keyboardHeight,
          display: 'flex',
          gap: 10,
          padding:
            keyboardHeight > 0
              ? '10px 16px'
              : '12px 16px calc(env(safe-area-inset-bottom, 0px) + 18px)',
          borderTop: `0.5px solid ${HAIR}`,
          background: SURFACE,
          transition: 'bottom 0.2s ease',
          zIndex: 40,
        }}
      >
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            flex: 1,
            padding: '13px 0',
            borderRadius: 10,
            border: `1px solid ${HAIR}`,
            background: SURFACE,
            fontSize: 13,
            fontWeight: 700,
            color: INK_2,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <ImagePlus size={16} strokeWidth={2} />
          {hasMedia ? 'Add more' : 'Add photo / video'}
        </button>
        <button
          onClick={handleCoursePillTap}
          style={{
            flex: 1,
            padding: '13px 0',
            borderRadius: 10,
            border: `1px solid ${taggedCourses.length > 0 ? GOLD_BORDER : HAIR}`,
            background: taggedCourses.length > 0 ? AMBER_SOFT : SURFACE,
            fontSize: 13,
            fontWeight: 700,
            color: taggedCourses.length > 0 ? GOLD_DEEP : INK_2,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <MapPin size={16} strokeWidth={2} />
          {taggedCourses.length > 0
            ? `Tagged${courseExtraCount > 0 ? ` +${courseExtraCount}` : ''}`
            : 'Course'}
        </button>
      </div>

      {/* Sheets & dialogs */}
      <CourseSearchSheet
        open={courseSheetOpen}
        onClose={() => setCourseSheetOpen(false)}
        onSelect={(c) => {
          handleAddCourse(c);
          if (courseSearchMode === 'single') setCourseSheetOpen(false);
        }}
        multi={courseSearchMode === 'add'}
        excludedIds={taggedCourses.map((c) => c.courseId)}
      />

      <TaggedCoursesSheet
        open={taggedSheetOpen}
        courses={taggedCourses}
        onClose={() => setTaggedSheetOpen(false)}
        onRemove={handleRemoveCourse}
        onAdd={() => {
          setTaggedSheetOpen(false);
          openCourseSearchAdd();
        }}
      />

      <BottomSheet
        open={actorSheetOpen}
        onClose={() => setActorSheetOpen(false)}
        title="Post as"
      >
        {availableActors.map((actor) => {
          const isSelected =
            displayActor.type === actor.type && displayActor.id === actor.id;
          const sub =
            actor.type === 'personal'
              ? 'Personal'
              : `Business${actor.meta?.category ? ` · ${String(actor.meta.category)}` : ''}`;
          return (
            <button
              key={`${actor.type}-${actor.id}`}
              onClick={() => {
                setActiveActor(actor);
                setActorSheetOpen(false);
              }}
              style={sheetRowStyle(isSelected)}
            >
              <SquircleAvatar
                src={actor.avatarUrl ?? undefined}
                alt={actor.name}
                size={40}
                hideRing
              />
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: isSelected ? 800 : 600, color: INK_2 }}>
                  {actor.name}
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{sub}</div>
              </div>
              {isSelected && <Check size={18} strokeWidth={2.5} color={AMBER} />}
            </button>
          );
        })}
      </BottomSheet>

      <BottomSheet
        open={visibilitySheetOpen}
        onClose={() => setVisibilitySheetOpen(false)}
        title="Who can see this?"
      >
        {VISIBILITY_OPTIONS.map(({ value, label, sub, Icon }) => {
          const isSelected = visibility === value;
          return (
            <button
              key={value}
              onClick={() => {
                setVisibility(value);
                setVisibilitySheetOpen(false);
              }}
              style={sheetRowStyle(isSelected)}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: isSelected ? AMBER_SOFT : '#F1F5F9',
                  color: isSelected ? GOLD_DEEP : INK_MUTE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={18} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: isSelected ? 800 : 600, color: INK_2 }}>
                  {label}
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{sub}</div>
              </div>
            </button>
          );
        })}
      </BottomSheet>

      {/* Discard confirm */}
      <AnimatePresence>
        {discardConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              zIndex: 10001,
              display: 'flex',
              alignItems: 'flex-end',
            }}
            onClick={() => setDiscardConfirmOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                padding: '12px 12px calc(env(safe-area-inset-bottom, 0px) + 12px)',
              }}
            >
              <div
                style={{
                  background: SURFACE,
                  borderRadius: 14,
                  overflow: 'hidden',
                  marginBottom: 8,
                }}
              >
                <div style={{ padding: '16px 16px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: INK_2 }}>Discard post?</div>
                  <div style={{ fontSize: 12, color: INK_MUTE, marginTop: 4 }}>
                    Your draft won't be saved.
                  </div>
                </div>
                <button
                  onClick={() => {
                    setDiscardConfirmOpen(false);
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    padding: '14px 0',
                    background: SURFACE,
                    border: 'none',
                    borderTop: `0.5px solid ${HAIR}`,
                    color: '#DC2626',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Discard
                </button>
              </div>
              <button
                onClick={() => setDiscardConfirmOpen(false)}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  background: SURFACE,
                  border: 'none',
                  borderRadius: 14,
                  color: INK_2,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Keep editing
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Inline media preview (LinkedIn-style) ────────────────────────────────── */
function MediaPreview({
  items,
  onEditItem,
  onRemoveItem,
}: {
  items: ComposerMediaItem[];
  onEditItem: (idx: number) => void;
  onRemoveItem: (idx: number) => void;
}) {
  if (items.length === 1) {
    const item = items[0];
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => onEditItem(0)}
          style={{
            display: 'block',
            width: '100%',
            padding: 0,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          <MediaStage
            item={item}
            frame={item.frame}
            height={360}
            borderRadius={14}
            showPlayGlyph={item.type === 'video'}
          />
        </button>
        <CornerButton top right onClick={() => onEditItem(0)} ariaLabel="Edit">
          <Pencil size={14} strokeWidth={2.25} />
        </CornerButton>
        <CornerButton bottom right onClick={() => onRemoveItem(0)} ariaLabel="Remove">
          <Trash2 size={14} strokeWidth={2.25} />
        </CornerButton>
      </div>
    );
  }

  // Grid: show up to 4 tiles, +N overlay on the 4th when more.
  const visible = items.slice(0, 4);
  const overflow = Math.max(0, items.length - 4);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 6,
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {visible.map((item, i) => {
        const isLast = i === visible.length - 1;
        const showOverflow = isLast && overflow > 0;
        return (
          <div key={item.id} style={{ position: 'relative', aspectRatio: '1 / 1' }}>
            <button
              onClick={() => onEditItem(i)}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <MediaStage
                item={item}
                frame={item.frame}
                height={170}
                borderRadius={8}
                showPlayGlyph={item.type === 'video'}
              />
            </button>
            {showOverflow && (
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.55)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 26,
                  fontWeight: 800,
                  pointerEvents: 'none',
                }}
              >
                +{overflow}
              </div>
            )}
            <CornerButton top right onClick={() => onRemoveItem(i)} ariaLabel="Remove" small>
              <X size={12} strokeWidth={2.5} />
            </CornerButton>
          </div>
        );
      })}
    </div>
  );
}

function CornerButton({
  children,
  onClick,
  ariaLabel,
  top,
  bottom,
  left,
  right,
  small,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  small?: boolean;
}) {
  const size = small ? 26 : 32;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={ariaLabel}
      style={{
        position: 'absolute',
        top: top ? 8 : undefined,
        bottom: bottom ? 8 : undefined,
        left: left ? 8 : undefined,
        right: right ? 8 : undefined,
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.55)',
        WebkitBackdropFilter: 'blur(8px)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.3)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#fff',
        zIndex: 3,
      }}
    >
      {children}
    </button>
  );
}

function sheetRowStyle(selected: boolean): React.CSSProperties {
  return {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    background: selected ? 'rgba(247,147,30,0.04)' : 'transparent',
    border: 'none',
    borderLeft: selected ? `3px solid ${AMBER}` : '3px solid transparent',
    borderBottom: `0.5px solid ${HAIR}`,
    cursor: 'pointer',
    textAlign: 'left',
  };
}

function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 10000,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              background: SURFACE,
              borderRadius: '20px 20px 0 0',
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
              maxHeight: '80vh',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.12)' }} />
            </div>
            <div style={{ padding: '8px 20px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                {title}
              </div>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 60px)' }}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Composer;
