import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import SocialActivity from './SocialActivity';
import HandicapSection from './HandicapSection';
import UserCoursesContent from '@/components/courses/UserCoursesContent';

interface SlidingProfileSectionsProps {
  userId: string;
  profile: any;
  isOwnProfile: boolean;
  activeSection: string;
}

const SlidingProfileSections: React.FC<SlidingProfileSectionsProps> = ({
  userId,
  profile,
  isOwnProfile,
  activeSection
}) => {
  const { user } = useSupabaseSession();
  const firstName = profile?.display_name?.split(' ')[0] || profile?.username || 'User';
  const isBusinessAccount = profile?.user_type !== 'individual';
  const showIndividualSections = !isBusinessAccount;

  return (
    <div className="relative overflow-hidden">
      <div 
        className="flex transition-transform duration-300 ease-in-out"
        style={{
          transform: `translateX(${
            activeSection === 'activity' ? '0%' : 
            activeSection === 'handicap' ? '-100%' : 
            '-200%'
          })`,
          width: showIndividualSections ? '300%' : '100%'
        }}
      >
        {/* Activity Section */}
        <div className="w-full flex-shrink-0">
          <SocialActivity
            userId={userId}
            isOwnProfile={isOwnProfile}
            activityVisible={true}
            profileDisplayName={profile?.display_name}
            userType={profile?.user_type || 'individual'}
          />
        </div>

        {/* Handicap Section */}
        {showIndividualSections && (
          <div className="w-full flex-shrink-0">
            <HandicapSection userId={userId} profile={profile} />
          </div>
        )}

        {/* Top 100 Section */}
        {showIndividualSections && (
          <div className="w-full flex-shrink-0">
            <UserCoursesContent 
              username={profile?.username} 
              isOwnProfile={isOwnProfile}
              displayName={profile?.display_name}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SlidingProfileSections;