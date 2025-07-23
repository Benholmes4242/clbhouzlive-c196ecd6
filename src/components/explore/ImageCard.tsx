import React from 'react';
import { MapPin } from 'lucide-react';
import { ExploreContentItem } from './types';

interface ImageCardProps {
  item: ExploreContentItem;
  onClick: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ item, onClick }) => {
  // Clean title text
  const cleanTitleText = (title: string) => {
    if (!title) return '';
    return title
      .replace(/\s*Played at\s+[^.!?]*[.!?]?\s*/gi, '')
      .replace(/\s*#golf\s*/gi, '')
      .replace(/\s*#family\s*/gi, '')
      .replace(/\s*#chaos\s*/gi, '')
      .replace(/\s*⛳\s*/gi, '')
      .replace(/\s*📍\s*/gi, '')
      .replace(/\s*🏌️\s*/gi, '')
      .replace(/\s*🏌️‍♂️\s*/gi, '')
      .replace(/\s*🏌️‍♀️\s*/gi, '')
      .trim();
  };

  const truncateTitle = (title: string) => {
    const cleanedTitle = cleanTitleText(title);
    if (!cleanedTitle) return '';
    const words = cleanedTitle.split(' ');
    if (words.length <= 5) return cleanedTitle;
    return words.slice(0, 5).join(' ') + '...';
  };

  return (
    <div
      className="relative bg-muted overflow-hidden cursor-pointer group h-52"
      onClick={onClick}
    >
      {/* Image */}
      <img
        src={item.src}
        alt={item.title}
        className="w-full h-full object-cover"
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Golf Course Tag */}
      {item.golfCourse && (
        <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2 max-w-[70%]">
          <MapPin className="w-4 h-4 text-white flex-shrink-0" />
          <span className="text-white text-sm font-medium truncate">
            {item.golfCourse.name}
          </span>
        </div>
      )}

      {/* User info and caption */}
      <div className="absolute bottom-3 left-3 right-3">
        <div className="flex items-center gap-2">
          <img
            src={item.user?.avatar || '/placeholder.svg'}
            alt={item.user?.name || 'User'}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">
              {item.user?.name || item.user?.username || 'Anonymous'}
            </p>
            {truncateTitle(item.title) && (
              <p className="text-white/80 text-xs truncate">{truncateTitle(item.title)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;