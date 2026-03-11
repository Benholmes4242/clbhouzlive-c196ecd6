// ComposerScreen — Step 2: Main creative canvas
// Preview + MediaReel + Caption + Tool strip

import React, { useCallback, useRef } from 'react';
import { AtSign, Flag, Hash, Scissors, Image as ImageIcon } from 'lucide-react';
import { StudioHeader } from '../components/StudioHeader';
import { MediaPreview } from '../components/MediaPreview';
import { MediaReel } from '../components/MediaReel';
import { CharacterRing } from '../components/CharacterRing';
import { usePostStudioContext } from '../usePostStudio';
import { ALLOWED_VIDEO_TYPES, ALLOWED_IMAGE_TYPES, POST_LIMITS } from '../constants';
import type { StudioMediaItem } from '../types';
import { toast } from 'sonner';

export function ComposerScreen() {
  const {
    state,
    setStep,
    setActiveMedia,
    removeMedia,
    addMedia,
    setCaption,
    openPanel,
    setPostType,
    setReviewRating,
  } = usePostStudioContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeItem = state.mediaItems[state.activeMediaIndex] ?? null;
  const hasVideo = state.mediaItems.some((m) => m.mediaType === 'video');
  const activeIsVideo = activeItem?.mediaType === 'video';

  // Caption character count using Intl.Segmenter for accuracy
  const charCount = (() => {
    try {
      // Use Intl.Segmenter for accurate grapheme counting when available
      const SegmenterCtor = (Intl as Record<string, unknown>).Segmenter as
        | (new (locale: string, opts: { granularity: string }) => { segment: (s: string) => Iterable<unknown> })
        | undefined;
      if (SegmenterCtor) {
        const segmenter = new SegmenterCtor('en', { granularity: 'grapheme' });
        return [...segmenter.segment(state.caption)].length;
      }
      return state.caption.length;
    } catch {
      return state.caption.length;
    }
  })();

  const isValid = state.mediaItems.length > 0 && charCount <= POST_LIMITS.MAX_CAPTION_LENGTH;

  // Swipe navigation
  const handleSwipeLeft = useCallback(() => {
    if (state.activeMediaIndex < state.mediaItems.length - 1) {
      setActiveMedia(state.activeMediaIndex + 1);
    }
  }, [state.activeMediaIndex, state.mediaItems.length, setActiveMedia]);

  const handleSwipeRight = useCallback(() => {
    if (state.activeMediaIndex > 0) {
      setActiveMedia(state.activeMediaIndex - 1);
    }
  }, [state.activeMediaIndex, setActiveMedia]);

  // Add more files
  const handleAddMore = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList) return;
      // Re-use the same filesToMediaItems from MediaPickerScreen
      // For simplicity, do inline processing here
      const files = Array.from(fileList);
      const remaining = POST_LIMITS.MAX_MEDIA_COUNT - state.mediaItems.length;
      if (files.length > remaining) {
        toast.error(`Max ${POST_LIMITS.MAX_MEDIA_COUNT} items per post`);
      }
      const toProcess = files.slice(0, Math.max(0, remaining));
      const items: StudioMediaItem[] = [];
      for (const file of toProcess) {
        const isVideo = file.type.startsWith('video/');
        items.push({
          id: crypto.randomUUID(),
          file,
          mediaType: isVideo ? 'video' : 'image',
          previewUrl: URL.createObjectURL(file),
          duration: null,
          trimStart: 0,
          trimEnd: null,
          posterTimestamp: 0,
          posterPreviewUrl: null,
          width: null,
          height: null,
          validationError: null,
        });
      }
      if (items.length > 0) addMedia(items);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [state.mediaItems.length, addMedia]
  );

  const acceptTypes = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_IMAGE_TYPES].join(',');

  return (
    <div className="flex-1 flex flex-col">
      <StudioHeader
        title="Compose"
        leftAction={{ label: 'Back', onClick: () => setStep('MEDIA_PICKER') }}
        rightAction={{
          label: 'Next',
          onClick: () => setStep('PUBLISH'),
          variant: 'primary',
          disabled: !isValid,
        }}
      />

      {/* Hidden file input for adding more */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Media Preview */}
        <div className="px-4 pt-3">
          {activeItem && (
            <MediaPreview
              item={activeItem}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
            />
          )}
        </div>

        {/* Media Reel */}
        <MediaReel
          items={state.mediaItems}
          activeIndex={state.activeMediaIndex}
          onSelect={setActiveMedia}
          onRemove={removeMedia}
          onAddMore={handleAddMore}
        />

        {/* Edit Tools Row (video only) */}
        {activeIsVideo && (
          <div className="flex items-center gap-4 px-4 py-2">
            <button
              onClick={() => setStep('TRIM')}
              className="flex items-center gap-1.5 text-muted-foreground text-sm min-h-[44px]"
            >
              <Scissors className="w-4 h-4" />
              Trim
            </button>
            <button
              onClick={() => setStep('POSTER')}
              className="flex items-center gap-1.5 text-muted-foreground text-sm min-h-[44px]"
            >
              <ImageIcon className="w-4 h-4" />
              Cover
            </button>
          </div>
        )}

        {/* Caption */}
        <div className="px-4 py-3 relative">
          <textarea
            ref={textareaRef}
            value={state.caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Share what's on your mind…"
            rows={4}
            className="w-full bg-transparent text-foreground text-sm placeholder:text-muted-foreground resize-none outline-none min-h-[120px]"
            maxLength={POST_LIMITS.MAX_CAPTION_LENGTH + 100} // Soft limit, visual enforcement via ring
          />
          {/* Character ring */}
          <div className="absolute bottom-4 right-5">
            <CharacterRing count={charCount} />
          </div>
        </div>

        {/* Tool strip */}
        <div className="flex items-center gap-1 px-4 py-2 border-t border-border/50">
          <button
            onClick={() => openPanel('mention')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-muted-foreground text-sm min-h-[44px]"
          >
            <AtSign className="w-4 h-4" />
            Mention
          </button>

          <button
            disabled
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-muted-foreground/40 text-sm min-h-[44px]"
            title="Coming soon"
          >
            <Hash className="w-4 h-4" />
          </button>

          <button
            onClick={() => openPanel('course')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-muted-foreground text-sm min-h-[44px]"
          >
            <Flag className="w-4 h-4" />
            Course
          </button>

          {/* Post type chip */}
          <button
            onClick={() =>
              setPostType(state.postType === 'standard' ? 'review' : 'standard')
            }
            className={`ml-auto px-3 py-1.5 rounded-full text-xs font-medium min-h-[44px] flex items-center ${
              state.postType === 'review'
                ? 'bg-primary/15 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {state.postType === 'review' ? '⭐ Review' : 'Post'}
          </button>
        </div>

        {/* Review rating (if review mode) */}
        {state.postType === 'review' && (
          <div className="flex items-center gap-2 px-4 py-3 border-t border-border/50">
            <span className="text-sm text-muted-foreground">Rating:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <span
                    className={`text-2xl ${
                      (state.reviewRating ?? 0) >= star
                        ? 'opacity-100'
                        : 'opacity-25'
                    }`}
                  >
                    ⭐
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tagged courses display */}
        {state.taggedCourses.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 py-2">
            {state.taggedCourses.map((course) => (
              <span
                key={course.courseId}
                className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full"
              >
                ⛳ {course.courseName}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
