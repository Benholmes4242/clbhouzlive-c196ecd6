import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MediaItem {
  id: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
}

interface ResponsiveImmersiveHeaderProps {
  mediaItems: MediaItem[];
  isCollapsed?: boolean;
}

const ResponsiveImmersiveHeader: React.FC<ResponsiveImmersiveHeaderProps> = ({
  mediaItems,
  isCollapsed = false
}) => {
  const isMobile = useIsMobile();

  if (!mediaItems.length) return null;

  const primaryMedia = mediaItems[0];
  
  return (
    <div className={`
      relative w-full overflow-hidden transition-all duration-700 ease-out
      ${isCollapsed 
        ? isMobile 
          ? 'h-32' // Mobile collapsed
          : 'h-40' // Desktop collapsed
        : isMobile 
          ? 'h-48' // Mobile full
          : 'h-64' // Desktop full
      }
    `}>
      {/* Background Media */}
      {primaryMedia.media_type === 'video' ? (
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
      )}

      {/* Desktop: Wide Blurred Header Gradient */}
      {!isMobile && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      )}

      {/* Mobile: Subtle overlay */}
      {isMobile && (
        <div className="absolute inset-0 bg-black/30" />
      )}

      {/* Blur overlay for desktop when collapsed */}
      {!isMobile && isCollapsed && (
        <div className="absolute inset-0 backdrop-blur-sm bg-black/20" />
      )}
    </div>
  );
};

export default ResponsiveImmersiveHeader;