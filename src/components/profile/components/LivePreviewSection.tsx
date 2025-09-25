import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Monitor } from 'lucide-react';
import { PROFILE_PANEL_OVERLAP_PX, MINI_CARD_MOBILE, MINI_CARD_DESKTOP } from '@/components/profile/profile-config';

interface LivePreviewSectionProps {
  formData: {
    displayName: string;
    username: string;
    homeClub: string;
    handicap: string;
    bio: string;
    websites: string[];
    profilePhoto: File | null;
    headerPhoto: File | null;
    mobileCropX: number;
    mobileCropY: number;
    mobileCropWidth: number;
    mobileCropHeight: number;
    desktopCropX: number;
    desktopCropY: number;
    desktopCropWidth: number;
    desktopCropHeight: number;
    miniCardCropX: number;
    miniCardCropY: number;
    miniCardCropWidth: number;
    miniCardCropHeight: number;
  };
  profile: any;
  activeMode: 'mobile' | 'desktop';
  onModeChange: (mode: 'mobile' | 'desktop') => void;
}

export const LivePreviewSection: React.FC<LivePreviewSectionProps> = ({
  formData,
  profile,
  activeMode,
  onModeChange,
}) => {
  const getHeaderImageUrl = () => {
    if (formData.headerPhoto) {
      return URL.createObjectURL(formData.headerPhoto);
    }
    return profile?.header_photo_url || '';
  };

  const getProfileImageUrl = () => {
    if (formData.profilePhoto) {
      return URL.createObjectURL(formData.profilePhoto);
    }
    return profile?.profile_photo_url || '';
  };

  const getHeaderCropStyle = () => {
    const crop = activeMode === 'mobile' 
      ? { x: formData.mobileCropX, y: formData.mobileCropY, width: formData.mobileCropWidth, height: formData.mobileCropHeight }
      : { x: formData.desktopCropX, y: formData.desktopCropY, width: formData.desktopCropWidth, height: formData.desktopCropHeight };
    
    const centerX = crop.x + crop.width / 2;
    const centerY = crop.y + crop.height / 2;
    
    return {
      objectPosition: `${centerX}% ${centerY}%`,
    };
  };

  const getMiniCardCropStyle = () => {
    const centerX = formData.miniCardCropX + formData.miniCardCropWidth / 2;
    const centerY = formData.miniCardCropY + formData.miniCardCropHeight / 2;
    
    return {
      objectPosition: `${centerX}% ${centerY}%`,
      transform: `scale(${100 / Math.min(formData.miniCardCropWidth, formData.miniCardCropHeight)})`,
    };
  };

  const formatWebsiteDisplay = (url: string): string => {
    if (!url) return '';
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    }
  };

  const headerImageUrl = getHeaderImageUrl();
  const profileImageUrl = getProfileImageUrl();
  const isMobile = activeMode === 'mobile';
  const miniCardSize = isMobile ? MINI_CARD_MOBILE : MINI_CARD_DESKTOP;

  return (
    <Card className="p-4 sticky top-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Live Preview</h3>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={activeMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onModeChange('mobile')}
              className="gap-2"
            >
              <Smartphone className="w-4 h-4" />
              Mobile
            </Button>
            <Button
              variant={activeMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onModeChange('desktop')}
              className="gap-2"
            >
              <Monitor className="w-4 h-4" />
              Desktop
            </Button>
          </div>
        </div>

        {/* Preview Container */}
        <div 
          className={`relative bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg overflow-hidden ${
            isMobile ? 'w-full max-w-[280px] mx-auto' : 'w-full'
          }`}
          style={{ aspectRatio: isMobile ? '9/16' : '16/9', minHeight: isMobile ? '300px' : '200px' }}
        >
          {/* Header/Hero Image */}
          {headerImageUrl && (
            <div className="absolute inset-0">
              <img
                src={headerImageUrl}
                alt="Header preview"
                className="w-full h-full object-cover"
                style={getHeaderCropStyle()}
              />
              
              {/* Safe zone gradient */}
              <div 
                className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white/80 via-white/40 to-transparent"
                style={{ height: `${(PROFILE_PANEL_OVERLAP_PX / 200) * 100}%` }}
              />
            </div>
          )}

          {/* Glass Panel Silhouette */}
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-white/35 backdrop-blur-sm border border-white/35 rounded-t-2xl shadow-lg"
            style={{
              width: isMobile ? '90%' : '80%',
              height: '60%',
              transform: `translateX(-50%) translateY(${(PROFILE_PANEL_OVERLAP_PX / 200) * 100}%)`,
            }}
          >
            <div className="p-3 flex flex-col items-center h-full">
              {/* Mini profile card and content area */}
              <div className="flex items-start gap-3 w-full">
                {/* Mini profile card */}
                {profileImageUrl && (
                  <div 
                    className="rounded-lg overflow-hidden bg-gray-200 border shadow-sm flex-shrink-0"
                    style={{ 
                      width: miniCardSize.w * 0.8,
                      height: miniCardSize.h * 0.8 
                    }}
                  >
                    <img 
                      src={profileImageUrl} 
                      alt="Mini profile preview" 
                      className="w-full h-full object-cover"
                      style={getMiniCardCropStyle()}
                    />
                  </div>
                )}
                
                {/* Text content area */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Name/Username */}
                  <div className="text-center">
                    <h4 className="text-sm font-semibold truncate">
                      {formData.displayName || 'Display Name'}
                    </h4>
                    {formData.username && (
                      <p className="text-xs text-muted-foreground">
                        @{formData.username}
                      </p>
                    )}
                  </div>
                  
                  {/* Club/Handicap row */}
                  <div className="flex justify-between text-xs">
                    <span className="truncate">
                      {formData.homeClub || 'Home Club'}
                    </span>
                    <span>
                      {formData.handicap ? `HC: ${formData.handicap}` : 'HC: --'}
                    </span>
                  </div>
                  
                  {/* Bio */}
                  {formData.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {formData.bio}
                    </p>
                  )}
                  
                  {/* Websites */}
                  {formData.websites.length > 0 && (
                    <div className="space-y-1">
                      {formData.websites.slice(0, 2).map((website, index) => (
                        <div key={index} className="text-xs text-blue-600 truncate">
                          {formatWebsiteDisplay(website)}
                        </div>
                      ))}
                      {formData.websites.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{formData.websites.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          This preview shows how your profile will look on {activeMode} devices
        </div>
      </div>
    </Card>
  );
};