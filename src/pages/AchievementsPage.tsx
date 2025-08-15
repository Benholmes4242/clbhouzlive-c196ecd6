import React from 'react';
import AchievementsPane from '@/components/profile/AchievementsPane';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const AchievementsPage: React.FC = () => {
  const { session } = useSupabaseSession();

  return (
    <div className="min-h-screen w-full">
      <AchievementsPane 
        userId={session?.user?.id}
        userDisplayName={session?.user?.user_metadata?.display_name || "User"}
        isCurrentUser={true}
      />
    </div>
  );
};

export default AchievementsPage;