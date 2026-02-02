import React from 'react';
import { Trash2, AlertCircle, RefreshCw, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoPlayIndicator } from '@/components/ui/VideoPlayIndicator';
import { getFileKey, type ReviewVideoDraft } from '@/hooks/useReviewVideoUpload';
import type { ExistingMedia } from '../types';
import { MAX_REVIEW_MEDIA_ITEMS } from '../constants';

interface MediaUploadSectionProps {
  existingMediaItems: ExistingMedia[];
  selectedImages: File[];
  imagePreviews: Map<string, string>;
  videoDrafts: ReviewVideoDraft[];
  localVideoPosters: Map<string, string>;
  onRemoveExistingMedia: (id: string) => void;
  onRemoveImage: (index: number) => void;
  onRemoveVideo: (fileKey: string) => void;
  onRetryPoster: (fileKey: string) => void;
  onAddMedia: () => void;
  disabled?: boolean;
}

const MediaUploadSection = React.memo(function MediaUploadSection({
  existingMediaItems,
  selectedImages,
  imagePreviews,
  videoDrafts,
  localVideoPosters,
  onRemoveExistingMedia,
  onRemoveImage,
  onRemoveVideo,
  onRetryPoster,
  onAddMedia,
  disabled = false,
}: MediaUploadSectionProps) {
  const totalMediaCount = existingMediaItems.length + selectedImages.length + videoDrafts.length;

  return (
    <section className="px-[2px] pt-6 pb-3 bg-slate-100">
      <div className="py-8 flex flex-col items-center justify-center gap-4 px-[4px]">
        {totalMediaCount > 0 && (
          <div className="w-full">
            <div className="grid grid-cols-3 gap-[2px]">
              {/* Existing media items from database */}
              {existingMediaItems.map((item) => {
                const isVideo = item.media_type === 'video';
                
                return (
                  <div key={item.id} className="relative w-full aspect-square overflow-hidden rounded-sm">
                    {isVideo ? (
                      <div className="relative h-full w-full">
                        {item.poster_url ? (
                          <img
                            src={item.poster_url}
                            alt="Video thumbnail"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-700" />
                        )}
                        <VideoPlayIndicator size="md" />
                      </div>
                    ) : (
                      <img
                        src={item.media_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveExistingMedia(item.id)}
                      className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-red-500/80 backdrop-blur-sm hover:bg-red-500 flex items-center justify-center z-20 transition-colors"
                      aria-label="Remove media"
                    >
                      <Trash2 className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                );
              })}
              
              {/* Newly selected IMAGES */}
              {selectedImages.map((file, index) => {
                const fileKey = getFileKey(file);
                const previewUrl = imagePreviews.get(fileKey);
                
                return (
                  <div key={fileKey} className="relative w-full aspect-square overflow-hidden rounded-sm">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-slate-700 animate-pulse" />
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveImage(index)}
                      className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-red-500/80 backdrop-blur-sm hover:bg-red-500 flex items-center justify-center z-20 transition-colors"
                      aria-label="Remove media"
                    >
                      <Trash2 className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                );
              })}
              
              {/* Video drafts (upload-on-select) */}
              {videoDrafts.map((draft) => {
                const posterSrc = draft.posterUrl || localVideoPosters.get(draft.fileKey);
                const showSpinner = draft.status === 'uploading';
                const showError = draft.status === 'failed';
                const showReady = draft.status === 'ready';
                const posterRetryCount = draft.posterRetryCount ?? 0;
                const posterFailed = showReady && !draft.posterUrl && posterRetryCount > 0;
                
                return (
                  <div key={draft.fileKey} className="relative w-full aspect-square overflow-hidden rounded-sm bg-slate-800">
                    {posterSrc ? (
                      <img
                        src={posterSrc}
                        alt="Video thumbnail"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-slate-700" />
                    )}
                    
                    {/* Status overlay */}
                    {showSpinner && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                    {showReady && !posterFailed && (
                      <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-green-500/80 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {posterFailed && (
                      <button
                        type="button"
                        onClick={() => onRetryPoster(draft.fileKey)}
                        className="absolute top-1 left-1 w-5 h-5 rounded-full bg-amber-500/80 flex items-center justify-center hover:bg-amber-500"
                        aria-label="Retry thumbnail"
                      >
                        <RefreshCw className="w-3 h-3 text-white" />
                      </button>
                    )}
                    {showError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                      </div>
                    )}
                    
                    {/* Play icon */}
                    {!showSpinner && !showError && <VideoPlayIndicator size="md" />}
                    
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => onRemoveVideo(draft.fileKey)}
                      className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-red-500/80 backdrop-blur-sm hover:bg-red-500 flex items-center justify-center z-20 transition-colors"
                      aria-label="Remove video"
                    >
                      <Trash2 className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {totalMediaCount === 0 && (
          <div className="text-center">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
              Media upload (optional)
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Add up to 6 photos or videos
            </p>
          </div>
        )}
        
        <Button
          type="button"
          onClick={onAddMedia}
          variant="outline"
          disabled={disabled || totalMediaCount >= MAX_REVIEW_MEDIA_ITEMS}
          className="w-44 mt-6 h-11 rounded-xl border border-slate-600 bg-white px-6 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {totalMediaCount >= MAX_REVIEW_MEDIA_ITEMS 
            ? `${MAX_REVIEW_MEDIA_ITEMS} of ${MAX_REVIEW_MEDIA_ITEMS} added` 
            : 'Add Media'}
        </Button>
      </div>
    </section>
  );
});

export default MediaUploadSection;
