import React from 'react';
import { Edit, Flag } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface GlassmorphicProfileCardProps {
  profile: {
    profile_photo_url?: string;
    display_name?: string;
    username?: string;
    home_club?: string;
    eg_handicap_index?: number;
  } | null;
  isOwnProfile: boolean;
  onEditProfile: () => void;
  // New tab props
  tabs?: Array<{ id: string; label: string }>;
  activeSection?: string;
  onTabChange?: (tab: string) => void;
  isMobile?: boolean;
}

const GlassmorphicProfileCard: React.FC<GlassmorphicProfileCardProps> = ({
  profile,
  isOwnProfile,
  onEditProfile,
  tabs = [],
  activeSection = '',
  onTabChange,
  isMobile = false
}) => {

  const glassmorphicStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
  };

  return (
    <div 
      className="relative mx-4 md:mx-8 p-6 text-center"
      style={glassmorphicStyle}
    >
      {/* Profile photo - overlapping top of card */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
        <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white/30">
          {profile?.profile_photo_url ? (
            <img
              src={profile.profile_photo_url}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Profile content */}
      <div className="pt-6 space-y-2">
        {/* Name - large, bold */}
        <h2 className="text-2xl font-bold text-white">
          {profile?.display_name || 'User'}
        </h2>

        {/* Username row with edit button */}
        <div className="flex items-center justify-center gap-3">
          <p className="text-base text-white/80">
            @{profile?.username || 'username'}
          </p>
          
          {/* Edit Profile button - pill style, subtle */}
          {isOwnProfile && (
            <button
              onClick={onEditProfile}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all duration-300 flex items-center gap-1"
            >
              <Edit className="w-3 h-3" />
              Edit
            </button>
          )}
        </div>

        {/* Home Club and Handicap - moved left with mini profile card on right */}
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Home Club and Handicap centered */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-white/60" />
              <p className="text-sm text-white/60">
                {profile?.home_club || 'No Club'}
              </p>
            </div>
            {/* Handicap display */}
            <div className="text-center">
              <p className="text-xs text-white/50">Handicap</p>
              <p className="text-sm font-medium text-white/80">
                {profile?.eg_handicap_index !== null && profile?.eg_handicap_index !== undefined 
                  ? `${profile.eg_handicap_index > 0 ? '+' : ''}${profile.eg_handicap_index.toFixed(1)}`
                  : 'Not set'
                }
              </p>
            </div>
          </div>
          
          {/* Right side - Mini Profile Card - positioned with more breathing room */}
          <div className="w-16 h-20 rounded-lg bg-white/10 border border-white/20 flex flex-col items-center justify-center p-2 mt-6">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30 mb-1">
              {profile?.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt="Mini profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">
                    {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-white/70 font-medium truncate w-full text-center">
              {profile?.display_name?.split(' ')[0] || 'User'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation - pinned to bottom */}
      {tabs.length > 0 && (
        <div className="border-t border-white/20 mt-4 pt-3">
          <div className="flex" role="tablist" aria-label="Profile sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                role="tab"
                aria-selected={activeSection === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={activeSection === tab.id ? 0 : -1}
                className={`
                  relative py-3 px-2 text-sm font-medium transition-colors duration-200
                  ${activeSection === tab.id 
                    ? 'text-white focus:outline-none' 
                    : 'text-white/70 hover:text-white/90 focus:outline-none'
                  }
                  flex-1 text-center
                `}
              >
                {tab.label}
                {/* Brand orange underline animation */}
                <div 
                  className={`
                    absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500
                    transition-all duration-300 ease-out
                    ${activeSection === tab.id 
                      ? 'scale-x-100 opacity-100' 
                      : 'scale-x-0 opacity-0'
                    }
                    origin-center
                  `}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlassmorphicProfileCard;