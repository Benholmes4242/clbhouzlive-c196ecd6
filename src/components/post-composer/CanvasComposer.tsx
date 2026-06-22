// CanvasComposer — adaptive dark-when-media / light-when-text post composer.

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { X, ImagePlus, Trash2, MapPin, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePostSubmission } from '@/hooks/usePostSubmission';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { CourseSearchSheet } from './CourseSearchSheet';
import { MediaStage } from './MediaStage';
import { FrameChooser, type FrameId } from './FrameChooser';
import { bakeFrameCrop } from './bakeFrameCrop';
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

export interface StageMediaItem {
  id: string;
  type: 'image' | 'video';
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
  pos: { x: number; y: number };
}

interface CanvasComposerProps {
  onClose: () => void;
  onBack: () => void;
  initialMedia: File[];
  initialActorType: StudioActorType;
  initialActorId: string | null;
  actorInfo: { name: string; avatarUrl: string | null };
}

let __idCounter = 0;
const nextId = () => `m_${Date.now()}_${++__idCounter}`;

function measureImage(file: File): Promise<{ width: number; height: number; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const previewUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight, previewUrl });
    img.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      reject(new Error('image load failed'));
    };
    img.src = previewUrl;
  });
}

function measureVideo(file: File): Promise<{ width: number; height: number; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const previewUrl = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.onloadedmetadata = () =>
      resolve({ width: v.videoWidth || 16, height: v.videoHeight || 9, previewUrl });
    v.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      reject(new Error('video load failed'));
    };
    v.src = previewUrl;
  });
}

