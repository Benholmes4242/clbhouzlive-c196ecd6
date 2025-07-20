import React from 'react';
import Top100CourseLists from './Top100CourseLists';
import CommunityLeaderboards from './CommunityLeaderboards';
import Top100VideoMoments from './Top100VideoMoments';
import CommunityTop100Moments from './CommunityTop100Moments';

const GlobalTop100Content = () => {
  return (
    <div className="space-y-12">
      {/* Top 100 Course Lists */}
      <Top100CourseLists />
      
      {/* Community Top 100 Leaderboards */}
      <CommunityLeaderboards />
      
      {/* Top 100 Video Moments */}
      <Top100VideoMoments />
      
      {/* Community Top 100 Moments */}
      <CommunityTop100Moments />
    </div>
  );
};

export default GlobalTop100Content;