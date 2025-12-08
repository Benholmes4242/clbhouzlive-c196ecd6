import React from 'react';
import { DEMO_HANDICAP_USERNAMES } from '@/lib/demoConfig';
import HandicapDemoExperience from './handicap/HandicapDemoExperience';
import HandicapComingSoonCard from './handicap/HandicapComingSoonCard';

interface HandicapSectionProps {
  userId: string;
  profile: any;
}

const HandicapSection: React.FC<HandicapSectionProps> = ({ userId, profile }) => {
  // Check if this is a demo user who gets the full handicap experience
  const username = profile?.username?.toLowerCase() || '';
  const isDemoHandicapUser = DEMO_HANDICAP_USERNAMES.some(
    demo => username === demo.toLowerCase()
  );

  // Show coming soon for all non-demo users
  if (!isDemoHandicapUser) {
    return <HandicapComingSoonCard />;
  }

  // Full demo experience for demo users
  return <HandicapDemoExperience />;
};

export default HandicapSection;
