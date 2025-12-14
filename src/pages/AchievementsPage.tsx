import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageRoot } from '@/components/layout/PageRoot';
import { MilestonesAndAchievementsContent } from '@/components/achievements/MilestonesAndAchievementsContent';

/**
 * Standalone Achievements Page
 * Uses PageRoot wrapper for iOS Safari text rendering fix
 */
const AchievementsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <PageRoot className="bg-muted/40">
      <MilestonesAndAchievementsContent 
        onBack={handleBack}
        backLabel="Back"
      />
    </PageRoot>
  );
};

export default AchievementsPage;
