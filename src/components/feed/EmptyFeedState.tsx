import React from 'react';

const EmptyFeedState = () => {
  return (
    <div className="space-y-6 pb-20">
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No posts from friends or followed accounts yet.</p>
        <p className="text-muted-foreground text-sm mt-2">
          Follow users or add friends to see their posts here!
        </p>
      </div>
    </div>
  );
};

export default EmptyFeedState;