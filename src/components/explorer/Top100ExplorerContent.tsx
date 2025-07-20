
import React from 'react';
import CommunityLeaderboards from './CommunityLeaderboards';
import RandomExplorerGrid from './RandomExplorerGrid';
import VideoHighlights from './VideoHighlights';

const Top100ExplorerContent = () => {
  return (
    <div className="space-y-0">

      {/* Community Top 100 Leaderboards */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <CommunityLeaderboards />
      </div>

      {/* Video Highlights Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <VideoHighlights />
      </div>

      {/* Random Explorer Grid (Core Content Feed) - Edge to edge */}
      <RandomExplorerGrid filters={{ audience: 'all', region: 'global', search: '', viewMode: 'media', showMap: false, sortBy: 'recent' }} />
    </div>
  );
};

export default Top100ExplorerContent;
