import React from 'react';
import { Play } from 'lucide-react';

export interface ReviewMediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  poster_url?: string | null;
}

interface ReviewMediaStripProps {
  media: ReviewMediaItem[];
  onMediaClick: (index: number) => void;
}

export const ReviewMediaStrip: React.FC<ReviewMediaStripProps> = ({ media, onMediaClick }) => {
  if (!media || media.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 -mx-1 px-1">
      {media.map((item, index) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onMediaClick(index)}
          className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-slate-100 hover:opacity-90 transition"
        >
          {item.media_type === 'video' ? (
            <>
              <img
                src={item.poster_url || item.media_url}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-4 h-4 text-slate-900 fill-slate-900 ml-0.5" />
                </div>
              </div>
            </>
          ) : (
            <img
              src={item.media_url}
              alt="Review media"
              className="w-full h-full object-cover"
            />
          )}
        </button>
      ))}
    </div>
  );
};
