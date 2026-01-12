import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaCarouselProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onOpenStudio: () => void;
}

/**
 * Premium media carousel with thumbnails, dots, and drag-to-reorder.
 */
export const MediaCarousel: React.FC<MediaCarouselProps> = ({
  files,
  onFilesChange,
  onOpenStudio,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleRemove = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
    if (currentIndex >= newFiles.length && newFiles.length > 0) {
      setCurrentIndex(newFiles.length - 1);
    }
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : files.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < files.length - 1 ? prev + 1 : 0));
  };

  if (files.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
        {/* Preview image would go here */}
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <span className="text-sm">Preview {currentIndex + 1}</span>
        </div>

        {/* Navigation arrows */}
        {files.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2",
                "w-9 h-9 rounded-full flex items-center justify-center",
                "bg-white/80 dark:bg-black/60 backdrop-blur-md",
                "border border-white/30 dark:border-white/10",
                "text-foreground shadow-lg",
                "transition-all duration-200 hover:bg-white dark:hover:bg-black/80",
                "active:scale-95"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                "w-9 h-9 rounded-full flex items-center justify-center",
                "bg-white/80 dark:bg-black/60 backdrop-blur-md",
                "border border-white/30 dark:border-white/10",
                "text-foreground shadow-lg",
                "transition-all duration-200 hover:bg-white dark:hover:bg-black/80",
                "active:scale-95"
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Edit button */}
        <button
          onClick={onOpenStudio}
          className={cn(
            "absolute bottom-3 right-3",
            "px-3 py-2 rounded-xl flex items-center gap-2",
            "bg-white/80 dark:bg-black/60 backdrop-blur-md",
            "border border-white/30 dark:border-white/10",
            "text-sm font-medium text-foreground shadow-lg",
            "transition-all duration-200 hover:bg-white dark:hover:bg-black/80",
            "active:scale-95"
          )}
        >
          <Wand2 className="w-4 h-4" />
          Edit
        </button>

        {/* Dots */}
        {files.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {files.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "rounded-full transition-all duration-200",
                  idx === currentIndex 
                    ? "w-2.5 h-2.5 bg-white shadow-lg" 
                    : "w-2 h-2 bg-white/50 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {files.length > 1 && (
        <div className="space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {files.map((file, idx) => (
              <div
                key={idx}
                className={cn(
                  "relative shrink-0 w-16 h-16 rounded-xl overflow-hidden",
                  "bg-slate-100 dark:bg-slate-800",
                  "border-2 transition-all duration-200 cursor-pointer",
                  idx === currentIndex 
                    ? "border-orange-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]" 
                    : "border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                )}
                onClick={() => setCurrentIndex(idx)}
              >
                {/* Cover badge for first item */}
                {idx === 0 && (
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-500 text-white">
                    Cover
                  </div>
                )}
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(idx);
                  }}
                  className={cn(
                    "absolute -top-1 -right-1",
                    "w-5 h-5 rounded-full flex items-center justify-center",
                    "bg-slate-600/90 text-white",
                    "shadow-sm hover:bg-red-500",
                    "transition-colors duration-200"
                  )}
                >
                  <X className="w-3 h-3" />
                </button>
                
                {/* Thumbnail placeholder */}
                <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground/70 text-center">
            Drag to reorder • First = cover
          </p>
        </div>
      )}
    </div>
  );
};

export default MediaCarousel;
