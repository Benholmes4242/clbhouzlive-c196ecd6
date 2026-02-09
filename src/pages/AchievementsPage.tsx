import React from 'react';
import { useParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import ProfileQuestView from './ProfileQuestView';

/**
 * Achievements Page - Renders the Quest experience
 * Supports viewing own quest (/achievements) or another user's (/achievements/:userId)
 */
const AchievementsPage: React.FC = () => {
  const { userId: routeUserId } = useParams<{ userId?: string }>();
  const { user } = useSupabaseSession();

  // Determine if viewing another user's quest
  const isOwnProfile = !routeUserId || routeUserId === user?.id;
  const targetUserId = routeUserId || undefined;

  // Fetch the target user's profile for their name (only when viewing another user)
  const { data: targetProfile } = useUserProfile(isOwnProfile ? undefined : targetUserId);

  // Extract first name from display_name for taglines
  const displayName = targetProfile?.display_name || '';
  const firstName = displayName.split(' ')[0] || undefined;

  return (
    <ProfileQuestView
      profileUserId={targetUserId}
      profileFirstName={firstName}
      profileDisplayName={!isOwnProfile ? displayName || undefined : undefined}
      isOwnProfile={isOwnProfile}
    />
  );
};

export default AchievementsPage;