export function CanvasComposer({
  onClose,
  onBack,
  initialMedia,
  initialActorType,
  initialActorId,
  actorInfo,
}: CanvasComposerProps) {
  const { submitPost, isSubmitting } = usePostSubmission();
  const fileRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);

  const [mediaItems, setMediaItems] = useState<StageMediaItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [frame, setFrame] = useState<FrameId>('original');
  const [caption, setCaption] = useState('');
  const [taggedCourse, setTaggedCourse] = useState<TaggedCourse | null>(null);
  const [courseSheetOpen, setCourseSheetOpen] = useState(false);

  // Add files (measure + append)
  const addFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const measured: StageMediaItem[] = [];
    for (const f of files) {
      try {
        const isVideo = f.type.startsWith('video/');
        const m = isVideo ? await measureVideo(f) : await measureImage(f);
        measured.push({
          id: nextId(),
          type: isVideo ? 'video' : 'image',
          file: f,
          previewUrl: m.previewUrl,
          width: m.width,
          height: m.height,
          aspectRatio: m.width / Math.max(1, m.height),
          pos: { x: 50, y: 50 },
        });
      } catch {
        // skip bad file
      }
    }
    if (measured.length === 0) return;
    setMediaItems((prev) => [...prev, ...measured]);
  }, []);

  // Seed from initialMedia once
  useEffect(() => {
    if (initialMedia && initialMedia.length > 0) {
      addFiles(initialMedia);
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

  const handlePickFiles = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      addFiles(files);
      e.target.value = '';
    },
    [addFiles]
  );

  const handleRemove = useCallback(() => {
    setMediaItems((prev) => {
      const next = prev.filter((_, i) => i !== activeIndex);
      const removed = prev[activeIndex];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
    setActiveIndex(0);
  }, [activeIndex]);

  const setActivePos = useCallback(
    (pos: { x: number; y: number }) => {
      setMediaItems((prev) => prev.map((it, i) => (i === activeIndex ? { ...it, pos } : it)));
    },
    [activeIndex]
  );

  const hasMedia = mediaItems.length > 0;
  const dark = hasMedia;
  const activeItem = hasMedia ? mediaItems[Math.min(activeIndex, mediaItems.length - 1)] : null;
  const canPost = (hasMedia || caption.trim().length > 0) && !isSubmitting;

  const remaining = MAX_CAPTION - caption.length;
  const showCounter = remaining <= COUNTER_THRESHOLD;

  const handleShare = useCallback(async () => {
    if (!canPost) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be signed in to post');
      return;
    }

    // Bake crops for photos with non-original frame
    const filesOut: File[] = [];
    for (const item of mediaItems) {
      if (item.type === 'image' && frame !== 'original') {
        try {
          const baked = await bakeFrameCrop(item.file, frame, item.pos);
          filesOut.push(baked);
        } catch {
          filesOut.push(item.file);
        }
      } else {
        filesOut.push(item.file);
      }
    }

    await submitPost({
      user,
      content: caption,
      mediaFiles: filesOut,
      selectedTags: [],
      courseInfo: taggedCourse
        ? {
            id: taggedCourse.courseId,
            name: taggedCourse.courseName,
            country: taggedCourse.country ?? '',
          }
        : null,
      actorType: initialActorType,
      actorId: initialActorId ?? user.id,
      onSuccess: () => {
        toast.success('Posted');
        onClose();
      },
      onError: () => {},
    });
  }, [
    canPost,
    mediaItems,
    frame,
    caption,
    taggedCourse,
    initialActorType,
    initialActorId,
    submitPost,
    onClose,
  ]);

  const safeTop = useMemo<React.CSSProperties>(
    () => ({ paddingTop: 'max(env(safe-area-inset-top, 0px), 14px)' }),
    []
  );

  return (
    <div
      style={{
        background: dark ? '#000' : PAGE,
        minHeight: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.3s',
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

      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          padding: '14px 16px',
          gap: 8,
          ...safeTop,
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: dark ? 'rgba(255,255,255,0.16)' : CHIP,
            WebkitBackdropFilter: 'blur(8px)',
            backdropFilter: 'blur(8px)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: dark ? '#fff' : INK_MUTE,
          }}
        >
          <X size={18} strokeWidth={2} />
        </button>
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: dark ? '#fff' : INK_MUTE,
            fontSize: 12,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            cursor: 'pointer',
            mixBlendMode: dark ? 'difference' : 'normal',
          }}
          aria-label="Back to chooser"
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
          Back
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
            background: canPost ? AMBER : dark ? 'rgba(255,255,255,0.18)' : CHIP,
            color: canPost ? '#fff' : dark ? 'rgba(255,255,255,0.6)' : '#94A3B8',
            opacity: canPost ? 1 : 0.85,
            boxShadow: canPost ? '0 2px 12px rgba(247,147,30,0.22)' : 'none',
          }}
        >
          {isSubmitting ? 'Posting…' : 'Share'}
        </button>
      </div>

      {hasMedia && activeItem ? (
        <>
          <div style={{ paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 14px) + 56px)' }}>
            <MediaStage item={activeItem} frame={frame} onPos={setActivePos} />
          </div>

          {/* Frame chooser only for photo slides */}
          {activeItem.type === 'image' && <FrameChooser frame={frame} onChange={setFrame} />}

          {/* Course pill */}
          {taggedCourse && (
            <button
              onClick={() => setTaggedCourse(null)}
              style={{
                position: 'absolute',
                top: 'calc(max(env(safe-area-inset-top, 0px), 14px) + 66px)',
                left: 16,
                zIndex: 20,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.18)',
                WebkitBackdropFilter: 'blur(10px)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.28)',
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              <MapPin size={12} strokeWidth={2.5} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>{taggedCourse.courseName}</span>
              <X size={12} strokeWidth={2.5} style={{ opacity: 0.7 }} />
            </button>
          )}

          {/* Thumbnails strip */}
          {mediaItems.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '8px 0' }}>
              {mediaItems.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setActiveIndex(i)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: i === activeIndex ? `2px solid ${AMBER}` : '2px solid transparent',
                    opacity: i === activeIndex ? 1 : 0.6,
                    padding: 0,
                    cursor: 'pointer',
                    background: '#000',
                  }}
                >
                  {m.type === 'video' ? (
                    <video
                      src={m.previewUrl}
                      muted
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <img
                      src={m.previewUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Caption over media */}
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 110 }}>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION))}
              placeholder="Write something…"
              rows={2}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                color: '#fff',
                fontSize: 20,
                fontWeight: 600,
                lineHeight: 1.25,
                textShadow: '0 1px 10px rgba(0,0,0,0.6)',
                caretColor: AMBER,
                fontFamily: 'inherit',
              }}
            />
            {showCounter && (
              <div
                style={{
                  textAlign: 'right',
                  fontSize: 11,
                  color: remaining <= 0 ? '#FCA5A5' : 'rgba(255,255,255,0.7)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {remaining}
              </div>
            )}
          </div>

          {/* Dock */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              gap: 8,
              padding: '12px 12px calc(env(safe-area-inset-bottom, 0px) + 18px)',
              justifyContent: 'space-around',
              background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
              zIndex: 25,
            }}
          >
            <DockAction
              label="Add"
              onClick={() => fileRef.current?.click()}
              icon={<ImagePlus size={18} />}
            />
            <DockAction
              label="Remove"
              onClick={handleRemove}
              icon={<Trash2 size={18} />}
            />
            <DockAction
              label={taggedCourse ? 'Tagged' : 'Course'}
              onClick={() => setCourseSheetOpen(true)}
              icon={<MapPin size={18} />}
              highlighted={!!taggedCourse}
            />
          </div>
        </>
      ) : (
        // ── Text-only light state ──
        <div
          style={{
            minHeight: '100%',
            paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 14px) + 64px)',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}
        >
          <div
            style={{
              padding: '8px 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <SquircleAvatar
              src={actorInfo.avatarUrl ?? undefined}
              alt={actorInfo.name}
              size={32}
              hideRing
            />
            <span style={{ fontSize: 13, color: INK_MUTE }}>
              Posting as{' '}
              <b style={{ color: INK_2, fontWeight: 700 }}>{actorInfo.name}</b>
            </span>
          </div>

          <textarea
            ref={captionRef}
            autoFocus
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION))}
            placeholder="Share a thought…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              resize: 'none',
              padding: 16,
              fontSize: 20,
              color: INK_2,
              caretColor: AMBER,
              fontFamily: 'inherit',
              background: 'transparent',
              minHeight: 200,
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

          {taggedCourse && (
            <div
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
              }}
            >
              <MapPin size={12} color={GOLD_DEEP} strokeWidth={2.5} />
              <span style={{ fontSize: 12, fontWeight: 700, color: GOLD_DEEP }}>
                {taggedCourse.courseName}
              </span>
              <button
                onClick={() => setTaggedCourse(null)}
                aria-label="Untag"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: GOLD_DEEP,
                  display: 'inline-flex',
                }}
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: 10,
              padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 18px)',
              borderTop: `0.5px solid ${HAIR}`,
              background: SURFACE,
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
              Add photo / video
            </button>
            <button
              onClick={() => setCourseSheetOpen(true)}
              style={{
                flex: 1,
                padding: '13px 0',
                borderRadius: 10,
                border: `1px solid ${taggedCourse ? GOLD_BORDER : HAIR}`,
                background: taggedCourse ? AMBER_SOFT : SURFACE,
                fontSize: 13,
                fontWeight: 700,
                color: taggedCourse ? GOLD_DEEP : INK_2,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <MapPin size={16} strokeWidth={2} />
              {taggedCourse ? 'Tagged' : 'Course'}
            </button>
          </div>
        </div>
      )}

      <CourseSearchSheet
        open={courseSheetOpen}
        onClose={() => setCourseSheetOpen(false)}
        onSelect={(c) => {
          setTaggedCourse(c);
          setCourseSheetOpen(false);
        }}
      />
    </div>
  );
}

function DockAction({
  label,
  onClick,
  icon,
  highlighted,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: '50%',
          background: highlighted ? 'rgba(247,147,30,0.32)' : 'rgba(255,255,255,0.18)',
          WebkitBackdropFilter: 'blur(10px)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          border: `1px solid ${highlighted ? 'rgba(247,147,30,0.55)' : 'rgba(255,255,255,0.24)'}`,
        }}
      >
        {icon}
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#fff' }}>{label}</span>
    </button>
  );
}

export default CanvasComposer;
