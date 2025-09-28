import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MoreVertical, Share, Copy, Camera } from 'lucide-react';
import { TbMovie } from 'react-icons/tb';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { getMobileCropPosition } from '@/utils/mobileCropUtils';
import { useImmersiveProfile } from '@/hooks/useImmersiveProfile';

interface UserProfile {
  id: string;
  display_name?: string;
  username?: string;
  home_club?: string;
  profile_photo_url?: string;
  header_photo_url?: string;
  updated_at?: string;
  mini_card_crop_x?: number;
  mini_card_crop_y?: number;
  mini_card_crop_width?: number;
  mini_card_crop_height?: number;
  bio?: string;
  website?: string;
  eg_handicap_index?: number;
}

interface CompactProfileHeaderProps {
  profile: UserProfile | null;
  isOwnProfile: boolean;
  onEditProfile?: () => void;
}

const CompactProfileHeader: React.FC<CompactProfileHeaderProps> = ({
  profile,
  isOwnProfile,
  onEditProfile
}) => {
  const {
    openImmersive,
  } = useImmersiveProfile(profile?.id || '', isOwnProfile);

  // Derived values
  const displayName = profile?.display_name || 'User';
  const username = profile?.username || 'user';
  const homeClub = profile?.home_club || 'Home Club';
  const handicap = profile?.eg_handicap_index?.toString() || '--';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName}'s Profile`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying link
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Profile link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="relative -mt-16 bg-white">
      <section className="relative w-full overflow-visible">
        {/* HERO (full-bleed) */}
        <div className="relative w-full" style={{ height: 'var(--hero-h)' }}>
          {/* Loading state */}
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
          
          {(profile?.header_photo_url || profile?.profile_photo_url) ? (
            <img
              src={(() => {
                const heroSrc = profile?.header_photo_url || profile?.profile_photo_url || '';
                const ver = profile?.updated_at ? new Date(profile.updated_at).getTime() : 0;
                return heroSrc ? `${heroSrc}${heroSrc.includes('?') ? '&' : '?'}v=${ver}` : '';
              })()}
              alt={profile?.display_name || 'Profile'}
              className="h-full w-full object-cover"
              style={{ 
                objectPosition: getMobileCropPosition(profile),
                objectFit: 'cover'
              }}
              loading="eager"
              onLoad={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.previousElementSibling?.remove();
              }}
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center text-gray-500">
              <Camera className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Profile Photo</p>
              <p className="text-sm text-center px-4">
                {isOwnProfile ? 'Upload a photo in Edit Profile' : 'User hasn\'t uploaded a photo yet'}
              </p>
            </div>
          )}

          {/* Bottom Fade Gradient - behind panel */}
          <div className="absolute bottom-0 left-0 w-full h-16 md:h-20
                          bg-gradient-to-t from-white via-white/60 to-transparent
                          pointer-events-none z-[5]" />
        </div>

        {/* GLASS PANEL — compact layout with overhanging mini card */}
        <div
          className="relative z-20 mx-0 sm:mx-0 md:mx-0 lg:mx-4 rounded-none lg:rounded-2xl border border-white/35 bg-white/10 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] px-[20px] py-[16px] overflow-visible"
          style={{ marginTop: 'calc(var(--panel-overlap) * -1)' }}
        >
          {/* Overhanging Mini Profile Card */}
          <div 
            className="absolute rounded-lg border border-white/40 bg-white/20 backdrop-blur-sm shadow-lg overflow-hidden cursor-pointer hover:bg-white/30 transition-all duration-200"
            style={{ 
              top: '-25%',
              right: '20px',
              width: 'var(--mini-w)', 
              height: 'var(--mini-h)', 
              borderRadius: 'var(--mini-radius)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
            onClick={() => openImmersive(0)}
          >
            {profile?.profile_photo_url ? (
              <img
                src={(() => {
                  const ver = profile?.updated_at ? new Date(profile.updated_at).getTime() : 0;
                  return `${profile.profile_photo_url}${profile.profile_photo_url.includes('?') ? '&' : '?'}v=${ver}`;
                })()}
                alt="Mini profile"
                className="w-full h-full object-cover"
                style={{
                  objectPosition: (() => {
                    const crop = {
                      x: profile?.mini_card_crop_x || 0,
                      y: profile?.mini_card_crop_y || 0,
                      width: profile?.mini_card_crop_width || 100,
                      height: profile?.mini_card_crop_height || 100
                    };
                    const cx = crop.x + crop.width / 2;
                    const cy = crop.y + crop.height / 2;
                    return `${cx}% ${cy}%`;
                  })()
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                <span className="text-gray-600 font-bold text-2xl">
                  {displayName?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col relative">
            {/* Three dots menu - positioned absolutely on left */}
            {isOwnProfile && (
              <div className="absolute top-0 left-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded-full transition-colors duration-300 hover:bg-black/10 text-gray-700 hover:text-gray-900">
                      <MoreVertical size={20} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg z-50">
                    <DropdownMenuItem onClick={onEditProfile}>
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShare}>
                      <Share className="mr-2 h-4 w-4" />
                      Share Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Header Block - left aligned with space for overhang */}
            <div className="w-full mb-3" style={{ paddingRight: 'calc(var(--mini-w) + 16px)' }}>
              {/* User Info - left aligned */}
              <div className="text-left min-w-0">
                <div>
                  <h1 className="font-semibold leading-tight text-[length:var(--fs-display)] m-0 mb-1" title={displayName}>
                    {displayName}
                  </h1>
                  <div className="opacity-70 text-[length:var(--fs-handle)] m-0">@{username}</div>
                </div>

                {/* Club + Handicap Row - horizontal flex layout */}
                <div className="flex items-start justify-between gap-6 mt-4 min-w-0">
                  {/* Golf Club */}
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-xs opacity-70 mb-1.5">Golf Club</div>
                    <div className="text-sm font-semibold text-foreground truncate">
                      {homeClub}
                    </div>
                  </div>
                  
                  {/* Handicap */}
                  <div className="text-right">
                    <div className="text-xs opacity-70 mb-1.5">Handicap</div>
                    <div className="text-base font-semibold text-foreground">
                      {handicap}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio + Website section */}
        {(profile?.bio || profile?.website) && (
          <div className="relative z-10 mx-4 mt-6">
            {profile?.bio && (
              <p className="text-sm text-gray-700 mb-2 line-clamp-2 text-left leading-relaxed">
                {profile.bio}
              </p>
            )}
            {profile?.website && (
              <div className="text-left">
                <a 
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                >
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default CompactProfileHeader;