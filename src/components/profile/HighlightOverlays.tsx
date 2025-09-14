import React from 'react';
import { Top100Highlight } from '@/hooks/useTop100Highlights';
import { Volume2, VolumeX } from 'lucide-react';
import CoursePostBadge from '@/components/posts/CoursePostBadge';
import { isElementMostlyInView } from '@/utils/videoPreload';

interface HighlightOverlaysProps {
  highlight: Top100Highlight;
  muted: boolean;
  onToggleMute: () => void;
}

/** Overlays (mute icon + club badge) that can re-render freely */
const HighlightOverlays: React.FC<HighlightOverlaysProps> = ({
  highlight,
  muted,
  onToggleMute,
}) => {
  const primaryMedia = highlight.post_media[0];
  
  return (
    <>
      {/* Golf Course Badge - Top Right */}
      {highlight.golf_course && (
        <div className="absolute top-3 right-3 z-20">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl px-3 py-1.5 shadow-lg">
            <CoursePostBadge 
              course={{
                id: highlight.golf_course.id,
                name: highlight.golf_course.name,
                country: highlight.golf_course.country
              }}
              className="text-xs text-white"
            />
          </div>
        </div>
      )}

      {/* Unmute Button - Bottom Right */}
      {primaryMedia?.media_type === 'video' && (
        <button
          onClick={onToggleMute}
          className="absolute bottom-3 right-3 z-30 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-lg w-8 h-8 flex items-center justify-center hover:bg-white/20 transition-all duration-300"
          aria-label={muted ? 'Unmute video' : 'Mute video'}
          title={muted ? 'Unmute video' : 'Mute video'}
        >
          {muted ? (
            <VolumeX className="w-4 h-4 text-white" />
          ) : (
            <Volume2 className="w-4 h-4 text-white" />
          )}
        </button>
      )}
    </>
  );
};

export default HighlightOverlays;