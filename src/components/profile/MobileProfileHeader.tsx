import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Camera } from 'lucide-react';

interface MobileProfileHeaderProps {
  profile: any;
  isOwnProfile: boolean;
  profileCardRef: React.RefObject<HTMLElement>;
  displayName: string;
  username: string;
  homeClub: string;
  handicap: string;
  postsCount: number;
  followingCount: number;
  followersCount: number;
  tabs: Array<{ id: string; label: string }>;
  activeSection: string;
  handleTabChange: (tabId: string) => void;
  openImmersive: (index: number) => void;
  setEditDialogOpen: (open: boolean) => void;
}

const MobileProfileHeader: React.FC<MobileProfileHeaderProps> = ({
  profile,
  isOwnProfile,
  profileCardRef,
  displayName,
  username,
  homeClub,
  handicap,
  postsCount,
  followingCount,
  followersCount,
  tabs,
  activeSection,
  handleTabChange,
  openImmersive,
  setEditDialogOpen
}) => {
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
                objectPosition: (() => {
                  const crop = {
                    x: profile?.desktop_crop_x || 0,
                    y: profile?.desktop_crop_y || 0,
                    width: profile?.desktop_crop_width || 100,
                    height: profile?.desktop_crop_height || 100
                  };
                  const cx = crop.x + crop.width / 2;
                  const cy = crop.y + crop.height / 2;
                  return `${cx}% ${cy}%`;
                })(),
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
              <Camera className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-base font-medium mb-1">No Profile Photo</p>
              <p className="text-xs text-center px-4">
                {isOwnProfile ? 'Upload a photo in Edit Profile' : 'User hasn\'t uploaded a photo yet'}
              </p>
            </div>
          )}

          {/* Bottom Fade Gradient - behind panel */}
          <div className="absolute bottom-0 left-0 w-full h-12 md:h-16
                          bg-gradient-to-t from-white via-white/60 to-transparent
                          pointer-events-none z-[5]" />
        </div>

        {/* GLASS PANEL — consistent overlap & padding */}
        <section
          ref={profileCardRef}
          className="relative z-20 mx-0 rounded-none border border-white/35 bg-white/10 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
          style={{
            marginTop: 'calc(var(--panel-overlap) * -1)',
            padding: 'var(--panel-pad-y) var(--panel-pad-x)'
          }}
        >
          <div className="flex flex-col items-center relative">
            {/* Mini profile card (absolute, overhanging) */}
            <div
              className="
                absolute
                overflow-hidden
                rounded-xl
                shadow-xl
                border border-white/90
                bg-white/10 backdrop-blur-sm
                z-10
              "
              style={{
                top: 'calc(var(--mini-h) * -0.24)',
                right: 'var(--mini-right-gap)',
                width: 'var(--mini-w)',
                height: 'var(--mini-h)',
              }}
              onClick={() => openImmersive(0)}
              role="button"
              aria-label="Open immersive profile"
            >
              {profile?.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: (() => {
                      const cx = (profile?.mini_card_crop_x ?? 0) + (profile?.mini_card_crop_width ?? 100) / 2;
                      const cy = (profile?.mini_card_crop_y ?? 0) + (profile?.mini_card_crop_height ?? 100) / 2;
                      return `${cx}% ${cy}%`;
                    })()
                  }}
                  loading="lazy"
                />
              ) : null}
            </div>

            {/* Three dots menu - positioned absolutely on left */}
            {isOwnProfile && (
              <div className="absolute top-0 left-0 z-20">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded-full transition-colors duration-300 hover:bg-black/10 text-gray-700 hover:text-gray-900">
                      <MoreVertical size={20} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg z-50">
                    <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                      Edit Profile
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Header text block (reserves space for the mini card on the right) */}
            <div
              className="text-center"
              style={{
                paddingRight: 'calc(var(--mini-w) + var(--mini-right-gap))',
              }}
            >
              {/* Name: two-line wrap, larger, bold */}
              <h1
                className="
                  font-semibold leading-tight
                  text-[length:var(--fs-display)]
                  line-clamp-2
                "
              >
                {displayName}
              </h1>

              {/* Handle: sits under the name */}
              <div className="opacity-70 text-[length:var(--fs-handle)]">
                @{username}
              </div>
            </div>

            {/* Club + Handicap row: aligns with the mini card */}
            <div
              className="mt-3 grid items-start"
              style={{
                gridTemplateColumns: `1fr 1fr var(--mini-w)`,
                columnGap: 'clamp(12px, 4vw, 28px)',
                paddingRight: 'var(--mini-right-gap)',
              }}
            >
              {/* Column 1 — Golf Club (title above value, left area) */}
              <div className="text-left">
                <div className="font-semibold opacity-70 text-[length:var(--fs-label)]">
                  Golf Club
                </div>
                <div className="text-[length:var(--fs-value)] leading-snug">
                  {homeClub}
                </div>
              </div>

              {/* Column 2 — spacer (do not render content) */}
              <div />

              {/* Column 3 — Handicap (centered under the mini card) */}
              <div className="text-center">
                <div className="font-semibold opacity-70 text-[length:var(--fs-label)]">
                  Handicap
                </div>
                <div className="text-[length:var(--fs-value)] leading-snug">
                  {handicap}
                </div>
              </div>
            </div>

            {/* Bio section below the content column */}
            <div className="w-full mt-6">
              <div className="text-center">
                {profile?.bio && (
                  <p className="text-sm text-gray-700 mb-2 line-clamp-2 leading-relaxed">
                    {profile.bio}
                  </p>
                )}
                {profile?.website && (
                  <div className="text-center">
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
            </div>

            {/* Slim Stats Row */}
            <div className="w-full grid grid-cols-4 gap-3 text-center mt-4">
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-gray-900">{postsCount}</span>
                <span className="text-xs text-gray-600 uppercase tracking-wide">Posts</span>
              </div>
              <div className="flex flex-col border-l border-gray-300 pl-3">
                <span className="text-lg font-semibold text-gray-900">2,500</span>
                <span className="text-xs text-gray-600 uppercase tracking-wide">Total XP</span>
              </div>
              <div className="flex flex-col border-l border-gray-300 pl-3">
                <span className="text-lg font-semibold text-gray-900">{followingCount}</span>
                <span className="text-xs text-gray-600 uppercase tracking-wide">Following</span>
              </div>
              <div className="flex flex-col border-l border-gray-300 pl-3">
                <span className="text-lg font-semibold text-gray-900">{followersCount}</span>
                <span className="text-xs text-gray-600 uppercase tracking-wide">Followers</span>
              </div>
            </div>

            {/* Tab Navigation - pinned to bottom */}
            <div className="w-full border-t border-gray-300 mt-4 pt-4">
              <div className="flex" role="tablist" aria-label="Profile sections">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    role="tab"
                    aria-selected={activeSection === tab.id}
                    aria-controls={`tabpanel-${tab.id}`}
                    tabIndex={activeSection === tab.id ? 0 : -1}
                    className={`
                      relative py-3 px-2 text-sm font-medium transition-colors duration-200
                      ${activeSection === tab.id 
                        ? 'text-gray-900 focus:outline-none' 
                        : 'text-gray-600 hover:text-gray-800 focus:outline-none'
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
          </div>
        </section>
        
        {/* Spacer below for 16px gap before tab content */}
        <div className="h-4" />
      </section>
    </div>
  );
};

export default MobileProfileHeader;