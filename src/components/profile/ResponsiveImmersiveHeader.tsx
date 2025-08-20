import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveImmersiveHeaderProps {
  headerImageUrl?: string;
  isCollapsed?: boolean;
}

const ResponsiveImmersiveHeader: React.FC<ResponsiveImmersiveHeaderProps> = ({
  headerImageUrl,
  isCollapsed = false
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`
      relative w-full overflow-hidden transition-all duration-700 ease-out
      ${isCollapsed 
        ? isMobile 
          ? 'h-32' // Mobile collapsed
          : 'h-40' // Desktop collapsed
        : isMobile 
          ? 'h-64' // Mobile full - increased from h-56
          : 'h-80' // Desktop full - increased from h-72
      }
    `}>
      {/* Header Image or Default Background */}
      {headerImageUrl ? (
        <img
          src={headerImageUrl}
          alt="Profile header"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        // Default background for profiles without header image
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