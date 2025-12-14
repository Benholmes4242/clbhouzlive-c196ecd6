/**
 * ProfilePageV2 - Dark Golf Passport Profile
 * Single-scroll cinematic profile experience
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile.tsx';
import { useTop100Overview } from '@/hooks/useTop100Overview';
import { useUserSeasonXP } from '@/hooks/useUserSeasonXP';
import { useCurrentSeason } from '@/hooks/useCurrentSeason';
import { useActivityPosts } from '@/components/profile/hooks/useActivityPosts';
import { Settings, ArrowLeft, Share2 } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';

import {
  HeroMedia,
  IdentityOverlay,
  GolfDNACard,
  GolfDNASheet,
  MomentCard,
  GolfDNAStats,
  MomentPost,
} from '@/components/profile-v2';

const ProfilePageV2: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseSession();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: top100Overview } = useTop100Overview(user?.id);
  const { data: currentSeason } = useCurrentSeason();
  const { data: seasonXP } = useUserSeasonXP(user?.id, currentSeason?.id);
  const { posts } = useActivityPosts(user?.id);
  
  const [dnaSheetOpen, setDnaSheetOpen] = useState(false);

  // Convert posts to moments
  const moments: MomentPost[] = useMemo(() => {
    return posts.slice(0, 20).map(post => ({
      id: post.id,
      mediaUrl: post.post_media?.[0]?.media_url || post.image || '',
      mediaType: (post.post_media?.[0]?.media_type === 'video' ? 'video' : 'image') as 'image' | 'video',
      posterUrl: post.post_media?.[0]?.poster_url,
      courseName: post.post_tags?.find(t => t.entity_type === 'golf_club')?.name,
      courseId: post.post_tags?.find(t => t.entity_type === 'golf_club')?.entity_id,
      caption: post.content,
      date: post.created_at,
      likesCount: post.likes || 0,
      commentsCount: post.comments || 0,
    })).filter(m => m.mediaUrl);
  }, [posts]);

  // Build Golf DNA stats (placeholder data for now)
  const dnaStats: GolfDNAStats = useMemo(() => ({
    handicapTrend: [18.2, 17.8, 17.5, 17.9, 17.2, 16.8, 16.5, 16.9, 16.4, 16.1],
    roundsThisYear: 24,
    coursesPlayed: 18,
    top100Progress: top100Overview?.total_rated ?? 0,
    currentHandicap: profile?.eg_handicap_index ?? undefined,
    recentForm: ['74', '76', '73', '78', '75'],
  }), [top100Overview, profile]);

  // Loading state
  if (authLoading || profileLoading) {
    return (
      <div className="dgp-page flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  const displayName = profile?.display_name || 'Golfer';
  const username = profile?.username || 'user';
  const heroUrl = profile?.header_photo_url || profile?.profile_photo_url || '';
  const xpValue = seasonXP?.total_xp ?? 0;

  return (
    <PageRoot className="dgp-page">
      {/* Navigation buttons - glass style, floating */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 safe-top">
        <button
          onClick={() => navigate(-1)}
          className="dgp-nav-button"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2">
          <button
            className="dgp-nav-button"
            aria-label="Share profile"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="dgp-nav-button"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <HeroMedia
          mediaType={profile?.has_profile_video ? 'video' : 'image'}
          url={heroUrl}
          posterUrl={profile?.profile_video_thumbnail_url}
          height="48vh"
        />
        
        <IdentityOverlay
          displayName={displayName}
          username={username}
          clubName={profile?.home_club ?? undefined}
          handicapIndex={profile?.eg_handicap_index ?? undefined}
          avatarUrl={profile?.profile_photo_url ?? undefined}
          xpValue={xpValue}
          isVerified={profile?.is_verified_golfer ?? false}
          onAvatarClick={() => {/* Open immersive view */}}
        />
      </div>

      {/* Content Sections */}
      <div className="relative z-10 -mt-4 space-y-6 px-4 pb-32">
        {/* Golf DNA Card */}
        <GolfDNACard
          stats={dnaStats}
          onExpand={() => setDnaSheetOpen(true)}
        />

        {/* Moments Timeline */}
        <section>
          <div className="dgp-section-header">
            <h2 className="dgp-section-title">Moments</h2>
          </div>
          
          <div className="space-y-4">
            {moments.length > 0 ? (
              moments.map(moment => (
                <MomentCard
                  key={moment.id}
                  moment={moment}
                  onClick={() => {/* Open fullscreen viewer */}}
                />
              ))
            ) : (
              <div
                className="py-12 text-center rounded-2xl"
                style={{ background: 'var(--dgp-glass-surface)' }}
              >
                <p style={{ color: 'var(--dgp-text-muted)' }}>
                  No moments yet
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Golf DNA Sheet */}
      <GolfDNASheet
        isOpen={dnaSheetOpen}
        onClose={() => setDnaSheetOpen(false)}
        stats={dnaStats}
        displayName={displayName}
      />
    </PageRoot>
  );
};

export default ProfilePageV2;
