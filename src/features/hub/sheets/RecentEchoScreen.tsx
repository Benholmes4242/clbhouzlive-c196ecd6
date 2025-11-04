import React from 'react';

type RecentEchoScreenProps = {
  onClose: () => void;
};

export function RecentEchoScreen({ onClose }: RecentEchoScreenProps) {
  return (
    <div className="space-y-4 pb-6">
      <h2 className="text-xl font-semibold text-white">Recent Echo</h2>
      
      <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.6)' }}>
        <p className="text-[15px]">Recent Echo history coming soon</p>
      </div>
    </div>
  );
}
