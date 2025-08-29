import React from 'react';
import ActivityFeed from '../ActivityFeed';
import UserCoursesContent from '@/components/courses/UserCoursesContent';
import AchievementsPane from '../AchievementsPane';
import HandicapSection from '../HandicapSection';
import { TransitionDirection } from '@/hooks/useTabSlideTransition';
import { useIsMobile } from '@/hooks/use-mobile';

interface UserProfile {
  id: string;
  display_name?: string;
  username?: string;
  profile_photo_url?: string;
  eg_handicap_index?: number;
}

interface ProfileContentRendererProps {
  activeSection: string;
  profile: UserProfile | null;
  isOwnProfile: boolean;
  onSectionChange?: (section: string) => void;
  transitionState: 'idle' | 'transitioning';
  transitionDirection: TransitionDirection;
}

const ProfileContentRenderer: React.FC<ProfileContentRendererProps> = ({
  activeSection,
  profile,
  isOwnProfile,
  onSectionChange,
  transitionState,
  transitionDirection
}) => {
  const isMobile = useIsMobile();

  const getContentTransitionClass = (isOutgoing: boolean) => {
    const baseClasses = activeSection === 'activity' ? 'px-0 md:px-0 pt-0 pb-8' : 'px-4 md:px-0';
    const sectionClasses = `
      ${activeSection === 'courses' ? 'pt-0 pb-8' : ''}
      ${activeSection === 'achievements' || activeSection === 'stats' ? 'py-8' : ''}
      ${isMobile && activeSection === 'activity' ? 'pb-4' : ''}
      ${isMobile && activeSection !== 'activity' && activeSection !== 'courses' ? 'py-4' : ''}
    `;
    
    if (isOutgoing) {
      // Element sliding out
      return `${baseClasses} ${sectionClasses} ${transitionDirection === 'right' 
        ? 'animate-slide-out-left' 
        : 'animate-slide-out-right'}`;
    } else {
      // Element sliding in
      return `${baseClasses} ${sectionClasses} ${transitionDirection === 'right'
        ? (isMobile ? 'animate-slide-in-from-right-bounce' : 'animate-slide-in-from-right')
        : (isMobile ? 'animate-slide-in-from-left-bounce' : 'animate-slide-in-from-left')}`;
    }
  };

  const getCurrentContent = () => {
    const containerClasses = activeSection === 'activity' ? 'w-full' : 'md:max-w-[1150px] md:mx-auto';
    
    const content = (() => {
      switch (activeSection) {
        case 'activity':
          return (
            <ActivityFeed
              userId={profile?.id || ''}
              isOwnProfile={isOwnProfile}
              profileDisplayName={profile?.display_name}
              userHandicap={profile?.eg_handicap_index}
              userProfilePhotoUrl={profile?.profile_photo_url}
              onAchievementsClick={() => onSectionChange?.('achievements')}
            />
          );
        case 'courses':
          return (
            <UserCoursesContent 
              username={profile?.username || ''}
              isOwnProfile={isOwnProfile}
              displayName={profile?.display_name || 'User'}
            />
          );
        case 'achievements':
          return (
            <AchievementsPane 
              userId={profile?.id}
              userDisplayName={profile?.display_name || 'User'}
              userHandicap={profile?.eg_handicap_index}
              userProfilePhotoUrl={profile?.profile_photo_url}
              isCurrentUser={isOwnProfile}
            />
          );
        case 'stats':
          return (
            <HandicapSection 
              userId={profile?.id || ''}
              profile={profile}
            />
          );
        default:
          return null;
      }
    })();

    return <div className={containerClasses}>{content}</div>;
  };

  return (
    <div className="flex-grow">
      {transitionState === 'transitioning' ? (
        <>
          {/* Outgoing content */}
          <div className={`absolute inset-0 ${getContentTransitionClass(true)}`}>
            {getCurrentContent()}
          </div>
          
          {/* Incoming content */}
          <div className={`relative w-full ${getContentTransitionClass(false)}`}>
            {getCurrentContent()}
          </div>
        </>
      ) : (
        /* Normal state - only show active section */
        <div className={`
          ${activeSection === 'activity' ? 'px-0 md:px-0 pt-0 pb-8' : 'px-0 md:px-4'}
          ${activeSection === 'courses' ? 'pt-0 pb-8' : ''}
          ${activeSection === 'achievements' || activeSection === 'stats' ? 'py-8' : ''}
          ${isMobile && activeSection === 'activity' ? 'pb-4' : ''}
          ${isMobile && activeSection !== 'activity' && activeSection !== 'courses' ? 'py-4' : ''}
        `}>
          <div className={`
            ${activeSection === 'activity' ? 'w-full' : 'md:max-w-[1150px] md:mx-auto'}
          `}>
            {getCurrentContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileContentRenderer;