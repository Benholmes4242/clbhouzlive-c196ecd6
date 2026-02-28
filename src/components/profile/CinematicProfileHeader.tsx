import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSwipeable } from 'react-swipeable';

interface CinematicProfileHeaderProps {
  profilePhotoUrl?: string;
  displayName: string;
  isOwnProfile: boolean;
  onPhotoUpload: (file: File) => void;
  uploading?: boolean;
  className?: string;
  hasImmersiveMedia?: boolean;
  onOpenMediaManager?: () => void;
  onPreviewImmersive?: () => void;
  onReopenImmersive?: () => void;
}

/**
 * CinematicProfileHeader - IMAGE ONLY
 * 
 * This component renders a profile header with a static image.
 * NO video support - profile headers are identity, not content.
 * 
 * Features:
 * - Static profile photo display
 * - Blurred background effect
 * - Gradient overlays for depth
 * - Photo upload for profile owners
 * - Swipe to reopen immersive mode
 */
const CinematicProfileHeader: React.FC<CinematicProfileHeaderProps> = ({
  profilePhotoUrl,
  displayName,
  isOwnProfile,
  onPhotoUpload,
  uploading = false,
  className = '',
  hasImmersiveMedia = false,
  onOpenMediaManager,
  onPreviewImmersive,
  onReopenImmersive
}) => {
  const photoRef = useRef<HTMLImageElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Fallback image if no profile photo - using standard shipped asset
  const fallbackImage = '/placeholder.svg';
  const actualPhotoUrl = profilePhotoUrl || fallbackImage;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handlePhotoSelect = () => {
    photoInputRef.current?.click();
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Unsupported file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", { description: "Max 10MB for photos" });
      return;
    }

    onPhotoUpload(file);
  };

  // Swipe handlers for reopening immersive mode
  const swipeHandlers = useSwipeable({
    onSwipedDown: () => {
      if (hasImmersiveMedia && !isOwnProfile) {
        onReopenImmersive?.();
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: false,
    delta: 50
  });

  return (
    <div 
      className={`relative w-full overflow-hidden ${className}`} 
      style={{ 
        marginTop: '-8rem',
        height: isMobile ? '80vh' : '65vh',
        minHeight: isMobile ? '650px' : '600px',
        maxHeight: '800px',
        paddingTop: '8rem'
      }}
      {...swipeHandlers}
    >
      {/* Blurred Background - Static image only */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${actualPhotoUrl})`,
            filter: isMobile ? 'blur(20px) saturate(1.2)' : 'blur(40px) saturate(1.2)',
            transform: 'scale(1.1)',
          }}
        />
        
        {/* Gradient overlay for smooth transition to page content */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent via-60% to-white" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent" />
      </div>

      {/* Central Profile Photo */}
      <div className={`relative z-10 w-full h-full flex items-start justify-center ${isMobile ? 'pt-8' : 'pt-20'}`}>
        <div 
          className={`group relative overflow-hidden cursor-pointer transition-all duration-500 ease-out hover:scale-105 ${
            isMobile ? 'w-full mx-0 rounded-sq-sm' : 'clbhouz-squircle'
          }`}
          style={{
            width: isMobile ? '100%' : '400px',
            height: isMobile ? '360px' : '400px',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px) saturate(1.3)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2) inset',
            ...(isMobile && { marginTop: '-2rem' })
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Profile Photo - Image only */}
          <img
            ref={photoRef}
            src={actualPhotoUrl}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            alt={`${displayName} profile`}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = fallbackImage;
            }}
          />
        </div>

        {/* Upload Interface for Empty State */}
        {!profilePhotoUrl && isOwnProfile && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl text-white/80 mb-4">
                {displayName.charAt(0)}
              </div>
              <div className="flex flex-col gap-3 items-center">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePhotoSelect}
                    disabled={uploading}
                    className="bg-white/20 backdrop-blur-sm text-white border-white/30"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Profile Photo
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => onOpenMediaManager?.()}
                    disabled={uploading}
                    className="bg-white/20 backdrop-blur-sm text-white border-white/30"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Immersive Media
                  </Button>
                </div>
                {hasImmersiveMedia && (
                  <Button
                    variant="ghost"
                    onClick={() => onPreviewImmersive?.()}
                    className="bg-white/10 backdrop-blur-sm text-white border-white/20"
                  >
                    Preview Immersive Mode
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Owner Edit Controls - Show on hover */}
      {profilePhotoUrl && isHovering && isOwnProfile && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-20"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="flex flex-col gap-3 items-center">
            <div className="flex gap-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePhotoSelect();
                }}
                disabled={uploading}
                className="bg-white/15 backdrop-blur-md hover:bg-white/25 text-white rounded-full px-4 py-2 shadow-lg transition-all duration-300 hover:scale-105 border-0"
                style={{
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 5px 20px rgba(0,0,0,0.2)'
                }}
              >
                <span className="text-xs font-medium">Profile Photo</span>
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMediaManager?.();
                }}
                disabled={uploading}
                className="bg-white/15 backdrop-blur-md hover:bg-white/25 text-white rounded-full px-4 py-2 shadow-lg transition-all duration-300 hover:scale-105 border-0"
                style={{
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 5px 20px rgba(0,0,0,0.2)'
                }}
              >
                <span className="text-xs font-medium">Immersive Media</span>
              </Button>
            </div>
            
            {hasImmersiveMedia && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewImmersive?.();
                }}
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full px-4 py-2 shadow-lg transition-all duration-300 hover:scale-105 border-0"
                style={{
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 5px 20px rgba(0,0,0,0.2)'
                }}
              >
                <span className="text-xs font-medium">Preview Immersive Mode</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Hidden File Input - Photo only */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
        className="hidden"
      />
      
      {/* Loading Overlay */}
      {uploading && (
        <div className="absolute inset-0 bg-[#0a0a0a]/50 flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="text-white font-medium">Uploading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CinematicProfileHeader;
