import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

import { MediaItem } from '@/types/media';

interface LocalMediaItem {
  id: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
}

interface ResponsiveImmersiveHeaderProps {
  mediaItems: LocalMediaItem[];
  isCollapsed?: boolean;
}

const ResponsiveImmersiveHeader: React.FC<ResponsiveImmersiveHeaderProps> = ({
  mediaItems,
  isCollapsed = false
}) => {
  const isMobile = useIsMobile();

  // Always show immersive header, use default background if no media
  const primaryMedia = mediaItems.length > 0 ? mediaItems[0] : null;
  
  return (
    <div className={`
      w-full overflow-hidden transition-all duration-700 ease-out
      ${isCollapsed 
        ? isMobile 
          ? 'h-32' // Mobile collapsed
          : 'h-40' // Desktop collapsed
        : isMobile 
          ? 'h-96' // Mobile full 
          : 'h-[28rem]' // Desktop full 
      }
    `}>
      {/* Background Media or Default */}
      {primaryMedia ? (
        primaryMedia.media_type === 'video' ? (
          <video
            src={primaryMedia.media_url}
            poster={primaryMedia.thumbnail_url}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <img
            src={primaryMedia.media_url}
            alt="Profile header"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )
      ) : (
        // Default background for profiles without media
        <div 
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&h=400&fit=crop&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}


      {/* Desktop: Wide Blurred Header Gradient */}
      {!isMobile && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
      )}

      {/* Mobile: Subtle overlay */}
      {isMobile && (
        <div className="absolute inset-0 bg-black/20" />
      )}

      {/* Blur overlay for desktop when collapsed */}
      {!isMobile && isCollapsed && (
        <div className="absolute inset-0 backdrop-blur-sm bg-black/20" />
      )}
    </div>
  );
};

export default ResponsiveImmersiveHeader;