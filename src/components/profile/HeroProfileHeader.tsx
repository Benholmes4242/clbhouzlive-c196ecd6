import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useR2Upload } from '@/hooks/useR2Upload';
import { toast } from 'sonner';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileMedia } from '@/hooks/useProfileMedia';
import { useImmersiveProfile } from '@/hooks/useImmersiveProfile';
import { useFullscreenMedia } from '@/hooks/useFullscreenMedia';
import SwipeToReturnZone from '@/components/profile/SwipeToReturnZone';
import { Camera, Upload, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeroProfileHeaderProps {
  profile: any;
  isOwnProfile: boolean;
  onProfileUpdate: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const HeroProfileHeader: React.FC<HeroProfileHeaderProps> = ({
  profile,
  isOwnProfile,
  onProfileUpdate,
  activeSection,
  onSectionChange
}) => {
  const { user } = useSupabaseSession();
  const isMobile = useIsMobile();
  const { uploadImage } = useR2Upload();
  const profileCardRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEditButton, setShowEditButton] = useState(false);
  const [showVideoEditButton, setShowVideoEditButton] = useState(false);

  const { mediaItems, loading, error, refetch } = useProfileMedia(profile?.id || '');
  const { reopenImmersive, openImmersive, previewImmersive } = useImmersiveProfile(profile?.id || '', isOwnProfile);
  const { openMedia } = useFullscreenMedia();

  // Get basic info
  const displayName = profile?.display_name || 'Unknown';
  const username = profile?.username || 'unknown';
  const homeClub = profile?.home_club || 'No Club Selected';
  const handicap = profile?.handicap !== null ? profile.handicap : '—';
  const postsCount = profile?.posts_count || 0;
  const followersCount = profile?.followers_count || 0;
  const followingCount = profile?.following_count || 0;

  // CSS Variables for responsive design (mobile-first)
  const cssVars = {
    '--hero-h': '320px',
    '--panel-overlap': '24px',
    '--panel-pad-x': '16px',
    '--panel-pad-y': '16px',
    '--mini-w': '96px',
    '--mini-h': '128px',
    '--fs-display': '22px',
    '--fs-handle': '14px',
    '--fs-label': '11px',
    '--fs-value': '16px'
  } as React.CSSProperties;

  const tabs = [
    { id: 'activity', label: 'Activity' },
    { id: 'following', label: 'Following' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'stats', label: 'Stats' },
    { id: 'top100', label: 'Top 100' },
    { id: 'handicap', label: 'Handicap' }
  ];

  const handleTabChange = (tabId: string) => {
    onSectionChange(tabId);
  };

  const handleMediaClick = (media: any) => {
    if (media.type === 'image') {
      openMedia([media.url], ['image'], media.alt);
    } else if (media.type === 'video') {
      openMedia([media.url], ['video'], media.alt);
    }
  };

  const handleVideoSave = async (videoUrl: string, thumbnailUrl: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          profile_video_url: videoUrl,
          profile_video_thumbnail_url: thumbnailUrl,
          has_profile_video: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      toast.success("Profile video saved successfully!");
      onProfileUpdate();
    } catch (error) {
      console.error('Error updating profile video:', error);
      toast.error("Failed to save video to profile");
    }
  };

  const handleVideoRemove = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          profile_video_url: null,
          profile_video_thumbnail_url: null,
          has_profile_video: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      toast.success("Profile video removed successfully!");

      onProfileUpdate();
    } catch (error) {
      console.error('Error removing profile video:', error);
      toast.error("Failed to remove video from profile");
    }
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      const result = await uploadImage(file);
      
      if (!result.success) {
        toast.error(result.error || "Failed to upload photo");
        return;
      }

      // Update profile with photo URL
      const { error } = await supabase
        .from('user_profiles')
        .update({
          profile_photo_url: result.imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      toast.success("Profile photo updated successfully!");
      onProfileUpdate();
    } catch (error) {
      console.error('Error updating profile photo:', error);
      toast.error("Failed to update profile photo");
    }
  };

  const getHeightForSection = () => {
    switch (activeSection) {
      case 'leaderboard': return '1800px';
      case 'achievements': return '1600px';
      case 'stats': return '1500px';
      case 'top100': return '2200px';
      case 'handicap': return '2200px';
      default: return '1300px';
    }
  };

  return (
    <SwipeToReturnZone onSwipeDown={reopenImmersive}>

      {/* Mobile-Only Full Bleed Profile Layout */}
      {isMobile ? (
        <div className="relative -mt-16 bg-white">
          <section className="relative w-full overflow-visible">
            {/* HERO (full-bleed) */}
            <div className="relative w-full" style={{ height: 'var(--hero-h)' }}>
              {/* Loading state */}
              <div className="absolute inset-0 bg-gray-100 animate-pulse" />
              
              {(profile?.header_photo_url || profile?.profile_photo_url) ? (
                <img 
                  src={profile?.header_photo_url || profile?.profile_photo_url}
                  alt={`${displayName}'s profile`}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center 20%' }}
                  loading="lazy"
                  onMouseEnter={() => setShowEditButton(true)}
                  onMouseLeave={() => setShowEditButton(false)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Camera className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No Profile Photo</p>
                    <p className="text-sm text-center px-4">
                      {isOwnProfile ? 'Upload a photo in Edit Profile' : 'User hasn\'t uploaded a photo yet'}
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom Fade Gradient - behind panel */}
              <div className="absolute bottom-0 left-0 w-full h-16 md:h-20
                              bg-gradient-to-t from-white via-white/60 to-transparent
                              pointer-events-none z-[5]" />
            </div>

            {/* GLASS PANEL — 2-column grid for perfect centering */}
            <section
              ref={profileCardRef}
              className="relative z-20 mx-0 sm:mx-0 md:mx-0 lg:mx-4 rounded-none lg:rounded-2xl border border-white/35 bg-white/10 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
              style={{
                marginTop: 'calc(var(--panel-overlap) * -1)',
                paddingInline: 'var(--panel-pad-x)',
                paddingBlock: 'var(--panel-pad-y)',
                display: 'grid',
                gridTemplateColumns: '1fr var(--mini-w)',
                columnGap: '8px',
                alignItems: 'start',
                position: 'relative',
                gridTemplateRows: 'auto auto auto auto'
              }}
            >
              {/* NAME LANE — lives entirely in column 1 */}
              <div
                className="text-center"
                style={{
                  gridColumn: '1',
                  gridRow: '1',
                  justifySelf: 'center',
                  width: '100%',
                  maxWidth: 'min(100%, 22ch)'
                }}
              >
                {(() => {
                  const parts = (displayName || '').trim().split(/\s+/);
                  const firstName = parts[0] || '';
                  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
                  return (
                    <h1
                      className="leading-tight font-semibold"
                      style={{ fontSize: 'var(--fs-display)' }}
                    >
                      <span className="block">{firstName}</span>
                      {lastName && <span className="block">{lastName}</span>}
                    </h1>
                  );
                })()}

                <div className="mt-1 opacity-70" style={{ fontSize: 'var(--fs-handle)' }}>
                  @{username}
                </div>
              </div>

              {/* MINI CARD — fixed in column 2 */}
              <button
                className="overflow-hidden rounded-xl border border-white/40 shadow-[0_16px_36px_rgba(0,0,0,0.22)]"
                style={{
                  gridColumn: '2',
                  gridRow: '1',
                  justifySelf: 'end',
                  width: 'var(--mini-w)',
                  aspectRatio: '3 / 4',
                  marginTop: 'calc(var(--mini-h) * -0.24)'
                }}
                onClick={() => openImmersive?.(0)}
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
              </button>

              {/* Golf Club info - spans full grid width */}
              <div
                className="grid items-start col-span-2"
                style={{
                  gridColumn: '1 / -1',
                  gridRow: '2',
                  gridTemplateColumns: '1fr 1fr var(--mini-w)',
                  columnGap: 'clamp(12px, 4vw, 28px)',
                  marginTop: 'calc(var(--mini-h) * 0.55 - 8px)'
                }}
              >
                {/* Column 1 — Golf Club */}
                <div className="text-left">
                  <div className="font-semibold opacity-70" style={{ fontSize: 'var(--fs-label)' }}>
                    Golf Club
                  </div>
                  <div
                    className="leading-snug"
                    style={{
                      fontSize: 'var(--fs-value)',
                      display: 'inline-block',
                      maxWidth: 'min(100%, 26ch)'
                    }}
                  >
                    {homeClub}
                  </div>
                </div>

                {/* Column 2 — spacer (do not render content) */}
                <div />

                {/* Column 3 — Handicap (centered under the mini card) */}
                <div className="text-center">
                  <div className="font-semibold opacity-70" style={{ fontSize: 'var(--fs-label)' }}>
                    Handicap
                  </div>
                  <div
                    className="leading-snug"
                    style={{
                      fontSize: 'var(--fs-value)',
                      paddingTop: '2px'
                    }}
                  >
                    {handicap}
                  </div>
                </div>
              </div>

              {/* Bio section - spans full grid width */}
              <div className="col-span-2 w-full mt-6" style={{ gridColumn: '1 / -1', gridRow: '3' }}>
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
              <div className="w-full grid grid-cols-4 gap-3 text-center mt-4 col-span-2" style={{ gridColumn: '1 / -1', gridRow: '4' }}>
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
              <div className="w-full border-t border-gray-300 mt-4 pt-4 col-span-2" style={{ gridColumn: '1 / -1', gridRow: '5' }}>
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
            </section>

            {/* Spacer below for 16px gap before tab content */}
            <div className="h-4" />
          </section>
        </div>
      ) : (
        /* Desktop layout - updated to match mobile design pattern */
        <div className="relative -mt-16 bg-white">
          <section className="relative w-full overflow-visible">
            {/* HERO (full-bleed) */}
            <div className="relative w-full" style={{ height: 'var(--hero-h)' }}>
              {/* Loading state */}
              <div className="absolute inset-0 bg-gray-100 animate-pulse" />
              
              {(profile?.header_photo_url || profile?.profile_photo_url) ? (
                <img 
                  src={profile?.header_photo_url || profile?.profile_photo_url}
                  alt={`${displayName}'s profile`}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center 20%' }}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Camera className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No Profile Photo</p>
                    <p className="text-sm text-center px-4">
                      {isOwnProfile ? 'Upload a photo in Edit Profile' : 'User hasn\'t uploaded a photo yet'}
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom Fade Gradient - behind panel */}
              <div className="absolute bottom-0 left-0 w-full h-16 md:h-20
                              bg-gradient-to-t from-white via-white/60 to-transparent
                              pointer-events-none z-[5]" />
            </div>

            {/* GLASS PANEL — desktop layout */}
            <section
              ref={profileCardRef}
              className="relative z-20 mx-0 sm:mx-0 md:mx-0 lg:mx-4 rounded-none lg:rounded-2xl border border-white/35 bg-white/10 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
              style={{
                marginTop: 'calc(var(--panel-overlap) * -1)',
                padding: 'var(--panel-pad-y) var(--panel-pad-x)'
              }}
            >
              <div className="flex flex-col items-center relative">
                {/* Content for desktop */}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{displayName}</h1>
                <p className="text-lg text-gray-600 mb-4">@{username}</p>
                
                {/* Rest of desktop content */}
                <div className="grid grid-cols-2 gap-8 w-full max-w-md">
                  <div className="text-center">
                    <span className="text-sm font-medium text-gray-500">Golf Club</span>
                    <p className="text-lg font-semibold text-gray-900">{homeClub}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium text-gray-500">Handicap</span>
                    <p className="text-lg font-semibold text-gray-900">{handicap}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Spacer below for 16px gap before tab content */}
            <div className="h-4" />
          </section>
        </div>
      )}

      {/* CSS Variables */}
      <style>
        {`:root { ${Object.entries(cssVars).map(([key, value]) => `${key}: ${value}`).join('; ')} }`}
      </style>
    </SwipeToReturnZone>
  );
};

export default HeroProfileHeader;